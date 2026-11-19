import { SlopeDirection, SlopeSegment } from '../types/game';
import { GAME_CONSTANTS } from './constants';

export interface Point2D {
  x: number;
  y: number;
}

export interface SupportingWalkMatch {
  segmentIndex: number;
  matchedDirection: boolean;
  isCornerWedge: boolean;
  alongWorldDist: number;
  worldLength: number;
}

const G_COS_LEN = GAME_CONSTANTS.SLOPE_COS;
const G_SIN_LEN = GAME_CONSTANTS.SLOPE_SIN * GAME_CONSTANTS.ROAD_VERTICAL_RATIO;
const G_UNIT_LEN = Math.hypot(G_COS_LEN, G_SIN_LEN);
export const GROUND_TANGENT_COS = G_COS_LEN / G_UNIT_LEN;
export const GROUND_TANGENT_SIN = G_SIN_LEN / G_UNIT_LEN;
export const WORLD_TO_GROUND_SCALE = G_UNIT_LEN;

export function toGroundPoint(wx: number, wy: number): Point2D {
  return {
    x: wx,
    y: wy * GAME_CONSTANTS.ROAD_VERTICAL_RATIO,
  };
}

/**
 * 자유 절단면(GAP 절벽/착지단, 붕괴 구간, 출발단 등)이 반대쪽 진행 방향 길(지그재그 대칭 축)과
 * 평행하도록 지면 평면 상의 레일 오프셋 기울기(alongShift / perpOffset)를 반환합니다.
 * - RIGHT_DOWN(왼쪽이 높고 오른쪽이 낮은 길) -> LEFT_DOWN(오른쪽이 높은 길)에 평행 (-4/3)
 * - LEFT_DOWN(오른쪽이 높고 왼쪽이 낮은 길) -> RIGHT_DOWN(왼쪽이 높은 길)에 평행 (+4/3)
 */
export function computeOppositeRoadCapSlope(t: Point2D): number {
  const denom = 2 * t.x * t.y;
  if (Math.abs(denom) < 1e-6) return 0;
  return (t.y * t.y - t.x * t.x) / denom;
}

export function clampSpanCapShifts(
  spanLen: number,
  halfW: number,
  startCapSlope: number,
  endCapSlope: number
): { startShift: number; endShift: number } {
  let startShift = halfW * startCapSlope;
  let endShift = halfW * endCapSlope;
  const minRailLen = Math.min(4, spanLen * 0.2);
  const maxDelta = Math.max(0, spanLen - minRailLen);
  const delta = endShift - startShift;
  if (Math.abs(delta) > maxDelta && Math.abs(delta) > 1e-6) {
    const scale = maxDelta / Math.abs(delta);
    startShift *= scale;
    endShift *= scale;
  }
  return { startShift, endShift };
}

export function getSegmentSpanCapSlopes(
  segments: SlopeSegment[],
  segIndex: number,
  geom: { g0: Point2D; t: Point2D; gLen: number },
  spanA: number,
  spanB: number
): { startCapSlope: number; endCapSlope: number } {
  const seg = segments[segIndex];
  const prevSeg = segIndex > 0 ? segments[segIndex - 1] : null;
  const nextSeg = segIndex + 1 < segments.length ? segments[segIndex + 1] : null;

  const startConnected =
    spanA === 0 &&
    !seg.isCollapsed &&
    prevSeg !== null &&
    (prevSeg.type === 'TURN' ||
      (prevSeg.type !== 'GAP' &&
        !prevSeg.isCollapsed &&
        prevSeg.direction === seg.direction &&
        Math.hypot(seg.startX - prevSeg.endX, seg.startY - prevSeg.endY) < 1));

  const endConnected =
    spanB === geom.gLen &&
    seg.type !== 'GAP' &&
    !seg.isCollapsed &&
    nextSeg !== null &&
    (nextSeg.type === 'TURN' ||
      (!nextSeg.isCollapsed &&
        nextSeg.direction === seg.direction &&
        Math.hypot(nextSeg.startX - seg.endX, nextSeg.startY - seg.endY) < 1));

  const oppSlope = computeOppositeRoadCapSlope(geom.t);
  return {
    startCapSlope: startConnected ? 0 : oppSlope,
    endCapSlope: endConnected ? 0 : oppSlope,
  };
}

