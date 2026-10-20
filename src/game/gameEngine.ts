import { Egg, SlopeSegment, Particle, GameStats, SlopeDirection } from '../types/game';
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
      currentSegmentIndex: 0,
      jumpStartY: 0,
      jumpStartX: 0,
      jumpProgress: 0,
      jumpPeakHeight: GAME_CONSTANTS.JUMP_PEAK_PIXELS,
      dropStartY: 0,
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
      y: firstSeg.startY - GAME_CONSTANTS.EGG_RADIUS_Y + 5,
      vx: 0,
      vy: 0,
      rotation: 0,
      direction: firstSeg.direction,
      state: 'ROLLING',
      currentSegmentIndex: 0,
      jumpStartY: 0,
      jumpStartX: 0,
      jumpProgress: 0,
      jumpPeakHeight: GAME_CONSTANTS.JUMP_PEAK_PIXELS,
      dropStartY: 0,
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

    // 헛점프 여부 판정: 현재 세그먼트가 끊어진 길(GAP)이 아닌 일반 길이거나,
    // GAP의 끝자락이 아직 너무 멀리 남았을 때
    if (!currentSeg || currentSeg.type !== 'GAP') {
      this.isCurrentJumpMisjump = true;
      this.jumpOptimalHeight = this.egg.y;
    } else {
      // 갭 세그먼트인 경우
      // 이상적인 점프 지점은 세그먼트 끝점(endX, endY) 부근
      const distToEnd = Math.hypot(currentSeg.endX - this.egg.x, currentSeg.endY - this.egg.y);
      if (distToEnd > 130) {
        // 너무 일찍 점프한 경우 (낙하 높이차 발생 페널티)
        this.isCurrentJumpMisjump = false;
        this.jumpOptimalHeight = currentSeg.endY;
      } else {
        // 완벽에 가까운 점프 타이밍
        this.isCurrentJumpMisjump = false;
        this.jumpOptimalHeight = currentSeg.endY;
      }
    }
  }

  // 2. [방향 전환] 버튼
  public triggerTurn(): void {
    if (!this.isRunning || this.isGameOver) return;
    if (this.egg.state !== 'ROLLING') return;

    const currentSeg = this.segments[this.egg.currentSegmentIndex];
    if (!currentSeg) return;

    // 현재 세그먼트 또는 바로 다음 세그먼트가 TURN인지 확인
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

      // 코너 끝점에 아주 가깝게 도달했을 때 누른 경우: 퍼펙트 턴! (높이차 0)
      if (distToTurn <= 35) {
        this.egg.direction = newDir;
        this.egg.currentSegmentIndex = turnSegIndex + 1;
        this.egg.x = turnSeg.startX;
        this.egg.y = turnSeg.startY - GAME_CONSTANTS.EGG_RADIUS_Y + 5;
        sound.playTurn();
        sound.playPerfect();
        this.stats.perfectLandings++;
        this.spawnTextParticle(this.egg.x, this.egg.y - 25, 'PERFECT TURN!', '#10b981');
        return;
      }

      // 코너에 도달하기 전에 너무 일찍 누른 경우 (기획 6-2):
      // 계란이 윗길에서 즉시 방향을 바꾸며 아랫길로 쿵 떨어짐 (수직 드롭)
      this.egg.direction = newDir;
      this.egg.state = 'DROPPING_TURN';
      this.egg.dropStartY = this.egg.y;
      this.egg.vy = 60; // 아래쪽으로 낙하 시작
      sound.playTurn();

      // 아랫길 세그먼트 찾기 (코너 다음 세그먼트)
      this.egg.currentSegmentIndex = turnSegIndex + 1;
    } else {
      // 코너가 전혀 없는 곳에서 엉뚱하게 방향 전환을 누른 경우:
      // 슬로프를 이탈하여 화면 밖으로 추락!
      this.egg.direction = newDir;
      this.egg.state = 'DEAD_FALLING';
      this.egg.vx = (newDir === 'RIGHT_DOWN' ? 1 : -1) * 120;
      this.egg.vy = 80;
      sound.playFall();
      this.triggerGameOver('FALL');
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

    // 게임 오버 상태일 때 추락 또는 파편 연출만 진행
    if (this.isGameOver) {
      if (this.egg.state === 'DEAD_FALLING') {
        this.egg.vy += 650 * dt;
        this.egg.x += this.egg.vx * dt;
        this.egg.y += this.egg.vy * dt;
      }
      this.updateCamera(dt);
      return;
    }

    // 속도 계산 (100m마다 가속, 2000m에서 최고 속도 도달)
    const currentMeters = Math.floor(this.egg.y / GAME_CONSTANTS.PIXELS_PER_METER);
    this.stats.distanceMeters = Math.max(this.stats.distanceMeters, currentMeters);

    const speedStepCount = Math.floor(this.stats.distanceMeters / GAME_CONSTANTS.SPEED_INCREASE_INTERVAL_M);
    const targetSpeed = Math.min(
      GAME_CONSTANTS.MAX_SPEED,
      GAME_CONSTANTS.INITIAL_SPEED + speedStepCount * GAME_CONSTANTS.SPEED_INCREASE_STEP
    );
    this.stats.speed = targetSpeed;

    // 상태별 이동 로직
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
      case 'DEAD_FALLING':
        this.egg.vy += 650 * dt;
        this.egg.y += this.egg.vy * dt;
        this.egg.x += this.egg.vx * dt;
        break;
    }

    // 카메라 추적
    this.updateCamera(dt);

    // 맵 무한 생성 및 지나간 세그먼트 청소
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

    // 데굴데굴 회전각 갱신
    this.egg.rotation += (dirSign * moveDist) / GAME_CONSTANTS.EGG_RADIUS_X;

    // 간헐적 모래/바람 파티클
    if (Math.random() < 0.25) {
      this.particles.push({
        x: this.egg.x - dx * 0.8,
        y: this.egg.y + GAME_CONSTANTS.EGG_RADIUS_Y - 4,
        vx: -dx * 0.3 + (Math.random() - 0.5) * 20,
        vy: -15 - Math.random() * 20,
        radius: 2 + Math.random() * 2,
        color: 'rgba(56, 189, 248, 0.5)',
        alpha: 0.8,
        life: 0,
        maxLife: 0.35,
        type: 'DUST',
      });
    }

    // 아이템 획득 검사
    if (currentSeg.item && !currentSeg.item.collected) {
      const distToItem = Math.hypot(this.egg.x - currentSeg.item.x, this.egg.y - currentSeg.item.y);
      if (distToItem < 28) {
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
        // 갭인데 점프를 뛰지 않고 그냥 지나침 ➔ 절벽으로 추락사!
        this.egg.state = 'DEAD_FALLING';
        this.egg.vx = dirSign * this.stats.speed * 0.7;
        this.egg.vy = 80;
        sound.playFall();
        this.triggerGameOver('FALL');
        return;
      } else if (currentSeg.type === 'TURN') {
        // 코너인데 방향 전환을 안 누르고 지나침 ➔ 허공 추락사!
        this.egg.state = 'DEAD_FALLING';
        this.egg.vx = dirSign * this.stats.speed;
        this.egg.vy = 80;
        sound.playFall();
        this.triggerGameOver('FALL');
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

    // 수평/사선 전진 이동
    const forwardStep = (GAME_CONSTANTS.JUMP_DISTANCE_FORWARD * dt) / GAME_CONSTANTS.JUMP_DURATION_SEC;
    this.egg.x += dirSign * forwardStep * GAME_CONSTANTS.SLOPE_COS;
    this.egg.y += forwardStep * GAME_CONSTANTS.SLOPE_SIN;

    // 포물선 정점 계산
    const p = Math.min(1, this.egg.jumpProgress);
    const arcOffset = Math.sin(p * Math.PI) * this.egg.jumpPeakHeight;
    const visualY = this.egg.y - arcOffset;

    // 회전은 조금 더 빠르게 공중제비
    this.egg.rotation += dirSign * dt * 9;

    // 점프 완료 시 착지 판정
    if (this.egg.jumpProgress >= 1) {
      this.egg.state = 'ROLLING';
      this.handleJumpLanding();
    }
  }

  // 3. 방향 전환 낙하 상태 (DROPPING_TURN)
  private updateDroppingTurn(dt: number): void {
    const dirSign = this.egg.direction === 'RIGHT_DOWN' ? 1 : -1;
    this.egg.vy += 750 * dt; // 중력 가속
    this.egg.y += this.egg.vy * dt;
    this.egg.x += dirSign * 80 * dt;

    // 목표 아랫길(현재 세그먼트)의 표면 좌표에 닿았는지 확인
    const targetSeg = this.segments[this.egg.currentSegmentIndex];
    if (targetSeg) {
      // 아랫길 표면의 예상 Y 좌표 계산
      const segT = (this.egg.x - targetSeg.startX) / (targetSeg.endX - targetSeg.startX);
      if (segT >= 0 && segT <= 1) {
        const expectedY = targetSeg.startY + segT * (targetSeg.endY - targetSeg.startY) - GAME_CONSTANTS.EGG_RADIUS_Y + 5;
        if (this.egg.y >= expectedY) {
          // 아랫길에 착지 성공!
          this.egg.y = expectedY;
          this.egg.state = 'ROLLING';
          const dropHeight = this.egg.y - this.egg.dropStartY;
          this.handleDropLanding(dropHeight);
          return;
        }
      }
    }

    // 만약 아랫길을 한참 지나쳐서도 못 닿았다면 추락
    if (this.egg.y - this.egg.dropStartY > 260) {
      this.egg.state = 'DEAD_FALLING';
      this.egg.vx = dirSign * 60;
      sound.playFall();
      this.triggerGameOver('FALL');
    }
  }

  // 점프 착지 처리
  private handleJumpLanding(): void {
    const currentSeg = this.segments[this.egg.currentSegmentIndex];
    if (!currentSeg) return;

    if (this.isCurrentJumpMisjump) {
      // 6-3. 일반 길에서 헛점프한 경우 페널티
      const damage = GAME_CONSTANTS.MISJUMP_DAMAGE;
      this.applyDamage(damage, 'MISJUMP!');
    } else {
      // 6-1. 갭 착지 높이차 판정
      // 이상적 착지 높이와 실제 착지 높이의 차이
      const heightDiff = Math.abs(this.egg.y - this.jumpOptimalHeight);
      const damage = Math.max(0, Math.floor(heightDiff * GAME_CONSTANTS.DAMAGE_PER_HEIGHT_PIXEL));

      if (damage <= 1) {
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
    // 높이차에 비례한 데미지
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

    // 찌그러짐 및 화면 흔들림
    this.egg.squishX = 1.35;
    this.egg.squishY = 0.72;
    this.screenShake = Math.min(12, 3 + damage * 0.4);

    sound.playImpact(damage);
    this.spawnTextParticle(this.egg.x, this.egg.y - 25, label, '#ef4444');

    // 껍질 점멸
    this.egg.flashDamage = true;
    setTimeout(() => {
      this.egg.flashDamage = false;
    }, 120);

    // 내구도 0 파괴 체크
    if (this.egg.hp <= 0) {
      this.egg.state = 'DEAD_CRACKED';
      sound.playBreak();
      const breakParticles = this.eggRenderer.createBreakExplosion(this.egg.x, this.egg.y);
      this.particles.push(...breakParticles);
      this.triggerGameOver('CRACKED');
    }
  }

  // 게임 오버 처리
  private triggerGameOver(reason: 'CRACKED' | 'FALL'): void {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.gameOverReason = reason;

    if (this.onGameOver) {
      this.onGameOver(this.stats, reason);
    }
  }

  // ==========================================
  // 카메라 및 맵 세그먼트 동적 유지
  // ==========================================
  private updateCamera(dt: number): void {
    // 계란이 화면의 중앙 상단(약 가로 50%, 세로 42%)에 위치하도록 부드럽게 추적
    const targetX = this.egg.x - this.screenWidth * 0.5;
    const targetY = this.egg.y - this.screenHeight * 0.42;

    this.cameraX += (targetX - this.cameraX) * dt * 9;
    this.cameraY += (targetY - this.cameraY) * dt * 9;
  }

  private ensureMapSegments(): void {
    // 계란 앞쪽으로 항상 15개 이상의 세그먼트가 있도록 유지
    while (this.segments.length - this.egg.currentSegmentIndex < 15) {
      const currentMeters = this.stats.distanceMeters;
      const nextSeg = this.mapGen.generateNextSegment(currentMeters);
      this.segments.push(nextSeg);
    }

    // 너무 뒤처진 오래된 세그먼트는 메모리 절약을 위해 정리 (현재 인덱스 앞 20개는 보존)
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
        p.vy += 450 * dt; // 중력
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

    // 화면 쉐이크 효과
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // 배경 그라데이션
    this.drawBackground(ctx);

    // 카메라 뷰 변환
    ctx.translate(-this.cameraX, -this.cameraY);

    // 1. 슬로프(미끄럼틀) 그리기
    this.drawSlopes(ctx);

    // 2. 아이템 그리기
    this.drawItems(ctx);

    // 3. 계란 그리기 (깨진 상태가 아니거나 파편 연출 중일 때)
    if (this.egg.state !== 'DEAD_CRACKED') {
      this.eggRenderer.drawEgg(ctx, this.egg);
    }

    // 4. 파티클 그리기
    this.drawParticles(ctx);

    ctx.restore();
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.screenHeight);
    bgGrad.addColorStop(0, GAME_CONSTANTS.COLORS.BG_TOP);
    bgGrad.addColorStop(1, GAME_CONSTANTS.COLORS.BG_BOTTOM);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);

    // 은은한 원경 텍스처 (구름 또는 격자)
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.4)';
    ctx.lineWidth = 1;
    const gridSpacing = 60;
    const offsetX = -(this.cameraX * 0.2) % gridSpacing;
    const offsetY = -(this.cameraY * 0.2) % gridSpacing;

    ctx.beginPath();
    for (let x = offsetX; x < this.screenWidth; x += gridSpacing) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.screenHeight);
    }
    for (let y = offsetY; y < this.screenHeight; y += gridSpacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.screenWidth, y);
    }
    ctx.stroke();
  }

  // 슬로프(미끄럼틀) 트랙 렌더링
  private drawSlopes(ctx: CanvasRenderingContext2D): void {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const seg of this.segments) {
      // 화면 밖 세그먼트는 컬링(Culling)하여 렌더링 성능 최적화
      const minX = Math.min(seg.startX, seg.endX) - 50;
      const maxX = Math.max(seg.startX, seg.endX) + 50;
      const minY = Math.min(seg.startY, seg.endY) - 50;
      const maxY = Math.max(seg.startY, seg.endY) + 50;

      if (
        maxX < this.cameraX ||
        minX > this.cameraX + this.screenWidth ||
        maxY < this.cameraY ||
        minY > this.cameraY + this.screenHeight
      ) {
        continue;
      }

      if (seg.type === 'TURN') {
        // 코너 회전점 마커 (화살표 또는 둥근 원)
        ctx.beginPath();
        ctx.arc(seg.startX, seg.startY, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#0284c7';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        continue;
      }

      // 1. 하단 입체 그림자
      ctx.beginPath();
      ctx.moveTo(seg.startX, seg.startY + 6);
      ctx.lineTo(seg.endX, seg.endY + 6);
      ctx.strokeStyle = 'rgba(2, 132, 199, 0.4)';
      ctx.lineWidth = GAME_CONSTANTS.SLOPE_WIDTH + 6;
      ctx.stroke();

      // 2. 미끄럼틀 메인 트랙 바디
      ctx.beginPath();
      ctx.moveTo(seg.startX, seg.startY);
      ctx.lineTo(seg.endX, seg.endY);
      ctx.strokeStyle = GAME_CONSTANTS.COLORS.SLOPE_MAIN;
      ctx.lineWidth = GAME_CONSTANTS.SLOPE_WIDTH;
      ctx.stroke();

      // 3. 중앙 밝은 하이라이트 레일
      ctx.beginPath();
      ctx.moveTo(seg.startX, seg.startY - 3);
      ctx.lineTo(seg.endX, seg.endY - 3);
      ctx.strokeStyle = GAME_CONSTANTS.COLORS.SLOPE_HIGHLIGHT;
      ctx.lineWidth = 5;
      ctx.stroke();

      // 4. 끊어진 길(GAP) 끝자락 경고 스트라이프 (아이들도 한눈에 점프 지점을 인지할 수 있게 연출)
      if (seg.type === 'GAP') {
        ctx.save();
        ctx.beginPath();
        ctx.arc(seg.endX, seg.endY, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 느낌표(!) 마커
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', seg.endX, seg.endY);
        ctx.restore();
      }
    }
  }

  // 아이템 렌더링 (반창고 등)
  private drawItems(ctx: CanvasRenderingContext2D): void {
    const time = performance.now() * 0.004;

    for (const seg of this.segments) {
      if (seg.item && !seg.item.collected) {
        const floatY = seg.item.y + Math.sin(time) * 4;

        ctx.save();
        ctx.translate(seg.item.x, floatY);

        // 반창고 십자가 배경
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(-10, -10, 20, 20, 5);
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 초록색 십자가 마크
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
        // 계란 껍질 조각 (회전하는 삼각형)
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.radius);
        ctx.lineTo(p.radius * 0.9, p.radius * 0.8);
        ctx.lineTo(-p.radius * 0.8, p.radius * 0.6);
        ctx.closePath();
        ctx.fill();
      } else {
        // 일반 원형 파티클 (노른자, 먼지 등)
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }

      ctx.restore();
    }
  }
}
