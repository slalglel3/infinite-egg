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

  // 점프 판정용
  private isCurrentJumpMisjump: boolean = false;
  private jumpOptimalHeight: number = 0;

  // 콜백 (연출 완료 후 모달 띄우기용)
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

  // 게임 재시작 및 완전 초기화
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
    this.egg.jumpArcOffset = 0;

    sound.playJump();

    if (!currentSeg || currentSeg.type !== 'GAP') {
      this.isCurrentJumpMisjump = true;
      this.jumpOptimalHeight = this.egg.y;
    } else {
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
      // 코너가 없는 곳에서 방향 전환을 누른 경우 -> 추락 연출 시작!
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

    // 통계 거리 및 속도 계산
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

    // 맵 무한 생성
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
    this.egg.jumpArcOffset = 0; // 구를 때는 지면 착지

    // 물리적 회전 방향
    const rollAngle = (moveDist / GAME_CONSTANTS.EGG_RADIUS_X);
    if (this.egg.direction === 'RIGHT_DOWN') {
      this.egg.rotation += rollAngle;
    } else {
      this.egg.rotation -= rollAngle;
    }

    this.egg.expression = 'NORMAL';

    // 먼지 파티클
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

    // 아이템 획득
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
        // 갭인데 점프를 전혀 안 뛰고 끝까지 굴러감 -> 절벽 추락사!
        this.startFallSequence(dirSign * this.stats.speed * 0.6);
        return;
      } else if (currentSeg.type === 'TURN') {
        // 코너인데 방향 전환을 안 누르고 지나침 -> 추락사!
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

  // 2. 점프 상태 (JUMPING) - 시각적 솟구침 및 세그먼트 전진
  private updateJumping(dt: number): void {
    const dirSign = this.egg.direction === 'RIGHT_DOWN' ? 1 : -1;
    this.egg.jumpProgress += dt / GAME_CONSTANTS.JUMP_DURATION_SEC;

    // 수평/사선 전진 이동
    const forwardStep = (GAME_CONSTANTS.JUMP_DISTANCE_FORWARD * dt) / GAME_CONSTANTS.JUMP_DURATION_SEC;
    this.egg.x += dirSign * forwardStep * GAME_CONSTANTS.SLOPE_COS;
    this.egg.y += forwardStep * GAME_CONSTANTS.SLOPE_SIN;

    // [핵심 해결 1] 공중으로 시원하게 솟구치는 포물선 오프셋 계산!
    const p = Math.min(1, this.egg.jumpProgress);
    this.egg.jumpArcOffset = Math.sin(p * Math.PI) * this.egg.jumpPeakHeight;
    
    // 점프 중 공중제비 회전
    if (this.egg.direction === 'RIGHT_DOWN') {
      this.egg.rotation += dt * 10;
    } else {
      this.egg.rotation -= dt * 10;
    }

    // 점프 완료 시 착지 판정
    if (this.egg.jumpProgress >= 1) {
      this.egg.jumpArcOffset = 0;
      this.handleJumpLanding();
    }
  }

  // 3. 점프 착지 판정 및 세그먼트 자동 갱신 (핵심 해결 3)
  private handleJumpLanding(): void {
    // 착지한 현재 (x, y) 좌표에 위치한 실제 도로 세그먼트를 탐색!
    let landedIndex = -1;
    for (let i = this.egg.currentSegmentIndex; i < Math.min(this.segments.length, this.egg.currentSegmentIndex + 6); i++) {
      const seg = this.segments[i];
      if (seg.type === 'TURN') continue;

      const minX = Math.min(seg.startX, seg.endX) - 30;
      const maxX = Math.max(seg.startX, seg.endX) + 30;
      const minY = Math.min(seg.startY, seg.endY) - 20;
      const maxY = Math.max(seg.startY, seg.endY) + 35;

      if (this.egg.x >= minX && this.egg.x <= maxX && this.egg.y >= minY && this.egg.y <= maxY) {
        landedIndex = i;
        break;
      }
    }

    if (landedIndex !== -1) {
      // [성공 착지] 실제 도로 세그먼트 위에 안전하게 착지!
      const landedSeg = this.segments[landedIndex];
      this.egg.currentSegmentIndex = landedIndex;
      this.egg.direction = landedSeg.direction;
      this.egg.state = 'ROLLING';

      if (this.isCurrentJumpMisjump) {
        // 일반 도로에서 불필요하게 헛점프를 뛴 경우
        const damage = GAME_CONSTANTS.MISJUMP_DAMAGE;
        this.applyDamage(damage, 'MISJUMP!');
      } else {
        // 끊어진 길(GAP)을 뛰어넘어 아랫길에 착지한 경우!
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
    } else {
      // 도로를 벗어나 갭의 허공이나 절벽 밖으로 떨어짐 -> 추락!
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

    // 내구도 0 도달 시 바닥 깨짐 연출 발동
    if (this.egg.hp <= 0) {
      this.startCrackedSequence();
    }
  }

  // 추락 시퀀스 시작
  private startFallSequence(vx: number): void {
    this.egg.state = 'SURPRISED_FALL';
    this.egg.expression = 'SURPRISED';
    this.egg.vx = vx;
    this.egg.vy = -35;
    this.egg.jumpArcOffset = 0;
    this.egg.deathTimer = 0;
    sound.playSurpriseBoing();
  }

  // 계란 파괴 시퀀스 시작
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
  // 전체 화면 렌더링
  // ==========================================
  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    this.drawNatureBackground(ctx);

    ctx.translate(-this.cameraX, -this.cameraY);

    this.drawAsphaltRoads(ctx);

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

  // 자연 패럴랙스 배경
  private drawNatureBackground(ctx: CanvasRenderingContext2D): void {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.screenHeight);
    skyGrad.addColorStop(0, GAME_CONSTANTS.COLORS.SKY_TOP);
    skyGrad.addColorStop(0.65, GAME_CONSTANTS.COLORS.SKY_BOTTOM);
    skyGrad.addColorStop(1, '#ecfdf5');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);

    const cloudOffset = -(this.cameraX * 0.05);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    this.drawCloud(ctx, (cloudOffset + 100) % (this.screenWidth + 200) - 100, 80, 55);
    this.drawCloud(ctx, (cloudOffset + 380) % (this.screenWidth + 200) - 100, 140, 42);
    this.drawCloud(ctx, (cloudOffset + 650) % (this.screenWidth + 200) - 100, 95, 65);

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

    ctx.fillStyle = GAME_CONSTANTS.COLORS.GRASS_BASE;
    ctx.fillRect(0, this.screenHeight - 120, this.screenWidth, 120);

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

  // 아스팔트 도로 렌더링
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
        ctx.beginPath();
        ctx.arc(seg.startX, seg.startY, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('↷', seg.startX, seg.startY);
        continue;
      }

      // 도로 하단 3D 그림자
      ctx.beginPath();
      ctx.moveTo(seg.startX, seg.startY + 8);
      ctx.lineTo(seg.endX, seg.endY + 8);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = GAME_CONSTANTS.ROAD_WIDTH + 6;
      ctx.stroke();

      // 도로 양옆 레이싱 연석
      ctx.beginPath();
      ctx.moveTo(seg.startX, seg.startY);
      ctx.lineTo(seg.endX, seg.endY);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = GAME_CONSTANTS.ROAD_WIDTH;
      ctx.stroke();

      // 다크 아스팔트 노면
      ctx.beginPath();
      ctx.moveTo(seg.startX, seg.startY);
      ctx.lineTo(seg.endX, seg.endY);
      ctx.strokeStyle = GAME_CONSTANTS.COLORS.ROAD_SURFACE;
      ctx.lineWidth = GAME_CONSTANTS.ROAD_WIDTH - (GAME_CONSTANTS.CURB_WIDTH * 2);
      ctx.stroke();

      // 중앙 노란색 점선
      ctx.save();
      ctx.setLineDash([12, 10]);
      ctx.beginPath();
      ctx.moveTo(seg.startX, seg.startY);
      ctx.lineTo(seg.endX, seg.endY);
      ctx.strokeStyle = GAME_CONSTANTS.COLORS.ROAD_LINE;
      ctx.lineWidth = 3.0;
      ctx.stroke();
      ctx.restore();

      // 끊어진 길(GAP) 끝자락 경고 마커
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
