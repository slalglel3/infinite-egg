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
    // 시작 방향도 매번 50% 확률로 랜덤하게 출발 (우하향 or 좌하향)!
    this.currentDirection = Math.random() < 0.5 ? 'RIGHT_DOWN' : 'LEFT_DOWN';
    this.straightCountInCurrentDir = 0;
    this.lastItemMeter = 0;
  }

  // 매 판 100% 완전히 다른 랜덤 맵 생성 (요구사항 2 완벽 해결)
  public generateInitialMap(): SlopeSegment[] {
    const segments: SlopeSegment[] = [];

    // 1. 아주 짧은 안전 출발대 (1스텝 = 70px)
    segments.push(this.createStraightStep(1, false));

    // 2. 출발 직후부터 완전히 무작위 절차적 패턴을 30개 연속 생성!
    for (let i = 0; i < 30; i++) {
      this.generateDynamicPattern(segments, i * 4);
    }

    return segments;
  }

  // 무한의 계단 스타일 자체 랜덤 맵 생성 알고리즘
  public generateDynamicPattern(segments: SlopeSegment[], currentMeters: number): void {
    const isMid = currentMeters >= 200;
    const isHard = currentMeters >= 500;

    const rand = Math.random();

    // 1. [고난도] 2연속 갭 점프 (500m 이상에서 18% 확률)
    if (isHard && rand < 0.18) {
      segments.push(this.createStraightStep(1, false));
      segments.push(this.createGapStep(currentMeters));
      segments.push(this.createStraightStep(1, false));
      segments.push(this.createGapStep(currentMeters));
      segments.push(this.createTurnSegment());
      return;
    }

    // 2. [무한의 계단 엇박 지그재그] 1스텝 - 턴 - 1스텝 - 턴 (25% 확률)
    if (rand < 0.42) {
      const zigzagCount = isMid ? (Math.random() < 0.5 ? 2 : 3) : 2;
      for (let z = 0; z < zigzagCount; z++) {
        segments.push(this.createStraightStep(1, false));
        segments.push(this.createTurnSegment());
      }
      return;
    }

    // 3. [점프 후 바로 턴] 2~3스텝 ➔ 점프 ➔ 1스텝 착지 ➔ 즉시 턴! (28% 확률)
    if (rand < 0.70) {
      const leadSteps = Math.random() < 0.6 ? 2 : 3;
      segments.push(this.createStraightStep(leadSteps, this.shouldSpawnItem(currentMeters)));
      segments.push(this.createGapStep(currentMeters));
      segments.push(this.createStraightStep(1, false));
      segments.push(this.createTurnSegment());
      return;
    }

    // 4. [계단형 스텝] 2스텝 ➔ 턴 ➔ 2스텝 ➔ 턴 (18% 확률)
    if (rand < 0.88) {
      segments.push(this.createStraightStep(2, false));
      segments.push(this.createTurnSegment());
      segments.push(this.createStraightStep(2, this.shouldSpawnItem(currentMeters)));
      segments.push(this.createTurnSegment());
      return;
    }

    // 5. [롱 스트레이트 & 점프] 3~5스텝 시원한 질주 후 점프 (12% 확률)
    const runSteps = isHard ? 3 : (Math.random() < 0.5 ? 3 : 4);
    segments.push(this.createStraightStep(runSteps, this.shouldSpawnItem(currentMeters)));
    segments.push(this.createGapStep(currentMeters));
  }

  private shouldSpawnItem(currentMeters: number): boolean {
    if (currentMeters - this.lastItemMeter >= 100 && Math.random() < 0.35) {
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
    // 도약대 길이: 1스텝
    const runLength = GAME_CONSTANTS.STEP_LENGTH;

    const startX = this.currentX;
    const startY = this.currentY;
    const endX = startX + dirSign * runLength * GAME_CONSTANTS.SLOPE_COS;
    const endY = startY + runLength * GAME_CONSTANTS.SLOPE_SIN;

    // 갭 폭: 초반 60px -> 1500m에서 105px (점프 도달거리 190px 이내에서 안전 통과 가능)
    const baseGap = 55;
    const extraGap = Math.min(50, (currentMeters / 1500) * 50);
    const gapDistance = baseGap + extraGap;

    const gapDx = dirSign * gapDistance * GAME_CONSTANTS.SLOPE_COS;
    const gapDy = gapDistance * GAME_CONSTANTS.SLOPE_SIN + 10;

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
