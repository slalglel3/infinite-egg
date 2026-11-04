import { Egg, SlopeSegment, Particle, GameStats, SlopeDirection, EggSplat, EggSkin, EventMapItem } from '../types/game';
import { GAME_CONSTANTS } from './constants';
import { MapGenerator } from './mapGenerator';
import { EggRenderer } from './eggRenderer';
import { sound } from '../audio/sound';
import { getEggSkinById } from '../data/eggSkins';
import { getUIAsset } from '../assets/assetRegistry';

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
  public currentEventMap: EventMapItem | null = null;

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

  // 계란 주행 궤적 (Trail & Skidmark)
  public trails: EggTrailPoint[] = [];
  private trailSpawnTimer: number = 0;

  // 대기 환경 파티클 타이머 (눈송이, 불티 등)
  private ambientParticleTimer: number = 0;
  private featherImg: HTMLImageElement | null = null;

  // 콜백
  public onGameOver?: (stats: GameStats, reason: 'CRACKED' | 'FALL') => void;

  constructor(userLevel: number = 1) {
    this.mapGen = new MapGenerator();
    this.eggRenderer = new EggRenderer();

    const featherSrc = getUIAsset('prop_golden_feather');
    if (featherSrc) {
      this.featherImg = new Image();
      this.featherImg.src = featherSrc;
    }

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
    costumes?: { hat?: string; top?: string; bottom?: string; hand?: string },
    eventMap?: EventMapItem | null
  ): void {
    if (skin) {
      this.setSkin(skin);
    }
    this.setCostumes(costumes);
    this.currentEventMap = eventMap || null;
    this.mapGen.bandageMultiplier = this.currentEventMap ? this.currentEventMap.bandageRate : 1.0;

    this.mapGen.reset(0, 0);
    this.segments = this.mapGen.generateInitialMap();

    const hpBonus = this.currentSkin.hpBonus || 0;
    const maxHp = GAME_CONSTANTS.BASE_HP + (userLevel - 1) * GAME_CONSTANTS.HP_PER_LEVEL + hpBonus;
    const firstSeg = this.segments[0];

    const speedMult = this.currentEventMap ? this.currentEventMap.speedMultiplier : 1.0;

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
      speed: GAME_CONSTANTS.INITIAL_SPEED * speedMult,
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

      // 코너 끝점 38px 이내 도달 시: 퍼펙트 턴! (대미지 0)
      if (distToTurn <= 38) {
        this.egg.direction = newDir;
        this.egg.currentSegmentIndex = turnSegIndex + 1;
        this.egg.x = turnSeg.startX;
        this.egg.y = turnSeg.startY - GAME_CONSTANTS.EGG_RADIUS_Y + 4;
        sound.playTurn();
        sound.playPerfect();
        this.stats.perfectLandings++;
        this.spawnTextParticle(this.egg.x, this.egg.y - 25, 'PERFECT TURN!', '#10b981');
        return;
      }

      // 너무 일찍 누른 경우 (수직 낙하 드롭으로 바닥 착지 대미지 또는 낭떠러지 추락)
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
    const speedMult = this.currentEventMap ? this.currentEventMap.speedMultiplier : 1.0;
    const baseTargetSpeed = Math.min(
      GAME_CONSTANTS.MAX_SPEED,
      GAME_CONSTANTS.INITIAL_SPEED + speedStepCount * GAME_CONSTANTS.SPEED_INCREASE_STEP
    );
    this.stats.speed = baseTargetSpeed * speedMult;

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

    // 지면 노면 스키드마크 & 고유 궤적(Trail) 생성 (초당 약 45회 촘촘한 리본 스폰)
    this.trailSpawnTimer += dt;
    if (this.trailSpawnTimer >= 0.022) {
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

    // 아이템 수집 판정 (황금 깃털 🪶 & 반창고)
    if (currentSeg.item && !currentSeg.item.collected) {
      const distToItem = Math.hypot(this.egg.x - currentSeg.item.x, this.egg.y - currentSeg.item.y);
      if (distToItem < 32) {
        currentSeg.item.collected = true;
        this.stats.itemsCollected++;

        if (currentSeg.item.type === 'FEATHER') {
          sound.playCoin();
          this.spawnFeatherBursts(currentSeg.item.x, currentSeg.item.y);
          this.spawnTextParticle(this.egg.x, this.egg.y - 25, '+1 🪶', '#fde047');
        } else {
          this.egg.hp = Math.min(this.egg.maxHp, this.egg.hp + GAME_CONSTANTS.BANDAGE_HEAL_HP);
          this.stats.hp = this.egg.hp;
          sound.playHeal();
          this.spawnTextParticle(this.egg.x, this.egg.y - 25, `+${GAME_CONSTANTS.BANDAGE_HEAL_HP} HP`, '#10b981');
        }
      }
    }

    // 건초 더미 (HAYSTACK) 장애물 굴러서 충돌 판정
    if (currentSeg.obstacle && currentSeg.obstacle.type === 'HAYSTACK') {
      const obs = currentSeg.obstacle;
      const distToObs = Math.hypot(this.egg.x - obs.x, this.egg.y - obs.y);
      if (distToObs < 24 && !obs.hit && !obs.cleared) {
        obs.hit = true;
        this.egg.hp = Math.max(0, this.egg.hp - 15);
        this.stats.hp = this.egg.hp;
        this.egg.flashDamage = true;
        this.screenShake = 12;
        sound.playCrack();
        this.spawnStrawBurst(obs.x, obs.y, 16);
        this.spawnTextParticle(obs.x, obs.y - 25, '-15 HP 건초 충돌!', '#f87171');
        if (this.egg.hp <= 0) {
          this.startCrackedSequence();
          return;
        }
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

    // 점프 중 건초 더미를 공중에서 뛰어넘는 판정
    const currentSeg = this.segments[this.egg.currentSegmentIndex];
    if (currentSeg?.obstacle && currentSeg.obstacle.type === 'HAYSTACK') {
      const obs = currentSeg.obstacle;
      const distToObs = Math.hypot(this.egg.x - obs.x, this.egg.y - obs.y);
      if (distToObs < 32 && !obs.hit && !obs.cleared && this.egg.jumpArcOffset > 8) {
        obs.cleared = true;
        sound.playPerfect();
        this.spawnStrawBurst(obs.x, obs.y, 10);
        this.spawnTextParticle(obs.x, obs.y - 25, '건초 점프 통과! 🌾', '#fde047');
      }
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

    if (meters < 420) {
      // 헛간 다락방 & 농장 마당: 바람에 나풀거리는 단풍잎 & 부유하는 깃털
      const isFeather = Math.random() < 0.45;
      this.particles.push({
        x: this.cameraX + Math.random() * this.screenWidth,
        y: this.cameraY - 20,
        vx: (Math.random() - 0.5) * 35,
        vy: 20 + Math.random() * 30,
        radius: isFeather ? 4 + Math.random() * 2 : 5 + Math.random() * 3,
        color: isFeather ? 'rgba(254, 240, 138, 0.9)' : (Math.random() < 0.5 ? '#f59e0b' : '#84cc16'),
        alpha: 0.85,
        life: 0,
        maxLife: 3.5,
        vRot: (Math.random() - 0.5) * 3,
        type: 'LEAF',
      });
    } else if (meters >= 420 && meters < 950) {
      // 초원: 흰 민들레 홀씨와 꽃가루
      this.particles.push({
        x: this.cameraX + Math.random() * this.screenWidth,
        y: this.cameraY - 15,
        vx: (Math.random() - 0.5) * 40 - 15,
        vy: 15 + Math.random() * 25,
        radius: 1.5 + Math.random() * 2,
        color: 'rgba(255, 255, 255, 0.9)',
        alpha: 0.8,
        life: 0,
        maxLife: 3.0,
        type: 'DUST',
      });
    } else if (meters >= 950 && meters < 1500) {
      // 자작나무 숲 & 폭포: 튀는 물안개와 수정 포자
      this.particles.push({
        x: this.cameraX + Math.random() * this.screenWidth,
        y: this.cameraY + Math.random() * this.screenHeight,
        vx: (Math.random() - 0.5) * 20,
        vy: -15 - Math.random() * 25,
        radius: 2 + Math.random() * 2,
        color: '#38bdf8',
        alpha: 0.7,
        life: 0,
        maxLife: 2.0,
        type: 'DUST',
      });
    } else if (meters >= 1500) {
      // 은하수 별빛 가루
      this.particles.push({
        x: this.cameraX + Math.random() * this.screenWidth,
        y: this.cameraY + Math.random() * this.screenHeight,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        radius: 1.5 + Math.random() * 2.5,
        color: Math.random() < 0.5 ? '#c084fc' : '#fde047',
        alpha: 1,
        life: 0,
        maxLife: 2.0,
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
      } else if (p.type === 'LEAF' || p.type === 'STRAW') {
        p.vx += Math.sin(p.life * 3.5) * 16 * dt;
        p.rotation = (p.rotation || 0) + (p.vRot || 2.5) * dt;
        p.vy += 20 * dt;
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

  // 건초 파편 분출 파티클
  private spawnStrawBurst(x: number, y: number, count: number = 14): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 80;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 14,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 30,
        radius: 2 + Math.random() * 2.5,
        color: Math.random() < 0.6 ? '#f59e0b' : '#fef08a',
        alpha: 1,
        life: 0,
        maxLife: 0.6,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 8,
        type: 'STRAW',
      });
    }
  }

  // 황금 깃털 획득 스파클 파티클
  private spawnFeatherBursts(x: number, y: number): void {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.3;
      const spd = 45 + Math.random() * 65;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 35,
        radius: 3 + Math.random() * 2.5,
        color: Math.random() < 0.6 ? '#facc15' : '#ffffff',
        alpha: 1,
        life: 0,
        maxLife: 0.7,
        type: 'FEATHER_BURST',
      });
    }
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
    if (this.trails.length >= 80) {
      this.trails.shift();
    }

    const special = this.currentSkin.specialType;
    let type: EggTrailPoint['type'] = 'SKID';
    let color = 'rgba(255, 255, 255, 0.75)';
    let radius = 6.5;

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
          // [VOC-04 반영] 타이어 자국 대신 신선한 계란 흰자의 촉촉한 윤기 & 미세 껍질 광택 궤적
          ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
          ctx.beginPath();
          ctx.ellipse(trail.x, trail.y, trail.radius, trail.radius * 0.45, 0.4, 0, Math.PI * 2);
          ctx.fill();
          // 중심부 반짝이는 달걀 껍질 미세 광채 하이라이트
          ctx.fillStyle = '#fef3c7';
          ctx.beginPath();
          ctx.arc(trail.x, trail.y, trail.radius * 0.35, 0, Math.PI * 2);
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

    this.drawWoodenBridgeRoads(ctx);
    this.drawTrails(ctx);
    this.drawItems(ctx);
    this.drawObstacles(ctx);

    for (const splat of this.splats) {
      this.eggRenderer.drawEggSplat(ctx, splat);
    }

    if (this.egg.state !== 'DEAD_CRACKED') {
      this.eggRenderer.drawEgg(ctx, this.egg);
    }

    this.drawParticles(ctx);

    ctx.restore();
  }

  // [시네마틱 탈출 서사] 닭장 둥지 ➔ 헛간 탈출 ➔ 시골 마당 ➔ 푸른 초원 ➔ 미지의 모험
  private drawDynamicBiomeBackground(ctx: CanvasRenderingContext2D): void {
    const meters = this.stats.distanceMeters;
    const animTick = (Date.now() * 0.003); // 애니메이션 틱

    // 바이옴 키프레임 (거리, 상단색, 중단색, 하단색)
    const BIOMES = [
      { m: 0, top: '#2b1306', mid: '#5c371e', bot: '#fef3c7' },     // 1. 아늑한 닭장 다락방 (따뜻한 호박빛 서까래 & 둥지)
      { m: 180, top: '#78350f', mid: '#d97706', bot: '#fef08a' },   // 2. 헛간 탈출구 & 농장 마당
      { m: 450, top: '#0284c7', mid: '#38bdf8', bot: '#f0fdf4' },   // 3. 햇살 가득한 푸른 대초원 & 풍차 언덕
      { m: 950, top: '#0369a1', mid: '#0ea5e9', bot: '#ecfdf5' },   // 4. 자작나무 강가 숲 & 폭포
      { m: 1500, top: '#0f172a', mid: '#1e1b4b', bot: '#38bdf8' },  // 5. 별빛 쏟아지는 밤하늘 & 은하수
      { m: 2200, top: '#18181b', mid: '#450a0a', bot: '#facc15' },  // 6. 마그마 심연
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
    // 1. 아늑한 닭장 다락방 (0m ~ 220m): 목조 서까래 & 사선 햇살(God Rays) 브리딩!
    // -------------------------------------------------------------
    const barnAlpha = getZoneAlpha(80, 160);
    if (barnAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = barnAlpha;

      // 1-1. 목조 서까래(Rafters) 들보
      ctx.fillStyle = '#2b1306';
      for (let b = 0; b < 4; b++) {
        const beamX = (b * 240 - (this.cameraX * 0.15)) % (this.screenWidth + 240);
        ctx.fillRect(beamX - 40, 0, 24, this.screenHeight);
      }
      ctx.fillRect(0, 40, this.screenWidth, 28);

      // 1-2. 사선으로 내리쬐는 따스한 햇살 광선 (God Rays) - 부드러운 호흡 애니메이션
      const breath = 0.28 + 0.14 * Math.sin(animTick * 1.5);
      ctx.globalAlpha = barnAlpha * breath;
      const rayGrad = ctx.createLinearGradient(0, 0, this.screenWidth * 0.8, this.screenHeight);
      rayGrad.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
      rayGrad.addColorStop(0.5, 'rgba(253, 224, 71, 0.35)');
      rayGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(this.screenWidth * 0.35, 0);
      ctx.lineTo(this.screenWidth * 0.95, this.screenHeight);
      ctx.lineTo(this.screenWidth * 0.45, this.screenHeight);
      ctx.closePath();
      ctx.fill();

      // 1-3. 햇살 속에 반짝이는 금빛 먼지 티끌 (Dust Motes)
      ctx.fillStyle = '#fef08a';
      for (let d = 0; d < 18; d++) {
        const dx = ((d * 53) - (this.cameraX * 0.2) + Math.sin(animTick + d) * 15) % this.screenWidth;
        const dy = ((d * 47) + (animTick * 25)) % (this.screenHeight * 0.7);
        ctx.globalAlpha = barnAlpha * (0.4 + 0.4 * Math.sin(animTick * 2 + d));
        ctx.beginPath();
        ctx.arc((dx + this.screenWidth) % this.screenWidth, dy, 1.5 + (d % 2), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // -------------------------------------------------------------
    // 2. 헛간 탈출구 & 시골 농장 마당 (150m ~ 460m)
    // -------------------------------------------------------------
    const farmAlpha = getZoneAlpha(300, 180);
    if (farmAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = farmAlpha;

      // 2-1. 하얀 목조 울타리 (White Picket Fence)
      ctx.fillStyle = '#f8fafc';
      const fenceOffset = -(this.cameraX * 0.2) % 60;
      const fenceY = this.screenHeight - 120;
      for (let x = fenceOffset - 60; x < this.screenWidth + 60; x += 30) {
        ctx.fillRect(x, fenceY, 14, 70);
        ctx.beginPath();
        ctx.moveTo(x, fenceY);
        ctx.lineTo(x + 7, fenceY - 10);
        ctx.lineTo(x + 14, fenceY);
        ctx.fill();
      }
      ctx.fillRect(0, fenceY + 20, this.screenWidth, 10);
      ctx.fillRect(0, fenceY + 45, this.screenWidth, 10);

      // 2-2. 붉은 지붕 헛간 창고 & 풍향계
      const barnX = (300 - (this.cameraX * 0.12)) % (this.screenWidth + 400) - 80;
      const barnY = this.screenHeight - 180;
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(barnX, barnY, 110, 80);
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.moveTo(barnX - 15, barnY);
      ctx.lineTo(barnX + 55, barnY - 45);
      ctx.lineTo(barnX + 125, barnY);
      ctx.fill();

      // 헛간 흰색 X자 문틀
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(barnX + 35, barnY + 25, 40, 55);

      ctx.restore();
    }

    // -------------------------------------------------------------
    // 3. 목가적인 동화 초원 & 풍차 (400m ~ 1000m)
    // -------------------------------------------------------------
    const meadowAlpha = getZoneAlpha(700, 320);
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

  // 2.5D 목조 구름다리(Wooden Plank Bridge) 트랙 렌더링 (play.png 컨셉 100% 매칭)
  private drawWoodenBridgeRoads(ctx: CanvasRenderingContext2D): void {
    // 1. 세그먼트들을 연속된 다리 체인(Continuous Bridge Chains)으로 그룹화
    interface RoadPoint {
      x: number;
      y: number;
    }
    type RoadChain = RoadPoint[];

    const chains: RoadChain[] = [];
    let currentChain: RoadChain | null = null;

    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];

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

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // A. 하단 3D 앰비언트 그림자 (전체 체인 일괄)
    ctx.strokeStyle = 'rgba(28, 14, 5, 0.45)';
    ctx.lineWidth = GAME_CONSTANTS.ROAD_WIDTH + 8;
    for (const chain of chains) {
      traceChain(chain, 8);
      ctx.stroke();
    }

    // B. 목조 다리 밑받침 대들보 두께 (Dark Timber Thickness)
    ctx.strokeStyle = '#381a06';
    ctx.lineWidth = GAME_CONSTANTS.ROAD_WIDTH + 2;
    for (const chain of chains) {
      traceChain(chain, 4);
      ctx.stroke();
    }

    // C. 메인 목재 보행 데크 상판 (Warm Wooden Deck Planks)
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = GAME_CONSTANTS.ROAD_WIDTH;
    for (const chain of chains) {
      traceChain(chain, 0);
      ctx.stroke();
    }

    // D. 다리 양옆 꼬아놓은 새끼줄/로프 안전 난간 (Braided Rope Guardrails)
    ctx.save();
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 3.5;
    for (const chain of chains) {
      traceChain(chain, 0);
      ctx.stroke();
    }
    ctx.restore();

    // 4. 개별 직각 나무 판자 이음새 슬릿 & 못 디테일 & 부러진 단면
    for (const seg of this.segments) {
      const minX = Math.min(seg.startX, seg.endX) - 80;
      const maxX = Math.max(seg.startX, seg.endX) + 80;
      const minY = Math.min(seg.startY, seg.endY) - 80;
      const maxY = Math.max(seg.startY, seg.endY) + 80;

      if (
        maxX < this.cameraX ||
        minX > this.cameraX + this.screenWidth ||
        maxY < this.cameraY ||
        minY > this.cameraY + this.screenHeight
      ) {
        continue;
      }

      if (seg.type === 'TURN') continue;

      const segDx = seg.endX - seg.startX;
      const segDy = seg.endY - seg.startY;
      const segLen = Math.hypot(segDx, segDy);
      if (segLen < 2) continue;

      const udx = segDx / segLen;
      const udy = segDy / segLen;
      const nx = -udy; // 법선 수직 벡터
      const ny = udx;
      const halfW = (GAME_CONSTANTS.ROAD_WIDTH - 6) * 0.5;

      // 4-1. 도로를 따라 18px 간격으로 직각 나무 판자 분할 홈(Plank Divider Slits)
      for (let dist = 10; dist < segLen - 6; dist += 18) {
        if (seg.isCollapsed && dist >= segLen * 0.25 && dist <= segLen * 0.75) {
          continue;
        }

        const px = seg.startX + udx * dist;
        const py = seg.startY + udy * dist;

        // 어두운 판자 홈 선
        ctx.beginPath();
        ctx.moveTo(px - nx * halfW, py - ny * halfW);
        ctx.lineTo(px + nx * halfW, py + ny * halfW);
        ctx.strokeStyle = '#3b1604';
        ctx.lineWidth = 2.0;
        ctx.stroke();

        // 판자 모서리 미세 하이라이트선
        ctx.beginPath();
        ctx.moveTo(px - nx * halfW + udx * 1.5, py - ny * halfW + udy * 1.5);
        ctx.lineTo(px + nx * halfW + udx * 1.5, py + ny * halfW + udy * 1.5);
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.22)';
        ctx.lineWidth = 1.0;
        ctx.stroke();

        // 양옆 고정 쇠못 (Rustic Iron Nails)
        const nailD = halfW - 3;
        ctx.fillStyle = '#1c0d02';
        ctx.fillRect(px - nx * nailD - 1.2, py - ny * nailD - 1.2, 2.4, 2.4);
        ctx.fillRect(px + nx * nailD - 1.2, py + ny * nailD - 1.2, 2.4, 2.4);
      }

      // 4-2. 점프 도약대 (GAP) 끝단: 부러진 목재 가시(Splintered Broken Wood Planks)
      if (seg.type === 'GAP') {
        ctx.fillStyle = '#5c2e0b';
        const tipX = seg.endX;
        const tipY = seg.endY;
        for (let s = -2; s <= 2; s++) {
          const spX = tipX + nx * (s * 8);
          const spY = tipY + ny * (s * 8);
          const spLen = 7 + (Math.abs(s * 7) % 8);
          ctx.beginPath();
          ctx.moveTo(spX - 2.5, spY);
          ctx.lineTo(spX + udx * spLen, spY + udy * spLen);
          ctx.lineTo(spX + 2.5, spY);
          ctx.fill();
        }
      }

      // 4-3. 붕괴된 길(isCollapsed): 양쪽 끊어진 낭떠러지 목재 파편
      if (seg.isCollapsed) {
        const p1X = seg.startX + segDx * 0.25;
        const p1Y = seg.startY + segDy * 0.25;
        const p2X = seg.startX + segDx * 0.75;
        const p2Y = seg.startY + segDy * 0.75;

        ctx.fillStyle = '#381a06';
        ctx.beginPath();
        ctx.arc(p1X, p1Y, 14, 0, Math.PI * 2);
        ctx.arc(p2X, p2Y, 14, 0, Math.PI * 2);
        ctx.fill();

        // 떨어져나간 부러진 가시
        for (let s = -2; s <= 2; s++) {
          const spX = p1X + nx * (s * 7);
          const spY = p1Y + ny * (s * 7);
          ctx.beginPath();
          ctx.moveTo(spX - 2, spY);
          ctx.lineTo(spX + udx * 8, spY + udy * 8);
          ctx.lineTo(spX + 2, spY);
          ctx.fill();
        }
      }

      // 4-4. 금 간 길(isCracked): 삐걱거리는 균열 & 튀어나온 못
      if (seg.isCracked && !seg.isCollapsed) {
        ctx.save();
        const midX = (seg.startX + seg.endX) * 0.5;
        const midY = (seg.startY + seg.endY) * 0.5;

        // 갈라진 목재 균열
        ctx.strokeStyle = '#1c0d02';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(midX - 20, midY - 12);
        ctx.lineTo(midX - 6, midY + 4);
        ctx.lineTo(midX + 8, midY - 5);
        ctx.lineTo(midX + 20, midY + 11);
        ctx.stroke();

        // 목재 섬유 갈라짐 하이라이트
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(midX - 20, midY - 10);
        ctx.lineTo(midX - 6, midY + 6);
        ctx.lineTo(midX + 8, midY - 3);
        ctx.lineTo(midX + 20, midY + 13);
        ctx.stroke();

        // 삐걱거림 위험 인디케이터
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(midX, midY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // 3D 건초 더미 (Haystack Obstacle) 렌더링
  private drawObstacles(ctx: CanvasRenderingContext2D): void {
    for (const seg of this.segments) {
      if (!seg.obstacle) continue;

      const obs = seg.obstacle;
      // 카메라 컬링
      if (
        obs.x < this.cameraX - 60 ||
        obs.x > this.cameraX + this.screenWidth + 60 ||
        obs.y < this.cameraY - 60 ||
        obs.y > this.cameraY + this.screenHeight + 60
      ) {
        continue;
      }

      ctx.save();
      ctx.translate(obs.x, obs.y);

      if (obs.hit) {
        // 충돌 후 흩어진 건초 잔해
        ctx.fillStyle = 'rgba(30, 15, 5, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 4, 24, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1.8;
        for (let i = 0; i < 8; i++) {
          const ang = (i * Math.PI) / 4;
          const len = 12 + (i % 3) * 4;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(ang) * len, Math.sin(ang) * (len * 0.5));
          ctx.stroke();
        }
      } else {
        // 1. 하단 부드러운 접지 그림자
        ctx.fillStyle = 'rgba(20, 10, 2, 0.45)';
        ctx.beginPath();
        ctx.ellipse(0, 10, 22, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // 점프 클리어 성공 시 황금빛 아우라
        if (obs.cleared) {
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 12;
        }

        // 2. 3D 건초 더미 본체 (따스한 황금빛 짚단 레이어)
        const hayGrad = ctx.createRadialGradient(-3, -6, 4, 0, 0, 22);
        hayGrad.addColorStop(0, '#fef9c3');
        hayGrad.addColorStop(0.35, '#fef08a');
        hayGrad.addColorStop(0.75, '#f59e0b');
        hayGrad.addColorStop(1, '#92400e');

        ctx.fillStyle = hayGrad;
        ctx.beginPath();
        ctx.moveTo(-18, 8);
        ctx.bezierCurveTo(-20, -12, -12, -22, 0, -22);
        ctx.bezierCurveTo(12, -22, 20, -12, 18, 8);
        ctx.bezierCurveTo(14, 13, -14, 13, -18, 8);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;

        // 3. 건초 묶음 밧줄 (새끼줄 밴드)
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.ellipse(0, -2, 17, 6, 0.05, 0, Math.PI);
        ctx.stroke();

        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, -3, 16, 5, 0.05, 0, Math.PI);
        ctx.stroke();

        // 4. 삐죽삐죽 튀어나온 유기적인 밀짚 가닥 디테일
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.8;
        const strawOffsets = [
          { x: -16, y: -4, dx: -7, dy: -4 },
          { x: -12, y: -16, dx: -5, dy: -6 },
          { x: 2, y: -22, dx: 4, dy: -7 },
          { x: 14, y: -14, dx: 6, dy: -5 },
          { x: 17, y: -2, dx: 7, dy: 3 },
          { x: -15, y: 7, dx: -6, dy: 4 },
          { x: 14, y: 8, dx: 6, dy: 3 },
        ];
        for (const s of strawOffsets) {
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x + s.dx, s.y + s.dy);
          ctx.stroke();
        }

        // 5. 점프 클리어 완료 시 PASS 인디케이터
        if (obs.cleared) {
          ctx.fillStyle = '#22c55e';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('PASS!', 0, -28);
        }
      }

      ctx.restore();
    }
  }

  // 아이템 렌더링 (황금 깃털 🪶 & 구급 반창고)
  private drawItems(ctx: CanvasRenderingContext2D): void {
    const time = performance.now() * 0.004;

    for (const seg of this.segments) {
      if (seg.item && !seg.item.collected) {
        const item = seg.item;
        // 카메라 컬링
        if (
          item.x < this.cameraX - 40 ||
          item.x > this.cameraX + this.screenWidth + 40 ||
          item.y < this.cameraY - 40 ||
          item.y > this.cameraY + this.screenHeight + 40
        ) {
          continue;
        }

        if (item.type === 'FEATHER') {
          // 황금 깃털 (Floating Golden Feather)
          const floatY = item.y + Math.sin(time + item.x * 0.05) * 5;

          // 접지 그림자 (다리 바닥에 비치는 부드러운 그림자)
          ctx.save();
          ctx.fillStyle = 'rgba(30, 15, 5, 0.35)';
          ctx.beginPath();
          ctx.ellipse(item.x, item.y + 14, 10, 4, 0, 0, Math.PI * 2);
          ctx.fill();

          // 황금빛 발광 헤일로 (Golden Aura)
          const haloGrad = ctx.createRadialGradient(item.x, floatY, 2, item.x, floatY, 20);
          haloGrad.addColorStop(0, 'rgba(253, 224, 71, 0.55)');
          haloGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.25)');
          haloGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
          ctx.fillStyle = haloGrad;
          ctx.beginPath();
          ctx.arc(item.x, floatY, 20, 0, Math.PI * 2);
          ctx.fill();

          ctx.translate(item.x, floatY);
          ctx.rotate(Math.sin(time * 0.7) * 0.15);

          if (this.featherImg && this.featherImg.complete && this.featherImg.naturalWidth > 0) {
            ctx.drawImage(this.featherImg, -14, -14, 28, 28);
          } else {
            // 정밀 캔버스 황금 깃털 백업 렌더링
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.moveTo(0, -12);
            ctx.bezierCurveTo(8, -8, 9, 4, 3, 10);
            ctx.lineTo(0, 13);
            ctx.lineTo(-3, 10);
            ctx.bezierCurveTo(-9, 4, -8, -8, 0, -12);
            ctx.closePath();
            ctx.fill();

            // 깃대 (Quill)
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(0, -12);
            ctx.lineTo(0, 13);
            ctx.stroke();

            // 깃털 빗살 하이라이트
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 1;
            for (let k = -6; k <= 6; k += 4) {
              ctx.beginPath();
              ctx.moveTo(0, k);
              ctx.lineTo(5, k - 3);
              ctx.moveTo(0, k);
              ctx.lineTo(-5, k - 3);
              ctx.stroke();
            }
          }

          // 반짝임 스파클
          const sparkSize = 2 + Math.sin(time * 3) * 1.5;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(4, -6, sparkSize, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        } else {
          // BANDAGE (구급 반창고)
          const floatY = item.y + Math.sin(time) * 4;

          ctx.save();
          // 접지 그림자
          ctx.fillStyle = 'rgba(30, 15, 5, 0.3)';
          ctx.beginPath();
          ctx.ellipse(item.x, item.y + 14, 11, 4, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.translate(item.x, floatY);

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
  }

  // 파티클 렌더링
  private drawParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.type === 'TEXT') {
        ctx.font = '900 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.strokeText(p.text || '', p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text || '', p.x, p.y);
      } else if (p.type === 'STRAW') {
        // 날리는 황금 밀짚 가닥
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-p.radius * 2, 0);
        ctx.lineTo(p.radius * 2, 0);
        ctx.stroke();
      } else if (p.type === 'LEAF') {
        // 바람에 살랑살랑 나부끼는 나뭇잎
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.radius * 1.5, p.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-p.radius * 1.5, 0);
        ctx.lineTo(p.radius * 1.5, 0);
        ctx.stroke();
      } else if (p.type === 'FEATHER_BURST') {
        // 황금 깃털 획득 시 4각 반짝임 별
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = p.color;
        const r = p.radius;
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.5);
        ctx.quadraticCurveTo(0, 0, r * 1.5, 0);
        ctx.quadraticCurveTo(0, 0, 0, r * 1.5);
        ctx.quadraticCurveTo(0, 0, -r * 1.5, 0);
        ctx.quadraticCurveTo(0, 0, 0, -r * 1.5);
        ctx.fill();
      } else if (p.type === 'CHUNK') {
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
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        grad.addColorStop(0, p.color);
        grad.addColorStop(0.7, 'rgba(34, 197, 94, 0.4)');
        grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'HOLY_GLOW') {
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
