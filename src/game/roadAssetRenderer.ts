import roadManifestRaw from '../assets/roads/roadManifest.json';
import { SlopeDirection, SlopeSegment } from '../types/game';
import { GAME_CONSTANTS } from './constants';

export type VisualMode = 'ASSET' | 'HYBRID' | 'WIREFRAME';

export interface RoadPieceMeta {
  id: string;
  file: string;
  mirror: boolean;
  w: number;
  h: number;
  a_px: [number, number];
  b_px: [number, number];
  normal_px: [number, number];
  pad_top_px: number;
  pad_bot_px: number;
  walk_half_w_px: number;
  walk_half_w_ortho_px: number;
  gap_t0: number;
  gap_t1: number;
  length_px: number;
}

export interface CornerPieceMeta {
  id: string;
  file: string;
  mirror: boolean;
  w: number;
  h: number;
  pivot_px: [number, number];
  deck_w_px: number;
}

interface RoadManifest {
  ltr: Record<'short' | 'cont' | 'long' | 'broken', RoadPieceMeta[]>;
  rtl: Record<'short' | 'cont' | 'long' | 'broken', RoadPieceMeta[]>;
  corners: {
    left: CornerPieceMeta[];
    right: CornerPieceMeta[];
  };
}

interface SegmentVisualCache {
  type: SlopeSegment['type'];
  dirKey?: 'ltr' | 'rtl';
  side?: 'left' | 'right';
  asset?: RoadPieceMeta;
  fillerAsset?: RoadPieceMeta;
  cornerAsset?: CornerPieceMeta;
  trimStart: number;
  trimEnd: number;
  extStart: number;
  extEnd: number;
  leftSpan: number;
  rightSpan: number;
  natTotal: number;
}

interface DustMote {
  nx: number;
  ny: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
  phase: number;
}

const roadManifest = roadManifestRaw as unknown as RoadManifest;

const roadAssetUrls = import.meta.glob<string>('../assets/roads/*.webp', {
  eager: true,
  import: 'default',
});