export function getSegmentGroundGeometry(seg: SlopeSegment): {
  g0: Point2D;
  g1: Point2D;
  t: Point2D;
  n: Point2D;
  gLen: number;
  worldLength: number;
} | null {
  const g0 = toGroundPoint(seg.startX, seg.startY);
  const g1 = toGroundPoint(seg.endX, seg.endY);
  const dx = g1.x - g0.x;
  const dy = g1.y - g0.y;
  const gLen = Math.hypot(dx, dy);
  if (gLen < 0.5) return null;

  const t = { x: dx / gLen, y: dy / gLen };
  const n = { x: -t.y, y: t.x };
  const worldLength = seg.length || Math.hypot(seg.endX - seg.startX, seg.endY - seg.startY);
  return { g0, g1, t, n, gLen, worldLength };
}

export function getSegmentWalkSpans(seg: SlopeSegment, gLen: number): Array<{ a: number; b: number }> {
  if (seg.type === 'TURN') return [];
  if (seg.isCollapsed) {
    return [
      { a: 0, b: gLen * 0.25 },
      { a: gLen * 0.75, b: gLen },
    ];
  }
  return [{ a: 0, b: gLen }];
}

export function buildSpanQuad(
  g0: Point2D,
  t: Point2D,
  n: Point2D,
  a: number,
  b: number,
  halfW: number,
  startCapSlope: number = 0,
  endCapSlope: number = 0
): Point2D[] {
  const { startShift, endShift } = clampSpanCapShifts(b - a, halfW, startCapSlope, endCapSlope);
  const axTop = g0.x + t.x * (a + startShift) + n.x * halfW;
  const ayTop = g0.y + t.y * (a + startShift) + n.y * halfW;
  const bxTop = g0.x + t.x * (b + endShift) + n.x * halfW;
  const byTop = g0.y + t.y * (b + endShift) + n.y * halfW;
  const bxBot = g0.x + t.x * (b - endShift) - n.x * halfW;
  const byBot = g0.y + t.y * (b - endShift) - n.y * halfW;
  const axBot = g0.x + t.x * (a - startShift) - n.x * halfW;
  const ayBot = g0.y + t.y * (a - startShift) - n.y * halfW;
  return [
    { x: axTop, y: ayTop },
    { x: bxTop, y: byTop },
    { x: bxBot, y: byBot },
    { x: axBot, y: ayBot },
  ];
}

export function getTurnNeighborInfo(
  segments: SlopeSegment[],
  turnIndex: number
): {
  dirIn: SlopeDirection;
  dirOut: SlopeDirection;
  prevSegIndex: number;
  nextSegIndex: number;
  prevGLen: number;
  nextGLen: number;
} | null {
  const turnSeg = segments[turnIndex];
  if (!turnSeg || turnSeg.type !== 'TURN') return null;

  let prevSegIndex = -1;
  let prevGLen = 70 * WORLD_TO_GROUND_SCALE;
  let dirIn: SlopeDirection = turnSeg.direction;
  if (turnIndex > 0 && segments[turnIndex - 1].type !== 'TURN') {
    prevSegIndex = turnIndex - 1;
    const prev = segments[prevSegIndex];
    dirIn = prev.direction;
    const gPrev = getSegmentGroundGeometry(prev);
    if (gPrev) prevGLen = gPrev.gLen;
  }

  let nextSegIndex = -1;
  let nextGLen = 70 * WORLD_TO_GROUND_SCALE;
  let dirOut: SlopeDirection = dirIn === 'RIGHT_DOWN' ? 'LEFT_DOWN' : 'RIGHT_DOWN';
  if (turnIndex + 1 < segments.length && segments[turnIndex + 1].type !== 'TURN') {
    nextSegIndex = turnIndex + 1;
    const next = segments[nextSegIndex];
    dirOut = next.direction;
    const gNext = getSegmentGroundGeometry(next);
    if (gNext) nextGLen = gNext.gLen;
  }

  if (dirIn === dirOut) return null;

  return {
    dirIn,
    dirOut,
    prevSegIndex,
    nextSegIndex,
    prevGLen,
    nextGLen,
  };
}

