import { SlopeSegment, SlopeDirection } from '../types/game';
import { GAME_CONSTANTS } from './constants';

export class MapGenerator {
  private currentId: number = 0;
  private currentX: number = 0;
  private currentY: number = 0;
  private currentDirection: SlopeDirection = 'RIGHT_DOWN';
  private straightCountInCurrentDir: number = 0;
  private lastItemMeter: number = 0;

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

    // 1. 첫 출발: 시원한 직선 출발대 (2스텝 = 140px)
    segments.push(this.createStraightStep(2, false));

    // 2. 이후 절차적 다이나믹 패턴을 25개 연속 생성
    for (let i = 0; i < 25; i++) {
      this.generateDynamicPattern(segments, i * 6);
    }

    return segments;
  }

  // 다이나믹 패턴 생성기 (피드백 1, 2, 6 완벽 반영)
  public generateDynamicPattern(segments: SlopeSegment[], currentMeters: number): void {
    const isMid = currentMeters >= 300;
    const isHard = currentMeters >= 800;
    const isExtreme = currentMeters >= 1500;

    const rand = Math.random();

    // [피드백 1] 점프 빈도를 50% 수준으로 대폭 상향!
    if (rand < 0.50) {
      // 1. [점프 코스]
      const leadSteps = Math.random() < 0.5 ? 3 : 2;
      segments.push(this.createStraightStep(leadSteps, this.shouldSpawnItem(currentMeters)));
      segments.push(this.createGapStep(currentMeters));

      // [피드백 2] 거리에 따른 착지 후 활주로 동적 조절!
      // 착지 지점(아랫길 1.8스텝 지점)을 최소 거리로 두고, 거리가 늘수록 착지 직후 칼턴 배치!
      let runwaySteps = 4; // 초반: 4스텝 (착지 후 약 2스텝 여유)
      if (isExtreme) {
        runwaySteps = 2;   // 1500m+: 착지하자마자 0.2스텝 만에 칼턴!
      } else if (isHard) {
        runwaySteps = 2.5; // 800m+: 착지 후 약 0.7스텝 만에 턴!
      } else if (isMid) {
        runwaySteps = 3;   // 300m+: 착지 후 약 1스텝 만에 턴!
      }

      segments.push(this.createStraightStep(runwaySteps, false));
      segments.push(this.createTurnSegment());
      return;
    }

    // 2. [롱/중거리 직선 질주] (35% 확률)
    if (rand < 0.85) {
      const runSteps = isHard ? (Math.random() < 0.5 ? 2 : 3) : (Math.random() < 0.5 ? 4 : 3);
      segments.push(this.createStraightStep(runSteps, this.shouldSpawnItem(currentMeters)));
      segments.push(this.createTurnSegment());
      return;
    }

    // 3. [1스텝 지그재그 특수 구간] (15% 확률로 가끔만 깜짝 스릴 등장)
    const zigzagCount = isHard ? 3 : 2;
    for (let z = 0; z < zigzagCount; z++) {
      segments.push(this.createStraightStep(1, false));
      segments.push(this.createTurnSegment());
    }
    // 지그재그 직후에는 숨 돌릴 수 있도록 2스텝 직선로 부여
    segments.push(this.createStraightStep(2, this.shouldSpawnItem(currentMeters)));
  }

  // [피드백 6] 반창고 발생 빈도 증가 (60m마다 50% 확률)
  private shouldSpawnItem(currentMeters: number): boolean {
    if (
      currentMeters - this.lastItemMeter >= GAME_CONSTANTS.BANDAGE_MIN_INTERVAL_M &&
      Math.random() < GAME_CONSTANTS.BANDAGE_SPAWN_CHANCE
    ) {
      this.lastItemMeter = currentMeters;
      return true;
    }
    return false;
  }

  // 스텝 단위 도로 생성
  private createStraightStep(steps: number, hasItem: boolean): SlopeSegment {
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
    if (hasItem) {
      item = {
        type: 'BANDAGE' as const,
        x: startX + dx * 0.5,
        y: startY + dy * 0.5 - 12,
        collected: false,
      };
    }

    return {
      id: this.currentId,
      type: 'STRAIGHT',
      direction: this.currentDirection,
      startX,
      startY,
      endX,
      endY,
      length,
      item,
      isPassed: false,
    };
  }

  // 끊어진 길(GAP) 생성
  private createGapStep(currentMeters: number): SlopeSegment {
    this.currentId++;
    const dirSign = this.currentDirection === 'RIGHT_DOWN' ? 1 : -1;
    const runLength = GAME_CONSTANTS.STEP_LENGTH * 1.5;

    const startX = this.currentX;
    const startY = this.currentY;
    const endX = startX + dirSign * runLength * GAME_CONSTANTS.SLOPE_COS;
    const endY = startY + runLength * GAME_CONSTANTS.SLOPE_SIN;

    const baseGap = 55;
    const extraGap = Math.min(35, (currentMeters / 1500) * 35);
    const gapDistance = baseGap + extraGap;

    const gapDx = dirSign * gapDistance * GAME_CONSTANTS.SLOPE_COS;
    const gapDy = gapDistance * GAME_CONSTANTS.SLOPE_SIN + 8;

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
