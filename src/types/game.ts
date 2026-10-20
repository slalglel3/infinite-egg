export type SlopeDirection = 'LEFT_DOWN' | 'RIGHT_DOWN';

export type SegmentType = 'STRAIGHT' | 'GAP' | 'TURN';

export type ItemType = 'BANDAGE' | 'GOLDEN_EGG';

export interface SlopeSegment {
  id: number;
  type: SegmentType;
  direction: SlopeDirection;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  length: number;
  // 끊어진 길(GAP)인 경우
  gapDistance?: number;
  gapHeight?: number;
  item?: {
    type: ItemType;
    x: number;
    y: number;
    collected: boolean;
  };
  isPassed: boolean;
}

export type EggState =
  | 'ROLLING'          // 슬로프 위를 굴러가는 중
  | 'JUMPING'          // 점프 포물선 비행 중
  | 'DROPPING_TURN'    // 방향 전환을 일찍 눌러서 아랫길로 자유 낙하 중
  | 'SURPRISED_FALL'   // 추락 직전 공중에 멈춰 당황하는 만화적 연출
  | 'DEAD_FALLING'     // 화면 아래로 회전하며 추락 중
  | 'DEAD_CRACKED'     // 착지 충격으로 깨져 흰자/노른자가 퍼지는 연출 중
  | 'DEAD_OVER';       // 연출 완료 후 게임 종료 상태

export type EggExpression = 'NORMAL' | 'DIZZY' | 'SURPRISED' | 'PAIN';

export interface Egg {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;        // 현재 구르는 각도 (라디안)
  direction: SlopeDirection;
  state: EggState;
  expression: EggExpression;
  currentSegmentIndex: number;
  // 점프 관련
  jumpStartY: number;
  jumpStartX: number;
  jumpProgress: number;    // 0 ~ 1
  jumpPeakHeight: number;
  // 낙하/드롭 관련
  dropStartY: number;
  // 사망 연출 타이머
  deathTimer: number;
  // 체력(내구도)
  maxHp: number;
  hp: number;
  // 시각 효과용
  squishX: number;
  squishY: number;
  flashDamage: boolean;
  crackLevel: number;      // 0(멀쩡) ~ 4(파괴 직전)
}

export interface EggSplat {
  x: number;
  y: number;
  rotation: number;
  radius: number;
  shellFragments: Array<{
    offsetX: number;
    offsetY: number;
    size: number;
    rot: number;
    color: string;
  }>;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  rotation?: number;
  vRot?: number;
  type?: 'SHELL' | 'YOLK' | 'DUST' | 'SPARK' | 'TEXT';
  text?: string;
}

export interface UserProgress {
  level: number;
  exp: number;
  nextLevelExp: number;
  bestDistanceMeters: number;
  totalDistanceMeters: number;
  totalGamesPlayed: number;
}

export interface GameStats {
  distanceMeters: number;
  speed: number;
  hp: number;
  maxHp: number;
  perfectLandings: number;
  itemsCollected: number;
  isNewRecord: boolean;
}