/**
 * 코너(TURN) 꼭짓점 V 주변에서 진입 도로와 진출 도로의 외곽선을 자연스럽게 잇는
 * 모따기(Chamfered Miter) 볼록 오각형을 지면 평면 좌표계로 생성합니다.
 * maskOverlapPx > 0일 경우 안티앨리어싱 이음새 제거용 내부 중첩 칠각형으로 확장합니다.
 */
export function buildTurnCornerPolygon(
  segments: SlopeSegment[],
  turnIndex: number,
  halfW: number,
  maskOverlapPx: number = 0
): Point2D[] | null {
  const info = getTurnNeighborInfo(segments, turnIndex);
  if (!info) return null;

  const turnSeg = segments[turnIndex];
  const v = toGroundPoint(turnSeg.startX, turnSeg.startY);
  const sIn = info.dirIn === 'RIGHT_DOWN' ? 1 : -1;

  const c = GROUND_TANGENT_COS;
  const s = GROUND_TANGENT_SIN;

  // 진입/진출 도로 끝면과 일치하는 외곽 모서리 정점
  const aOut: Point2D = {
    x: v.x + sIn * s * halfW,
    y: v.y - c * halfW,
  };
  const bOut: Point2D = {
    x: v.x + sIn * s * halfW,
    y: v.y + c * halfW,
  };

  // 직선 레일 연장선(slope c:s) 상에서 모따기 한계 거리까지 확장
  const minReach = s * halfW + 0.5;
  const maxSharpMiter = halfW / s;
  const reach = Math.min(maxSharpMiter, Math.max(minReach, halfW * GAME_CONSTANTS.CORNER_OUTER_REACH_FACTOR));
  const k = (reach - s * halfW) / c;

  const m1: Point2D = {
    x: v.x + sIn * reach,
    y: v.y - (c * halfW - k * s),
  };
  const m2: Point2D = {
    x: v.x + sIn * reach,
    y: v.y + (c * halfW - k * s),
  };

  if (maskOverlapPx <= 0) {
    return [v, aOut, m1, m2, bOut];
  }

  const shift = Math.min(maskOverlapPx, info.prevGLen * 0.4, info.nextGLen * 0.4);
  if (shift < 0.2) {
    return [v, aOut, m1, m2, bOut];
  }

  const vShift: Point2D = {
    x: v.x - 2 * sIn * c * shift,
    y: v.y,
  };
  const aOutBack: Point2D = {
    x: aOut.x - sIn * c * shift,
    y: aOut.y - s * shift,
  };
  const bOutFwd: Point2D = {
    x: bOut.x - sIn * c * shift,
    y: bOut.y + s * shift,
  };

  return [vShift, aOutBack, aOut, m1, m2, bOut, bOutFwd];
}

export function pointInConvexPolygon(p: Point2D, poly: Point2D[], eps: number = 1e-4): boolean {
  let seenSign = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ex = b.x - a.x;
    const ey = b.y - a.y;
    const edgeLen = Math.hypot(ex, ey);
    if (edgeLen < 1e-6) continue;

    const signedDist = (ex * (p.y - a.y) - ey * (p.x - a.x)) / edgeLen;
    if (Math.abs(signedDist) <= eps) continue;

    const sign = signedDist > 0 ? 1 : -1;
    if (seenSign === 0) {
      seenSign = sign;
    } else if (seenSign !== sign) {
      return false;
    }
  }
  return true;
}

