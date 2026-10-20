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
    this.currentDirection = 'RIGHT_DOWN';
    this.straightCountInCurrentDir = 0;
    this.lastItemMeter = 0;
  }

  // 초기 시작 맵 세그먼트 생성 (약 20개 세그먼트)
  public generateInitialMap(): SlopeSegment[] {
    const segments: SlopeSegment[] = [];

    // 최초 3개는 안전한 긴 직선 구간
    for (let i = 0; i < 3; i++) {
      segments.push(this.createStraightSegment(260, false));
    }

    // 이후 20개 세그먼트 연속 생성
    for (let i = 0; i < 20; i++) {
      segments.push(this.generateNextSegment(0));
    }

    return segments;
  }

  // 다음 세그먼트 생성 (현재 하강 거리 meters 반영하여 난이도 조절)
  public generateNextSegment(currentMeters: number): SlopeSegment {
    this.currentId++;

    // 방향 전환(TURN) 결정
    // 현재 방향으로 3~6번 직진했으면 방향 전환 고려
    const minStraights = currentMeters > 500 ? 2 : 3;
    const maxStraights = currentMeters > 500 ? 5 : 7;

    const shouldTurn = this.straightCountInCurrentDir >= minStraights &&
      (this.straightCountInCurrentDir >= maxStraights || Math.random() < 0.45);

    if (shouldTurn) {
      return this.createTurnSegment();
    }

    // 끊어진 길(GAP) 결정 (100m 이후부터 등장)
    // 갭 확률: 초반 20% -> 후반 35%
    const gapChance = currentMeters > 100 ? Math.min(0.35, 0.2 + (currentMeters / 3000) * 0.15) : 0;
    const shouldGap = Math.random() < gapChance;

    if (shouldGap) {
      return this.createGapSegment(currentMeters);
    }

    // 일반 직진 슬로프
    const length = 180 + Math.random() * 120; // 180 ~ 300px
    const shouldSpawnItem = (currentMeters - this.lastItemMeter >= 140) && Math.random() < 0.35;
    if (shouldSpawnItem) {
      this.lastItemMeter = currentMeters;
    }

    return this.createStraightSegment(length, shouldSpawnItem);
  }

  // 1. 직진 슬로프 세그먼트 생성
  private createStraightSegment(length: number, hasItem: boolean): SlopeSegment {
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

  // 2. 끊어진 길 (GAP) 세그먼트 생성
  private createGapSegment(currentMeters: number): SlopeSegment {
    const dirSign = this.currentDirection === 'RIGHT_DOWN' ? 1 : -1;
    const length = 160 + Math.random() * 80;

    const startX = this.currentX;
    const startY = this.currentY;
    const endX = startX + dirSign * length * GAME_CONSTANTS.SLOPE_COS;
    const endY = startY + length * GAME_CONSTANTS.SLOPE_SIN;

    // 갭의 폭: 거리(meters)에 따라 조금씩 넓어짐 (기획 3-1 반영)
    // 초반: 70px -> 2000m: 130px (기본 점프 도달거리 200px 이내에서 정확한 점프 타이밍 요구)
    const baseGap = 65;
    const extraGap = Math.min(65, (currentMeters / 2000) * 65);
    const gapDistance = baseGap + extraGap;

    const gapDx = dirSign * gapDistance * GAME_CONSTANTS.SLOPE_COS;
    const gapDy = gapDistance * GAME_CONSTANTS.SLOPE_SIN + 15; // 아랫길이 15px 살짝 더 아래로 떨어져 단차 형성

    // 다음 세그먼트의 시작 좌표를 갭만큼 점프 이동
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
      length,
      gapDistance,
      gapHeight: gapDy,
      isPassed: false,
    };
  }

  // 3. 방향 전환 (TURN) 세그먼트 생성
  private createTurnSegment(): SlopeSegment {
    // 현재 방향의 끝점에서 즉시 반대 방향으로 전환
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

    // 방향 반전 및 카운트 리셋
    this.currentDirection = newDir;
    this.straightCountInCurrentDir = 0;

    return turnSegment;
  }
}
