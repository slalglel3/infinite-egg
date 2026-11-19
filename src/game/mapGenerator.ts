import { ObstacleKind, RoadObstacle, SlopeSegment, SlopeDirection } from '../types/game';
import { GAME_CONSTANTS } from './constants';

export class MapGenerator {
  private currentId: number = 0;
  private currentX: number = 0;
  private currentY: number = 0;
  private currentDirection: SlopeDirection = 'RIGHT_DOWN';
  private straightCountInCurrentDir: number = 0;
  private lastItemMeter: number = 0;
  public bandageMultiplier: number = 1.0;

  constructor() {
    this.reset();
  }

  public reset(startX: number = 0, startY: number = 0): void {
    this.currentId = 0;
    this.currentX = startX;
    this.currentY = startY;
    this.currentDirection = Math.random() < 0.5 ? 'RIGHT_DOWN' : 'LEFT_DOWN';
    this.straightCountInCurrentDir = 0;
    this.lastItemMeter = 0;
  }

  // 매 판 100% 새로운 무작위 절차적 맵 생성
  public generateInitialMap(): SlopeSegment[] {
    const segments: SlopeSegment[] = [];

    // 1. 첫 출발: 계란이 출발 다리 정중앙(50% 지점 = (0, 0))에 넉넉히 자리 잡도록
    //    뒤쪽(-2.2스텝 = 154px)부터 앞쪽(+2.2스텝 = 154px)까지 총 4.4스텝(308px) 직선 출발대 생성
    const backLen = 2.2 * GAME_CONSTANTS.STEP_LENGTH;
    const dirSign = this.currentDirection === 'RIGHT_DOWN' ? 1 : -1;
    this.currentX -= dirSign * backLen * GAME_CONSTANTS.SLOPE_COS;
    this.currentY -= backLen * GAME_CONSTANTS.SLOPE_SIN;
    segments.push(this.createStraightStep(4.4, false, false, false));

    // 2. 이후 절차적 다이나믹 패턴을 25개 연속 생성 (실제 월드 Y 진행도 기준)
    for (let i = 0; i < 25; i++) {
      this.generateDynamicPattern(segments, this.currentY / GAME_CONSTANTS.PIXELS_PER_METER);
    }

    return segments;
  }

