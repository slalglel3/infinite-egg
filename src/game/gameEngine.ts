import { Egg, SlopeSegment, Particle, GameStats, SlopeDirection, EggSplat, EggSkin } from '../types/game';
import { GAME_CONSTANTS } from './constants';
import { MapGenerator } from './mapGenerator';
import { EggRenderer } from './eggRenderer';
import { sound } from '../audio/sound';
import { getEggSkinById } from '../data/eggSkins';

export interface EggTrailPoint {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  color: string;
  type: 'SKID' | 'SPARK' | 'SLIME' | 'HOLY' | 'DARK_FIRE';
  rotation?: number;
}

export class GameEngine {
  private mapGen: MapGenerator;
  private eggRenderer: EggRenderer;
  private currentSkin: EggSkin = getEggSkinById('classic');

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
  public isGameOver: boolean = false;
  public gameOverReason: 'CRACKED' | 'FALL' | null = null;
  private screenShake: number = 0;

  // 점프 판정용 (절벽 끝점과의 거리)
  private isCurrentJumpMisjump: boolean = false;
  private jumpDistanceToEdge: number = 0;

  // 방향 전환 선입력 버퍼링 (Input Buffering)
  private turnBuffered: boolean = false;
  private turnBufferTimer: number = 0;
  private turnBufferSegIndex: number = -1;
  private turnBufferDir: SlopeDirection = 'RIGHT_DOWN';

  // 계란 주행 궤적 (Trail & Skidmark)
  public trails: EggTrailPoint[] = [];
  private trailSpawnTimer: number = 0;

  // 대기 환경 파티클 타이머 (눈송이, 불티 등)
  private ambientParticleTimer: number = 0;

  // 콜백
  public onGameOver?: (stats: GameStats, reason: 'CRACKED' | 'FALL') => void;

