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
    this.currentDirection = Math.random() < 0.5 ? 'RIGHT_DOWN' : 'LEFT_DOWN';
    this.lastItemMeter = 0;
  }

  // 매 판 100% 새로운 무작위 절차적 맵 생성
  public generateInitialMap(): SlopeSegment[] {
    const segments: SlopeSegment[] = [];

    // 1. 첫 출발: 시원하고 안전한 직선 도로 (3스텝 = 210px)
    segments.push(this.createStraightStep(3, false));

    // 2. 이후 절차적 다이나믹 패턴을 25개 연속 생성
    for (let i = 0; i < 25; i++) {
      this.generateDynamicPattern(segments, i * 5);
    }

    return segments;
  }

  // 무한의 계단 스타일 다이나믹 맵 생성 알고리즘 (피드백 1, 2, 4 완벽 반영)
  public generateDynamicPattern(segments: SlopeSegment[], currentMeters: number): void {
    const isHard = currentMeters >= 500;
    const rand = Math.random();

    // 1. [점프 & 안전 착지 활주로] (가장 핵심적인 점프 코스 - 약 35% 확률)
    // 점프 착지 후에는 무조건 최소 4스텝(280px)의 넉넉한 착지 직선로를 강제 보장! (피드백 2, 4)
    if (rand < 0.35) {
      // 윗길 도약대: 2~4스텝
      const leadSteps = Math.random() < 0.5 ? 3 : 2;
      segments.push(this.createStraightStep(leadSteps, this.shouldSpawnItem(currentMeters)));
      // 끊어진 갭
      segments.push(this.createGapStep(currentMeters));
      // [필수] 착지 후 안전 주행 활주로 (최소 4~5스텝: 280~350px 보장)
      const runwaySteps = isHard ? 4 : 5;
      segments.push(this.createStraightStep(runwaySteps, false));
      // 활주로 끝에서 여유롭게 방향 전환
      segments.push(this.createTurnSegment());
      return;
    }

    // 2. [시원한 롱 스트레이트 질주 코스] (3~5스텝 직진 후 턴 - 약 40% 확률)
    // 짧은 길에 대한 피로도를 없애고 시원하게 데굴데굴 달리는 쾌감! (피드백 1)
    if (rand < 0.75) {
      const runSteps = Math.random() < 0.5 ? 4 : 3;
      segments.push(this.createStraightStep(runSteps, this.shouldSpawnItem(currentMeters)));
      segments.push(this.createTurnSegment());
      return;
    }

    // 3. [계단형 중거리 코너] 2스텝 ➔ 턴 ➔ 3스텝 ➔ 턴 (약 15% 확률)
    if (rand < 0.90) {
      segments.push(this.createStraightStep(2, false));
      segments.push(this.createTurnSegment());
      segments.push(this.createStraightStep(3, this.shouldSpawnItem(currentMeters)));
      segments.push(this.createTurnSegment());
      return;
    }

    // 4. [특수 구간: 1스텝 엇박 지그재그] (오직 10% 미만의 낮은 확률로 가끔만 깜짝 등장! - 피드백 1)
    const zigzagCount = isHard ? 3 : 2;
    for (let z = 0; z < zigzagCount; z++) {
      segments.push(this.createStraightStep(1, false));
      segments.push(this.createTurnSegment());
    }
    // 지그재그 직후에는 숨 돌릴 수 있도록 3스텝 직선로 부여
    segments.push(this.createStraightStep(3, false));
  }

  private shouldSpawnItem(currentMeters: number): boolean {
    if (currentMeters - this.lastItemMeter >= 110 && Math.random() < 0.35) {
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

  // 끊어진 길(GAP) 생성 (도약대와 아랫길 단차)
  private createGapStep(currentMeters: number): SlopeSegment {
    this.currentId++;
    const dirSign = this.currentDirection === 'RIGHT_DOWN' ? 1 : -1;
    // 도약대 길이: 2스텝 (140px, 충분한 도약 여유)
    const runLength = GAME_CONSTANTS.STEP_LENGTH * 2;

    const startX = this.currentX;
    const startY = this.currentY;
    const endX = startX + dirSign * runLength * GAME_CONSTANTS.SLOPE_COS;
    const endY = startY + runLength * GAME_CONSTANTS.SLOPE_SIN;

    // 갭 폭: 초반 60px -> 1500m에서 95px (점프 도달거리 190px 대비 넉넉하여 무조건 아랫길 안쪽에 안착)
    const baseGap = 55;
    const extraGap = Math.min(40, (currentMeters / 1500) * 40);
    const gapDistance = baseGap + extraGap;

    const gapDx = dirSign * gapDistance * GAME_CONSTANTS.SLOPE_COS;
    const gapDy = gapDistance * GAME_CONSTANTS.SLOPE_SIN + 8;

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
    return turnSegment;
  }
}
