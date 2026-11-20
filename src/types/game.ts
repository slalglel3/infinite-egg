export type SlopeDirection = 'LEFT_DOWN' | 'RIGHT_DOWN';

export type SegmentType = 'STRAIGHT' | 'GAP' | 'TURN';

export type ItemType = 'BANDAGE';

export type ObstacleKind = 'ROCK' | 'HAY' | 'VINE';

export interface RoadObstacle {
  kind: ObstacleKind;
  t: number; // 세그먼트 진행률 (0 ~ 1)
  x: number;
  y: number;
  damage: number;
  hit: boolean;
}

export interface SlopeSegment {
  id: number;
  type: SegmentType;
  direction: SlopeDirection;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  length: number;
  // 끊어진 길(GAP)
  gapDistance?: number;
  gapHeight?: number;
  // 금이 간 길 (CRACKED) - 점프하지 않고 굴러가면 붕괴 후 추락
  isCracked?: boolean;
  isCollapsed?: boolean;
  obstacles?: RoadObstacle[];
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
  | 'SURPRISED_FALL'   // 길 영역 이탈 직후 당황하며 미끄러지는 구간
  | 'DEAD_FALLING'     // 길 아래로 떨어지는 낙하 애니메이션 진행 중
  | 'DEAD_CRACKED'     // 착지 충격으로 깨진 상태
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
  jumpArcOffset: number;   // 공중 솟구침 시각적 오프셋 (픽셀)
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
  type: 'SHELL' | 'TEXT' | 'CHUNK';
  text?: string;
}

export interface UserProgress {
  bestDistanceMeters: number;
  totalGamesPlayed: number;
}

export type HomeTabType = 'SHOP' | 'SKINS' | 'MAIN' | 'MISSIONS' | 'CHALLENGE';

export interface GameStats {
  distanceMeters: number;
  speed: number;
  hp: number;
  maxHp: number;
  itemsCollected: number;
  isNewRecord: boolean;
  eggState: EggState;
}