const ROAD_VERTICAL_RATIO = 4 / 9;
const PERSPECTIVE_K = 1.8;
const PERSPECTIVE_W_MIN = 0.2;
const VIS_WIDTH_SCALE = 1.24;
const SLICES_PER_SEGMENT = 10;
const TRIANGLE_SEAM_PAD_PX = 0.65;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function posMod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export class RoadAssetRenderer {
  private rawUrlByFile = new Map<string, string>();
  private rawImages = new Map<string, HTMLImageElement>();
  private mirroredCanvases = new Map<string, HTMLCanvasElement>();
  private segmentCache = new Map<number, SegmentVisualCache>();
  private lastBucketChoice = new Map<string, string>();
  private dustMotes: DustMote[] = [];

  constructor() {
    for (const [globPath, url] of Object.entries(roadAssetUrls)) {
      const fileName = globPath.split('/').pop();
      if (fileName) {
        this.rawUrlByFile.set(fileName, url);
      }
    }
    this.preloadAllImages();
    this.initDustMotes();
  }

  private preloadAllImages(): void {
    for (const [fileName, url] of this.rawUrlByFile.entries()) {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      this.rawImages.set(fileName, img);
    }
  }

  private initDustMotes(): void {
    // Deterministic seeded LCG so dust field is reproducible and allocation-free
    let seed = 777;
    const rand = (): number => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    this.dustMotes = [];
    for (let i = 0; i < 28; i++) {
      this.dustMotes.push({
        nx: rand(),
        ny: rand(),
        r: 1.4 + rand() * 2.6,
        vx: 0.012 + rand() * 0.025,
        vy: -(0.014 + rand() * 0.018),
        alpha: 0.14 + rand() * 0.26,
        phase: rand() * Math.PI * 2,
      });
    }
  }

  public reset(): void {
    this.segmentCache.clear();
    this.lastBucketChoice.clear();
  }

  public isReady(): boolean {
    if (this.rawImages.size === 0) return false;
    for (const img of this.rawImages.values()) {
      if (!img.complete || img.naturalWidth <= 0) {
        return false;
      }
    }
    return true;
  }

  private getTextureSource(file: string, mirror: boolean): CanvasImageSource | null {
    const img = this.rawImages.get(file);
    if (!img || !img.complete || img.naturalWidth <= 0) {
      return null;
    }
    if (!mirror) {
      return img;
    }
    const cacheKey = `mirror:${file}`;
    let mirrored = this.mirroredCanvases.get(cacheKey);
    if (!mirrored) {
      mirrored = document.createElement('canvas');
      mirrored.width = img.naturalWidth;
      mirrored.height = img.naturalHeight;
      const octx = mirrored.getContext('2d');
      if (!octx) return img;
      octx.translate(mirrored.width, 0);
      octx.scale(-1, 1);
      octx.drawImage(img, 0, 0);
      this.mirroredCanvases.set(cacheKey, mirrored);
    }
    return mirrored;
  }

  // =========================================================================
  // 2D Planar Homography Projection (Parity with GameEngine & RoadPerspective)
  // =========================================================================

  private projectPoint(
    wx: number,
    wy: number,
    camX: number,
    camY: number,
    vpW: number,
    vpH: number
  ): { x: number; y: number; scale: number; w: number } {
    const anchorX = vpW * 0.5;
    const anchorY = vpH * 0.42;
    const rx = wx - (camX + anchorX);
    const ry = (wy - (camY + anchorY)) * ROAD_VERTICAL_RATIO;
    const k = PERSPECTIVE_K / Math.max(400, vpH);
    const w = Math.max(PERSPECTIVE_W_MIN, 1 - k * ry);
    const scale = 1 / w;
    return {
      x: anchorX + rx * scale,
      y: anchorY + ry * scale,
      scale,
      w,
    };
  }

  private clipAndProjectSegment(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    camX: number,
    camY: number,
    vpW: number,
    vpH: number
  ): {
    visible: boolean;
    p0x: number;
    p0y: number;
    p1x: number;
    p1y: number;
    s0: number;
    s1: number;
    t0: number;
    t1: number;
  } {
    const anchorX = vpW * 0.5;
    const anchorY = vpH * 0.42;
    const k = PERSPECTIVE_K / Math.max(400, vpH);
    const wMin = PERSPECTIVE_W_MIN;

    const rx0 = x0 - (camX + anchorX);
    const ry0 = (y0 - (camY + anchorY)) * ROAD_VERTICAL_RATIO;
    const w0 = 1 - k * ry0;

    const rx1 = x1 - (camX + anchorX);
    const ry1 = (y1 - (camY + anchorY)) * ROAD_VERTICAL_RATIO;
    const w1 = 1 - k * ry1;

    if (w0 < wMin && w1 < wMin) {
      return { visible: false, p0x: 0, p0y: 0, p1x: 0, p1y: 0, s0: 1, s1: 1, t0: 0, t1: 1 };
    }

    let t0 = 0;
    let t1 = 1;
    const dw = w1 - w0;
    if (w0 < wMin && Math.abs(dw) > 1e-6) {
      t0 = clamp((wMin - w0) / dw, 0, 1);
    } else if (w1 < wMin && Math.abs(dw) > 1e-6) {
      t1 = clamp((wMin - w0) / dw, 0, 1);
    }

    if (t1 <= t0) {
      return { visible: false, p0x: 0, p0y: 0, p1x: 0, p1y: 0, s0: 1, s1: 1, t0: 0, t1: 1 };
    }

    const cRx0 = lerp(rx0, rx1, t0);
    const cRy0 = lerp(ry0, ry1, t0);
    const cW0 = Math.max(wMin, lerp(w0, w1, t0));

    const cRx1 = lerp(rx0, rx1, t1);
    const cRy1 = lerp(ry0, ry1, t1);
    const cW1 = Math.max(wMin, lerp(w0, w1, t1));

    const s0 = 1 / cW0;
    const s1 = 1 / cW1;

    return {
      visible: true,
      p0x: anchorX + cRx0 * s0,
      p0y: anchorY + cRy0 * s0,
      p1x: anchorX + cRx1 * s1,
      p1y: anchorY + cRy1 * s1,
      s0,
      s1,
      t0,
      t1,
    };
  }

  // =========================================================================
  // Segment Visual Assignment & Neighbor Trim Joins
  // =========================================================================

  private pickVariant(
    dirKey: 'ltr' | 'rtl',
    bucket: 'short' | 'cont' | 'long' | 'broken',
    variantSeed: number
  ): RoadPieceMeta | undefined {
    const dirBuckets = roadManifest[dirKey];
    if (!dirBuckets) return undefined;
    const items = dirBuckets[bucket];
    if (!items || items.length === 0) return undefined;

    const bucketKey = `${dirKey}_${bucket}`;
    const lastId = this.lastBucketChoice.get(bucketKey) ?? '';
    const candidates = items.length > 1 ? items.filter((item) => item.id !== lastId) : items;
    const pool = candidates.length > 0 ? candidates : items;
    const chosen = pool[posMod(variantSeed, pool.length)];
    this.lastBucketChoice.set(bucketKey, chosen.id);
    return chosen;
  }

  private syncSegments(segments: SlopeSegment[]): void {
    // Prune culled segments from visual cache cleanly
    if (this.segmentCache.size > segments.length + 32) {
      const liveIds = new Set(segments.map((s) => s.id));
      for (const cachedId of this.segmentCache.keys()) {
        if (!liveIds.has(cachedId)) {
          this.segmentCache.delete(cachedId);
        }
      }
    }

    let added = false;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (this.segmentCache.has(seg.id)) continue;
      added = true;
      this.assignSegmentVisual(seg);
    }

    if (added) {
      this.recomputeSegmentJoins(segments);
    }
  }

  private assignSegmentVisual(seg: SlopeSegment): void {
    const vseed = seg.id * 131 + 17;

    if (seg.type === 'TURN') {
      const side: 'left' | 'right' = seg.direction === 'RIGHT_DOWN' ? 'right' : 'left';
      const corners = roadManifest.corners?.[side] ?? [];
      let cornerAsset: CornerPieceMeta | undefined;
      if (corners.length > 0) {
        const key = `corner_${side}`;
        const lastId = this.lastBucketChoice.get(key) ?? '';
        const candidates = corners.length > 1 ? corners.filter((c) => c.id !== lastId) : corners;
        const pool = candidates.length > 0 ? candidates : corners;
        cornerAsset = pool[posMod(vseed, pool.length)];
        this.lastBucketChoice.set(key, cornerAsset.id);
      }
      this.segmentCache.set(seg.id, {
        type: seg.type,
        side,
        cornerAsset,
        trimStart: 0,
        trimEnd: 0,
        extStart: 0,
        extEnd: 0,
        leftSpan: 0,
        rightSpan: 0,
        natTotal: 0,
      });
      return;
    }

    const dirKey: 'ltr' | 'rtl' = seg.direction === 'RIGHT_DOWN' ? 'ltr' : 'rtl';

    if (seg.type === 'GAP') {
      const brokenAsset = this.pickVariant(dirKey, 'broken', vseed);
      const fillerAsset = this.pickVariant(dirKey, 'short', vseed + 17);
      this.segmentCache.set(seg.id, {
        type: seg.type,
        dirKey,
        asset: brokenAsset,
        fillerAsset,
        trimStart: 0,
        trimEnd: 0,
        extStart: 0,
        extEnd: 0,
        leftSpan: seg.length,
        rightSpan: 120,
        natTotal: 340,
      });
      return;
    }

    const bucket: 'short' | 'cont' | 'long' =
      seg.length < 130 ? 'short' : seg.length < 192 ? 'cont' : 'long';
    const roadAsset = this.pickVariant(dirKey, bucket, vseed);
    this.segmentCache.set(seg.id, {
      type: seg.type,
      dirKey,
      asset: roadAsset,
      trimStart: 0,
      trimEnd: 0,
      extStart: 0,
      extEnd: 0,
      leftSpan: 0,
      rightSpan: 0,
      natTotal: 0,
    });
  }

  private recomputeSegmentJoins(segments: SlopeSegment[]): void {
    const visW = GAME_CONSTANTS.ROAD_WIDTH * VIS_WIDTH_SCALE;
    const miterExt = visW * 0.14;

    for (const seg of segments) {
      const v = this.segmentCache.get(seg.id);
      if (v && v.type === 'STRAIGHT') {
        v.trimStart = 0;
        v.trimEnd = 0;
        v.extStart = 0;
        v.extEnd = 0;
      }
    }

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const v = this.segmentCache.get(seg.id);
      if (!v) continue;

      if (seg.type === 'STRAIGHT') {
        if (i > 0 && segments[i - 1].type === 'TURN') {
          v.extStart = miterExt;
        }
        if (i + 1 < segments.length && segments[i + 1].type === 'TURN') {
          v.extEnd = miterExt;
        }
      } else if (seg.type === 'GAP') {
        const asset = v.asset;
        if (!asset) continue;
        const whwOrtho = asset.walk_half_w_ortho_px || asset.walk_half_w_px;
        const natTotal = clamp((asset.length_px / Math.max(16, 2 * whwOrtho)) * visW, 220, 390);
        const g0 = asset.gap_t0;
        const g1 = asset.gap_t1;

        const leftNat = g0 * natTotal;
        const prevSeg = i > 0 ? segments[i - 1] : undefined;
        const prevPrevIsGap = i >= 2 && segments[i - 2].type === 'GAP';
        let maxBack = seg.length;

        if (prevSeg?.type === 'TURN') {
          maxBack += miterExt;
        } else if (prevSeg?.type === 'STRAIGHT') {
          maxBack += prevSeg.length * (prevPrevIsGap ? 0.42 : 0.85);
        }

        const leftSpan = Math.min(leftNat, maxBack);
        v.leftSpan = leftSpan;
        v.natTotal = natTotal;

        if (prevSeg?.type === 'STRAIGHT' && leftSpan > seg.length + 8) {
          const pv = this.segmentCache.get(prevSeg.id);
          if (pv) {
            pv.trimEnd = Math.min(prevSeg.length * 0.92, leftSpan - seg.length - 4);
          }
        }

        const rightNat = (1 - g1) * natTotal;
        const nextSeg = i + 1 < segments.length ? segments[i + 1] : undefined;
        if (nextSeg?.type === 'STRAIGHT') {
          const nextNextIsTurn = i + 2 < segments.length && segments[i + 2].type === 'TURN';
          const nextNextIsGap = i + 2 < segments.length && segments[i + 2].type === 'GAP';
          let maxFwd = nextSeg.length * (nextNextIsGap ? 0.48 : 1.0);
          if (nextNextIsTurn) {
            maxFwd += miterExt;
          }
          const rightSpan = Math.min(rightNat, maxFwd);
          v.rightSpan = rightSpan;
          const nv = this.segmentCache.get(nextSeg.id);
          if (nv) {
            nv.trimStart = Math.max(0, rightSpan - 4);
          }
        } else {
          v.rightSpan = Math.min(rightNat, 130);
        }
      }
    }
  }

  // =========================================================================
  // Sunlit Barn Backdrop & Atmospheric Lighting
  // =========================================================================

  public renderBackdrop(
    ctx: CanvasRenderingContext2D,
    vpW: number,
    vpH: number,
    animTime: number
  ): void {
    // 1. Warm golden-amber barn background gradient matching concept backdrop
    const bgGrad = ctx.createLinearGradient(0, 0, 0, vpH);
    bgGrad.addColorStop(0.0, '#4a2b17');
    bgGrad.addColorStop(0.42, '#995c2b');
    bgGrad.addColorStop(1.0, '#db9e4d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, vpW, vpH);

    // 2. Subtle vertical wooden barn framing beams on left & right margins
    ctx.fillStyle = 'rgba(46, 23, 10, 0.35)';
    ctx.fillRect(0, 0, 26, vpH);
    ctx.fillRect(vpW - 26, 0, 26, vpH);

    // 3. Soft diagonal morning sunbeams streaming across upper barn
    for (let i = 0; i < 4; i++) {
      const shift = Math.sin(animTime * 0.55 + i * 1.4) * 10;
      const x0 = vpW * (0.14 + i * 0.21) + shift;
      const beamGrad = ctx.createLinearGradient(0, 0, 0, vpH * 0.85);
      beamGrad.addColorStop(0, 'rgba(255, 230, 158, 0.09)');
      beamGrad.addColorStop(1, 'rgba(255, 220, 133, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(x0, 0);
      ctx.lineTo(x0 + 58, 0);
      ctx.lineTo(x0 + 230, vpH * 0.85);
      ctx.lineTo(x0 + 130, vpH * 0.85);
      ctx.closePath();
      ctx.fill();
    }

    // 4. Floating sunlit golden dust motes
    for (const m of this.dustMotes) {
      const mx = posMod(m.nx + m.vx * animTime, 1) * vpW;
      const my = posMod(m.ny + m.vy * animTime, 1) * vpH;
      const pulse = 0.7 + 0.3 * Math.sin(animTime * 2.2 + m.phase);
      ctx.fillStyle = `rgba(255, 237, 184, ${(m.alpha * pulse).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(mx, my, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // =========================================================================
  // Main Road Asset Render Pass
  // =========================================================================

  public renderRoads(
    ctx: CanvasRenderingContext2D,
    segments: SlopeSegment[],
    camX: number,
    camY: number,
    vpW: number,
    vpH: number,
    animTime: number
  ): boolean {
    if (!this.isReady()) {
      return false;
    }

    this.syncSegments(segments);
    const visHalfW = GAME_CONSTANTS.ROAD_WIDTH * 0.5 * VIS_WIDTH_SCALE;

    // Pass 1: Vertical timber support columns beneath TURN corners
    for (const seg of segments) {
      if (seg.type === 'TURN') {
        this.drawTurnSupportPillar(ctx, seg, camX, camY, vpW, vpH, visHalfW);
      }
    }

    // Pass 2: Road decks, broken-gap split cliffs, and chamfered turn corner caps (distant -> near)
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const v = this.segmentCache.get(seg.id);
      if (!v) continue;

      if (seg.type === 'STRAIGHT') {
        this.drawStraightSegment(ctx, seg, v, camX, camY, vpW, vpH, visHalfW, animTime);
      } else if (seg.type === 'GAP') {
        const nextSeg = i + 1 < segments.length ? segments[i + 1] : undefined;
        this.drawGapSegment(ctx, seg, nextSeg, v, camX, camY, vpW, vpH, visHalfW);
      } else if (seg.type === 'TURN') {
        this.drawTurnCornerCap(ctx, seg, v, camX, camY, vpW, vpH, visHalfW);
      }
    }

    return true;
  }

  private drawTurnSupportPillar(
    ctx: CanvasRenderingContext2D,
    seg: SlopeSegment,
    camX: number,
    camY: number,
    vpW: number,
    vpH: number,
    visHalfW: number
  ): void {
    const proj = this.projectPoint(seg.startX, seg.startY, camX, camY, vpW, vpH);
    if (proj.w <= PERSPECTIVE_W_MIN + 0.01) return;
    if (proj.y < -120 || proj.y > vpH + 80) return;

    const s = proj.scale;
    const postW = Math.max(8, 15 * s);
    const postH = clamp(190 * s, 50, 360);
    const xOff = (seg.direction === 'RIGHT_DOWN' ? -0.42 : 0.42) * visHalfW * s;
    const topX = proj.x + xOff;
    const topY = proj.y + 4 * s;

    const grad = ctx.createLinearGradient(topX, topY, topX, topY + postH);
    grad.addColorStop(0, 'rgba(71, 41, 23, 0.88)');
    grad.addColorStop(1, 'rgba(71, 41, 23, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(topX - postW * 0.5, topY);
    ctx.lineTo(topX + postW * 0.5, topY);
    ctx.lineTo(topX + postW * 0.44, topY + postH);
    ctx.lineTo(topX - postW * 0.44, topY + postH);
    ctx.closePath();
    ctx.fill();

    // Sunlit wood highlight edge along left side of post
    ctx.strokeStyle = 'rgba(140, 87, 43, 0.45)';
    ctx.lineWidth = Math.max(1.5, 2.5 * s);
    ctx.beginPath();
    ctx.moveTo(topX - postW * 0.5, topY);
    ctx.lineTo(topX - postW * 0.44, topY + postH);
    ctx.stroke();
  }

  private getDirVector(direction: SlopeDirection): { dx: number; dy: number; sign: number } {
    const sign = direction === 'RIGHT_DOWN' ? 1 : -1;
    return {
      dx: sign * GAME_CONSTANTS.SLOPE_COS,
      dy: GAME_CONSTANTS.SLOPE_SIN,
      sign,
    };
  }

  private drawStraightSegment(
    ctx: CanvasRenderingContext2D,
    seg: SlopeSegment,
    v: SegmentVisualCache,
    camX: number,
    camY: number,
    vpW: number,
    vpH: number,
    visHalfW: number,
    animTime: number
  ): void {
    const asset = v.asset;
    if (!asset) return;
    const tex = this.getTextureSource(asset.file, asset.mirror);
    if (!tex) return;

    const dir = this.getDirVector(seg.direction);
    if (v.trimStart + v.trimEnd >= seg.length - 4) return;

    const sx = seg.startX + dir.dx * (v.trimStart - v.extStart);
    const sy = seg.startY + dir.dy * (v.trimStart - v.extStart);
    const ex = seg.endX - dir.dx * (v.trimEnd - v.extEnd);
    const ey = seg.endY - dir.dy * (v.trimEnd - v.extEnd);

    const nSlices = seg.length < 130 ? 6 : SLICES_PER_SEGMENT;

    if (seg.isCracked && seg.isCollapsed) {
      // Split plank remnants at [0..0.24] and [0.76..1.0], opening a collapse chasm in the center
      const lEndX = lerp(sx, ex, 0.24);
      const lEndY = lerp(sy, ey, 0.24);
      const rStartX = lerp(sx, ex, 0.76);
      const rStartY = lerp(sy, ey, 0.76);
      this.drawHomographyStrip(
        ctx, tex, asset, sx, sy, lEndX, lEndY, 0, 0.24, dir.sign,
        camX, camY, vpW, vpH, visHalfW, 4
      );
      this.drawHomographyStrip(
        ctx, tex, asset, rStartX, rStartY, ex, ey, 0.76, 1, dir.sign,
        camX, camY, vpW, vpH, visHalfW, 4
      );
      return;
    }

    this.drawHomographyStrip(
      ctx, tex, asset, sx, sy, ex, ey, 0, 1, dir.sign,
      camX, camY, vpW, vpH, visHalfW, nSlices
    );

    if (seg.isCracked) {
      this.drawCrackedWarningOverlay(ctx, sx, sy, ex, ey, dir.sign, camX, camY, vpW, vpH, animTime);
    }
  }

  private drawCrackedWarningOverlay(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    ex: number,
    ey: number,
    dirSign: number,
    camX: number,
    camY: number,
    vpW: number,
    vpH: number,
    animTime: number
  ): void {
    const mx = (sx + ex) * 0.5;
    const my = (sy + ey) * 0.5;
    const pCenter = this.projectPoint(mx, my, camX, camY, vpW, vpH);
    if (pCenter.w <= PERSPECTIVE_W_MIN + 0.02 || pCenter.y < -60 || pCenter.y > vpH + 60) {
      return;
    }

    const hw = GAME_CONSTANTS.ROAD_WIDTH * 0.52;
    const nx = -dirSign * GAME_CONSTANTS.SLOPE_SIN;
    const ny = GAME_CONSTANTS.SLOPE_COS;
    const pTop = this.projectPoint(mx - nx * hw, my - ny * hw, camX, camY, vpW, vpH);
    const pBot = this.projectPoint(mx + nx * hw, my + ny * hw, camX, camY, vpW, vpH);
    const pLeft = this.projectPoint(lerp(sx, ex, 0.36), lerp(sy, ey, 0.36), camX, camY, vpW, vpH);
    const pRight = this.projectPoint(lerp(sx, ex, 0.64), lerp(sy, ey, 0.64), camX, camY, vpW, vpH);

    const pulse = 0.65 + 0.35 * Math.sin(animTime * 9.0);
    ctx.save();
    ctx.strokeStyle = `rgba(239, 68, 68, ${(0.88 * pulse).toFixed(3)})`;
    ctx.lineWidth = clamp(2.8 * pCenter.scale, 1.5, 4.5);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(pTop.x, pTop.y);
    ctx.lineTo(pLeft.x * 0.35 + pCenter.x * 0.65, pCenter.y - 3 * pCenter.scale);
    ctx.lineTo(pRight.x * 0.35 + pCenter.x * 0.65, pCenter.y + 3 * pCenter.scale);
    ctx.lineTo(pBot.x, pBot.y);
    ctx.stroke();
    ctx.restore();
  }

  private drawGapSegment(
    ctx: CanvasRenderingContext2D,
    seg: SlopeSegment,
    nextSeg: SlopeSegment | undefined,
    v: SegmentVisualCache,
    camX: number,
    camY: number,
    vpW: number,
    vpH: number,
    visHalfW: number
  ): void {
    const asset = v.asset;
    if (!asset) return;
    const tex = this.getTextureSource(asset.file, asset.mirror);
    if (!tex) return;

    const dir = this.getDirVector(seg.direction);
    const natTotal = v.natTotal || 340;
    const g0 = asset.gap_t0;
    const g1 = asset.gap_t1;
    const gMid = 0.5 * (g0 + g1);

    const leftSpan = v.leftSpan;
    const rightSpan = v.rightSpan;

    // Derive exact landing vertex (matches mapGenerator & next segment start)
    const gapEndX =
      nextSeg !== undefined
        ? nextSeg.startX
        : seg.endX + dir.dx * (seg.gapDistance ?? 110);
    const gapEndY =
      nextSeg !== undefined
        ? nextSeg.startY
        : seg.endY + (seg.gapHeight ?? 0);

    // Optional solid filler runway behind left wing if runway exceeds broken wing coverage
    if (leftSpan < seg.length - 6 && v.fillerAsset) {
      const fillerTex = this.getTextureSource(v.fillerAsset.file, v.fillerAsset.mirror);
      if (fillerTex) {
        const fEndX = seg.endX - dir.dx * (leftSpan - 8);
        const fEndY = seg.endY - dir.dy * (leftSpan - 8);
        this.drawHomographyStrip(
          ctx, fillerTex, v.fillerAsset, seg.startX, seg.startY, fEndX, fEndY,
          0, 1, dir.sign, camX, camY, vpW, vpH, visHalfW, 6
        );
      }
    }

    // 1. Left snapped takeoff wing (solid cliff stops right at seg.end; torn splinters clamped inside gap width)
    const gapPx = Math.max(24, Math.hypot(gapEndX - seg.endX, gapEndY - seg.endY));
    const maxSplitT = (gapPx * 0.22) / natTotal;
    const ropeOver = Math.min(clamp((g1 - g0) * 0.28, 0.012, 0.028), maxSplitT);
    const tL0 = Math.max(0, g0 - leftSpan / natTotal);
    const tL1 = Math.min(gMid - 0.005, g0 + ropeOver);
    const wL0x = seg.endX - dir.dx * leftSpan;
    const wL0y = seg.endY - dir.dy * leftSpan;
    const wL1x = seg.endX + dir.dx * ((tL1 - g0) * natTotal);
    const wL1y = seg.endY + dir.dy * ((tL1 - g0) * natTotal);
    this.drawHomographyStrip(
      ctx, tex, asset, wL0x, wL0y, wL1x, wL1y,
      tL0, tL1, dir.sign, camX, camY, vpW, vpH, visHalfW, 6
    );

    // 2. Right snapped landing wing (solid deck begins dead-on gapEnd; splinters jut slightly into gap)
    const lipOver = Math.min(clamp((g1 - g0) * 0.24, 0.012, 0.032), maxSplitT);
    const tR0 = Math.max(gMid + 0.005, g1 - lipOver);
    const tR1 = Math.min(1, g1 + rightSpan / natTotal);
    const wR0x = gapEndX - dir.dx * ((g1 - tR0) * natTotal);
    const wR0y = gapEndY - dir.dy * ((g1 - tR0) * natTotal);
    const wR1x = gapEndX + dir.dx * rightSpan;
    const wR1y = gapEndY + dir.dy * rightSpan;
    this.drawHomographyStrip(
      ctx, tex, asset, wR0x, wR0y, wR1x, wR1y,
      tR0, tR1, dir.sign, camX, camY, vpW, vpH, visHalfW, 6
    );
  }

  private drawTurnCornerCap(
    ctx: CanvasRenderingContext2D,
    seg: SlopeSegment,
    v: SegmentVisualCache,
    camX: number,
    camY: number,
    vpW: number,
    vpH: number,
    visHalfW: number
  ): void {
    const corner = v.cornerAsset;
    if (!corner) return;
    const tex = this.getTextureSource(corner.file, corner.mirror);
    if (!tex) return;

    const proj = this.projectPoint(seg.startX, seg.startY, camX, camY, vpW, vpH);
    if (proj.w <= PERSPECTIVE_W_MIN + 0.02) return;
    if (proj.y < -220 || proj.y > vpH + 240) return;

    const dirSign = seg.direction === 'RIGHT_DOWN' ? 1 : -1;
    const nx = -dirSign * GAME_CONSTANTS.SLOPE_SIN;
    const ny = GAME_CONSTANTS.SLOPE_COS;

    const pTop = this.projectPoint(seg.startX - nx * visHalfW, seg.startY - ny * visHalfW, camX, camY, vpW, vpH);
    const pBot = this.projectPoint(seg.startX + nx * visHalfW, seg.startY + ny * visHalfW, camX, camY, vpW, vpH);
    const roadScrW = Math.hypot(pBot.x - pTop.x, pBot.y - pTop.y);

    const deckW = Math.max(100, corner.deck_w_px || 205);
    const scaleF = (roadScrW * 0.98) / deckW;
    const drawW = corner.w * scaleF;
    const drawH = corner.h * scaleF;
    const topLeftX = proj.x - corner.pivot_px[0] * scaleF;
    const topLeftY = proj.y - corner.pivot_px[1] * scaleF;

    ctx.drawImage(tex, topLeftX, topLeftY, drawW, drawH);
  }

  // =========================================================================
  // Perspective Strip Meshing + Seam-Free Canvas 2D Affine Triangle Blitting
  // =========================================================================

  private drawHomographyStrip(
    ctx: CanvasRenderingContext2D,
    tex: CanvasImageSource,
    asset: RoadPieceMeta,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    tTex0: number,
    tTex1: number,
    dirSign: number,
    camX: number,
    camY: number,
    vpW: number,
    vpH: number,
    visHalfW: number,
    slices: number
  ): void {
    const clip = this.clipAndProjectSegment(startX, startY, endX, endY, camX, camY, vpW, vpH);
    if (!clip.visible) return;

    const maxScale = Math.max(clip.s0, clip.s1);
    const yPad = 180 * clamp(maxScale, 1, 4);
    const minY = Math.min(clip.p0y, clip.p1y);
    const maxY = Math.max(clip.p0y, clip.p1y);
    if (maxY < -yPad || minY > vpH + yPad) return;

    const w0x = lerp(startX, endX, clip.t0);
    const w0y = lerp(startY, endY, clip.t0);
    const w1x = lerp(startX, endX, clip.t1);
    const w1y = lerp(startY, endY, clip.t1);
    const tt0 = lerp(tTex0, tTex1, clip.t0);
    const tt1 = lerp(tTex0, tTex1, clip.t1);

    const nx = -dirSign * GAME_CONSTANTS.SLOPE_SIN;
    const ny = GAME_CONSTANTS.SLOPE_COS;

    const ax = asset.a_px[0];
    const ay = asset.a_px[1];
    const bx = asset.b_px[0];
    const by = asset.b_px[1];
    const npx = asset.normal_px[0];
    const npy = asset.normal_px[1];
    const texW = asset.w;
    const texH = asset.h;

    const walkHwPx = Math.max(8, asset.walk_half_w_px);
    const padTopUvPx = asset.pad_top_px * 1.07;
    const padBotUvPx = asset.pad_bot_px * 1.10;
    const topRatio = padTopUvPx / walkHwPx;
    const botRatio = padBotUvPx / walkHwPx;

    const count = Math.max(2, slices);
    const topPtsX = new Float64Array(count + 1);
    const topPtsY = new Float64Array(count + 1);
    const botPtsX = new Float64Array(count + 1);
    const botPtsY = new Float64Array(count + 1);
    const topU = new Float64Array(count + 1);
    const topV = new Float64Array(count + 1);
    const botU = new Float64Array(count + 1);
    const botV = new Float64Array(count + 1);

    for (let i = 0; i <= count; i++) {
      const frac = i / count;
      const wcx = lerp(w0x, w1x, frac);
      const wcy = lerp(w0y, w1y, frac);

      const pTop = this.projectPoint(wcx - nx * visHalfW, wcy - ny * visHalfW, camX, camY, vpW, vpH);
      const pBot = this.projectPoint(wcx + nx * visHalfW, wcy + ny * visHalfW, camX, camY, vpW, vpH);

      const midX = (pTop.x + pBot.x) * 0.5;
      const midY = (pTop.y + pBot.y) * 0.5;
      const halfX = (pBot.x - pTop.x) * 0.5;
      const halfY = (pBot.y - pTop.y) * 0.5;

      topPtsX[i] = midX - halfX * topRatio;
      topPtsY[i] = midY - halfY * topRatio;
      botPtsX[i] = midX + halfX * botRatio;
      botPtsY[i] = midY + halfY * botRatio;

      const tt = lerp(tt0, tt1, frac);
      const cx = lerp(ax, bx, tt);
      const cy = lerp(ay, by, tt);

      topU[i] = clamp(cx - npx * padTopUvPx, 0.5, texW - 0.5);
      topV[i] = clamp(cy - npy * padTopUvPx, 0.5, texH - 0.5);
      botU[i] = clamp(cx + npx * padBotUvPx, 0.5, texW - 0.5);
      botV[i] = clamp(cy + npy * padBotUvPx, 0.5, texH - 0.5);
    }

    for (let i = 0; i < count; i++) {
      // Tri 1: top[i], top[i+1], bot[i]
      this.drawTexturedTriangle(
        ctx, tex,
        topPtsX[i], topPtsY[i], topPtsX[i + 1], topPtsY[i + 1], botPtsX[i], botPtsY[i],
        topU[i], topV[i], topU[i + 1], topV[i + 1], botU[i], botV[i]
      );
      // Tri 2: bot[i], top[i+1], bot[i+1]
      this.drawTexturedTriangle(
        ctx, tex,
        botPtsX[i], botPtsY[i], topPtsX[i + 1], topPtsY[i + 1], botPtsX[i + 1], botPtsY[i + 1],
        botU[i], botV[i], topU[i + 1], topV[i + 1], botU[i + 1], botV[i + 1]
      );
    }
  }

  private drawTexturedTriangle(
    ctx: CanvasRenderingContext2D,
    tex: CanvasImageSource,
    x0: number, y0: number,
    x1: number, y1: number,
    x2: number, y2: number,
    u0: number, v0: number,
    u1: number, v1: number,
    u2: number, v2: number
  ): void {
    const du1 = u1 - u0;
    const dv1 = v1 - v0;
    const du2 = u2 - u0;
    const dv2 = v2 - v0;
    const det = du1 * dv2 - du2 * dv1;
    if (Math.abs(det) < 1e-4) return;

    const dx1 = x1 - x0;
    const dy1 = y1 - y0;
    const dx2 = x2 - x0;
    const dy2 = y2 - y0;

    // Skip degenerate zero-area screen triangles
    if (Math.abs(dx1 * dy2 - dx2 * dy1) < 0.25) return;

    const invDet = 1 / det;
    const a = (dx1 * dv2 - dx2 * dv1) * invDet;
    const b = (dy1 * dv2 - dy2 * dv1) * invDet;
    const c = (du1 * dx2 - du2 * dx1) * invDet;
    const d = (du1 * dy2 - du2 * dy1) * invDet;
    const e = x0 - a * u0 - c * v0;
    const f = y0 - b * u0 - d * v0;

    // Radially dilate ONLY the clip boundary slightly outward from triangle centroid
    // so adjacent homography strip triangles never show subpixel hairline seams.
    const mx = (x0 + x1 + x2) / 3;
    const my = (y0 + y1 + y2) / 3;

    const expandX = (vx: number, vy: number): [number, number] => {
      const rx = vx - mx;
      const ry = vy - my;
      const len = Math.hypot(rx, ry);
      if (len < 0.2) return [vx, vy];
      const k = TRIANGLE_SEAM_PAD_PX / len;
      return [vx + rx * k, vy + ry * k];
    };

    const [cx0, cy0] = expandX(x0, y0);
    const [cx1, cy1] = expandX(x1, y1);
    const [cx2, cy2] = expandX(x2, y2);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx0, cy0);
    ctx.lineTo(cx1, cy1);
    ctx.lineTo(cx2, cy2);
    ctx.closePath();
    ctx.clip();
    ctx.transform(a, b, c, d, e, f);
    ctx.drawImage(tex, 0, 0);
    ctx.restore();
  }
}
