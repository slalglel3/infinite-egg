import { Egg, SlopeSegment, Particle, GameStats, SlopeDirection, EggSplat, EggSkin } from '../types/game';
import { GAME_CONSTANTS } from './constants';
import { MapGenerator } from './mapGenerator';
import { EggRenderer } from './eggRenderer';
import { sound } from '../audio/sound';
import { getEggSkinById } from '../data/eggSkins';

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
    this.cameraX = this.egg.x;
    this.cameraY = this.egg.y;
    this.isRunning = true;
    this.isGameOver = false;
    this.gameOverReason = null;
    this.screenShake = 0;
    this.ambientParticleTimer = 0;
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

      // 너무 일찍 누른 경우 (수직 낙하 드롭)
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

    // [피드백 9] 고도(m)에 따라 6단계로 극적으로 변화하는 다이나믹 바이옴 배경!
    this.drawDynamicBiomeBackground(ctx);

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

  // [피드백 5 완벽 구현] 6대 바이옴 연속 보간 배경 렌더링 (설산 -> 침엽수림 -> 초원 -> 지하동굴 -> 지각 -> 맨틀)
  private drawDynamicBiomeBackground(ctx: CanvasRenderingContext2D): void {
    const meters = this.stats.distanceMeters;

    // 바이옴 키프레임 (거리, 상단색, 중단색, 하단색)
    const BIOMES = [
      { m: 0, top: '#1e40af', mid: '#60a5fa', bot: '#e0f2fe' },     // 설산
      { m: 450, top: '#0284c7', mid: '#7dd3fc', bot: '#f0fdf4' },   // 고산림
      { m: 900, top: '#38bdf8', mid: '#bae6fd', bot: '#ecfdf5' },   // 초원/숲
      { m: 1400, top: '#0f172a', mid: '#1e1b4b', bot: '#09090b' },  // 지하 동굴
      { m: 1950, top: '#18181b', mid: '#450a0a', bot: '#7f1d1d' },  // 지각/화산암
      { m: 2500, top: '#450a0a', mid: '#991b1b', bot: '#facc15' },  // 지구 중심 맨틀
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

    // 1. 설산 지형 (0m ~ 500m)
    const snowAlpha = getZoneAlpha(150, 350);
    if (snowAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = snowAlpha;
      // 원경 만년설 봉우리
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      const snowFarOffset = -(this.cameraX * 0.12) % 340;
      ctx.moveTo(0, this.screenHeight);
      for (let x = snowFarOffset - 340; x < this.screenWidth + 340; x += 340) {
        ctx.lineTo(x, this.screenHeight - 180);
        ctx.lineTo(x + 170, this.screenHeight - 370);
        ctx.lineTo(x + 340, this.screenHeight - 180);
      }
      ctx.lineTo(this.screenWidth, this.screenHeight);
      ctx.fill();

      // 빙하 푸른빛 음영
      ctx.fillStyle = '#bfdbfe';
      ctx.beginPath();
      const snowMidOffset = -(this.cameraX * 0.22) % 260;
      ctx.moveTo(0, this.screenHeight);
      for (let x = snowMidOffset - 260; x < this.screenWidth + 260; x += 260) {
        ctx.lineTo(x, this.screenHeight - 140);
        ctx.lineTo(x + 130, this.screenHeight - 270);
        ctx.lineTo(x + 260, this.screenHeight - 140);
      }
      ctx.lineTo(this.screenWidth, this.screenHeight);
      ctx.fill();

      // [피드백 9] 살랑살랑 흩날리는 만년설 눈송이 효과
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      for (let i = 0; i < 25; i++) {
        const sx = ((i * 47) - (this.cameraX * 0.4) + Math.sin(meters * 0.05 + i) * 20) % this.screenWidth;
        const sy = ((i * 31) + (meters * 1.5)) % this.screenHeight;
        ctx.beginPath();
        ctx.arc((sx + this.screenWidth) % this.screenWidth, sy, 1.5 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // 2. 침엽수림 지형 (300m ~ 850m)
    const highlandAlpha = getZoneAlpha(500, 350);
    if (highlandAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = highlandAlpha;
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      const rockOffset = -(this.cameraX * 0.15) % 300;
      ctx.moveTo(0, this.screenHeight);
      for (let x = rockOffset - 300; x < this.screenWidth + 300; x += 300) {
        ctx.lineTo(x, this.screenHeight - 160);
        ctx.lineTo(x + 150, this.screenHeight - 300);
        ctx.lineTo(x + 300, this.screenHeight - 160);
      }
      ctx.lineTo(this.screenWidth, this.screenHeight);
      ctx.fill();

      // 다층 전나무 숲 실루엣
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      const treeFarOffset = -(this.cameraX * 0.18) % 240;
      ctx.moveTo(0, this.screenHeight);
      for (let x = treeFarOffset - 240; x < this.screenWidth + 240; x += 240) {
        ctx.quadraticCurveTo(x + 120, this.screenHeight - 220, x + 240, this.screenHeight - 150);
      }
      ctx.lineTo(this.screenWidth, this.screenHeight);
      ctx.fill();

      ctx.fillStyle = '#166534';
      ctx.beginPath();
      const treeOffset = -(this.cameraX * 0.25) % 200;
      ctx.moveTo(0, this.screenHeight);
      for (let x = treeOffset - 200; x < this.screenWidth + 200; x += 200) {
        ctx.quadraticCurveTo(x + 100, this.screenHeight - 190, x + 200, this.screenHeight - 120);
      }
      ctx.lineTo(this.screenWidth, this.screenHeight);
      ctx.fill();
      ctx.restore();
    }

    // 3. 푸른 초원 & 숲 지형 (700m ~ 1350m)
    const meadowAlpha = getZoneAlpha(950, 400);
    if (meadowAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = meadowAlpha;

      // [피드백 9] 따스한 햇살 갓레이 광선 레이어
      const sunGrad = ctx.createRadialGradient(this.screenWidth * 0.8, 40, 10, this.screenWidth * 0.8, 40, 260);
      sunGrad.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
      sunGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, this.screenWidth, this.screenHeight * 0.6);

      const cloudOffset = -(this.cameraX * 0.05);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      this.drawCloud(ctx, (cloudOffset + 100) % (this.screenWidth + 200) - 100, 80, 55);
      this.drawCloud(ctx, (cloudOffset + 420) % (this.screenWidth + 200) - 100, 130, 45);

      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      const hillOffset = -(this.cameraX * 0.18) % 260;
      ctx.moveTo(0, this.screenHeight);
      for (let x = hillOffset - 260; x < this.screenWidth + 260; x += 260) {
        ctx.quadraticCurveTo(x + 130, this.screenHeight - 220, x + 260, this.screenHeight - 140);
      }
      ctx.lineTo(this.screenWidth, this.screenHeight);
      ctx.fill();
      ctx.restore();
    }

    // 4. 지하 동굴 지형 (1200m ~ 1850m)
    const caveAlpha = getZoneAlpha(1500, 400);
    if (caveAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = caveAlpha;
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      const stalactiteOffset = -(this.cameraX * 0.15) % 180;
      ctx.moveTo(0, 0);
      for (let x = stalactiteOffset - 180; x < this.screenWidth + 180; x += 180) {
        ctx.lineTo(x + 60, 0);
        ctx.lineTo(x + 90, 120 + ((x % 3) * 30));
        ctx.lineTo(x + 120, 0);
      }
      ctx.lineTo(this.screenWidth, 0);
      ctx.fill();

      // [피드백 9] 은은하게 빛나는 신비로운 수정 기둥
      ctx.fillStyle = '#818cf8';
      ctx.shadowColor = '#6366f1';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      const crystalOffset = -(this.cameraX * 0.3) % 240;
      for (let x = crystalOffset - 240; x < this.screenWidth + 240; x += 240) {
        ctx.moveTo(x + 100, this.screenHeight);
        ctx.lineTo(x + 115, this.screenHeight - 160);
        ctx.lineTo(x + 130, this.screenHeight);
      }
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // 5. 지각 & 화산암 (1700m ~ 2400m)
    const crustAlpha = getZoneAlpha(2050, 450);
    if (crustAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = crustAlpha;
      ctx.fillStyle = '#27272a';
      ctx.beginPath();
      const magmaHillOffset = -(this.cameraX * 0.2) % 250;
      ctx.moveTo(0, this.screenHeight);
      for (let x = magmaHillOffset - 250; x < this.screenWidth + 250; x += 250) {
        ctx.lineTo(x, this.screenHeight - 100);
        ctx.lineTo(x + 125, this.screenHeight - 210);
        ctx.lineTo(x + 250, this.screenHeight - 100);
      }
      ctx.lineTo(this.screenWidth, this.screenHeight);
      ctx.fill();

      ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.fillRect(0, this.screenHeight - 150, this.screenWidth, 150);
      ctx.restore();
    }

    // 6. 맨틀 & 용암 코어 (2250m+)
    if (meters >= 2250) {
      const mantleAlpha = Math.min(1, (meters - 2250) / 300);
      ctx.save();
      ctx.globalAlpha = mantleAlpha;
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      const lavaOffset = -(this.cameraX * 0.3) % 180;
      ctx.moveTo(0, this.screenHeight);
      for (let x = lavaOffset - 180; x < this.screenWidth + 180; x += 180) {
        ctx.quadraticCurveTo(x + 90, this.screenHeight - 180, x + 180, this.screenHeight - 90);
      }
      ctx.lineTo(this.screenWidth, this.screenHeight);
      ctx.fill();
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

      // [피드백 1 반영] 방향 전환 코너 조인트 자연스러운 연결 (Smooth Corner Fillet Junction)
      if (seg.type === 'TURN') {
        const cx = seg.startX;
        const cy = seg.startY;
        const roadR = GAME_CONSTANTS.ROAD_WIDTH * 0.5;
        const curbW = GAME_CONSTANTS.CURB_WIDTH;

        // 1. 코너 하단 3D 그림자 원반
        ctx.beginPath();
        ctx.arc(cx, cy + 8, roadR + 3, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();

        // 2. 코너 외곽 레이싱 연석 원반
        ctx.beginPath();
        ctx.arc(cx, cy, roadR, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();

        // 3. 코너 내부 다크 아스팔트 노면 원반
        ctx.beginPath();
        ctx.arc(cx, cy, roadR - curbW, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();

        // 4. 중앙 유도 노란색 호
        ctx.beginPath();
        ctx.arc(cx, cy, (roadR - curbW) * 0.45, 0, Math.PI * 2);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        continue;
      }

      // [피드백 4 반영] 붕괴된 도로(isCollapsed)는 중앙이 무너져 내린 실제 점프 낭떠러지(GAP)로 렌더링!
      if (seg.isCollapsed) {
        const dx = seg.endX - seg.startX;
        const dy = seg.endY - seg.startY;

        // 1) 전반부 끊어진 진입 단면 (0% ~ 25%)
        const p1X = seg.startX + dx * 0.25;
        const p1Y = seg.startY + dy * 0.25;

        // 그림자
        ctx.beginPath();
        ctx.moveTo(seg.startX, seg.startY + 8);
        ctx.lineTo(p1X, p1Y + 8);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = GAME_CONSTANTS.ROAD_WIDTH + 6;
        ctx.stroke();

        // 연석
        ctx.beginPath();
        ctx.moveTo(seg.startX, seg.startY);
        ctx.lineTo(p1X, p1Y);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = GAME_CONSTANTS.ROAD_WIDTH;
        ctx.stroke();

        // 아스팔트
        ctx.beginPath();
        ctx.moveTo(seg.startX, seg.startY);
        ctx.lineTo(p1X, p1Y);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = GAME_CONSTANTS.ROAD_WIDTH - (GAME_CONSTANTS.CURB_WIDTH * 2);
        ctx.stroke();

        // 붕괴된 깨진 바위 톱니 단면 1
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(p1X, p1Y, 14, 0, Math.PI * 2);
        ctx.fill();

        // 2) 후반부 끊어진 착지 단면 (75% ~ 100%)
        const p2X = seg.startX + dx * 0.75;
        const p2Y = seg.startY + dy * 0.75;

        // 그림자
        ctx.beginPath();
        ctx.moveTo(p2X, p2Y + 8);
        ctx.lineTo(seg.endX, seg.endY + 8);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = GAME_CONSTANTS.ROAD_WIDTH + 6;
        ctx.stroke();

        // 연석
        ctx.beginPath();
        ctx.moveTo(p2X, p2Y);
        ctx.lineTo(seg.endX, seg.endY);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = GAME_CONSTANTS.ROAD_WIDTH;
        ctx.stroke();

        // 아스팔트
        ctx.beginPath();
        ctx.moveTo(p2X, p2Y);
        ctx.lineTo(seg.endX, seg.endY);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = GAME_CONSTANTS.ROAD_WIDTH - (GAME_CONSTANTS.CURB_WIDTH * 2);
        ctx.stroke();

        // 붕괴된 깨진 바위 톱니 단면 2
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(p2X, p2Y, 14, 0, Math.PI * 2);
        ctx.fill();

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
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = GAME_CONSTANTS.ROAD_WIDTH - (GAME_CONSTANTS.CURB_WIDTH * 2);
      ctx.stroke();

      // 중앙 노란색 점선
      ctx.save();
      ctx.setLineDash([12, 10]);
      ctx.beginPath();
      ctx.moveTo(seg.startX, seg.startY);
      ctx.lineTo(seg.endX, seg.endY);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3.0;
      ctx.stroke();
      ctx.restore();

      // [피드백 4 & 11 반영] 금 간 길 (Cracked Road) - 선명한 균열 및 위험 경고 비주얼
      if (seg.isCracked && !seg.isCollapsed) {
        ctx.save();
        const midX = (seg.startX + seg.endX) * 0.5;
        const midY = (seg.startY + seg.endY) * 0.5;

        // 1. 도로를 가로지르는 굵고 선명한 위험 크랙 라인 (검정 균열선)
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 4.0;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(midX - 22, midY - 14);
        ctx.lineTo(midX - 8, midY + 4);
        ctx.lineTo(midX + 6, midY - 6);
        ctx.lineTo(midX + 22, midY + 12);
        ctx.stroke();

        // 2. 균열 경계 하이라이트선 (암석 파편이 깨져 돋보이게)
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(midX - 22, midY - 12);
        ctx.lineTo(midX - 8, midY + 6);
        ctx.lineTo(midX + 6, midY - 4);
        ctx.lineTo(midX + 22, midY + 14);
        ctx.stroke();

        // 3. 보조 균열 가지선
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(midX - 8, midY + 4);
        ctx.lineTo(midX - 14, midY + 14);
        ctx.moveTo(midX + 6, midY - 6);
        ctx.lineTo(midX + 16, midY - 14);
        ctx.stroke();

        // 4. 위험 주의 경고 노란색 마름모 인디케이터
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(midX, midY, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // [피드백 8 반영] 끊어진 길(GAP) 끝자락의 인위적인 '!' 경고 마커 제거! 순수 낭떠러지 단면을 눈으로 보고 점프 도약!
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
