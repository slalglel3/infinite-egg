import { Egg, SlopeSegment, Particle, GameStats, SlopeDirection, EggSplat, RoadObstacle } from '../types/game';
import { GAME_CONSTANTS } from './constants';
import { MapGenerator } from './mapGenerator';
import { EggRenderer } from './eggRenderer';
import {
  buildSpanQuad,
  buildTurnCornerPolygon,
  clampSpanCapShifts,
  computeOppositeRoadCapSlope,
  findSupportingSegment,
  getSegmentGroundGeometry,
  getSegmentSpanCapSlopes,
  getSegmentWalkSpans,
  Point2D,
  toGroundPoint,
} from './roadGeometry';
import { sound } from '../audio/sound';

export class GameEngine {
  private mapGen: MapGenerator;
  private eggRenderer: EggRenderer;

  public egg: Egg;
  public segments: SlopeSegment[] = [];
  public particles: Particle[] = [];
  public splats: EggSplat[] = [];
  public stats: GameStats;

  // 카메라 및 뷰포트
  public cameraX: number = 0;
  public cameraY: number = 0;
  private screenWidth: number = 800;
  private screenHeight: number = 600;

  // 게임 상태 플래그
  public isRunning: boolean = false;
  public isPaused: boolean = false;
  public isGameOver: boolean = false;
  public gameOverReason: 'CRACKED' | 'FALL' | null = null;
  private screenShake: number = 0;
  private damageFlashTimer: number = 0;
  private animTime: number = 0;
  private fallVelZ: number = 0;
  private roadMaskCanvas: HTMLCanvasElement | null = null;
  private roadMaskCtx: CanvasRenderingContext2D | null = null;

  // 점프 체공 시간 캐시 (속도 비례 고정 도달 거리 유지)
  private jumpActiveDuration: number = GAME_CONSTANTS.JUMP_DURATION_SEC;

  // 콜백
  public onGameOver?: (stats: GameStats, reason: 'CRACKED' | 'FALL') => void;

  constructor() {
    this.mapGen = new MapGenerator();
    this.eggRenderer = new EggRenderer();

    const maxHp = GAME_CONSTANTS.BASE_HP;

    this.egg = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      rotation: 0,
      direction: 'RIGHT_DOWN',
      state: 'ROLLING',
      expression: 'NORMAL',
      currentSegmentIndex: 0,
      jumpStartY: 0,
      jumpStartX: 0,
      jumpProgress: 0,
      jumpPeakHeight: GAME_CONSTANTS.JUMP_PEAK_PIXELS,
      jumpArcOffset: 0,
      dropStartY: 0,
      deathTimer: 0,
      maxHp,
      hp: maxHp,
      squishX: 1,
      squishY: 1,
      flashDamage: false,
      crackLevel: 0,
    };