  constructor(userLevel: number = 1) {
    this.mapGen = new MapGenerator();
    this.eggRenderer = new EggRenderer();

    const maxHp = GAME_CONSTANTS.BASE_HP + (userLevel - 1) * GAME_CONSTANTS.HP_PER_LEVEL;

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
      perfectLandings: 0,
      itemsCollected: 0,
      isNewRecord: false,
    };
  }

  public setScreenSize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  public setSkin(skin: EggSkin): void {
    this.currentSkin = skin;
    this.eggRenderer.setSkin(skin);
  }

  public setCostumes(costumes?: { hat?: string; top?: string; bottom?: string; hand?: string }): void {
    this.eggRenderer.setCostumes(costumes);
  }

  // 게임 재시작 및 완전 초기화
  public restart(
    userLevel: number = 1,
    skin?: EggSkin,
    costumes?: { hat?: string; top?: string; bottom?: string; hand?: string }
  ): void {
    if (skin) {
      this.setSkin(skin);
    }
    this.setCostumes(costumes);

    this.mapGen.reset(0, 0);
    this.segments = this.mapGen.generateInitialMap();

    const hpBonus = this.currentSkin.hpBonus || 0;
    const maxHp = GAME_CONSTANTS.BASE_HP + (userLevel - 1) * GAME_CONSTANTS.HP_PER_LEVEL + hpBonus;
    const firstSeg = this.segments[0];

    this.egg = {
      x: firstSeg.startX,
      y: firstSeg.startY - GAME_CONSTANTS.EGG_RADIUS_Y + 4,
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
      perfectLandings: 0,
      itemsCollected: 0,
      isNewRecord: false,
    };

    this.particles = [];
    this.splats = [];
    this.trails = [];
    this.trailSpawnTimer = 0;
    this.turnBuffered = false;
    this.turnBufferTimer = 0;
    this.turnBufferSegIndex = -1;
    this.cameraX = this.egg.x;
    this.cameraY = this.egg.y;
    this.isRunning = true;
    this.isGameOver = false;
    this.gameOverReason = null;
    this.screenShake = 0;
    this.ambientParticleTimer = 0;
    this.egg.devilStage = 0;
    this.egg.trailTimer = 0;
  }

  // ==========================================
  // 유저 조작 입력 (점프 & 방향 전환)
  // ==========================================

  // 1. [점프] 버튼
  public triggerJump(): void {
    if (!this.isRunning || this.isGameOver) return;
    if (this.egg.state !== 'ROLLING') return;

    const currentSeg = this.segments[this.egg.currentSegmentIndex];
    this.egg.state = 'JUMPING';
    this.egg.jumpStartX = this.egg.x;
    this.egg.jumpStartY = this.egg.y;
    this.egg.jumpProgress = 0;
    this.egg.jumpArcOffset = 0;

    sound.playJump();

    // [사이버 메탈란] 점프 시 등 뒤에서 나사가 우수수 떨어져 데굴데굴 구르는 물리 연출!
    if (this.currentSkin.id === 'metal_egg' || this.currentSkin.specialType === 'METAL') {
      const dirSign = this.egg.direction === 'RIGHT_DOWN' ? -1 : 1;
      for (let i = 0; i < 6; i++) {
        this.particles.push({
          x: this.egg.x + (Math.random() - 0.5) * 10,
          y: this.egg.y + GAME_CONSTANTS.EGG_RADIUS_Y - 4,
          vx: dirSign * (35 + Math.random() * 65) + (Math.random() - 0.5) * 35,
          vy: -45 - Math.random() * 65,
          radius: 3.2,
          color: '#94a3b8',
          alpha: 1,
          life: 0,
          maxLife: 1.4,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 16,
          type: 'BOLT',
        });
      }
    }

    let targetGapSeg: SlopeSegment | null = null;
    if (currentSeg && currentSeg.type === 'GAP') {
      targetGapSeg = currentSeg;
    } else {
      const nextSeg = this.segments[this.egg.currentSegmentIndex + 1];
      if (nextSeg && nextSeg.type === 'GAP') {
        targetGapSeg = nextSeg;
      }
    }

    if (targetGapSeg) {
      const distToEdge = Math.hypot(targetGapSeg.endX - this.egg.x, targetGapSeg.endY - this.egg.y);
      this.jumpDistanceToEdge = distToEdge;
      this.isCurrentJumpMisjump = false;
    } else {
      this.isCurrentJumpMisjump = true;
      this.jumpDistanceToEdge = 999;
    }
  }

  // 2. [방향 전환] 버튼 (v1.3.0 검증된 정상 코드로 100% 롤백)
  public triggerTurn(): void {
    if (!this.isRunning || this.isGameOver) return;
    if (this.egg.state !== 'ROLLING') return;

    const currentSeg = this.segments[this.egg.currentSegmentIndex];
    if (!currentSeg) return;

    let turnSegIndex = -1;
    for (let i = this.egg.currentSegmentIndex; i < Math.min(this.segments.length, this.egg.currentSegmentIndex + 3); i++) {
      if (this.segments[i].type === 'TURN') {
        turnSegIndex = i;
        break;
      }
    }

    const newDir: SlopeDirection = this.egg.direction === 'RIGHT_DOWN' ? 'LEFT_DOWN' : 'RIGHT_DOWN';

    if (turnSegIndex !== -1) {
      const turnSeg = this.segments[turnSegIndex];
      const distToTurn = Math.hypot(turnSeg.startX - this.egg.x, turnSeg.startY - this.egg.y);

      // 1. 코너 피벗 반경(42px 이내): 즉시 퍼펙트 턴 체결!
      if (distToTurn <= 42) {
        this.egg.direction = newDir;
        this.egg.currentSegmentIndex = turnSegIndex + 1;
        this.egg.x = turnSeg.startX;
        this.egg.y = turnSeg.startY - GAME_CONSTANTS.EGG_RADIUS_Y + 4;
        sound.playTurn();
        sound.playPerfect();
        this.stats.perfectLandings++;
        this.spawnTextParticle(this.egg.x, this.egg.y - 25, 'PERFECT TURN!', '#10b981');
        this.turnBuffered = false;
        return;
      }

      // 2. 코너 진입 전 42px ~ 95px 선입력 버퍼링 구간 (부드럽고 쫀득한 손맛 보장)
      if (distToTurn <= 95) {
        this.turnBuffered = true;
        this.turnBufferTimer = 0.16; // 160ms 버퍼 윈도우
        this.turnBufferSegIndex = turnSegIndex;
        this.turnBufferDir = newDir;
        sound.playTurn();
        return;
      }

      // 3. 95px 초과: 너무 일찍 누른 경우 (수직 낙하 드롭)
      this.egg.direction = newDir;
      this.egg.state = 'DROPPING_TURN';
      this.egg.dropStartY = this.egg.y;
      this.egg.vy = 80;
      sound.playTurn();

      this.egg.currentSegmentIndex = turnSegIndex + 1;
    } else {
      // 코너가 없는 곳에서 방향 전환 누름 -> 추락 시퀀스 시작
      this.egg.direction = newDir;
      this.startFallSequence((newDir === 'RIGHT_DOWN' ? 1 : -1) * 110);
    }
  }

  // ==========================================
  // 물리 업데이트 루프
  // ==========================================
  public update(dt: number): void {
    if (!this.isRunning) return;

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    this.egg.squishX += (1 - this.egg.squishX) * dt * 10;
    this.egg.squishY += (1 - this.egg.squishY) * dt * 10;

    this.updateParticles(dt);
    this.updateAmbientParticles(dt);

    // 1. 트레일 궤적 페이드아웃 및 청소
    for (let i = this.trails.length - 1; i >= 0; i--) {
      this.trails[i].alpha -= dt * 1.8;
      if (this.trails[i].alpha <= 0) {
        this.trails.splice(i, 1);
      }
    }

    // 2. 방향 전환 선입력 버퍼링 (Input Buffering) 자동 턴 체결 판정
    if (this.turnBuffered && this.egg.state === 'ROLLING') {
      this.turnBufferTimer -= dt;
      if (this.turnBufferSegIndex >= 0 && this.turnBufferSegIndex < this.segments.length) {
        const turnSeg = this.segments[this.turnBufferSegIndex];
        const distToTurn = Math.hypot(turnSeg.startX - this.egg.x, turnSeg.startY - this.egg.y);
        if (distToTurn <= 42) {
          // 코너 반경 도달! 지체없이 퍼펙트 턴 체결
          this.egg.direction = this.turnBufferDir;
          this.egg.currentSegmentIndex = this.turnBufferSegIndex + 1;
          this.egg.x = turnSeg.startX;
          this.egg.y = turnSeg.startY - GAME_CONSTANTS.EGG_RADIUS_Y + 4;
          sound.playTurn();
          sound.playPerfect();
          this.stats.perfectLandings++;
          this.spawnTextParticle(this.egg.x, this.egg.y - 25, 'PERFECT TURN!', '#10b981');
          this.turnBuffered = false;
        }
      }
      if (this.turnBufferTimer <= 0) {
        this.turnBuffered = false;
      }
    }

    // 사망 연출 시퀀스 진행
    if (this.egg.state === 'SURPRISED_FALL') {
      this.egg.deathTimer += dt;
      if (this.egg.deathTimer >= 0.32) {
        this.egg.state = 'DEAD_FALLING';
        this.egg.vy = 140;
        sound.playFallWhistle();
      }
      return;
    }

    if (this.egg.state === 'DEAD_FALLING') {
      this.egg.deathTimer += dt;
      this.egg.vy += 850 * dt;
      this.egg.y += this.egg.vy * dt;
      this.egg.x += this.egg.vx * dt;
      this.egg.rotation += 10 * dt;

      if (this.egg.deathTimer >= 1.25 && !this.isGameOver) {
        this.isGameOver = true;
        this.gameOverReason = 'FALL';
        if (this.onGameOver) {
          this.onGameOver(this.stats, 'FALL');
        }
      }
      return;
    }

    if (this.egg.state === 'DEAD_CRACKED') {
      this.egg.deathTimer += dt;
      if (this.egg.deathTimer >= 1.35 && !this.isGameOver) {
        this.isGameOver = true;
        this.gameOverReason = 'CRACKED';
        if (this.onGameOver) {
          this.onGameOver(this.stats, 'CRACKED');
        }
      }
      return;
    }

    // [피드백 3] 50m마다 속도 상승, 2000m에서 최고 속도 도달
    const currentMeters = Math.floor(this.egg.y / GAME_CONSTANTS.PIXELS_PER_METER);
    this.stats.distanceMeters = Math.max(this.stats.distanceMeters, currentMeters);

    const speedStepCount = Math.floor(this.stats.distanceMeters / GAME_CONSTANTS.SPEED_INCREASE_INTERVAL_M);
    const targetSpeed = Math.min(
      GAME_CONSTANTS.MAX_SPEED,
      GAME_CONSTANTS.INITIAL_SPEED + speedStepCount * GAME_CONSTANTS.SPEED_INCREASE_STEP
    );
    this.stats.speed = targetSpeed;

    switch (this.egg.state) {
      case 'ROLLING':
        this.updateRolling(dt);
        break;
      case 'JUMPING':
        this.updateJumping(dt);
        break;
      case 'DROPPING_TURN':
        this.updateDroppingTurn(dt);
        break;
    }

    this.updateCamera(dt);
    this.ensureMapSegments();
  }

  // 1. 구르는 상태 (ROLLING)
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

    const rollAngle = (moveDist / GAME_CONSTANTS.EGG_RADIUS_X);
    if (this.egg.direction === 'RIGHT_DOWN') {
      this.egg.rotation += rollAngle;
    } else {
      this.egg.rotation -= rollAngle;
    }

    this.egg.expression = 'NORMAL';

    if (Math.random() < 0.28) {
      this.particles.push({
        x: this.egg.x - dx * 0.7,
        y: this.egg.y + GAME_CONSTANTS.EGG_RADIUS_Y - 3,
        vx: -dx * 0.3 + (Math.random() - 0.5) * 20,
        vy: -15 - Math.random() * 20,
        radius: 2 + Math.random() * 2.5,
        color: 'rgba(250, 204, 21, 0.6)',
        alpha: 0.8,
        life: 0,
        maxLife: 0.35,
        type: 'DUST',
      });
    }

    // 지면 노면 스키드마크 & 고유 궤적(Trail) 생성 (초당 약 30회)
    this.trailSpawnTimer += dt;
    if (this.trailSpawnTimer >= 0.035) {
      this.trailSpawnTimer = 0;
      this.spawnEggTrail();
    }

    // [신규 특수 계란 4종] 고유 주행 트레일 & 상시 오라
    this.egg.trailTimer = (this.egg.trailTimer || 0) + dt;
    if (this.egg.trailTimer >= 0.05) {
      this.egg.trailTimer = 0;
      const special = this.currentSkin.specialType;

      if (special === 'POISON') {
        // [치명적인 맹독란] 몸 주변 피어오르는 독구름 + 주행 트레일
        this.particles.push({
          x: this.egg.x - dx * 0.6 + (Math.random() - 0.5) * 12,
          y: this.egg.y + GAME_CONSTANTS.EGG_RADIUS_Y - 2,
          vx: -dx * 0.2 + (Math.random() - 0.5) * 15,
          vy: -20 - Math.random() * 25,
          radius: 4.5 + Math.random() * 3.5,
          color: Math.random() < 0.6 ? '#22c55e' : '#10b981',
          alpha: 0.75,
          life: 0,
          maxLife: 0.65,
          type: 'POISON_SMOKE',
        });
        if (Math.random() < 0.4) {
          this.particles.push({
            x: this.egg.x + (Math.random() - 0.5) * 20,
            y: this.egg.y + (Math.random() - 0.5) * 16,
            vx: (Math.random() - 0.5) * 10,
            vy: -15 - Math.random() * 15,
            radius: 3 + Math.random() * 2.5,
            color: '#86efac',
            alpha: 0.5,
            life: 0,
            maxLife: 0.5,
            type: 'POISON_SMOKE',
          });
        }
      } else if (special === 'ANGEL') {
        // [순백의 천사란] 찬란한 황금빛/순백의 성광 트레일
        this.particles.push({
          x: this.egg.x - dx * 0.5 + (Math.random() - 0.5) * 14,
          y: this.egg.y + GAME_CONSTANTS.EGG_RADIUS_Y - 2,
          vx: -dx * 0.2 + (Math.random() - 0.5) * 20,
          vy: -15 - Math.random() * 20,
          radius: 3 + Math.random() * 3,
          color: Math.random() < 0.6 ? '#fde047' : '#ffffff',
          alpha: 0.9,
          life: 0,
          maxLife: 0.45,
          type: 'HOLY_GLOW',
        });
      } else if (special === 'DEVIL') {
        // [심연의 악마란] 검붉은 심연의 어둠 트레일
        this.particles.push({
          x: this.egg.x - dx * 0.5 + (Math.random() - 0.5) * 12,
          y: this.egg.y + GAME_CONSTANTS.EGG_RADIUS_Y - 2,
          vx: -dx * 0.2 + (Math.random() - 0.5) * 15,
          vy: -15 - Math.random() * 20,
          radius: 4 + Math.random() * 3,
          color: Math.random() < 0.6 ? '#7f1d1d' : '#1e1b4b',
          alpha: 0.75,
          life: 0,
          maxLife: 0.55,
          type: 'DARK_SMOKE',
        });
      }
    }

    // [심연의 악마란] 실시간 거리별 진화 판정 (100m: 뿔 각성, 200m: 박쥐 날개 각성)
    if (this.currentSkin.specialType === 'DEVIL') {
      const meters = this.stats.distanceMeters;
      const stage = this.egg.devilStage || 0;
      if (meters >= 200 && stage < 2) {
        this.egg.devilStage = 2;
        sound.playImpact(8);
        this.spawnTextParticle(this.egg.x, this.egg.y - 32, 'DEVIL WINGS AWAKENED!', '#ef4444');
        this.spawnEvolutionBursts(this.egg.x, this.egg.y, '#dc2626');
      } else if (meters >= 100 && stage < 1) {
        this.egg.devilStage = 1;
        sound.playImpact(6);
        this.spawnTextParticle(this.egg.x, this.egg.y - 32, 'DEVIL HORNS AWAKENED!', '#f87171');
        this.spawnEvolutionBursts(this.egg.x, this.egg.y, '#991b1b');
      }
    }

    // [피드백 7 해결] 반창고 먹자마자 egg.hp와 stats.hp를 실시간으로 즉시 동기화!
    if (currentSeg.item && !currentSeg.item.collected) {
      const distToItem = Math.hypot(this.egg.x - currentSeg.item.x, this.egg.y - currentSeg.item.y);
      if (distToItem < 32) {
        currentSeg.item.collected = true;
        this.egg.hp = Math.min(this.egg.maxHp, this.egg.hp + GAME_CONSTANTS.BANDAGE_HEAL_HP);
        this.stats.hp = this.egg.hp; // [핵심] stats.hp 즉시 업데이트!
        this.stats.itemsCollected++;
        sound.playHeal();
        this.spawnTextParticle(this.egg.x, this.egg.y - 25, `+${GAME_CONSTANTS.BANDAGE_HEAL_HP} HP`, '#10b981');
      }
    }

    // [피드백 11 구현] 금 간 길(isCracked) 위를 점프하지 않고 그냥 굴러가는 경우 붕괴 및 추락!
    if (currentSeg.isCracked && !currentSeg.isCollapsed) {
      const segLen = currentSeg.length || 70;
      const progressDist = Math.hypot(this.egg.x - currentSeg.startX, this.egg.y - currentSeg.startY);
      if (progressDist >= segLen * 0.35) {
        currentSeg.isCollapsed = true;
        this.triggerCrackedRoadCollapse();
        return;
      }
    }

    // 세그먼트 끝 도달 판정
    const pastEndY = this.egg.y >= currentSeg.endY;
    if (pastEndY) {
      if (currentSeg.type === 'GAP') {
        // [피드백 5] 점프를 안 하고 구멍에 빠진 경우 방향 전환처럼 멈칫 당황 추락 모션!
        this.startFallSequence(dirSign * this.stats.speed * 0.5);
        return;
      } else if (currentSeg.type === 'TURN') {
        this.startFallSequence(dirSign * this.stats.speed);
        return;
      } else {
        this.egg.currentSegmentIndex++;
        const nextSeg = this.segments[this.egg.currentSegmentIndex];
        if (nextSeg) {
          this.egg.direction = nextSeg.direction;
        }
      }
    }
  }

  // 2. 점프 상태 (JUMPING)
  private updateJumping(dt: number): void {
    const dirSign = this.egg.direction === 'RIGHT_DOWN' ? 1 : -1;
    this.egg.jumpProgress += dt / GAME_CONSTANTS.JUMP_DURATION_SEC;

    const forwardStep = (GAME_CONSTANTS.JUMP_DISTANCE_FORWARD * dt) / GAME_CONSTANTS.JUMP_DURATION_SEC;
    this.egg.x += dirSign * forwardStep * GAME_CONSTANTS.SLOPE_COS;
    this.egg.y += forwardStep * GAME_CONSTANTS.SLOPE_SIN;

    const p = Math.min(1, this.egg.jumpProgress);
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

  // 3. 점프 착지 판정 (피드백 4: 마진 축소 & 피드백 8: 방향 불일치 공중착지 버그 완벽 수정!)
  private handleJumpLanding(): void {
    let landedIndex = -1;

    // [피드백 8 해결] 착지 후보 세그먼트는 반드시 현재 계란 진행 방향과 일치해야 함!
    for (let i = this.egg.currentSegmentIndex; i < Math.min(this.segments.length, this.egg.currentSegmentIndex + 6); i++) {
      const seg = this.segments[i];
      if (seg.type === 'TURN') continue;
      // 방향이 다른 세그먼트는 절대 착지 불가!
      if (seg.direction !== this.egg.direction) continue;

      // 선분 상의 유효 착지 영역 정밀 판정
      const minX = Math.min(seg.startX, seg.endX) - 25;
      const maxX = Math.max(seg.startX, seg.endX) + 25;
      const minY = Math.min(seg.startY, seg.endY) - 15;
      const maxY = Math.max(seg.startY, seg.endY) + 35;

      if (this.egg.x >= minX && this.egg.x <= maxX && this.egg.y >= minY && this.egg.y <= maxY) {
        landedIndex = i;
        break;
      }
    }

    if (landedIndex !== -1) {
      // 정상 도로 세그먼트 위에 안착!
      const landedSeg = this.segments[landedIndex];
      this.egg.currentSegmentIndex = landedIndex;
      this.egg.direction = landedSeg.direction;
      this.egg.state = 'ROLLING';

      if (this.isCurrentJumpMisjump) {
        // 일반 길에서 헛점프한 경우
        this.applyDamage(GAME_CONSTANTS.MISJUMP_DAMAGE, 'MISJUMP!');
      } else {
        // 점프 도약점 판정
        if (this.jumpDistanceToEdge <= GAME_CONSTANTS.PERFECT_JUMP_MARGIN) {
          sound.playPerfect();
          this.stats.perfectLandings++;
          this.spawnTextParticle(this.egg.x, this.egg.y - 25, 'PERFECT JUMP!', '#10b981');
        } else if (this.jumpDistanceToEdge <= 60) {
          // 조금 일찍 도약
          const damage = Math.max(3, Math.floor((this.jumpDistanceToEdge - GAME_CONSTANTS.PERFECT_JUMP_MARGIN) * 0.16));
          this.applyDamage(damage, `EARLY -${damage}HP`);
        } else {
          // 너무 일찍 도약
          const damage = Math.max(6, Math.floor((this.jumpDistanceToEdge - GAME_CONSTANTS.PERFECT_JUMP_MARGIN) * 0.25));
          this.applyDamage(damage, `TOO EARLY! -${damage}HP`);
        }
      }
    } else {
      // [피드백 5, 8] 구멍에 빠지거나 코너를 지나쳐 공중으로 뛴 경우 -> 당황 후 추락 연출!
      const dirSign = this.egg.direction === 'RIGHT_DOWN' ? 1 : -1;
      this.startFallSequence(dirSign * 60);
    }
  }

  // 4. 방향 전환 낙하 상태 (DROPPING_TURN)
  private updateDroppingTurn(dt: number): void {
    const dirSign = this.egg.direction === 'RIGHT_DOWN' ? 1 : -1;
    this.egg.vy += 780 * dt;
    this.egg.y += this.egg.vy * dt;
    this.egg.x += dirSign * 80 * dt;
    this.egg.jumpArcOffset = 0;

    if (this.egg.direction === 'RIGHT_DOWN') {
      this.egg.rotation += dt * 6;
    } else {
      this.egg.rotation -= dt * 6;
    }

    const targetSeg = this.segments[this.egg.currentSegmentIndex];
    if (targetSeg) {
      const segT = (this.egg.x - targetSeg.startX) / (targetSeg.endX - targetSeg.startX);
      if (segT >= 0 && segT <= 1) {
        const expectedY = targetSeg.startY + segT * (targetSeg.endY - targetSeg.startY) - GAME_CONSTANTS.EGG_RADIUS_Y + 4;
        if (this.egg.y >= expectedY) {
          this.egg.y = expectedY;
          this.egg.state = 'ROLLING';
          const dropHeight = this.egg.y - this.egg.dropStartY;
          this.handleDropLanding(dropHeight);
          return;
        }
      }
    }

    if (this.egg.y - this.egg.dropStartY > 260) {
      this.startFallSequence(dirSign * 60);
    }
  }

  // [피드백 11 & 피드백 4 구현] 금 간 도로 붕괴 및 아래 길로 추락 낙하
  private triggerCrackedRoadCollapse(): void {
    sound.playImpact(10);
    this.screenShake = 18;

    // [피드백 4] 도로가 무너지면서 부서진 길 암석 파편들이 와르르 아래로 쏟아져 내리는 효과!
    const rockColors = ['#1e293b', '#334155', '#475569', '#0f172a', '#ef4444'];
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 140;
      this.particles.push({
        x: this.egg.x + (Math.random() - 0.5) * 36,
        y: this.egg.y + GAME_CONSTANTS.EGG_RADIUS_Y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: -20 - Math.random() * 90,
        radius: 3.5 + Math.random() * 5.0,
        color: rockColors[Math.floor(Math.random() * rockColors.length)],
        alpha: 1,
        life: 0,
        maxLife: 1.2 + Math.random() * 0.6,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 14,
        type: 'CHUNK',
      });
    }

    // 미세 분진 파티클 분출
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: this.egg.x + (Math.random() - 0.5) * 30,
        y: this.egg.y + GAME_CONSTANTS.EGG_RADIUS_Y,
        vx: (Math.random() - 0.5) * 90,
        vy: -10 - Math.random() * 50,
        radius: 2 + Math.random() * 3,
        color: '#64748b',
        alpha: 0.8,
        life: 0,
        maxLife: 0.8,
        type: 'DUST',
      });
    }

    // 아래쪽 도로로 자유 낙하 시작
    const nextSegIndex = Math.min(this.segments.length - 1, this.egg.currentSegmentIndex + 1);
    this.egg.currentSegmentIndex = nextSegIndex;
    this.egg.dropStartY = this.egg.y;
    this.egg.vy = 80;
    this.egg.state = 'DROPPING_TURN';
    this.egg.expression = 'PAIN';
    this.spawnTextParticle(this.egg.x, this.egg.y - 25, '도로 붕괴!', '#ea580c');
  }

  // [피드백 12 반영] 높이 차이에 따른 내구도 감소량 2배 온전히 적용
  private handleDropLanding(dropHeight: number): void {
    const damage = Math.max(0, Math.floor(dropHeight * GAME_CONSTANTS.DAMAGE_PER_HEIGHT_PIXEL));

    if (damage <= 2) {
      sound.playPerfect();
      this.stats.perfectLandings++;
      this.spawnTextParticle(this.egg.x, this.egg.y - 25, 'CLEAN TURN!', '#10b981');
    } else {
      this.applyDamage(damage, `-${damage} HP`);
    }
  }

  private applyDamage(damage: number, label: string): void {
    this.egg.hp = Math.max(0, this.egg.hp - damage);
    this.stats.hp = this.egg.hp;

    this.egg.squishX = 1.35;
    this.egg.squishY = 0.72;
    this.screenShake = Math.min(14, 4 + damage * 0.45);
    this.egg.expression = 'PAIN';

    sound.playImpact(damage);
    this.spawnTextParticle(this.egg.x, this.egg.y - 25, label, '#ef4444');

    this.egg.flashDamage = true;
    setTimeout(() => {
      this.egg.flashDamage = false;
    }, 120);

    if (this.egg.hp <= 0) {
      this.startCrackedSequence();
    }
  }

  // [피드백 5] 구멍이나 코너에서 떨어질 때 공중 멈칫 당황 후 추락 시퀀스
  private startFallSequence(vx: number): void {
    this.egg.state = 'SURPRISED_FALL';
    this.egg.expression = 'SURPRISED';
    this.egg.vx = vx;
    this.egg.vy = -35;
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
    const colors = ['#fffbeb', '#fde68a', '#fed7aa', '#f59e0b'];
    for (let i = 0; i < 9; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 18 + Math.random() * 20;
      shellFragments.push({
        offsetX: Math.cos(angle) * dist,
        offsetY: Math.sin(angle) * dist,
        size: 5 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
        color: colors[i % colors.length],
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
    while (this.segments.length - this.egg.currentSegmentIndex < 18) {
      this.mapGen.generateDynamicPattern(this.segments, this.stats.distanceMeters);
    }

    if (this.egg.currentSegmentIndex > 25) {
      const removeCount = 10;
      this.segments.splice(0, removeCount);
      this.egg.currentSegmentIndex -= removeCount;
    }
  }

  // 대기 환경 파티클 생성 (설산 눈송이, 동굴 포자, 마그마 불티 등)
  private updateAmbientParticles(dt: number): void {
    this.ambientParticleTimer += dt;
    if (this.ambientParticleTimer < 0.12) return;
    this.ambientParticleTimer = 0;

    const meters = this.stats.distanceMeters;

    if (meters < 350) {
      // 설산: 하늘에서 눈송이가 살랑살랑 내림
      this.particles.push({
        x: this.cameraX + Math.random() * this.screenWidth,
        y: this.cameraY - 20,
        vx: (Math.random() - 0.5) * 40 - 20,
        vy: 40 + Math.random() * 60,
        radius: 2 + Math.random() * 2.5,
        color: 'rgba(255, 255, 255, 0.85)',
        alpha: 0.9,
        life: 0,
        maxLife: 2.5,
        type: 'DUST',
      });
    } else if (meters >= 1250 && meters < 1750) {
      // 지하 동굴: 신비로운 푸른/보라빛 수정 포자 반딧불이
      this.particles.push({
        x: this.cameraX + Math.random() * this.screenWidth,
        y: this.cameraY + Math.random() * this.screenHeight,
        vx: (Math.random() - 0.5) * 20,
        vy: -15 - Math.random() * 25,
        radius: 2 + Math.random() * 2,
        color: Math.random() < 0.5 ? '#818cf8' : '#c084fc',
        alpha: 0.8,
        life: 0,
        maxLife: 2.0,
        type: 'DUST',
      });
    } else if (meters >= 1750) {
      // 지각 & 맨틀: 작열하는 주황/황금색 불티(Sparks)
      this.particles.push({
        x: this.cameraX + Math.random() * this.screenWidth,
        y: this.cameraY + this.screenHeight + 10,
        vx: (Math.random() - 0.5) * 60,
        vy: -90 - Math.random() * 120,
        radius: 1.5 + Math.random() * 2.5,
        color: Math.random() < 0.6 ? '#f97316' : '#facc15',
        alpha: 1,
        life: 0,
        maxLife: 1.5,
        type: 'SPARK',
      });
    }
  }

  // ==========================================
  // 파티클 시스템
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
      if (p.type === 'SHELL' || p.type === 'YOLK' || p.type === 'CHUNK') {
        p.vy += (p.type === 'CHUNK' ? 750 : 480) * dt;
      } else if (p.type === 'BOLT') {
        p.vy += 620 * dt;
        p.vx *= 0.98;
      } else if (p.type === 'POISON_SMOKE') {
        p.radius += dt * 8;
        p.vy -= dt * 10;
      } else if (p.type === 'HOLY_GLOW') {
        p.vx *= 0.94;
        p.vy *= 0.94;
      } else if (p.type === 'DARK_SMOKE') {
        p.radius += dt * 7;
        p.vy -= dt * 8;
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
      maxLife: 0.8,
      type: 'TEXT',
      text,
    });
  }

  // 특수 계란 진화 시 화려한 폭발 파티클 분출
  private spawnEvolutionBursts(x: number, y: number, color: string): void {
    for (let i = 0; i < 18; i++) {
      const angle = (Math.PI * 2 * i) / 18 + (Math.random() - 0.5) * 0.4;
      const spd = 80 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 30,
        radius: 3.5 + Math.random() * 4,
        color,
        alpha: 1,
        life: 0,
        maxLife: 0.9,
        type: 'SPARK',
      });
    }
  }

  // 지면 밀착형 궤적(Trail/Skidmark) 생성
  private spawnEggTrail(): void {
    if (this.trails.length >= 60) {
      this.trails.shift();
    }

    const special = this.currentSkin.specialType;
    let type: EggTrailPoint['type'] = 'SKID';
    let color = '#334155';
    let radius = 6;

    if (this.currentSkin.id === 'metal_egg' || special === 'METAL') {
      type = 'SPARK';
      color = '#f97316';
      radius = 7;
    } else if (special === 'POISON') {
      type = 'SLIME';
      color = '#84cc16';
      radius = 8;
    } else if (special === 'ANGEL') {
      type = 'HOLY';
      color = '#fde047';
      radius = 7;
    } else if (special === 'DEVIL') {
      type = 'DARK_FIRE';
      color = '#9333ea';
      radius = 8;
    }

    this.trails.push({
      x: this.egg.x,
      y: this.egg.y + GAME_CONSTANTS.EGG_RADIUS_Y - 2,
      radius,
      alpha: 0.75,
      color,
      type,
      rotation: this.egg.rotation,
    });
  }

  // 지면 밀착형 궤적(Trail/Skidmark) 렌더링
  private drawTrails(ctx: CanvasRenderingContext2D): void {
    if (this.trails.length === 0) return;

    ctx.save();
    for (const trail of this.trails) {
      ctx.globalAlpha = Math.max(0, trail.alpha);

      switch (trail.type) {
        case 'SKID': {
          ctx.fillStyle = trail.color;
          ctx.beginPath();
          ctx.ellipse(trail.x, trail.y, trail.radius, trail.radius * 0.45, 0.4, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'SPARK': {
          ctx.fillStyle = trail.color;
          ctx.beginPath();
          ctx.ellipse(trail.x, trail.y, trail.radius, trail.radius * 0.4, 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(trail.x, trail.y - 1, trail.radius * 0.4, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'SLIME': {
          ctx.fillStyle = trail.color;
          ctx.beginPath();
          ctx.ellipse(trail.x, trail.y, trail.radius * 1.1, trail.radius * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#15803d';
          ctx.lineWidth = 1.2;
          ctx.stroke();
          break;
        }
        case 'HOLY': {
          ctx.fillStyle = trail.color;
          ctx.beginPath();
          ctx.arc(trail.x, trail.y, trail.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(trail.x - trail.radius * 1.4, trail.y);
          ctx.lineTo(trail.x + trail.radius * 1.4, trail.y);
          ctx.moveTo(trail.x, trail.y - trail.radius * 1.4);
          ctx.lineTo(trail.x, trail.y + trail.radius * 1.4);
          ctx.stroke();
          break;
        }
        case 'DARK_FIRE': {
          ctx.fillStyle = trail.color;
          ctx.beginPath();
          ctx.ellipse(trail.x, trail.y, trail.radius, trail.radius * 0.5, 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#450a0a';
          ctx.beginPath();
          ctx.arc(trail.x, trail.y, trail.radius * 0.5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
      }
    }
    ctx.restore();
  }

  // ==========================================
  // 전체 화면 렌더링
  // ==========================================
  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // [피드백 9] 고도(m)에 따라 6단계로 극적으로 변화하는 다이나믹 바이옴 배경!
    this.drawDynamicBiomeBackground(ctx);

    ctx.translate(-this.cameraX, -this.cameraY);

    this.drawAsphaltRoads(ctx);
    this.drawTrails(ctx);
    this.drawItems(ctx);

    for (const splat of this.splats) {
      this.eggRenderer.drawEggSplat(ctx, splat);
    }

    if (this.egg.state !== 'DEAD_CRACKED') {
      this.eggRenderer.drawEgg(ctx, this.egg);
    }

    this.drawParticles(ctx);

    ctx.restore();
  }

  // [무한의 계단 영감 전면 고도화] 6대 바이옴 생생한 패럴랙스 배경 및 랜드마크 오브젝트 렌더링
  private drawDynamicBiomeBackground(ctx: CanvasRenderingContext2D): void {
    const meters = this.stats.distanceMeters;
    const animTick = (Date.now() * 0.003); // 애니메이션 틱

    // 바이옴 키프레임 (거리, 상단색, 중단색, 하단색)
    const BIOMES = [
      { m: 0, top: '#1d4ed8', mid: '#60a5fa', bot: '#dbeafe' },     // 설산 정상
      { m: 400, top: '#0284c7', mid: '#38bdf8', bot: '#f0fdf4' },   // 폭포 & 침엽수림
      { m: 900, top: '#38bdf8', mid: '#bae6fd', bot: '#ecfdf5' },   // 동화 초원 & 풍차
      { m: 1450, top: '#0f172a', mid: '#1e1b4b', bot: '#020617' },  // 발광 수정 동굴
      { m: 2050, top: '#18181b', mid: '#450a0a', bot: '#7f1d1d' },  // 화산암 & 마그마
      { m: 2600, top: '#450a0a', mid: '#991b1b', bot: '#facc15' },  // 지구 중심 맨틀
    ];

    // 현재 거리에 해당하는 인접 키프레임 탐색 및 보간율 t 계산
    let curIdx = 0;
    while (curIdx < BIOMES.length - 2 && meters > BIOMES[curIdx + 1].m) {
      curIdx++;
    }
    const b1 = BIOMES[curIdx];
    const b2 = BIOMES[curIdx + 1];
    const span = b2.m - b1.m;
    const t = Math.max(0, Math.min(1, (meters - b1.m) / span));

    // 하늘 그라데이션 3색 완전 연속 보간
    const topColor = this.lerpColor(b1.top, b2.top, t);
    const midColor = this.lerpColor(b1.mid, b2.mid, t);
    const botColor = this.lerpColor(b1.bot, b2.bot, t);

    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.screenHeight);
    skyGrad.addColorStop(0, topColor);
    skyGrad.addColorStop(0.65, midColor);
    skyGrad.addColorStop(1, botColor);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);

    // 각 바이옴별 가중치(Alpha, 0 ~ 1) 계산을 통한 부드러운 지형 크로스페이드
    const getZoneAlpha = (centerM: number, radiusM: number) => {
      const dist = Math.abs(meters - centerM);
      if (dist >= radiusM) return 0;
      return Math.cos((dist / radiusM) * (Math.PI / 2));
    };

    // -------------------------------------------------------------
    // 1. 설산 정상 & 알프스 롯지 (0m ~ 450m)
    // -------------------------------------------------------------
    const snowAlpha = getZoneAlpha(180, 360);
    if (snowAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = snowAlpha;

      // 1-1. 원경 만년설 웅장한 삼각 봉우리
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      const snowFarOffset = -(this.cameraX * 0.1) % 360;
      ctx.moveTo(0, this.screenHeight);
      for (let x = snowFarOffset - 360; x < this.screenWidth + 360; x += 360) {
        ctx.lineTo(x, this.screenHeight - 160);
        ctx.lineTo(x + 180, this.screenHeight - 400);
        ctx.lineTo(x + 360, this.screenHeight - 160);
      }
      ctx.lineTo(this.screenWidth, this.screenHeight);
      ctx.fill();

      // 1-2. 중경 빙하 푸른빛 음영 산맥
      ctx.fillStyle = '#93c5fd';
      ctx.beginPath();
      const snowMidOffset = -(this.cameraX * 0.2) % 280;
      ctx.moveTo(0, this.screenHeight);
      for (let x = snowMidOffset - 280; x < this.screenWidth + 280; x += 280) {
        ctx.lineTo(x, this.screenHeight - 130);
        ctx.lineTo(x + 140, this.screenHeight - 280);
        ctx.lineTo(x + 280, this.screenHeight - 130);
      }
      ctx.lineTo(this.screenWidth, this.screenHeight);
      ctx.fill();

      // 1-3. 알프스 통나무 롯지 산장 & 눈 덮인 지붕
      const lodgeX = (220 - (this.cameraX * 0.25)) % (this.screenWidth + 400) - 100;
      const lodgeY = this.screenHeight - 140;
      // 산장 벽체
      ctx.fillStyle = '#78350f';
      ctx.fillRect(lodgeX, lodgeY, 70, 50);
      // 창문 (노란 불빛)
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(lodgeX + 15, lodgeY + 15, 16, 16);
      ctx.fillRect(lodgeX + 42, lodgeY + 15, 16, 16);
      // 눈 덮인 삼각 지붕
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(lodgeX - 10, lodgeY);
      ctx.lineTo(lodgeX + 35, lodgeY - 35);
      ctx.lineTo(lodgeX + 80, lodgeY);
      ctx.closePath();
      ctx.fill();
      // 굴뚝 & 모락모락 솟는 연기
      ctx.fillStyle = '#475569';
      ctx.fillRect(lodgeX + 50, lodgeY - 45, 10, 20);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      for (let s = 0; s < 3; s++) {
        const smkY = lodgeY - 50 - (s * 15) - (animTick * 10) % 30;
        const smkX = lodgeX + 55 + Math.sin(animTick + s) * 8;
        ctx.beginPath();
        ctx.arc(smkX, smkY, 5 + s * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // 1-4. 흩날리는 만년설 눈보라
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      for (let i = 0; i < 30; i++) {
        const sx = ((i * 41) - (this.cameraX * 0.35) + Math.sin(animTick + i) * 25) % this.screenWidth;
        const sy = ((i * 37) + (meters * 1.8) + (animTick * 20)) % this.screenHeight;
        ctx.beginPath();
        ctx.arc((sx + this.screenWidth) % this.screenWidth, sy, 1.5 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // -------------------------------------------------------------
    // 2. 알프스 침엽수림 & 쏟아지는 폭포 (350m ~ 950m)
    // -------------------------------------------------------------
    const highlandAlpha = getZoneAlpha(600, 380);
    if (highlandAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = highlandAlpha;

      // 2-1. 거대한 절벽 바위
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      const rockOffset = -(this.cameraX * 0.15) % 320;
      ctx.moveTo(0, this.screenHeight);
      for (let x = rockOffset - 320; x < this.screenWidth + 320; x += 320) {
        ctx.lineTo(x, this.screenHeight - 160);
        ctx.lineTo(x + 160, this.screenHeight - 340);
        ctx.lineTo(x + 320, this.screenHeight - 160);
      }
      ctx.lineTo(this.screenWidth, this.screenHeight);
      ctx.fill();

      // 2-2. 콸콸 쏟아지는 시원한 폭포수 (애니메이션 물줄기)
      const wfallX = (180 - (this.cameraX * 0.15)) % (this.screenWidth + 300) - 50;
      const wfallGrad = ctx.createLinearGradient(wfallX, this.screenHeight - 340, wfallX, this.screenHeight);
      wfallGrad.addColorStop(0, '#e0f2fe');
      wfallGrad.addColorStop(0.5, '#38bdf8');
      wfallGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = wfallGrad;
      ctx.fillRect(wfallX + 60, this.screenHeight - 340, 40, 340);

      // 폭포 거품 및 튀는 물보라
      ctx.fillStyle = '#ffffff';
      for (let w = 0; w < 12; w++) {
        const wy = (this.screenHeight - 340) + ((w * 28 + animTick * 180) % 340);
        const wx = wfallX + 60 + (w % 4) * 8 + Math.sin(animTick * 3 + w) * 4;
        ctx.fillRect(wx, wy, 8, 14);
      }
      // 하단 웅덩이 물안개
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(wfallX + 80, this.screenHeight - 10, 45 + Math.sin(animTick * 2) * 5, 0, Math.PI * 2);
      ctx.fill();

      // 2-3. 다층 짙은 전나무 숲 실루엣
      ctx.fillStyle = '#064e3b';
      const treeOffset = -(this.cameraX * 0.25) % 180;
      for (let x = treeOffset - 180; x < this.screenWidth + 180; x += 180) {
        const tx = x + 40;
        const ty = this.screenHeight - 130;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + 25, ty - 65);
        ctx.lineTo(tx + 50, ty);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }

    // -------------------------------------------------------------
    // 3. 목가적인 동화 초원 & 풍차 (800m ~ 1500m)
    // -------------------------------------------------------------
    const meadowAlpha = getZoneAlpha(1150, 400);
    if (meadowAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = meadowAlpha;

      // 3-1. 따스한 햇살 갓레이
      const sunGrad = ctx.createRadialGradient(this.screenWidth * 0.85, 50, 10, this.screenWidth * 0.85, 50, 280);
      sunGrad.addColorStop(0, 'rgba(254, 240, 138, 0.4)');
      sunGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, this.screenWidth, this.screenHeight * 0.7);

      // 3-2. 뭉게구름 층
      const cloudOffset = -(this.cameraX * 0.06);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      this.drawCloud(ctx, (cloudOffset + 80) % (this.screenWidth + 250) - 100, 90, 60);
      this.drawCloud(ctx, (cloudOffset + 380) % (this.screenWidth + 250) - 100, 140, 50);

      // 3-3. 회전하는 풍차 (Windmill 랜드마크)
      const wmillX = (280 - (this.cameraX * 0.18)) % (this.screenWidth + 400) - 80;
      const wmillY = this.screenHeight - 150;
      // 풍차 몸체 타워
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.moveTo(wmillX + 15, wmillY);
      ctx.lineTo(wmillX + 25, wmillY - 80);
      ctx.lineTo(wmillX + 45, wmillY - 80);
      ctx.lineTo(wmillX + 55, wmillY);
      ctx.closePath();
      ctx.fill();
      // 풍차 붉은 지붕
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(wmillX + 20, wmillY - 80);
      ctx.lineTo(wmillX + 35, wmillY - 105);
      ctx.lineTo(wmillX + 50, wmillY - 80);
      ctx.closePath();
      ctx.fill();
      // 회전하는 4개 날개 (애니메이션 회전)
      ctx.save();
      ctx.translate(wmillX + 35, wmillY - 80);
      ctx.rotate(animTick * 1.2);
      ctx.fillStyle = '#78350f';
      for (let b = 0; b < 4; b++) {
        ctx.rotate(Math.PI / 2);
        ctx.fillRect(-2, -45, 4, 45);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(2, -42, 10, 30);
        ctx.fillStyle = '#78350f';
      }
      ctx.restore();

      // 3-4. 부드러운 초원 능선
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      const hillOffset = -(this.cameraX * 0.2) % 300;
      ctx.moveTo(0, this.screenHeight);
      for (let x = hillOffset - 300; x < this.screenWidth + 300; x += 300) {
        ctx.quadraticCurveTo(x + 150, this.screenHeight - 220, x + 300, this.screenHeight - 130);
      }
      ctx.lineTo(this.screenWidth, this.screenHeight);
      ctx.fill();

      // 3-5. 흩날리는 꽃잎 & 민들레 씨앗
      ctx.fillStyle = '#fbcfe8';
      for (let p = 0; p < 15; p++) {
        const px = ((p * 53) - (this.cameraX * 0.3) + Math.cos(animTick + p) * 20) % this.screenWidth;
        const py = ((p * 43) + (animTick * 35)) % this.screenHeight;
        ctx.beginPath();
        ctx.arc((px + this.screenWidth) % this.screenWidth, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // -------------------------------------------------------------
    // 4. 신비로운 발광 수정 동굴 (1400m ~ 2100m)
    // -------------------------------------------------------------
    const caveAlpha = getZoneAlpha(1750, 420);
    if (caveAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = caveAlpha;

      // 4-1. 천장 거대 암석 종유석
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      const stalactiteOffset = -(this.cameraX * 0.15) % 180;
      ctx.moveTo(0, 0);
      for (let x = stalactiteOffset - 180; x < this.screenWidth + 180; x += 180) {
        ctx.lineTo(x + 50, 0);
        ctx.lineTo(x + 90, 140 + ((Math.abs(x) % 4) * 25));
        ctx.lineTo(x + 130, 0);
      }
      ctx.lineTo(this.screenWidth, 0);
      ctx.fill();

      // 4-2. 영롱하게 빛나는 대형 크리스탈 수정 기둥 (네온 글로우)
      const crystalColors = ['#a855f7', '#06b6d4', '#ec4899'];
      const crystalOffset = -(this.cameraX * 0.28) % 240;
      for (let x = crystalOffset - 240; x < this.screenWidth + 240; x += 240) {
        const cColor = crystalColors[Math.abs(Math.floor(x / 240)) % crystalColors.length];
        ctx.shadowColor = cColor;
        ctx.shadowBlur = 18;
        ctx.fillStyle = cColor;

        ctx.beginPath();
        ctx.moveTo(x + 90, this.screenHeight);
        ctx.lineTo(x + 110, this.screenHeight - 190);
        ctx.lineTo(x + 125, this.screenHeight - 210);
        ctx.lineTo(x + 140, this.screenHeight - 170);
        ctx.lineTo(x + 155, this.screenHeight);
        ctx.closePath();
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // 4-3. 뚝뚝 떨어지는 동굴 물방울 & 반딧불이
      ctx.fillStyle = '#38bdf8';
      for (let d = 0; d < 12; d++) {
        const dx = ((d * 67) - (this.cameraX * 0.2)) % this.screenWidth;
        const dy = ((d * 83) + (animTick * 120)) % this.screenHeight;
        ctx.beginPath();
        ctx.arc((dx + this.screenWidth) % this.screenWidth, dy, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // -------------------------------------------------------------
    // 5. 지각 화산암 & 마그마 분출구 (2000m ~ 2650m)
    // -------------------------------------------------------------
    const crustAlpha = getZoneAlpha(2300, 450);
    if (crustAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = crustAlpha;

      // 5-1. 검붉은 화산암 절벽
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      const magmaHillOffset = -(this.cameraX * 0.2) % 260;
      ctx.moveTo(0, this.screenHeight);
      for (let x = magmaHillOffset - 260; x < this.screenWidth + 260; x += 260) {
        ctx.lineTo(x, this.screenHeight - 110);
        ctx.lineTo(x + 130, this.screenHeight - 240);
        ctx.lineTo(x + 260, this.screenHeight - 110);
      }
      ctx.lineTo(this.screenWidth, this.screenHeight);
      ctx.fill();

      // 5-2. 끓어오르는 용암 분출구 & 화염 광휘
      const magmaGrad = ctx.createLinearGradient(0, this.screenHeight - 140, 0, this.screenHeight);
      magmaGrad.addColorStop(0, 'rgba(239, 68, 68, 0.7)');
      magmaGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.85)');
      magmaGrad.addColorStop(1, '#ef4444');
      ctx.fillStyle = magmaGrad;
      ctx.fillRect(0, this.screenHeight - 90, this.screenWidth, 90);

      // 튀는 불티 파티클
      ctx.fillStyle = '#fef08a';
      for (let f = 0; f < 25; f++) {
        const fx = ((f * 39) - (this.cameraX * 0.4) + Math.sin(animTick * 2 + f) * 15) % this.screenWidth;
        const fy = this.screenHeight - ((f * 29 + animTick * 110) % 220);
        ctx.beginPath();
        ctx.arc((fx + this.screenWidth) % this.screenWidth, fy, 1.5 + (f % 2.5), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // -------------------------------------------------------------
    // 6. 지구 맨틀 & 심연의 코어 (2550m+)
    // -------------------------------------------------------------
    if (meters >= 2550) {
      const mantleAlpha = Math.min(1, (meters - 2550) / 250);
      ctx.save();
      ctx.globalAlpha = mantleAlpha;

      // 끓어오르는 용암 파도
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      const lavaOffset = -(this.cameraX * 0.35) % 160;
      ctx.moveTo(0, this.screenHeight);
      for (let x = lavaOffset - 160; x < this.screenWidth + 160; x += 160) {
        ctx.quadraticCurveTo(x + 80, this.screenHeight - 160 + Math.sin(animTick * 3 + x) * 15, x + 160, this.screenHeight - 80);
      }
      ctx.lineTo(this.screenWidth, this.screenHeight);
      ctx.fill();

      // 황금빛 마그마 맥
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 15;
      for (let m = 0; m < 5; m++) {
        const mx = (m * 90 + lavaOffset) % this.screenWidth;
        ctx.fillRect((mx + this.screenWidth) % this.screenWidth, this.screenHeight - 40, 45, 12);
      }
      ctx.shadowBlur = 0;

      ctx.restore();
    }
  }

  // 16진수 색상 보간(Lerp) 헬퍼
  private lerpColor(c1: string, c2: string, factor: number): string {
    const f = Math.max(0, Math.min(1, factor));
    const r1 = parseInt(c1.slice(1, 3), 16);
    const g1 = parseInt(c1.slice(3, 5), 16);
    const b1 = parseInt(c1.slice(5, 7), 16);

    const r2 = parseInt(c2.slice(1, 3), 16);
    const g2 = parseInt(c2.slice(3, 5), 16);
    const b2 = parseInt(c2.slice(5, 7), 16);

    const r = Math.round(r1 + (r2 - r1) * f);
    const g = Math.round(g1 + (g2 - g1) * f);
    const b = Math.round(b1 + (b2 - b1) * f);

    return `rgb(${r},${g},${b})`;
  }

  // 바이옴 고도에 따른 동적 도로 테마 (연석, 노면, 점선, 그림자) 계산
  private getCurrentRoadTheme(): { curb: string; surface: string; line: string; shadow: string } {
    const meters = this.stats.distanceMeters;
    const ROAD_THEMES = [
      { m: 0, curb: '#38bdf8', surface: '#e0f2fe', line: '#0284c7', shadow: '#0c4a6e' },       // 1. 설산 빙판 (화이트/아이스블루)
      { m: 400, curb: '#15803d', surface: '#1e293b', line: '#a3e635', shadow: '#022c22' },     // 2. 알프스 전나무 숲 (에메랄드/라임)
      { m: 900, curb: '#d97706', surface: '#78350f', line: '#fef08a', shadow: '#451a03' },     // 3. 동화 초원 벽돌/흙길 (황토/골드)
      { m: 1450, curb: '#c026d3', surface: '#2e1065', line: '#06b6d4', shadow: '#1e083a' },    // 4. 수정 동굴 (마젠타/네온사이언)
      { m: 2050, curb: '#ea580c', surface: '#450a0a', line: '#facc15', shadow: '#1f0404' },    // 5. 화산 마그마 (오렌지/용암 옐로우)
      { m: 2600, curb: '#e11d48', surface: '#0f0208', line: '#fb7185', shadow: '#000000' },    // 6. 지구 맨틀 심연 코어 (크림슨/네온레드)
    ];

    let curIdx = 0;
    while (curIdx < ROAD_THEMES.length - 2 && meters > ROAD_THEMES[curIdx + 1].m) {
      curIdx++;
    }
    const t1 = ROAD_THEMES[curIdx];
    const t2 = ROAD_THEMES[curIdx + 1];
    const span = Math.max(1, t2.m - t1.m);
    const t = Math.max(0, Math.min(1, (meters - t1.m) / span));

    return {
      curb: this.lerpColor(t1.curb, t2.curb, t),
      surface: this.lerpColor(t1.surface, t2.surface, t),
      line: this.lerpColor(t1.line, t2.line, t),
      shadow: this.lerpColor(t1.shadow, t2.shadow, t),
    };
  }

  private drawCloud(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number): void {
    ctx.beginPath();
    ctx.arc(cx, cy, scale * 0.5, 0, Math.PI * 2);
    ctx.arc(cx + scale * 0.4, cy - scale * 0.2, scale * 0.45, 0, Math.PI * 2);
    ctx.arc(cx + scale * 0.8, cy, scale * 0.4, 0, Math.PI * 2);
    ctx.arc(cx + scale * 0.35, cy + scale * 0.15, scale * 0.35, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  // 아스팔트 도로 렌더링 (방향 전환 코너가 완전히 하나로 매끄럽게 융합되는 연속 폴리라인 체인 방식)
  private drawAsphaltRoads(ctx: CanvasRenderingContext2D): void {
    // 1. 세그먼트들을 연속된 도로 체인(Continuous Road Chains)으로 그룹화
    interface RoadPoint {
      x: number;
      y: number;
    }
    type RoadChain = RoadPoint[];

    const chains: RoadChain[] = [];
    let currentChain: RoadChain | null = null;

    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];

      // 카메라 컬링
      const minX = Math.min(seg.startX, seg.endX) - 100;
      const maxX = Math.max(seg.startX, seg.endX) + 100;
      const minY = Math.min(seg.startY, seg.endY) - 100;
      const maxY = Math.max(seg.startY, seg.endY) + 100;
      const inView = !(
        maxX < this.cameraX ||
        minX > this.cameraX + this.screenWidth ||
        maxY < this.cameraY ||
        minY > this.cameraY + this.screenHeight
      );

      // TURN 세그먼트는 이전 세그먼트 끝점과 다음 세그먼트 시작점을 V자로 이어주는 피벗 꼭지점
      if (seg.type === 'TURN') {
        continue;
      }

      if (seg.isCollapsed) {
        const dx = seg.endX - seg.startX;
        const dy = seg.endY - seg.startY;
        const p1 = { x: seg.startX + dx * 0.25, y: seg.startY + dy * 0.25 };
        const p2 = { x: seg.startX + dx * 0.75, y: seg.startY + dy * 0.75 };

        if (!currentChain || Math.hypot(currentChain[currentChain.length - 1].x - seg.startX, currentChain[currentChain.length - 1].y - seg.startY) > 2) {
          if (currentChain && currentChain.length > 1) chains.push(currentChain);
          currentChain = [{ x: seg.startX, y: seg.startY }];
        }
        currentChain.push(p1);
        chains.push(currentChain);

        // 붕괴 구간 건너편 착지면 새 체인 시작
        currentChain = [p2, { x: seg.endX, y: seg.endY }];
        continue;
      }

      if (seg.type === 'GAP') {
        // 도약대까지 체인 연결 후 공중 낭떠러지이므로 체인 분리
        if (!currentChain || Math.hypot(currentChain[currentChain.length - 1].x - seg.startX, currentChain[currentChain.length - 1].y - seg.startY) > 2) {
          if (currentChain && currentChain.length > 1) chains.push(currentChain);
          currentChain = [{ x: seg.startX, y: seg.startY }];
        }
        currentChain.push({ x: seg.endX, y: seg.endY });
        chains.push(currentChain);
        currentChain = null;
        continue;
      }

      // 일반 STRAIGHT 세그먼트: 이전 점과 연속되면 이어서 연결, 끊기면 새 체인 시작
      if (!currentChain || Math.hypot(currentChain[currentChain.length - 1].x - seg.startX, currentChain[currentChain.length - 1].y - seg.startY) > 2) {
        if (currentChain && currentChain.length > 1) chains.push(currentChain);
        currentChain = [{ x: seg.startX, y: seg.startY }];
      }
      currentChain.push({ x: seg.endX, y: seg.endY });
    }

    if (currentChain && currentChain.length > 1) {
      chains.push(currentChain);
    }

    // 2. 단일 폴리라인 패스 그리기 헬퍼
    const traceChain = (pts: RoadPoint[], offsetY: number = 0) => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y + offsetY);
      for (let j = 1; j < pts.length; j++) {
        ctx.lineTo(pts[j].x, pts[j].y + offsetY);
      }
    };

    // 3. 일체형 도로 레이어 렌더링 (코너가 V자로 매끄럽게 융합)
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const roadTheme = this.getCurrentRoadTheme();

    // A. 하단 3D 도로 그림자 (전체 체인 일괄)
    ctx.strokeStyle = roadTheme.shadow;
    ctx.lineWidth = GAME_CONSTANTS.ROAD_WIDTH + 6;
    for (const chain of chains) {
      traceChain(chain, 8);
      ctx.stroke();
    }

    // B. 도로 양옆 레이싱 연석 (전체 체인 일괄)
    ctx.strokeStyle = roadTheme.curb;
    ctx.lineWidth = GAME_CONSTANTS.ROAD_WIDTH;
    for (const chain of chains) {
      traceChain(chain, 0);
      ctx.stroke();
    }

    // C. 다크 아스팔트 / 바이옴 노면 (전체 체인 일괄)
    ctx.strokeStyle = roadTheme.surface;
    ctx.lineWidth = GAME_CONSTANTS.ROAD_WIDTH - (GAME_CONSTANTS.CURB_WIDTH * 2);
    for (const chain of chains) {
      traceChain(chain, 0);
      ctx.stroke();
    }

    // D. 중앙 점선 (전체 체인 일괄)
    ctx.save();
    ctx.setLineDash([12, 10]);
    ctx.strokeStyle = roadTheme.line;
    ctx.lineWidth = 3.0;
    for (const chain of chains) {
      traceChain(chain, 0);
      ctx.stroke();
    }
    ctx.restore();

    // 4. 특수 도로 디테일 (붕괴 단면 암석 톱니 & 금 간 도로 균열선)
    for (const seg of this.segments) {
      const minX = Math.min(seg.startX, seg.endX) - 60;
      const maxX = Math.max(seg.startX, seg.endX) + 60;
      const minY = Math.min(seg.startY, seg.endY) - 60;
      const maxY = Math.max(seg.startY, seg.endY) + 60;

      if (
        maxX < this.cameraX ||
        minX > this.cameraX + this.screenWidth ||
        maxY < this.cameraY ||
        minY > this.cameraY + this.screenHeight
      ) {
        continue;
      }

      // 붕괴된 도로 깨진 바위 톱니 단면
      if (seg.isCollapsed) {
        const dx = seg.endX - seg.startX;
        const dy = seg.endY - seg.startY;
        const p1X = seg.startX + dx * 0.25;
        const p1Y = seg.startY + dy * 0.25;
        const p2X = seg.startX + dx * 0.75;
        const p2Y = seg.startY + dy * 0.75;

        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(p1X, p1Y, 14, 0, Math.PI * 2);
        ctx.arc(p2X, p2Y, 14, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      // 금 간 길 선명한 균열선
      if (seg.isCracked && !seg.isCollapsed) {
        ctx.save();
        const midX = (seg.startX + seg.endX) * 0.5;
        const midY = (seg.startY + seg.endY) * 0.5;

        // 굵고 선명한 위험 크랙 라인
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 4.0;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(midX - 22, midY - 14);
        ctx.lineTo(midX - 8, midY + 4);
        ctx.lineTo(midX + 6, midY - 6);
        ctx.lineTo(midX + 22, midY + 12);
        ctx.stroke();

        // 암석 하이라이트선
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(midX - 22, midY - 12);
        ctx.lineTo(midX - 8, midY + 6);
        ctx.lineTo(midX + 6, midY - 4);
        ctx.lineTo(midX + 22, midY + 14);
        ctx.stroke();

        // 경고 인디케이터
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(midX, midY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // 아이템 렌더링
  private drawItems(ctx: CanvasRenderingContext2D): void {
    const time = performance.now() * 0.004;

    for (const seg of this.segments) {
      if (seg.item && !seg.item.collected) {
        const floatY = seg.item.y + Math.sin(time) * 4;

        ctx.save();
        ctx.translate(seg.item.x, floatY);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(-10, -10, 20, 20, 5);
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#10b981';
        ctx.fillRect(-3, -7, 6, 14);
        ctx.fillRect(-7, -3, 14, 6);

        ctx.restore();
      }
    }
  }

  // 파티클 렌더링
  private drawParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.type === 'TEXT') {
        // [피드백 5] 밝은 배경(설산, 초원 등)에서도 선명하게 보이도록 검정 외곽선 스트로크 추가
        ctx.font = '900 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.strokeText(p.text || '', p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text || '', p.x, p.y);
      } else if (p.type === 'CHUNK') {
        // [피드백 4] 부서진 각진 도로 암석 파편 렌더링
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        const r = p.radius;
        ctx.moveTo(-r * 0.8, -r * 0.9);
        ctx.lineTo(r * 0.9, -r * 0.6);
        ctx.lineTo(r * 0.7, r * 0.8);
        ctx.lineTo(-r * 0.6, r * 0.9);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (p.type === 'SHELL') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.radius);
        ctx.lineTo(p.radius * 0.9, p.radius * 0.8);
        ctx.lineTo(-p.radius * 0.8, p.radius * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (p.type === 'BOLT') {
        // [사이버 메탈란] 굴러다니는 십자 나사 볼트 렌더링
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.0;
        ctx.stroke();

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(-p.radius * 0.7, 0);
        ctx.lineTo(p.radius * 0.7, 0);
        ctx.moveTo(0, -p.radius * 0.7);
        ctx.lineTo(0, p.radius * 0.7);
        ctx.stroke();
      } else if (p.type === 'POISON_SMOKE') {
        // [치명적인 맹독란] 맹독성 초록 구름
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        grad.addColorStop(0, p.color);
        grad.addColorStop(0.7, 'rgba(34, 197, 94, 0.4)');
        grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'HOLY_GLOW') {
        // [순백의 천사란] 성스러운 황금/순백 십자 반짝임
        ctx.translate(p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-p.radius * 1.4, 0);
        ctx.lineTo(p.radius * 1.4, 0);
        ctx.moveTo(0, -p.radius * 1.4);
        ctx.lineTo(0, p.radius * 1.4);
        ctx.stroke();
      } else if (p.type === 'DARK_SMOKE') {
        // [심연의 악마란] 검붉은 심연의 연기
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        grad.addColorStop(0, p.color);
        grad.addColorStop(0.6, 'rgba(127, 29, 29, 0.5)');
        grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }

      ctx.restore();
    }
  }
}