  // 다이나믹 패턴 생성기 (피드백: 방향 전환/점프 구간을 고려한 장애물 배치 및 2.5D 난이도 수렴)
  public generateDynamicPattern(segments: SlopeSegment[], currentMeters: number): void {
    const isMid = currentMeters >= 300;
    const isHard = currentMeters >= 800;
    const isExtreme = currentMeters >= 1500;

    const rand = Math.random();

    // 1. [점프 코스] (50% 확률)
    if (rand < 0.50) {
      let jumpCount = 1;
      const multiJumpRand = Math.random();

      if (isExtreme) {
        if (multiJumpRand < 0.25) jumpCount = 3;
        else if (multiJumpRand < 0.70) jumpCount = 2;
      } else if (isHard) {
        if (multiJumpRand < 0.45) jumpCount = 2;
      } else if (isMid) {
        if (multiJumpRand < 0.30) jumpCount = 2;
      }

      // 방향 전환 직후 도주로 길이 확보 (코너 직후 곧바로 절벽에 떨어지지 않도록 최소 1.4스텝 이상 보장)
      let leadStraightSteps = 0;
      let gapRunSteps = 1.6;
      const jumpRand = Math.random();

      if (isExtreme) {
        if (jumpRand < 0.50) {
          leadStraightSteps = 0;
          gapRunSteps = 1.4;
        } else if (jumpRand < 0.85) {
          leadStraightSteps = 0;
          gapRunSteps = 1.65;
        } else {
          leadStraightSteps = 1.2;
          gapRunSteps = 1.4;
        }
      } else if (isHard) {
        if (jumpRand < 0.40) {
          leadStraightSteps = 0;
          gapRunSteps = 1.5;
        } else if (jumpRand < 0.75) {
          leadStraightSteps = 0;
          gapRunSteps = 1.7;
        } else {
          leadStraightSteps = 1.5;
          gapRunSteps = 1.4;
        }
      } else if (isMid) {
        if (jumpRand < 0.30) {
          leadStraightSteps = 0;
          gapRunSteps = 1.55;
        } else if (jumpRand < 0.70) {
          leadStraightSteps = 1.0;
          gapRunSteps = 1.3;
        } else {
          leadStraightSteps = 1.8;
          gapRunSteps = 1.3;
        }
      } else {
        if (jumpRand < 0.25) {
          leadStraightSteps = 0;
          gapRunSteps = 1.8;
        } else if (jumpRand < 0.65) {
          leadStraightSteps = 1.2;
          gapRunSteps = 1.4;
        } else {
          leadStraightSteps = 2.0;
          gapRunSteps = 1.5;
        }
      }

      // 1) 첫 점프 진입 직선로 (GAP 직전이므로 장애물 절대 미배치)
      if (leadStraightSteps > 0) {
        segments.push(
          this.createStraightStep(leadStraightSteps, this.shouldSpawnItem(currentMeters), false, false)
        );
      }
      // 1차 점프
      segments.push(this.createGapStep(currentMeters, gapRunSteps));

      // 2) 2번째 또는 3번째 연속 점프 (착지 직후 다음 도약까지 장애물 없이 깔끔한 활주로 유지)
      for (let j = 1; j < jumpCount; j++) {
        const midConnectSteps = isExtreme ? 1.8 : isHard ? 2.1 : 2.4;
        segments.push(
          this.createStraightStep(midConnectSteps, this.shouldSpawnItem(currentMeters), false, false)
        );
        segments.push(this.createGapStep(currentMeters, 1.3));
      }

      // 최종 착지 후 활주로 (충분히 긴 직선 4.5+ 스텝일 때만 회피 가능한 장애물 허용)
      let runwaySteps = isExtreme ? 2.2 : isHard ? 2.7 : isMid ? 3.2 : 4.5;
      const hasBandageOnRunway = leadStraightSteps === 0 ? this.shouldSpawnItem(currentMeters) : false;
      const allowObstacleOnRunway =
        !hasBandageOnRunway && runwaySteps >= 4.5 && currentMeters >= 20 && Math.random() < 0.35;
      segments.push(
        this.createStraightStep(runwaySteps, hasBandageOnRunway, false, allowObstacleOnRunway, 128, 166)
      );
      segments.push(this.createTurnSegment());
      return;
    }

    // 2. [중/장거리 직선 + 장애물/균열 구간] (32% 확률)
    if (rand < 0.82) {
      const hasItem = this.shouldSpawnItem(currentMeters);
      const shouldCrack = !hasItem && currentMeters >= 200 && Math.random() < 0.25;
      const spawnObstacle =
        !hasItem && !shouldCrack && (currentMeters >= 15 || Math.random() < 0.70) && Math.random() < 0.65;

      let runSteps: number;
      if (spawnObstacle) {
        // 코너 진입 후 충분한 인지(105px) + 장애물 점프(152px) 착지 후 코너 전 착지(166px) 수학적 보장 (최소 4.1스텝=287px)
        runSteps = isHard ? (Math.random() < 0.5 ? 4.1 : 4.5) : (Math.random() < 0.5 ? 4.3 : 4.8);
      } else if (shouldCrack) {
        // 금 간 다리를 152px 점프로 건너고 코너 전에 착지하도록 3.4~3.8스텝(238~266px) 확보
        runSteps = Math.random() < 0.5 ? 3.4 : 3.8;
      } else {
        runSteps = isHard ? (Math.random() < 0.5 ? 2.4 : 3.0) : (Math.random() < 0.5 ? 2.8 : 3.4);
      }

      segments.push(
        this.createStraightStep(runSteps, hasItem, shouldCrack, spawnObstacle, 105, 166)
      );
      segments.push(this.createTurnSegment());
      return;
    }

    // 3. [짧은 방향 전환 리듬 구간] (18% 확률) - 꺾임이 잦으므로 장애물/균열 배제 & 1.3배 도로 폭 기준 비겹침 유지
    const zigzagCount = isHard ? 4 : 3;
    const stepChoices = isHard ? [1.35, 1.55, 1.75, 2.0] : [1.45, 1.7, 1.95, 2.2];
    for (let z = 0; z < zigzagCount; z++) {
      const steps = stepChoices[Math.floor(Math.random() * stepChoices.length)];
      segments.push(this.createStraightStep(steps, false, false, false));
      segments.push(this.createTurnSegment());
    }
    // 지그재그 직후에는 숨 돌릴 수 있도록 2.2스텝 직선로 부여
    segments.push(this.createStraightStep(2.2, this.shouldSpawnItem(currentMeters), false, false));
  }

  // [피드백 6] 반창고 발생 빈도 증가 (60m마다 50% 확률, 이벤트 맵 배율 반영)
  private shouldSpawnItem(currentMeters: number): boolean {
    const chance = Math.min(0.95, GAME_CONSTANTS.BANDAGE_SPAWN_CHANCE * this.bandageMultiplier);
    if (
      currentMeters - this.lastItemMeter >= GAME_CONSTANTS.BANDAGE_MIN_INTERVAL_M &&
      Math.random() < chance
    ) {
      this.lastItemMeter = currentMeters;
      return true;
    }
    return false;
  }