    this.stats = {
      distanceMeters: 0,
      speed: GAME_CONSTANTS.INITIAL_SPEED,
      hp: maxHp,
      maxHp,
      itemsCollected: 0,
      isNewRecord: false,
      eggState: 'ROLLING',
    };
  }

  public setScreenSize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  public stop(): void {
    this.isRunning = false;
    this.isPaused = false;
  }

  /** 일시정지 상태 설정 */
  public setPaused(paused: boolean): void {
    if (!this.isRunning || this.isGameOver) {
      this.isPaused = false;
      return;
    }
    this.isPaused = paused;
  }

  /** 일시정지 토글 후 현재 일시정지 상태 반환 */
  public togglePause(): boolean {
    this.setPaused(!this.isPaused);
    return this.isPaused;
  }

  // 게임 재시작 및 완전 초기화
  public restart(): void {
    this.mapGen.bandageMultiplier = 1.0;
    this.mapGen.reset(0, 0);
    this.segments = this.mapGen.generateInitialMap();

    const maxHp = GAME_CONSTANTS.BASE_HP;
    const firstSeg = this.segments[0];
    const spawnT = 0.5;
    const spawnGroundX = firstSeg.startX + (firstSeg.endX - firstSeg.startX) * spawnT;
    const spawnGroundY = firstSeg.startY + (firstSeg.endY - firstSeg.startY) * spawnT;

    this.egg = {
      x: spawnGroundX,
      y: spawnGroundY - GAME_CONSTANTS.EGG_RADIUS_Y + 4,
      vx: 0,
      vy: 0,
      rotation: 0,
      direction: firstSeg.direction,
      state: 'ROLLING',
      expression: 'NORMAL',
      currentSegmentIndex: 0,
      jumpStartY: 0,
      jumpStartX: 0,
      jumpProgress: 0,
      jumpPeakHeight: GAME_CONSTANTS.JUMP_PEAK_PIXELS,
      jumpArcOffset: 0,
      dropStartY: 0,
      deathTimer: 0,
      maxHp,
      hp: maxHp,
      squishX: 1,
      squishY: 1,
      flashDamage: false,
      crackLevel: 0,
    };

    this.stats = {
      distanceMeters: 0,
      speed: GAME_CONSTANTS.INITIAL_SPEED,
      hp: maxHp,
      maxHp,
      itemsCollected: 0,
      isNewRecord: false,
      eggState: 'ROLLING',
    };

    this.particles = [];
    this.splats = [];
    this.cameraX = this.egg.x - this.screenWidth * 0.5;
    this.cameraY = this.egg.y - this.screenHeight * 0.42;
    this.isRunning = true;
    this.isPaused = false;
    this.isGameOver = false;
    this.gameOverReason = null;
    this.screenShake = 0;
    this.damageFlashTimer = 0;
    this.animTime = 0;
    this.fallVelZ = 0;
  }

  private getEggGroundY(): number {
    return this.egg.y + GAME_CONSTANTS.EGG_RADIUS_Y - 4;
  }

  private getObstacleLabel(kind: RoadObstacle['kind']): string {
    switch (kind) {
      case 'ROCK':
        return '돌멩이!';
      case 'HAY':
        return '짚더미!';
      case 'VINE':
        return '가시덩쿨!';
    }
  }

  // 1. [점프] 버튼 — 속도 무관 고정 거리 도약
  public triggerJump(): void {
    if (!this.isRunning || this.isGameOver || this.isPaused) return;
    if (this.egg.state !== 'ROLLING') return;

    this.egg.state = 'JUMPING';
    this.egg.jumpStartX = this.egg.x;
    this.egg.jumpStartY = this.egg.y;
    this.egg.jumpProgress = 0;
    this.egg.jumpArcOffset = 0;

    // 속도가 빨라져도 이동 거리는 항상 JUMP_DISTANCE_FORWARD로 고정하고 체공 시간만 자연스럽게 단축
    this.jumpActiveDuration = Math.max(
      0.22,
      Math.min(
        GAME_CONSTANTS.JUMP_DURATION_SEC,
        GAME_CONSTANTS.JUMP_DISTANCE_FORWARD / Math.max(340, this.stats.speed)
      )
    );

    sound.playJump();
  }

  // 2. [방향 전환] 버튼 — 별도 판정 원 없이 진행 방향만 즉시 전환 (낙하 여부는 길 접점으로만 체크)
  public triggerTurn(): void {
    if (!this.isRunning || this.isGameOver || this.isPaused) return;
    if (this.egg.state !== 'ROLLING') return;

    this.egg.direction = this.egg.direction === 'RIGHT_DOWN' ? 'LEFT_DOWN' : 'RIGHT_DOWN';
    sound.playTurn();
  }

  // ==========================================
  // 물리 업데이트 루프
  // ==========================================
  public update(dt: number): void {
    if (!this.isRunning || this.isPaused) return;
    if (!Number.isFinite(dt) || dt <= 0) return;
    const safeDt = Math.min(0.08, dt);
    this.animTime += safeDt;

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - safeDt * 25);
    }
    if (this.damageFlashTimer > 0) {
      this.damageFlashTimer -= safeDt;
      if (this.damageFlashTimer <= 0) {
        this.egg.flashDamage = false;
      }
    }

    this.egg.squishX += (1 - this.egg.squishX) * safeDt * 10;
    this.egg.squishY += (1 - this.egg.squishY) * safeDt * 10;

    this.updateParticles(safeDt);

    // 사망 연출 시퀀스 진행 (길 아래로 떨어지는 애니메이션 후 게임 종료)
    if (this.egg.state === 'SURPRISED_FALL') {
      this.stats.eggState = this.egg.state;
      this.egg.deathTimer += safeDt;
      this.egg.x += this.egg.vx * 0.5 * safeDt;
      this.egg.y += this.egg.vy * 0.5 * safeDt;
      this.egg.jumpArcOffset = Math.sin(Math.min(1, this.egg.deathTimer / 0.18) * Math.PI) * 7;
      if (this.egg.deathTimer >= 0.18) {
        this.egg.state = 'DEAD_FALLING';
        this.egg.jumpArcOffset = 0;
        this.fallVelZ = 95;
        sound.playFallWhistle();
      }
      return;
    }

    if (this.egg.state === 'DEAD_FALLING') {
      this.stats.eggState = this.egg.state;
      this.egg.deathTimer += safeDt;
      const drag = Math.max(0, 1 - 2.2 * safeDt);
      this.egg.vx *= drag;
      this.egg.vy *= drag;
      this.egg.x += this.egg.vx * safeDt;
      this.egg.y += this.egg.vy * safeDt;
      this.fallVelZ += 1350 * safeDt;
      this.egg.jumpArcOffset -= this.fallVelZ * safeDt;
      this.egg.rotation += (this.egg.direction === 'RIGHT_DOWN' ? 9 : -9) * safeDt;

      if (this.egg.deathTimer >= 1.15 && !this.isGameOver) {
        this.isGameOver = true;
        this.gameOverReason = 'FALL';
        if (this.onGameOver) {
          this.onGameOver(this.stats, 'FALL');
        }
      }
      return;
    }

    if (this.egg.state === 'DEAD_CRACKED') {
      this.stats.eggState = this.egg.state;
      this.egg.deathTimer += safeDt;
      if (this.egg.deathTimer >= 1.35 && !this.isGameOver) {
        this.isGameOver = true;
        this.gameOverReason = 'CRACKED';
        if (this.onGameOver) {
          this.onGameOver(this.stats, 'CRACKED');
        }
      }
      return;
    }

    // 고속 이동 및 프레임 드랍 시에도 길 경계를 뛰어넘지 않도록 1/90s 이하로 서브 스텝 분할
    const subSteps = Math.max(1, Math.ceil(safeDt / (1 / 90)));
    const stepDt = safeDt / subSteps;

    for (let s = 0; s < subSteps; s++) {
      const currentMeters = Math.floor(this.egg.y / GAME_CONSTANTS.PIXELS_PER_METER);
      this.stats.distanceMeters = Math.max(this.stats.distanceMeters, currentMeters);

      const speedStepCount = Math.floor(
        this.stats.distanceMeters / GAME_CONSTANTS.SPEED_INCREASE_INTERVAL_M
      );
      this.stats.speed = Math.min(
        GAME_CONSTANTS.MAX_SPEED,
        GAME_CONSTANTS.INITIAL_SPEED + speedStepCount * GAME_CONSTANTS.SPEED_INCREASE_STEP
      );

      if (this.egg.state === 'ROLLING') {
        this.updateRolling(stepDt);
      } else if (this.egg.state === 'JUMPING') {
        this.updateJumping(stepDt);
      }

      if (this.egg.state !== 'ROLLING' && this.egg.state !== 'JUMPING') {
        break;
      }
    }

    this.stats.eggState = this.egg.state;
    this.updateCamera(safeDt);
    this.ensureMapSegments();
  }

  // 1. 구르는 상태 (ROLLING) — 계란 바닥 접점만으로 길 위 유지 / 이탈 낙하 체크
  private updateRolling(dt: number): void {
    const currentSeg = this.segments[this.egg.currentSegmentIndex];
    if (!currentSeg) return;

    const dirSign = this.egg.direction === 'RIGHT_DOWN' ? 1 : -1;
    const moveDist = this.stats.speed * dt;
    const dx = dirSign * moveDist * GAME_CONSTANTS.SLOPE_COS;
    const dy = moveDist * GAME_CONSTANTS.SLOPE_SIN;

    this.egg.x += dx;
    this.egg.y += dy;
    this.egg.jumpArcOffset = 0;

    const rollAngle = moveDist / GAME_CONSTANTS.EGG_RADIUS_X;
    this.egg.rotation += dirSign * rollAngle;
    this.egg.expression = 'NORMAL';

    const groundY = this.getEggGroundY();
    const support = findSupportingSegment(
      this.segments,
      this.egg.x,
      groundY,
      this.egg.direction,
      this.egg.currentSegmentIndex
    );

    if (!support) {
      this.startFallSequence(
        dirSign * this.stats.speed * 0.36 * GAME_CONSTANTS.SLOPE_COS,
        this.stats.speed * 0.36 * GAME_CONSTANTS.SLOPE_SIN
      );
      return;
    }

    this.egg.currentSegmentIndex = support.segmentIndex;
    this.checkGroundedInteractions(groundY, true);
  }

  private checkGroundedInteractions(groundY: number, collectItems: boolean): void {
    const startIdx = Math.max(0, this.egg.currentSegmentIndex - 1);
    const endIdx = Math.min(this.segments.length - 1, this.egg.currentSegmentIndex + 2);
    const gp = toGroundPoint(this.egg.x, groundY);
    const halfW = GAME_CONSTANTS.ROAD_WIDTH * 0.5;

    for (let i = startIdx; i <= endIdx; i++) {
      const seg = this.segments[i];

      if (collectItems && seg.item && !seg.item.collected) {
        const distToItem = Math.hypot(this.egg.x - seg.item.x, groundY - seg.item.y);
        if (distToItem < 42) {
          seg.item.collected = true;
          this.egg.hp = Math.min(this.egg.maxHp, this.egg.hp + GAME_CONSTANTS.BANDAGE_HEAL_HP);
          this.stats.hp = this.egg.hp;
          this.stats.itemsCollected++;
          sound.playHeal();
          this.spawnTextParticle(
            this.egg.x,
            this.egg.y - 25,
            `+${GAME_CONSTANTS.BANDAGE_HEAL_HP} HP`,
            '#059669'
          );
        }
      }

      if (seg.type === 'TURN') continue;
      const geom = getSegmentGroundGeometry(seg);
      if (!geom) continue;

      const relX = gp.x - geom.g0.x;
      const relY = gp.y - geom.g0.y;
      const alongG = relX * geom.t.x + relY * geom.t.y;
      const perpG = Math.abs(relX * geom.n.x + relY * geom.n.y);
      if (alongG < -2 || alongG > geom.gLen + 2 || perpG > halfW + 2) continue;

      const alongWorld = (alongG / geom.gLen) * geom.worldLength;

      if (seg.obstacles && seg.obstacles.length > 0) {
        for (const obs of seg.obstacles) {
          if (obs.hit) continue;
          if (Math.abs(alongWorld - obs.t * geom.worldLength) <= GAME_CONSTANTS.OBSTACLE_HIT_RADIUS) {
            obs.hit = true;
            this.applyDamage(obs.damage, `${this.getObstacleLabel(obs.kind)} -${obs.damage}HP`);
            if (this.egg.state === 'DEAD_CRACKED') return;
          }
        }
      }

      if (seg.isCracked && !seg.isCollapsed && !seg.isPassed) {
        if (alongWorld >= geom.worldLength * 0.35 && alongWorld <= geom.worldLength * 0.75) {
          seg.isCollapsed = true;
          this.triggerCrackedRoadCollapse();
          return;
        }
      }
    }
  }

  // 2. 점프 상태 (JUMPING)
  private updateJumping(dt: number): void {
    const dirSign = this.egg.direction === 'RIGHT_DOWN' ? 1 : -1;
    const dur = Math.max(0.18, this.jumpActiveDuration || GAME_CONSTANTS.JUMP_DURATION_SEC);
    this.egg.jumpProgress += dt / dur;

    const p = Math.min(1, this.egg.jumpProgress);
    this.egg.x = this.egg.jumpStartX + dirSign * p * GAME_CONSTANTS.JUMP_DISTANCE_FORWARD * GAME_CONSTANTS.SLOPE_COS;
    this.egg.y = this.egg.jumpStartY + p * GAME_CONSTANTS.JUMP_DISTANCE_FORWARD * GAME_CONSTANTS.SLOPE_SIN;
    this.egg.jumpArcOffset = Math.sin(p * Math.PI) * this.egg.jumpPeakHeight;

    if (this.egg.direction === 'RIGHT_DOWN') {
      this.egg.rotation += dt * 10;
    } else {
      this.egg.rotation -= dt * 10;
    }

    if (this.egg.jumpProgress >= 1) {
      this.egg.jumpArcOffset = 0;
      this.handleJumpLanding();
    }
  }

  // 3. 점프 착지 체크 — 착지 접점이 실제 길 영역 위에 있는지로만 판단
  private handleJumpLanding(): void {
    const groundY = this.getEggGroundY();
    const support = findSupportingSegment(
      this.segments,
      this.egg.x,
      groundY,
      this.egg.direction,
      this.egg.currentSegmentIndex
    );

    if (support) {
      this.egg.currentSegmentIndex = support.segmentIndex;
      this.egg.state = 'ROLLING';

      const landedSeg = this.segments[support.segmentIndex];
      if (!support.isCornerWedge && landedSeg && landedSeg.isCracked && !landedSeg.isCollapsed) {
        if (support.alongWorldDist >= support.worldLength * 0.56) {
          landedSeg.isPassed = true;
        }
      }

      this.checkGroundedInteractions(groundY, true);
    } else {
      const dirSign = this.egg.direction === 'RIGHT_DOWN' ? 1 : -1;
      this.startFallSequence(
        dirSign * this.stats.speed * 0.25 * GAME_CONSTANTS.SLOPE_COS,
        this.stats.speed * 0.25 * GAME_CONSTANTS.SLOPE_SIN
      );
    }
  }

  // 금 간 도로 붕괴 및 추락
  private triggerCrackedRoadCollapse(): void {
    sound.playImpact(10);
    this.screenShake = 14;

    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.particles.push({
        x: this.egg.x + (Math.random() - 0.5) * 32,
        y: this.egg.y + GAME_CONSTANTS.EGG_RADIUS_Y,
        vx: Math.cos(angle) * speed,
        vy: -20 - Math.random() * 80,
        radius: 4 + Math.random() * 4,
        color: '#ea580c',
        alpha: 1,
        life: 0,
        maxLife: 1.0,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 12,
        type: 'CHUNK',
      });
    }

    const dirSign = this.egg.direction === 'RIGHT_DOWN' ? 1 : -1;
    this.egg.expression = 'PAIN';
    this.spawnTextParticle(this.egg.x, this.egg.y - 25, '다리 붕괴!', '#ea580c');
    this.startFallSequence(
      dirSign * this.stats.speed * 0.25 * GAME_CONSTANTS.SLOPE_COS,
      this.stats.speed * 0.25 * GAME_CONSTANTS.SLOPE_SIN
    );
  }

  private applyDamage(damage: number, label: string): void {
    this.egg.hp = Math.max(0, this.egg.hp - damage);
    this.stats.hp = this.egg.hp;

    this.egg.squishX = 1.35;
    this.egg.squishY = 0.72;
    this.screenShake = Math.min(14, 4 + damage * 0.45);
    this.egg.expression = 'PAIN';

    sound.playImpact(damage);
    this.spawnTextParticle(this.egg.x, this.egg.y - 25, label, '#dc2626');

    this.egg.flashDamage = true;
    this.damageFlashTimer = 0.12;

    if (this.egg.hp <= 0) {
      this.startCrackedSequence();
    }
  }

  private startFallSequence(vx: number, vy: number = 0): void {
    this.egg.state = 'SURPRISED_FALL';
    this.egg.expression = 'SURPRISED';
    this.egg.vx = vx;
    this.egg.vy = vy;
    this.fallVelZ = 0;
    this.egg.jumpArcOffset = 0;
    this.egg.deathTimer = 0;
    sound.playSurpriseBoing();
  }

  private startCrackedSequence(): void {
    this.egg.state = 'DEAD_CRACKED';
    this.egg.jumpArcOffset = 0;
    this.egg.deathTimer = 0;
    sound.playBreakSplat();

    const shellFragments = [];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.4;
      const dist = 18 + Math.random() * 18;
      shellFragments.push({
        offsetX: Math.cos(angle) * dist,
        offsetY: Math.sin(angle) * dist,
        size: 5 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
      });
    }

    this.splats.push({
      x: this.egg.x,
      y: this.egg.y + GAME_CONSTANTS.EGG_RADIUS_Y - 4,
      rotation: Math.random() * Math.PI * 2,
      radius: 26,
      shellFragments,
    });

    const breakParticles = this.eggRenderer.createBreakExplosion(this.egg.x, this.egg.y);
    this.particles.push(...breakParticles);
  }

  // ==========================================
  // 카메라 및 맵 세그먼트 동적 유지
  // ==========================================
  private updateCamera(dt: number): void {
    const targetX = this.egg.x - this.screenWidth * 0.5;
    const targetY = this.egg.y - this.screenHeight * 0.42;

    this.cameraX += (targetX - this.cameraX) * dt * 8;
    this.cameraY += (targetY - this.cameraY) * dt * 8;
  }

  private ensureMapSegments(): void {
    while (this.segments.length - this.egg.currentSegmentIndex < 30) {
      this.mapGen.generateDynamicPattern(this.segments, this.stats.distanceMeters);
    }

    if (this.egg.currentSegmentIndex > 75) {
      const removeCount = 10;
      this.segments.splice(0, removeCount);
      this.egg.currentSegmentIndex -= removeCount;
    }
  }

  // ==========================================
  // 파티클 업데이트
  // ==========================================
  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.vRot) {
        p.rotation = (p.rotation || 0) + p.vRot * dt;
      }
      if (p.type === 'SHELL' || p.type === 'CHUNK') {
        p.vy += (p.type === 'CHUNK' ? 750 : 480) * dt;
      }
    }
  }

  private spawnTextParticle(x: number, y: number, text: string, color: string): void {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: -55,
      radius: 0,
      color,
      alpha: 1,
      life: 0,
      maxLife: 0.85,
      type: 'TEXT',
      text,
    });
  }

  // 기준 4:3 경사(73.74°)의 꺾임 사잇각을 절반(36.87°, 3:1 비율)으로 좁히고,
  // 2D 평면 원근 사영(Homography)으로 직선 곡률 0px을 유지하며 위(원경 ~0.24x)-아래(근경 ~2.04x) 비율 차이 부여
  private static readonly PERSPECTIVE_K = 1.8;
  private static readonly PERSPECTIVE_W_MIN = 0.2;
  private static readonly MOBILE_GUIDE_WIDTH = 390;

  /**
   * 2D 평면 원근 호모그래피(Homography) 사영:
   * w = 1 - k * ry (ry가 위쪽 음수일수록 w 증가 -> scale 감소, 아래쪽 양수일수록 w 감소 -> scale 증가)
   * 직선은 화면에서도 수학적으로 정확히 직선(곡률 0)으로 사영되며,
   * 기준점(계란 위치 Y=0.42H)에서는 정확히 1.0배(49.4px)를 유지합니다.
   */
  private projectWorldPoint(wx: number, wy: number): { sx: number; sy: number; scale: number } {
    const anchorX = this.screenWidth * 0.5;
    const anchorY = this.screenHeight * 0.42;
    const rx = wx - (this.cameraX + anchorX);
    const ry = (wy - (this.cameraY + anchorY)) * GAME_CONSTANTS.ROAD_VERTICAL_RATIO;

    const k = GameEngine.PERSPECTIVE_K / Math.max(400, this.screenHeight);
    const w = Math.max(GameEngine.PERSPECTIVE_W_MIN, 1 - k * ry);
    const scale = 1 / w;

    return {
      sx: anchorX + rx * scale,
      sy: anchorY + ry * scale,
      scale,
    };
  }

  /**
   * 3D 동차 근평면(w >= wMin) 클리핑 후 2D 평면 호모그래피로 선분 끝점 사영
   */
  private projectHomogeneousSegment(
    sx: number,
    sy: number,
    ex: number,
    ey: number
  ): {
    p0: { sx: number; sy: number; scale: number };
    p1: { sx: number; sy: number; scale: number };
  } | null {
    const anchorX = this.screenWidth * 0.5;
    const anchorY = this.screenHeight * 0.42;
    const k = GameEngine.PERSPECTIVE_K / Math.max(400, this.screenHeight);
    const wMin = GameEngine.PERSPECTIVE_W_MIN;

    let rx0 = sx - (this.cameraX + anchorX);
    let ry0 = (sy - (this.cameraY + anchorY)) * GAME_CONSTANTS.ROAD_VERTICAL_RATIO;
    let w0 = 1 - k * ry0;

    let rx1 = ex - (this.cameraX + anchorX);
    let ry1 = (ey - (this.cameraY + anchorY)) * GAME_CONSTANTS.ROAD_VERTICAL_RATIO;
    let w1 = 1 - k * ry1;

    if (w0 < wMin && w1 < wMin) {
      return null;
    }

    if (w0 < wMin) {
      const t = (wMin - w0) / (w1 - w0);
      rx0 += (rx1 - rx0) * t;
      ry0 += (ry1 - ry0) * t;
      w0 = wMin;
    } else if (w1 < wMin) {
      const t = (wMin - w0) / (w1 - w0);
      rx1 = rx0 + (rx1 - rx0) * t;
      ry1 = ry0 + (ry1 - ry0) * t;
      w1 = wMin;
    }

    const s0 = 1 / w0;
    const s1 = 1 / w1;
    return {
      p0: { sx: anchorX + rx0 * s0, sy: anchorY + ry0 * s0, scale: s0 },
      p1: { sx: anchorX + rx1 * s1, sy: anchorY + ry1 * s1, scale: s1 },
    };
  }

  /**
   * 지면 평면 좌표(gx, gy) 다각형을 동차 근평면(w >= wMin)으로 클리핑 후 화면 좌표로 사영합니다.
   * 충돌 판정과 렌더링이 수학적으로 100% 동일한 다각형 정점을 공유합니다.
   */
  private projectGroundPolygon(groundPoly: Point2D[]): Array<{ sx: number; sy: number }> {
    const anchorX = this.screenWidth * 0.5;
    const anchorY = this.screenHeight * 0.42;
    const camAnchorX = this.cameraX + anchorX;
    const camAnchorGroundY = (this.cameraY + anchorY) * GAME_CONSTANTS.ROAD_VERTICAL_RATIO;
    const k = GameEngine.PERSPECTIVE_K / Math.max(400, this.screenHeight);
    const wMin = GameEngine.PERSPECTIVE_W_MIN;

    const input = groundPoly.map((pt) => {
      const rx = pt.x - camAnchorX;
      const ry = pt.y - camAnchorGroundY;
      return { rx, ry, w: 1 - k * ry };
    });

    const clipped: Array<{ rx: number; ry: number; w: number }> = [];
    for (let i = 0; i < input.length; i++) {
      const curr = input[i];
      const prev = input[(i + input.length - 1) % input.length];
      const currIn = curr.w >= wMin;
      const prevIn = prev.w >= wMin;

      if (currIn !== prevIn) {
        const denom = curr.w - prev.w;
        const t = Math.abs(denom) > 1e-8 ? (wMin - prev.w) / denom : 0;
        clipped.push({
          rx: prev.rx + (curr.rx - prev.rx) * t,
          ry: prev.ry + (curr.ry - prev.ry) * t,
          w: wMin,
        });
      }
      if (currIn) {
        clipped.push(curr);
      }
    }

    if (clipped.length < 3) return [];

    return clipped.map((v) => {
      const s = 1 / v.w;
      return {
        sx: anchorX + v.rx * s,
        sy: anchorY + v.ry * s,
      };
    });
  }

  private traceGroundPolygon(ctx: CanvasRenderingContext2D, groundPoly: Point2D[]): boolean {
    const pts = this.projectGroundPolygon(groundPoly);
    if (pts.length < 3) return false;
    ctx.beginPath();
    ctx.moveTo(pts[0].sx, pts[0].sy);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].sx, pts[i].sy);
    }
    ctx.closePath();
    return true;
  }

  private getRoadMaskContext(mainCtx: CanvasRenderingContext2D): {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
  } | null {
    if (typeof document === 'undefined') return null;

    const physW = Math.max(1, Math.round(mainCtx.canvas?.width || this.screenWidth));
    const physH = Math.max(1, Math.round(mainCtx.canvas?.height || this.screenHeight));

    if (!this.roadMaskCanvas) {
      this.roadMaskCanvas = document.createElement('canvas');
      this.roadMaskCtx = this.roadMaskCanvas.getContext('2d');
    }
    if (!this.roadMaskCanvas || !this.roadMaskCtx) return null;

    if (this.roadMaskCanvas.width !== physW || this.roadMaskCanvas.height !== physH) {
      this.roadMaskCanvas.width = physW;
      this.roadMaskCanvas.height = physH;
    }

    const maskCtx = this.roadMaskCtx;
    if (typeof maskCtx.setTransform === 'function') {
      maskCtx.setTransform(1, 0, 0, 1, 0, 0);
    }
    maskCtx.clearRect(0, 0, physW, physH);
    if (typeof mainCtx.getTransform === 'function' && typeof maskCtx.setTransform === 'function') {
      maskCtx.setTransform(mainCtx.getTransform());
    }
    return { canvas: this.roadMaskCanvas, ctx: maskCtx };
  }

  // ==========================================
  // 투명 와이어프레임 캔버스 렌더링 (순수 로직 상태)
  // ==========================================
  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    this.eggRenderer.setFilledShell(false);

    // 1. 순백 와이어프레임 캔버스 & 1m(100px) 기준 격자선
    this.drawWireframeBackground(ctx);

    const drawEggBehindRoad = this.egg.state === 'DEAD_FALLING' && this.egg.jumpArcOffset < -12;
    if (drawEggBehindRoad) {
      this.drawEggProjected(ctx);
    }

    // 2. 원근 비율 투영된 트랙 요소 (코너 자연 연결 + 도약대+GAP + 균열/붕괴 도로)
    this.drawWireframeRoads(ctx);

    // 3. 회복 아이템 & 획득 반경 와이어프레임
    this.drawWireframeItems(ctx);

    // 3.5. 길 위 장애물(돌멩이/짚더미/덩쿨) 와이어프레임 렌더링
    this.drawRoadObstacles(ctx);

    // 4. 파손 흔적 & 달걀 본체 (접지점 기준으로 도로 위에 정렬)
    for (const splat of this.splats) {
      const p = this.projectWorldPoint(splat.x, splat.y);
      ctx.save();
      ctx.translate(p.sx, p.sy);
      ctx.scale(p.scale, p.scale);
      ctx.translate(-splat.x, -splat.y);
      this.eggRenderer.drawEggSplat(ctx, splat);
      ctx.restore();
    }

    if (!drawEggBehindRoad) {
      this.drawEggProjected(ctx);
    }

    // 5. 판정 텍스트 & 와이어프레임 파편
    this.drawParticles(ctx);

    ctx.restore();

    // 6. PC/웹 브라우저 확인용 모바일 화면 폭(390px) 좌우 가이드라인
    this.drawMobileViewportGuides(ctx);
  }

  private drawEggProjected(ctx: CanvasRenderingContext2D): void {
    if (this.egg.state === 'DEAD_CRACKED') return;

    const groundOffset = GAME_CONSTANTS.EGG_RADIUS_Y - 4;
    const pGround = this.projectWorldPoint(this.egg.x, this.egg.y + groundOffset);
    const fallDrop = Math.max(0, -this.egg.jumpArcOffset);
    const fallDepthScale = fallDrop > 0 ? Math.max(0.32, 1 / (1 + fallDrop / 240)) : 1;
    const fallAlpha = fallDrop > 260 ? Math.max(0.12, 1 - (fallDrop - 260) / 180) : 1;

    const eggCenterScreenY = pGround.sy - (groundOffset + this.egg.jumpArcOffset) * pGround.scale;

    // 길 아래 추락 중일 때 이탈 고도(z=0)에서 현재 낙하 위치까지 점선 궤적 표시
    if (this.egg.state === 'DEAD_FALLING' && fallDrop > 3) {
      ctx.save();
      ctx.globalAlpha *= fallAlpha;
      ctx.strokeStyle = 'rgba(220, 38, 38, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pGround.sx, pGround.sy);
      ctx.lineTo(pGround.sx, eggCenterScreenY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha *= fallAlpha;
    if (fallDrop > 0) {
      ctx.translate(pGround.sx, eggCenterScreenY);
      ctx.scale(pGround.scale * fallDepthScale, pGround.scale * fallDepthScale);
      ctx.translate(-this.egg.x, -(this.egg.y - this.egg.jumpArcOffset));
    } else {
      ctx.translate(pGround.sx, pGround.sy - groundOffset * pGround.scale);
      ctx.scale(pGround.scale, pGround.scale);
      ctx.translate(-this.egg.x, -this.egg.y);
    }
    this.eggRenderer.drawEgg(ctx, this.egg);
    ctx.restore();
  }

  private drawMobileViewportGuides(ctx: CanvasRenderingContext2D): void {
    const mobileW = GameEngine.MOBILE_GUIDE_WIDTH;
    if (this.screenWidth <= mobileW + 4) return;

    const leftX = (this.screenWidth - mobileW) * 0.5;
    const rightX = (this.screenWidth + mobileW) * 0.5;
    const labelY = Math.min(114, this.screenHeight * 0.22);

    ctx.save();
    ctx.strokeStyle = 'rgba(79, 70, 229, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(leftX, 0);
    ctx.lineTo(leftX, this.screenHeight);
    ctx.moveTo(rightX, 0);
    ctx.lineTo(rightX, this.screenHeight);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(79, 70, 229, 0.75)';
    ctx.font = '700 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`MOBILE ${mobileW}px`, leftX + 6, labelY);
    ctx.textAlign = 'right';
    ctx.fillText(`${mobileW}px`, rightX - 6, labelY);
    ctx.restore();
  }

  private drawWireframeBackground(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);

    const gridStep = GAME_CONSTANTS.PIXELS_PER_METER; // 100px = 1m
    const offsetX = ((-this.cameraX % gridStep) + gridStep) % gridStep;
    const offsetY = ((-this.cameraY % gridStep) + gridStep) % gridStep;

    ctx.save();
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = offsetX; x < this.screenWidth; x += gridStep) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.screenHeight);
    }
    for (let y = offsetY; y < this.screenHeight; y += gridStep) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.screenWidth, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  private strokeProjectedLine(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    ex: number,
    ey: number
  ): void {
    const projected = this.projectHomogeneousSegment(sx, sy, ex, ey);
    if (!projected) return;
    ctx.beginPath();
    ctx.moveTo(projected.p0.sx, projected.p0.sy);
    ctx.lineTo(projected.p1.sx, projected.p1.sy);
    ctx.stroke();
  }

  private drawWireframeRoads(ctx: CanvasRenderingContext2D): void {
    const halfW = GAME_CONSTANTS.ROAD_WIDTH * 0.5;
    const visibleIndices: number[] = [];

    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      const pStart = this.projectWorldPoint(seg.startX, seg.startY);
      const pEnd = this.projectWorldPoint(seg.endX, seg.endY);

      let minSx = Math.min(pStart.sx, pEnd.sx);
      let maxSx = Math.max(pStart.sx, pEnd.sx);
      let minSy = Math.min(pStart.sy, pEnd.sy);
      let maxSy = Math.max(pStart.sy, pEnd.sy);

      if (seg.type === 'GAP') {
        const dirSign = seg.direction === 'RIGHT_DOWN' ? 1 : -1;
        const gapDist = seg.gapDistance ?? 92;
        const gapEndX = seg.endX + dirSign * gapDist * GAME_CONSTANTS.SLOPE_COS;
        const gapEndY = seg.endY + (seg.gapHeight ?? gapDist * GAME_CONSTANTS.SLOPE_SIN);
        const pGapEnd = this.projectWorldPoint(gapEndX, gapEndY);
        minSx = Math.min(minSx, pGapEnd.sx);
        maxSx = Math.max(maxSx, pGapEnd.sx);
        minSy = Math.min(minSy, pGapEnd.sy);
        maxSy = Math.max(maxSy, pGapEnd.sy);
      }

      if (
        maxSx < -320 ||
        minSx > this.screenWidth + 320 ||
        maxSy < -280 ||
        minSy > this.screenHeight + 280
      ) {
        continue;
      }
      visibleIndices.push(i);
    }

    // 1. 연결된 도로 전체(직선 + 코너 모따기 다각형)의 내부 선을 지워 하나의 연속된 외곽선으로 렌더링
    const roadLayer = this.getRoadMaskContext(ctx);
    const strokeTarget = roadLayer ? roadLayer.ctx : ctx;

    strokeTarget.save();
    strokeTarget.globalCompositeOperation = 'source-over';
    strokeTarget.lineJoin = 'round';
    strokeTarget.lineCap = 'round';

    const erasePolys: Point2D[][] = [];

    for (const idx of visibleIndices) {
      const seg = this.segments[idx];

      if (seg.type === 'TURN') {
        const strokePoly = buildTurnCornerPolygon(this.segments, idx, halfW, 2.5);
        if (!strokePoly) continue;

        const prevSeg = idx > 0 ? this.segments[idx - 1] : null;
        strokeTarget.strokeStyle = prevSeg?.isCracked && !prevSeg.isCollapsed ? '#ea580c' : '#334155';
        strokeTarget.lineWidth = roadLayer ? 2.8 : 1.4;
        if (this.traceGroundPolygon(strokeTarget, strokePoly)) {
          strokeTarget.stroke();
        }
        erasePolys.push(strokePoly);
        continue;
      }

      const geom = getSegmentGroundGeometry(seg);
      if (!geom) continue;

      const spans = getSegmentWalkSpans(seg, geom.gLen);
      const color =
        seg.type === 'GAP'
          ? '#0284c7'
          : seg.isCracked && !seg.isCollapsed
            ? '#ea580c'
            : '#334155';
      const baseWidth = seg.type === 'GAP' ? 1.8 : seg.isCracked && !seg.isCollapsed ? 1.9 : 1.4;
      strokeTarget.strokeStyle = color;
      strokeTarget.lineWidth = roadLayer ? baseWidth * 2 : baseWidth;

      const nextSeg = idx + 1 < this.segments.length ? this.segments[idx + 1] : null;
      const seamlessNext =
        !seg.isCollapsed &&
        seg.type !== 'GAP' &&
        nextSeg !== null &&
        nextSeg.type !== 'TURN' &&
        !nextSeg.isCollapsed &&
        nextSeg.direction === seg.direction &&
        Math.hypot(nextSeg.startX - seg.endX, nextSeg.startY - seg.endY) < 1;

      for (const sp of spans) {
        const { startCapSlope, endCapSlope } = getSegmentSpanCapSlopes(
          this.segments,
          idx,
          geom,
          sp.a,
          sp.b
        );
        const quad = buildSpanQuad(
          geom.g0,
          geom.t,
          geom.n,
          sp.a,
          sp.b,
          halfW,
          startCapSlope,
          endCapSlope
        );
        if (this.traceGroundPolygon(strokeTarget, quad)) {
          strokeTarget.stroke();
        }
        if (seamlessNext && sp.b === geom.gLen) {
          erasePolys.push(
            buildSpanQuad(geom.g0, geom.t, geom.n, sp.a, sp.b + 2.5, halfW, startCapSlope, 0)
          );
        } else {
          erasePolys.push(quad);
        }
      }
    }

    if (roadLayer) {
      strokeTarget.globalCompositeOperation = 'destination-out';
      strokeTarget.fillStyle = '#000000';
      for (const poly of erasePolys) {
        if (this.traceGroundPolygon(strokeTarget, poly)) {
          strokeTarget.fill();
        }
      }
      strokeTarget.restore();

      ctx.save();
      if (typeof ctx.setTransform === 'function') {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      ctx.drawImage(roadLayer.canvas, 0, 0);
      ctx.restore();
    } else {
      strokeTarget.restore();
    }

    // 2. 세그먼트별 보조 와이어프레임 (중심축, 코너 굴절점, 붕괴/균열 표시, GAP 낭떠러지)
    for (const i of visibleIndices) {
      const seg = this.segments[i];

      if (seg.type === 'TURN') {
        const pStart = this.projectWorldPoint(seg.startX, seg.startY);
        const d = 3.2 * pStart.scale;
        ctx.save();
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.75)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(pStart.sx, pStart.sy - d);
        ctx.lineTo(pStart.sx + d, pStart.sy);
        ctx.lineTo(pStart.sx, pStart.sy + d);
        ctx.lineTo(pStart.sx - d, pStart.sy);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const pEnd = this.projectWorldPoint(seg.endX, seg.endY);

      if (seg.isCollapsed) {
        ctx.save();
        const geom = getSegmentGroundGeometry(seg);
        if (geom) {
          const voidA = geom.gLen * 0.25;
          const voidB = geom.gLen * 0.75;
          const oppSlope = computeOppositeRoadCapSlope(geom.t);

          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 1.4;
          ctx.setLineDash([3, 3]);
          if (
            this.traceGroundPolygon(
              ctx,
              buildSpanQuad(geom.g0, geom.t, geom.n, voidA, voidB, halfW, oppSlope, oppSlope)
            )
          ) {
            ctx.stroke();
          }
        }

        const mid = this.projectWorldPoint((seg.startX + seg.endX) * 0.5, (seg.startY + seg.endY) * 0.5);
        ctx.fillStyle = '#dc2626';
        ctx.font = '700 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('COLLAPSED', mid.sx, mid.sy - halfW * mid.scale - 6 * mid.scale);
        ctx.restore();
        continue;
      }

      if (seg.type === 'GAP') {
        ctx.save();
        const dirSign = seg.direction === 'RIGHT_DOWN' ? 1 : -1;
        const gapDist = seg.gapDistance ?? 92;
        const gapEndX = seg.endX + dirSign * gapDist * GAME_CONSTANTS.SLOPE_COS;
        const gapEndY = seg.endY + (seg.gapHeight ?? gapDist * GAME_CONSTANTS.SLOPE_SIN);

        // 중심선
        ctx.strokeStyle = 'rgba(2, 132, 199, 0.35)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        this.strokeProjectedLine(ctx, seg.startX, seg.startY, seg.endX, seg.endY);

        // 절벽 끝 굵은 경계선 (반대쪽 방향 길과 평행한 나무 판자 결 각도)
        const geom = getSegmentGroundGeometry(seg);
        if (geom) {
          const { startCapSlope, endCapSlope } = getSegmentSpanCapSlopes(
            this.segments,
            i,
            geom,
            0,
            geom.gLen
          );
          const { endShift: cliffShift } = clampSpanCapShifts(
            geom.gLen,
            halfW,
            startCapSlope,
            endCapSlope
          );
          const capAx = geom.g1.x + geom.t.x * cliffShift + geom.n.x * halfW;
          const capAy = (geom.g1.y + geom.t.y * cliffShift + geom.n.y * halfW) / GAME_CONSTANTS.ROAD_VERTICAL_RATIO;
          const capBx = geom.g1.x - geom.t.x * cliffShift - geom.n.x * halfW;
          const capBy = (geom.g1.y - geom.t.y * cliffShift - geom.n.y * halfW) / GAME_CONSTANTS.ROAD_VERTICAL_RATIO;
          ctx.setLineDash([]);
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 2.6;
          this.strokeProjectedLine(ctx, capAx, capAy, capBx, capBy);

          // 빈 낭떠러지(GAP) 점선 브릿지
          const gGapStart = geom.g1;
          const gGapEnd = toGroundPoint(gapEndX, gapEndY);
          const gapGLen = Math.hypot(gGapEnd.x - gGapStart.x, gGapEnd.y - gGapStart.y);
          if (gapGLen > 0.5) {
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.75)';
            ctx.lineWidth = 1.2;
            ctx.setLineDash([5, 5]);
            if (
              this.traceGroundPolygon(
                ctx,
                buildSpanQuad(
                  gGapStart,
                  geom.t,
                  geom.n,
                  0,
                  gapGLen,
                  halfW * 0.75,
                  endCapSlope,
                  endCapSlope
                )
              )
            ) {
              ctx.stroke();
            }
          }
        }

        const gapMid = this.projectWorldPoint((seg.endX + gapEndX) * 0.5, (seg.endY + gapEndY) * 0.5);
        ctx.setLineDash([]);
        ctx.fillStyle = '#0284c7';
        ctx.font = '700 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CLIFF', pEnd.sx, pEnd.sy - halfW * pEnd.scale - 6 * pEnd.scale);
        ctx.fillStyle = '#64748b';
        ctx.fillText(`GAP ${Math.round(gapDist)}px`, gapMid.sx, gapMid.sy - 4 * gapMid.scale);
        ctx.restore();
        continue;
      }

      // 균열 / 일반 직선 보조 표시
      ctx.save();
      if (seg.isCracked) {
        const mid = this.projectWorldPoint((seg.startX + seg.endX) * 0.5, (seg.startY + seg.endY) * 0.5);
        const s = mid.scale;
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(mid.sx - 12 * s, mid.sy - 8 * s);
        ctx.lineTo(mid.sx - 4 * s, mid.sy + 4 * s);
        ctx.lineTo(mid.sx + 4 * s, mid.sy - 4 * s);
        ctx.lineTo(mid.sx + 12 * s, mid.sy + 8 * s);
        ctx.stroke();

        ctx.fillStyle = '#ea580c';
        ctx.font = '700 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CRACKED', mid.sx, mid.sy - halfW * s - 6 * s);
      } else {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        this.strokeProjectedLine(ctx, seg.startX, seg.startY, seg.endX, seg.endY);
      }
      ctx.restore();
    }
  }

  private drawWireframeItems(ctx: CanvasRenderingContext2D): void {
    const time = this.animTime * 4;

    for (const seg of this.segments) {
      if (seg.item && !seg.item.collected) {
        const floatY = seg.item.y + Math.sin(time) * 3;
        const p = this.projectWorldPoint(seg.item.x, floatY);
        if (p.sy < -80 || p.sy > this.screenHeight + 80) continue;

        ctx.save();
        ctx.translate(p.sx, p.sy);
        ctx.scale(p.scale, p.scale);

        // 반창고 획득 반경 (32px) 점선 원
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.stroke();

        // 사각형 배지
        ctx.setLineDash([]);
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(-10, -10, 20, 20, 4);
        ctx.stroke();

        // 내부 십자 마크
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(-2.5, -6.5);
        ctx.lineTo(2.5, -6.5);
        ctx.lineTo(2.5, -2.5);
        ctx.lineTo(6.5, -2.5);
        ctx.lineTo(6.5, 2.5);
        ctx.lineTo(2.5, 2.5);
        ctx.lineTo(2.5, 6.5);
        ctx.lineTo(-2.5, 6.5);
        ctx.lineTo(-2.5, 2.5);
        ctx.lineTo(-6.5, 2.5);
        ctx.lineTo(-6.5, -2.5);
        ctx.lineTo(-2.5, -2.5);
        ctx.closePath();
        ctx.stroke();

        ctx.font = '700 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#059669';
        ctx.fillText('+25HP', 0, -15);

        ctx.restore();
      }
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const proj = this.projectWorldPoint(p.x, p.y);
      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.type === 'TEXT') {
        ctx.font = '800 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.strokeText(p.text || '', proj.sx, proj.sy);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text || '', proj.sx, proj.sy);
      } else if (p.type === 'CHUNK') {
        ctx.translate(proj.sx, proj.sy);
        ctx.scale(proj.scale, proj.scale);
        ctx.rotate(p.rotation || 0);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.4;
        const r = p.radius;
        ctx.beginPath();
        ctx.moveTo(-r * 0.8, -r * 0.9);
        ctx.lineTo(r * 0.9, -r * 0.6);
        ctx.lineTo(r * 0.7, r * 0.8);
        ctx.lineTo(-r * 0.6, r * 0.9);
        ctx.closePath();
        ctx.stroke();
      } else if (p.type === 'SHELL') {
        ctx.translate(proj.sx, proj.sy);
        ctx.scale(proj.scale, proj.scale);
        ctx.rotate(p.rotation || 0);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(0, -p.radius);
        ctx.lineTo(p.radius * 0.9, p.radius * 0.8);
        ctx.lineTo(-p.radius * 0.8, p.radius * 0.7);
        ctx.closePath();
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // 길 위 장애물(돌멩이 / 짚더미 / 덩쿨) 순수 와이어프레임 렌더링
  private drawRoadObstacles(ctx: CanvasRenderingContext2D): void {
    for (const seg of this.segments) {
      if (!seg.obstacles || seg.obstacles.length === 0) continue;

      for (const obs of seg.obstacles) {
        const p = this.projectWorldPoint(obs.x, obs.y);
        if (p.scale <= 0.08 || p.scale > 6) continue;
        if (
          p.sx < -120 ||
          p.sx > this.screenWidth + 120 ||
          p.sy < -120 ||
          p.sy > this.screenHeight + 120
        ) {
          continue;
        }

        ctx.save();
        ctx.translate(p.sx, p.sy);
        ctx.scale(p.scale, p.scale * (obs.hit ? 0.52 : 1));
        if (obs.hit) {
          ctx.globalAlpha = 0.42;
        }

        ctx.strokeStyle = obs.hit ? '#94a3b8' : '#dc2626';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        if (obs.kind === 'ROCK') {
          ctx.moveTo(-10, 3);
          ctx.lineTo(-4, -10);
          ctx.lineTo(8, -7);
          ctx.lineTo(10, 3);
          ctx.closePath();
        } else if (obs.kind === 'HAY') {
          ctx.roundRect(-13, -9, 26, 12, 4);
        } else {
          ctx.moveTo(-15, 0);
          ctx.lineTo(-5, -8);
          ctx.lineTo(5, 2);
          ctx.lineTo(15, -7);
        }
        ctx.stroke();

        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = obs.hit ? 'rgba(148, 163, 184, 0.7)' : 'rgba(220, 38, 38, 0.85)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, -3, GAME_CONSTANTS.OBSTACLE_HIT_RADIUS * 0.72, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = obs.hit ? '#64748b' : '#b91c1c';
        ctx.font = '700 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(obs.kind, 0, -15);

        ctx.restore();
      }
    }
  }
}