/**
 * 계란의 바닥 접점 (wx, groundY)이 실제 도로 영역(직선/도약 발판/코너 연결부) 위에 있는지 판정하고,
 * 현재 진행 방향과 일치하는 최적의 세그먼트 인덱스를 반환합니다.
 */
export function findSupportingSegment(
  segments: SlopeSegment[],
  wx: number,
  groundY: number,
  eggDir: SlopeDirection,
  hintIndex: number
): SupportingWalkMatch | null {
  if (segments.length === 0) return null;

  const halfW = GAME_CONSTANTS.ROAD_WIDTH * 0.5;
  const gp = toGroundPoint(wx, groundY);
  const startIdx = Math.max(0, hintIndex - 2);
  const endIdx = Math.min(segments.length - 1, hintIndex + 10);
  const eps = 1e-3;

  let bestDirRect: SupportingWalkMatch | null = null;
  let bestCorner: SupportingWalkMatch | null = null;
  let bestFallbackRect: SupportingWalkMatch | null = null;

  for (let i = startIdx; i <= endIdx; i++) {
    const seg = segments[i];

    if (seg.type === 'TURN') {
      const poly = buildTurnCornerPolygon(segments, i, halfW, 0);
      if (!poly || !pointInConvexPolygon(gp, poly, eps)) continue;

      const info = getTurnNeighborInfo(segments, i);
      const matchedOut = info ? info.dirOut === eggDir : false;
      const resolvedIndex = matchedOut && info && info.nextSegIndex !== -1 ? info.nextSegIndex : i;

      // 이미 진출 방향과 일치하는 코너 연결부면 직진 진행과 동일하게 우선 추적
      if (!bestCorner || (matchedOut && !bestCorner.matchedDirection)) {
        bestCorner = {
          segmentIndex: resolvedIndex,
          matchedDirection: matchedOut,
          isCornerWedge: true,
          alongWorldDist: 0,
          worldLength: 0,
        };
      }
      continue;
    }

    const geom = getSegmentGroundGeometry(seg);
    if (!geom) continue;

    const relX = gp.x - geom.g0.x;
    const relY = gp.y - geom.g0.y;
    const alongG = relX * geom.t.x + relY * geom.t.y;
    const perpG = relX * geom.n.x + relY * geom.n.y;

    if (Math.abs(perpG) > halfW + eps) continue;

    const spans = getSegmentWalkSpans(seg, geom.gLen);
    let insideSpan = false;
    for (const sp of spans) {
      const { startCapSlope, endCapSlope } = getSegmentSpanCapSlopes(
        segments,
        i,
        geom,
        sp.a,
        sp.b
      );
      const { startShift, endShift } = clampSpanCapShifts(
        sp.b - sp.a,
        halfW,
        startCapSlope,
        endCapSlope
      );
      const latRatio = perpG / halfW;
      const minAlong = sp.a + latRatio * startShift;
      const maxAlong = sp.b + latRatio * endShift;
      if (alongG >= minAlong - eps && alongG <= maxAlong + eps) {
        insideSpan = true;
        break;
      }
    }
    if (!insideSpan) continue;

    const alongWorldDist = (alongG / geom.gLen) * geom.worldLength;
    const candidate: SupportingWalkMatch = {
      segmentIndex: i,
      matchedDirection: seg.direction === eggDir,
      isCornerWedge: false,
      alongWorldDist,
      worldLength: geom.worldLength,
    };

    if (candidate.matchedDirection) {
      bestDirRect = candidate;
    } else {
      bestFallbackRect = candidate;
    }
  }

  return bestDirRect ?? bestCorner ?? bestFallbackRect;
}
