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

  // 다이나믹 패턴 생성기 (피드백: 방향 전환 직후 점프 진입로 동적 조절 & 긴장감 극대화)
  public generateDynamicPattern(segments: SlopeSegment[], currentMeters: number): void {
    const isMid = currentMeters >= 300;
    const isHard = currentMeters >= 800;
    const isExtreme = currentMeters >= 1500;

    const rand = Math.random();

    // 1. [점프 코스] (52% 확률)
    if (rand < 0.52) {
      // [피드백 6 반영] 거리가 늘어날수록 단일 방향 경로에서 2연속 또는 3연속 점프가 깜짝 출현!
      let jumpCount = 1;
      const multiJumpRand = Math.random();

      if (isExtreme) {
        if (multiJumpRand < 0.25) jumpCount = 3;      // 1500m+: 25% 확률로 3연속 점프!
        else if (multiJumpRand < 0.70) jumpCount = 2; // 45% 확률로 2연속 점프!
      } else if (isHard) {
        if (multiJumpRand < 0.45) jumpCount = 2;      // 800m+: 45% 확률로 2연속 점프!
      } else if (isMid) {
        if (multiJumpRand < 0.30) jumpCount = 2;      // 300m+: 30% 확률로 2연속 점프!
      }

      // 방향 전환 직후 첫 점프까지의 도주로(안전 도로) 길이를 동적으로 조절
      let leadStraightSteps = 0;
      let gapRunSteps = 1.0;

      const jumpRand = Math.random();

      if (isExtreme) {
        // 1500m+ (맨틀 코어): 극한의 반사신경 요구
        if (jumpRand < 0.50) {
          leadStraightSteps = 0;
          gapRunSteps = 1.0;
        } else if (jumpRand < 0.85) {
          leadStraightSteps = 0;
          gapRunSteps = 1.5;
        } else {
          leadStraightSteps = 1.2;
          gapRunSteps = 1.3;
        }
      } else if (isHard) {
        // 800m+ (지하 동굴/지각)
        if (jumpRand < 0.40) {
          leadStraightSteps = 0;
          gapRunSteps = 1.0;
        } else if (jumpRand < 0.75) {
          leadStraightSteps = 0;
          gapRunSteps = 1.6;
        } else {
          leadStraightSteps = 1.5;
          gapRunSteps = 1.3;
        }
      } else if (isMid) {
        // 300m+ (산중턱/초원)
        if (jumpRand < 0.30) {
          leadStraightSteps = 0;
          gapRunSteps = 1.3;
        } else if (jumpRand < 0.70) {
          leadStraightSteps = 1.0;
          gapRunSteps = 1.0;
        } else {
          leadStraightSteps = 1.8;
          gapRunSteps = 1.2;
        }
      } else {
        // 초반 (0~300m)
        if (jumpRand < 0.25) {
          leadStraightSteps = 0;
          gapRunSteps = 1.8;
        } else if (jumpRand < 0.65) {
          leadStraightSteps = 1.2;
          gapRunSteps = 1.3;
        } else {
          leadStraightSteps = 2.0;
          gapRunSteps = 1.5;
        }
      }

      // 1) 첫 점프 진입 직선로
      if (leadStraightSteps > 0) {
        segments.push(this.createStraightStep(leadStraightSteps, this.shouldSpawnItem(currentMeters)));
      }
      // 1차 점프
      segments.push(this.createGapStep(currentMeters, gapRunSteps));

      // 2) 2번째 또는 3번째 점프가 연결되는 경우
      for (let j = 1; j < jumpCount; j++) {
        // 착지 후 다음 점프 도약대까지의 중간 연결 활주로 (1.8 ~ 2.4스텝)
        const midConnectSteps = isExtreme ? 1.6 : (isHard ? 2.0 : 2.4);
        segments.push(this.createStraightStep(midConnectSteps, this.shouldSpawnItem(currentMeters)));
        // 연속 점프 GAP 생성
        segments.push(this.createGapStep(currentMeters, 1.2));
      }

      // 최종 착지 후 활주로 동적 조절
      let runwaySteps = 4;
      if (isExtreme) {
        runwaySteps = 2;
      } else if (isHard) {
        runwaySteps = 2.5;
      } else if (isMid) {
        runwaySteps = 3;
      }

      const canSpawnOnRunway = leadStraightSteps === 0 ? this.shouldSpawnItem(currentMeters) : false;
      segments.push(this.createStraightStep(runwaySteps, canSpawnOnRunway));
      segments.push(this.createTurnSegment());
      return;
    }

    // 2. [롱/중거리 직선 질주] (30% 확률)
    if (rand < 0.82) {
      const runSteps = isHard ? (Math.random() < 0.5 ? 2.2 : 3) : (Math.random() < 0.5 ? 3.5 : 2.5);
      // [피드백 11 반영] 200m 이상부터 일정 확률(30%)로 금이 간 위험한 도로 생성! 점프해서 넘지 않으면 붕괴!
      const shouldCrack = currentMeters >= 200 && Math.random() < 0.30;
      segments.push(this.createStraightStep(runSteps, this.shouldSpawnItem(currentMeters), shouldCrack));
      segments.push(this.createTurnSegment());
      return;
    }

    // 3. [다양한 길이의 짧은 방향 전환 리듬 구간] (18% 확률)
    // [피드백 6 반영] 1.0스텝만 반복되지 않고 0.8 ~ 1.8스텝의 다양한 길이의 짧은 길이 불규칙하게 반복!
    const zigzagCount = isHard ? 4 : 3;
    const stepChoices = isHard ? [0.8, 1.1, 1.4, 1.6] : [1.0, 1.3, 1.5, 1.8];
    for (let z = 0; z < zigzagCount; z++) {
      const steps = stepChoices[Math.floor(Math.random() * stepChoices.length)];
      // 가끔 짧은 길에도 금 간 구간 배치
      const crackInShort = currentMeters >= 400 && Math.random() < 0.20;
      segments.push(this.createStraightStep(steps, false, crackInShort));
      segments.push(this.createTurnSegment());
    }
    // 지그재그 직후에는 숨 돌릴 수 있도록 2스텝 직선로 부여
    segments.push(this.createStraightStep(2, this.shouldSpawnItem(currentMeters), false));
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
  private createStraightStep(steps: number, hasItem: boolean, isCracked: boolean = false): SlopeSegment {
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
    if (hasItem && !isCracked) {
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
      isCracked,
      isCollapsed: false,
    };
  }

  // 끊어진 길(GAP) 생성 (runSteps: 도약대 직선 도로 길이 스텝)
  private createGapStep(currentMeters: number, runSteps: number = 1.5): SlopeSegment {
    this.currentId++;
    const dirSign = this.currentDirection === 'RIGHT_DOWN' ? 1 : -1;
    const runLength = GAME_CONSTANTS.STEP_LENGTH * runSteps;

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
