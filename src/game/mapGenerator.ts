import { SlopeSegment, SlopeDirection } from '../types/game';
import { GAME_CONSTANTS } from './constants';

export class MapGenerator {
  private currentId: number = 0;
  private currentX: number = 0;
  private currentY: number = 0;
  private currentDirection: SlopeDirection = 'RIGHT_DOWN';
  private lastItemMeter: number = 0;

  constructor() {
    this.reset();
  }

  public reset(startX: number = 0, startY: number = 0): void {
    this.currentId = 0;
    this.currentX = startX;
    this.currentY = startY;
    this.currentDirection = 'RIGHT_DOWN';
    this.lastItemMeter = 0;
  }

  // 게임 시작 시 맵 초기화 (처음부터 턴과 점프가 즉시 등장!)
  public generateInitialMap(): SlopeSegment[] {
    const segments: SlopeSegment[] = [];

    // 1. 첫 출발: 2스텝 짧은 적응 구간 (140px)
    segments.push(this.createStraightStep(2, false));

    // 2. 시작 15m 지점: 첫 번째 점프 갭 (바로 점프의 손맛 체험!)
    segments.push(this.createGapStep(0));

    // 3. 착지 후 2스텝 직진
    segments.push(this.createStraightStep(2, false));

    // 4. 첫 번째 방향 전환 (TURN)
    segments.push(this.createTurnSegment());

    // 5. 1스텝 짧은 길 후 또 턴 (무한의 계단식 지그재그 맛보기)
    segments.push(this.createStraightStep(1, false));
    segments.push(this.createTurnSegment());

    // 6. 3스텝 직진 후 점프 갭
    segments.push(this.createStraightStep(3, true));
    segments.push(this.createGapStep(30));

    // 7. 연속해서 다이나믹 맵 25개 세그먼트 생성
    for (let i = 0; i < 25; i++) {
      this.generateDynamicPattern(segments, 50);
    }

    return segments;
  }

  // 다이나믹 패턴 단위 생성 (무한의 계단 리듬감 알고리즘)
  public generateDynamicPattern(segments: SlopeSegment[], currentMeters: number): void {
    // 난이도 단계 (0: 초반, 1: 중반 300m+, 2: 고난도 700m+)
    const isMid = currentMeters >= 250;
    const isHard = currentMeters >= 600;

    const rand = Math.random();

    if (isHard && rand < 0.22) {
      // [고난도] 2연속 점프 (Double Gap Jump)
      segments.push(this.createStraightStep(1, false));
      segments.push(this.createGapStep(currentMeters));
      segments.push(this.createStraightStep(1, false));
      segments.push(this.createGapStep(currentMeters));
      segments.push(this.createTurnSegment());
    } else if (rand < 0.28) {
      // [무한의 계단 시그니처] 1스텝 엇박 지그재그 (따-탁-따-탁!)
      const zigzagCount = isMid ? 3 + Math.floor(Math.random() * 2) : 2;
      for (let z = 0; z < zigzagCount; z++) {
        segments.push(this.createStraightStep(1, false));
        segments.push(this.createTurnSegment());
      }
    } else if (rand < 0.55) {
      // [점프 후 급회전] 점프 ➔ 1스텝 착지 ➔ 바로 방향 전환!
      const leadSteps = Math.random() < 0.5 ? 2 : 3;
      segments.push(this.createStraightStep(leadSteps, this.shouldSpawnItem(currentMeters)));
      segments.push(this.createGapStep(currentMeters));
      segments.push(this.createStraightStep(1, false));
      segments.push(this.createTurnSegment());
    } else if (rand < 0.78) {
      // [계단형 스텝] 2스텝 ➔ 턴 ➔ 2스텝 ➔ 턴
      segments.push(this.createStraightStep(2, false));
      segments.push(this.createTurnSegment());
      segments.push(this.createStraightStep(2, this.shouldSpawnItem(currentMeters)));
      segments.push(this.createTurnSegment());
    } else {
      // [롱 스트레이트 & 점프] 3~5스텝 시원한 질주 후 점프
      const runSteps = isHard ? 3 : 4 + Math.floor(Math.random() * 2);
      segments.push(this.createStraightStep(runSteps, this.shouldSpawnItem(currentMeters)));
      segments.push(this.createGapStep(currentMeters));
    }
  }

  private shouldSpawnItem(currentMeters: number): boolean {
    if (currentMeters - this.lastItemMeter >= 120 && Math.random() < 0.4) {
      this.lastItemMeter = currentMeters;
      return true;
    }
    return false;
  }

  // 1. 스텝 단위 직진 도로 생성
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

  // 2. 끊어진 길(GAP) 생성
  private createGapStep(currentMeters: number): SlopeSegment {
    this.currentId++;
    const dirSign = this.currentDirection === 'RIGHT_DOWN' ? 1 : -1;
    // 도약 발판 길이 (1~2스텝)
    const runLength = GAME_CONSTANTS.STEP_LENGTH * (1 + Math.random() * 0.5);

    const startX = this.currentX;
    const startY = this.currentY;
    const endX = startX + dirSign * runLength * GAME_CONSTANTS.SLOPE_COS;
    const endY = startY + runLength * GAME_CONSTANTS.SLOPE_SIN;

    // 갭 폭: 초반 65px -> 후반 115px (도달거리 175px 이내에서 정확한 점프 요구)
    const baseGap = 65;
    const extraGap = Math.min(50, (currentMeters / 1500) * 50);
    const gapDistance = baseGap + extraGap;

    const gapDx = dirSign * gapDistance * GAME_CONSTANTS.SLOPE_COS;
    const gapDy = gapDistance * GAME_CONSTANTS.SLOPE_SIN + 12;

    this.currentX = endX + gapDx;
    this.currentY = endY + gapDy;

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

  // 3. 방향 전환(TURN) 생성
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
    return turnSegment;
  }
}