  private buildSafeObstacle(
    startX: number,
    startY: number,
    dx: number,
    dy: number,
    length: number,
    minEntryPx: number,
    minExitPx: number
  ): RoadObstacle[] | undefined {
    if (length < minEntryPx + minExitPx + 12) {
      return undefined;
    }
    const obsDist = minEntryPx + Math.random() * (length - minEntryPx - minExitPx);
    const t = obsDist / length;
    const kinds: ObstacleKind[] = ['ROCK', 'HAY', 'VINE'];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const damage =
      kind === 'ROCK'
        ? GAME_CONSTANTS.OBSTACLE_DAMAGE_ROCK
        : kind === 'HAY'
          ? GAME_CONSTANTS.OBSTACLE_DAMAGE_HAY
          : GAME_CONSTANTS.OBSTACLE_DAMAGE_VINE;

    return [
      {
        kind,
        t,
        x: startX + dx * t,
        y: startY + dy * t,
        damage,
        hit: false,
      },
    ];
  }

  // 스텝 단위 도로 생성
  private createStraightStep(
    steps: number,
    hasItem: boolean,
    isCracked: boolean = false,
    hasObstacle: boolean = false,
    minEntryPx: number = 105,
    minExitPx: number = 166
  ): SlopeSegment {
    this.currentId++;
    const length = steps * GAME_CONSTANTS.STEP_LENGTH;
    const dirSign = this.currentDirection === 'RIGHT_DOWN' ? 1 : -1;

    const dx = dirSign * length * GAME_CONSTANTS.SLOPE_COS;
    const dy = length * GAME_CONSTANTS.SLOPE_SIN;

    const startX = this.currentX;
    const startY = this.currentY;
    const endX = startX + dx;
    const endY = startY + dy;

    this.currentX = endX;
    this.currentY = endY;
    this.straightCountInCurrentDir++;

    let item = undefined;
    if (hasItem && !isCracked && !hasObstacle) {
      item = {
        type: 'BANDAGE' as const,
        x: startX + dx * 0.5,
        y: startY + dy * 0.5 - 12,
        collected: false,
      };
    }

    const obstacles =
      hasObstacle && !isCracked && !hasItem
        ? this.buildSafeObstacle(startX, startY, dx, dy, length, minEntryPx, minExitPx)
        : undefined;

    return {
      id: this.currentId,
      type: 'STRAIGHT',
      direction: this.currentDirection,
      startX,
      startY,
      endX,
      endY,
      length,
      obstacles,
      item,
      isPassed: false,
      isCracked,
      isCollapsed: false,
    };
  }

  // 끊어진 길(GAP) 생성 (시작은 최대 점프거리의 2/3, 진행할수록 최대 점프거리에 수렴)
  private createGapStep(currentMeters: number, runSteps: number = 1.5): SlopeSegment {
    this.currentId++;
    const dirSign = this.currentDirection === 'RIGHT_DOWN' ? 1 : -1;
    const runLength = GAME_CONSTANTS.STEP_LENGTH * runSteps;

    const startX = this.currentX;
    const startY = this.currentY;
    const endX = startX + dirSign * runLength * GAME_CONSTANTS.SLOPE_COS;
    const endY = startY + runLength * GAME_CONSTANTS.SLOPE_SIN;

    const minGap = GAME_CONSTANTS.MIN_GAP_DISTANCE;
    const maxGap = GAME_CONSTANTS.MAX_GAP_CONVERGENCE_DISTANCE;
    const scaleM = GAME_CONSTANTS.GAP_CONVERGENCE_SCALE_M;
    const effectiveMeters = Math.max(currentMeters, this.currentY / GAME_CONSTANTS.PIXELS_PER_METER);
    const progress = 1 - Math.exp(-Math.max(0, effectiveMeters) / scaleM);
    const gapDistance = minGap + (maxGap - minGap) * progress;

    const gapDx = dirSign * gapDistance * GAME_CONSTANTS.SLOPE_COS;
    const gapDy = gapDistance * GAME_CONSTANTS.SLOPE_SIN;

    this.currentX = endX + gapDx;
    this.currentY = endY + gapDy;
    this.straightCountInCurrentDir++;

    return {
      id: this.currentId,
      type: 'GAP',
      direction: this.currentDirection,
      startX,
      startY,
      endX,
      endY,
      length: runLength,
      gapDistance,
      gapHeight: gapDy,
      isPassed: false,
    };
  }

  // 방향 전환(TURN) 생성
  private createTurnSegment(): SlopeSegment {
    this.currentId++;
    const oldDir = this.currentDirection;
    const newDir: SlopeDirection = oldDir === 'RIGHT_DOWN' ? 'LEFT_DOWN' : 'RIGHT_DOWN';

    const turnSegment: SlopeSegment = {
      id: this.currentId,
      type: 'TURN',
      direction: oldDir,
      startX: this.currentX,
      startY: this.currentY,
      endX: this.currentX,
      endY: this.currentY,
      length: 0,
      isPassed: false,
    };

    this.currentDirection = newDir;
    this.straightCountInCurrentDir = 0;
    return turnSegment;
  }
}
