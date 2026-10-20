import { Egg, SlopeSegment, Particle, GameStats, SlopeDirection, EggSplat } from '../types/game';
import { GAME_CONSTANTS } from './constants';
import { MapGenerator } from './mapGenerator';
import { EggRenderer } from './eggRenderer';
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
  public isGameOver: boolean = false;
  public gameOverReason: 'CRACKED' | 'FALL' | null = null;
  private screenShake: number = 0;

  // 헛점프 플래그
  private isCurrentJumpMisjump: boolean = false;
  private jumpOptimalHeight: number = 0;

  // 콜백 (연출이 완전히 끝난 후 모달 띄우기용)
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

  // 게임 재시작 및 초기화
  public restart(userLevel: number = 1): void {
    this.mapGen.reset(0, 0);
    this.segments = this.mapGen.generateInitialMap();

    const maxHp = GAME_CONSTANTS.BASE_HP + (userLevel - 1) * GAME_CONSTANTS.HP_PER_LEVEL;
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
    this.cameraX = this.egg.x;
    this.cameraY = this.egg.y;
    this.isRunning = true;
    this.isGameOver = false;
    this.gameOverReason = null;
    this.screenShake = 0;
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

    sound.playJump();

    if (!currentSeg || currentSeg.type !== 'GAP') {
      this.isCurrentJumpMisjump = true;
      this.jumpOptimalHeight = this.egg.y;
    } else {
      const distToEnd = Math.hypot(currentSeg.endX - this.egg.x, currentSeg.endY - this.egg.y);
      this.isCurrentJumpMisjump = false;
      this.jumpOptimalHeight = currentSeg.endY;
    }
  }

  // 2. [방향 전환] 버튼
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

      // 코너 끝점에 아주 가깝게 도달했을 때 누른 경우: 퍼펙트 턴!
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

      // 코너 도달 전에 너무 일찍 누른 경우 (기획 6-2 수직 낙하 드롭)
      this.egg.direction = newDir;
      this.egg.state = 'DROPPING_TURN';
      this.egg.dropStartY = this.egg.y;
      this.egg.vy = 80;
      sound.playTurn();

      this.egg.currentSegmentIndex = turnSegIndex + 1;
    } else {
      // 엉뚱한 곳에서 방향 전환을 누른 경우 -> 허공 추락 연출 시작!
      this.egg.direction = newDir;
      this.startFallSequence((newDir === 'RIGHT_DOWN' ? 1 : -1) * 110);
    }
  }

  // ==========================================
  // 물리 업데이트 루프
  // ==========================================
  public update(dt: number): void {
    if (!this.isRunning) return;

    // 화면 쉐이크 감쇄
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    // 찌그러짐 탄성 복원
    this.egg.squishX += (1 - this.egg.squishX) * dt * 10;
    this.egg.squishY += (1 - this.egg.squishY) * dt * 10;

    // 파티클 업데이트
    this.updateParticles(dt);

    // 사망 연출 시퀀스 진행
    if (this.egg.state === 'SURPRISED_FALL') {
      this.egg.deathTimer += dt;
      // 공중에서 멈칫 0.3초 후 본격적인 자유낙하로 전환
      if (this.egg.deathTimer >= 0.32) {
        this.egg.state = 'DEAD_FALLING';
        this.egg.vy = 120;
        sound.playFallWhistle();
      }
      return;
    }

    if (this.egg.state === 'DEAD_FALLING') {
      this.egg.deathTimer += dt;
      this.egg.vy += 850 * dt;
      this.egg.y += this.egg.vy * dt;
      this.egg.x += this.egg.vx * dt;
      // 빙글빙글 회전
      this.egg.rotation += 10 * dt;

      // 화면 아래로 완전히 사라지면 모달 등장 (요구사항 7)
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
      // 1.3초 동안 깨진 현장을 보여준 후 모달 등장 (요구사항 8)
      if (this.egg.deathTimer >= 1.35 && !this.isGameOver) {
        this.isGameOver = true;
        this.gameOverReason = 'CRACKED';
        if (this.onGameOver) {
          this.onGameOver(this.stats, 'CRACKED');
        }
      }
      return;
    }

    // 통계 거리 및 속도 계산 (100m마다 가속)
    const currentMeters = Math.floor(this.egg.y / GAME_CONSTANTS.PIXELS_PER_METER);
    this.stats.distanceMeters = Math.max(this.stats.distanceMeters, currentMeters);

    const speedStepCount = Math.floor(this.stats.distanceMeters / GAME_CONSTANTS.SPEED_INCREASE_INTERVAL_M);
    const targetSpeed = Math.min(
      GAME_CONSTANTS.MAX_SPEED,
      GAME_CONSTANTS.INITIAL_SPEED + speedStepCount * GAME_CONSTANTS.SPEED_INCREASE_STEP
    );
    this.stats.speed = targetSpeed;

    // 상태별 이동
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

    // 카메라 추적
    this.updateCamera(dt);

    // 맵 무한 생성 및 지나간 세그먼트 청소
    this.ensureMapSegments();
  }

  // 1. 구르는 상태 (ROLLING) - 회전 방향 물리 정확성 완벽 보장!
  private updateRolling(dt: number): void {
    const currentSeg = this.segments[this.egg.currentSegmentIndex];
    if (!currentSeg) return;

    const dirSign = this.egg.direction === 'RIGHT_DOWN' ? 1 : -1;
    const moveDist = this.stats.speed * dt;
    const dx = dirSign * moveDist * GAME_CONSTANTS.SLOPE_COS;
    const dy = moveDist * GAME_CONSTANTS.SLOPE_SIN;

    this.egg.x += dx;
    this.egg.y += dy;

    // [핵심] 회전 방향:
    // 우하향일 때는 시계방향(+), 좌하향일 때는 반시계방향(-)으로 완벽 회전!
    const rollAngle = (moveDist / GAME_CONSTANTS.EGG_RADIUS_X);
    if (this.egg.direction === 'RIGHT_DOWN') {
      this.egg.rotation += rollAngle;
    } else {
      this.egg.rotation -= rollAngle;
    }

    this.egg.expression = 'NORMAL';

    // 간헐적 모래/바람 파티클
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

    // 아이템 획득 검사
    if (currentSeg.item && !currentSeg.item.collected) {
      const distToItem = Math.hypot(this.egg.x - currentSeg.item.x, this.egg.y - currentSeg.item.y);
      if (distToItem < 30) {
        currentSeg.item.collected = true;
        this.egg.hp = Math.min(this.egg.maxHp, this.egg.hp + GAME_CONSTANTS.BANDAGE_HEAL_HP);
        this.stats.itemsCollected++;
        sound.playHeal();
        this.spawnTextParticle(this.egg.x, this.egg.y - 25, `+${GAME_CONSTANTS.BANDAGE_HEAL_HP} HP`, '#10b981');
      }
    }

    // 세그먼트 끝 도달 판정
    const pastEndY = this.egg.y >= currentSeg.endY;
    if (pastEndY) {
      if (currentSeg.type === 'GAP') {
        // 갭인데 점프를 안 뜀 -> 추락 시퀀스 시작!
        this.startFallSequence(dirSign * this.stats.speed * 0.6);
        return;
      } else if (currentSeg.type === 'TURN') {
        // 코너인데 방향 전환을 안 누르고 지나침 -> 추락 시퀀스 시작!
        this.startFallSequence(dirSign * this.stats.speed);
        return;
      } else {
        // 다음 세그먼트로 이동
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
    const arcOffset = Math.sin(p * Math.PI) * this.egg.jumpPeakHeight;
    
    // 점프 중에는 공중제비 회전
    if (this.egg.direction === 'RIGHT_DOWN') {
      this.egg.rotation += dt * 10;
    } else {
      this.egg.rotation -= dt * 10;
    }

    // 점프 완료 착지 판정
    if (this.egg.jumpProgress >= 1) {
      this.egg.state = 'ROLLING';
      this.handleJumpLanding();
    }
  }

  // 3. 방향 전환 낙하 상태 (DROPPING_TURN)
  private updateDroppingTurn(dt: number): void {
    const dirSign = this.egg.direction === 'RIGHT_DOWN' ? 1 : -1;
    this.egg.vy += 780 * dt;
    this.egg.y += this.egg.vy * dt;
    this.egg.x += dirSign * 80 * dt;

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

  // 점프 착지 처리
  private handleJumpLanding(): void {
    const currentSeg = this.segments[this.egg.currentSegmentIndex];
    if (!currentSeg) return;

    if (this.isCurrentJumpMisjump) {
      const damage = GAME_CONSTANTS.MISJUMP_DAMAGE;
      this.applyDamage(damage, 'MISJUMP!');
    } else {
      const heightDiff = Math.abs(this.egg.y - this.jumpOptimalHeight);
      const damage = Math.max(0, Math.floor(heightDiff * GAME_CONSTANTS.DAMAGE_PER_HEIGHT_PIXEL));

      if (damage <= 2) {
        sound.playPerfect();
        this.stats.perfectLandings++;
        this.spawnTextParticle(this.egg.x, this.egg.y - 25, 'PERFECT!', '#10b981');
      } else {
        this.applyDamage(damage, `-${damage} HP`);
      }
    }
  }

  // 방향 전환 드롭 착지 처리
  private handleDropLanding(dropHeight: number): void {
    const damage = Math.max(0, Math.floor(dropHeight * GAME_CONSTANTS.DAMAGE_PER_HEIGHT_PIXEL * 0.7));

    if (damage <= 2) {
      sound.playPerfect();
      this.stats.perfectLandings++;
      this.spawnTextParticle(this.egg.x, this.egg.y - 25, 'CLEAN TURN!', '#10b981');
    } else {
      this.applyDamage(damage, `-${damage} HP`);
    }
  }

  // 대미지 적용 및 파손 체크
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

    // 내구도 0 도달 시 -> 바닥 깨짐(Fried Splat) 연출 시퀀스 발동! (요구사항 8)
    if (this.egg.hp <= 0) {
      this.startCrackedSequence();
    }
  }

  // 추락 시퀀스 시작 (요구사항 7: 공중 멈칫 당황 연출 -> 하강 -> 모달)
  private startFallSequence(vx: number): void {
    this.egg.state = 'SURPRISED_FALL';
    this.egg.expression = 'SURPRISED';
    this.egg.vx = vx;
    this.egg.vy = -30; // 살짝 띠용 솟구침
    this.egg.deathTimer = 0;
    sound.playSurpriseBoing();
  }

  // 계란 파괴 시퀀스 시작 (요구사항 8: 바닥에 흰자/노른자 퍼지고 껍질 흩뿌려짐)
  private startCrackedSequence(): void {
    this.egg.state = 'DEAD_CRACKED';
    this.egg.deathTimer = 0;
    sound.playBreakSplat();

    // 1. 슬로프 바닥에 계란 프라이 스플랫 생성
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

    // 2. 비산 파편 파티클
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
      if (p.type === 'SHELL' || p.type === 'YOLK') {
        p.vy += 480 * dt;
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

  // ==========================================
  // 전체 화면 렌더링 (자연 테마 + 아스팔트 길)
  // ==========================================
  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // 1. 청명한 자연 배경 렌더링 (하늘, 구름, 산, 잔디)
    this.drawNatureBackground(ctx);

    // 카메라 변환
    ctx.translate(-this.cameraX, -this.cameraY);

    // 2. 아스팔트 도로 렌더링 (양쪽 연석 + 차선)
    this.drawAsphaltRoads(ctx);

    // 3. 아이템 렌더링
    this.drawItems(ctx);

    // 4. 깨진 계란 자국(Splat) 렌더링
    for (const splat of this.splats) {
      this.eggRenderer.drawEggSplat(ctx, splat);
    }

    // 5. 달걀 그리기 (사망 폭발 후에는 숨김)
    if (this.egg.state !== 'DEAD_CRACKED') {
      this.eggRenderer.drawEgg(ctx, this.egg);
    }

    // 6. 파티클 그리기
    this.drawParticles(ctx);

    ctx.restore();
  }

  // [요구사항 6] 풍성하고 청명한 자연(Nature) 패럴랙스 배경
  private drawNatureBackground(ctx: CanvasRenderingContext2D): void {
    // A. 푸른 하늘 그라데이션
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.screenHeight);
    skyGrad.addColorStop(0, GAME_CONSTANTS.COLORS.SKY_TOP);
    skyGrad.addColorStop(0.65, GAME_CONSTANTS.COLORS.SKY_BOTTOM);
    skyGrad.addColorStop(1, '#ecfdf5');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);

    // B. 패럴랙스 뭉게구름 (느린 스크롤)
    const cloudOffset = -(this.cameraX * 0.05);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    this.drawCloud(ctx, (cloudOffset + 100) % (this.screenWidth + 200) - 100, 80, 55);
    this.drawCloud(ctx, (cloudOffset + 380) % (this.screenWidth + 200) - 100, 140, 42);
    this.drawCloud(ctx, (cloudOffset + 650) % (this.screenWidth + 200) - 100, 95, 65);

    // C. 원경 푸른 산봉우리 (Far Mountains)
    ctx.fillStyle = GAME_CONSTANTS.COLORS.MOUNTAIN_FAR;
    ctx.beginPath();
    const mountainOffsetFar = -(this.cameraX * 0.12) % 320;
    ctx.moveTo(0, this.screenHeight);
    for (let x = mountainOffsetFar - 320; x < this.screenWidth + 320; x += 320) {
      ctx.lineTo(x, this.screenHeight - 210);
      ctx.lineTo(x + 160, this.screenHeight - 340);
      ctx.lineTo(x + 320, this.screenHeight - 210);
    }
    ctx.lineTo(this.screenWidth, this.screenHeight);
    ctx.closePath();
    ctx.fill();

    // D. 중경 초록 언덕 능선 (Mid Hills)
    ctx.fillStyle = GAME_CONSTANTS.COLORS.MOUNTAIN_MID;
    ctx.beginPath();
    const mountainOffsetMid = -(this.cameraX * 0.22) % 240;
    ctx.moveTo(0, this.screenHeight);
    for (let x = mountainOffsetMid - 240; x < this.screenWidth + 240; x += 240) {
      ctx.quadraticCurveTo(x + 120, this.screenHeight - 220, x + 240, this.screenHeight - 140);
    }
    ctx.lineTo(this.screenWidth, this.screenHeight);
    ctx.closePath();
    ctx.fill();

    // E. 근경 싱그러운 잔디밭 (Foreground Grass)
    ctx.fillStyle = GAME_CONSTANTS.COLORS.GRASS_BASE;
    ctx.fillRect(0, this.screenHeight - 120, this.screenWidth, 120);

    // 잔디밭 장식 풀잎 디테일
    ctx.fillStyle = GAME_CONSTANTS.COLORS.GRASS_DARK;
    const grassOffset = -(this.cameraX * 0.4) % 60;
    for (let gx = grassOffset - 60; gx < this.screenWidth + 60; gx += 60) {
      ctx.beginPath();
      ctx.arc(gx + 20, this.screenHeight - 110, 14, 0, Math.PI, true);
      ctx.arc(gx + 40, this.screenHeight - 110, 18, 0, Math.PI, true);
      ctx.fill();
    }
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

  // [요구사항 5] 진짜 아스팔트 길(Asphalt Road) 및 연석 렌더링
  private drawAsphaltRoads(ctx: CanvasRenderingContext2D): void {
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';

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

      if (seg.type === 'TURN') {
        // 코너 회전 기둥 마커 (레이싱 서킷 턴 인디케이터)
        ctx.beginPath();
        ctx.arc(seg.startX, seg.startY, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // 턴 화살표
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('↷', seg.startX, seg.startY);
        continue;
      }

      // 1. 도로 하단 3D 콘크리트 그림자
      ctx.beginPath();
      ctx.moveTo(seg.startX, seg.startY + 8);
      ctx.lineTo(seg.endX, seg.endY + 8);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = GAME_CONSTANTS.ROAD_WIDTH + 6;
      ctx.stroke();

      // 2. 도로 양옆 레이싱 연석(Curb - 빨강/흰색 체크무늬)
      ctx.beginPath();
      ctx.moveTo(seg.startX, seg.startY);
      ctx.lineTo(seg.endX, seg.endY);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = GAME_CONSTANTS.ROAD_WIDTH;
      ctx.stroke();

      // 3. 다크 아스팔트 메인 노면
      ctx.beginPath();
      ctx.moveTo(seg.startX, seg.startY);
      ctx.lineTo(seg.endX, seg.endY);
      ctx.strokeStyle = GAME_CONSTANTS.COLORS.ROAD_SURFACE;
      ctx.lineWidth = GAME_CONSTANTS.ROAD_WIDTH - (GAME_CONSTANTS.CURB_WIDTH * 2);
      ctx.stroke();

      // 4. 중앙 노란색 차선 (Yellow Dashed Centerline)
      ctx.save();
      ctx.setLineDash([12, 10]);
      ctx.beginPath();
      ctx.moveTo(seg.startX, seg.startY);
      ctx.lineTo(seg.endX, seg.endY);
      ctx.strokeStyle = GAME_CONSTANTS.COLORS.ROAD_LINE;
      ctx.lineWidth = 3.0;
      ctx.stroke();
      ctx.restore();

      // 5. 끊어진 길(GAP) 끝자락 경고 마커
      if (seg.type === 'GAP') {
        ctx.save();
        ctx.beginPath();
        ctx.arc(seg.endX, seg.endY, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#f97316';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'black 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', seg.endX, seg.endY);
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
        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = p.color;
        ctx.textAlign = 'center';
        ctx.fillText(p.text || '', p.x, p.y);
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
