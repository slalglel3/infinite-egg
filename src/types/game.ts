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
  // 끊어진 길(GAP)인 경우 다음 세그먼트 시작점과의 오프셋
  gapDistance?: number;
  gapHeight?: number;
  // 스폰된 아이템
  item?: {
    type: ItemType;
    x: number;
    y: number;
    collected: boolean;
  };
  isPassed: boolean;
}

export type EggState =
  | 'ROLLING'       // 슬로프 위를 굴러가는 중
  | 'JUMPING'       // 점프 포물선 비행 중
  | 'DROPPING_TURN' // 방향 전환을 일찍 눌러서 아랫길로 자유 낙하 중
  | 'DEAD_FALLING'  // 코너/갭을 지나쳐 맵 밖으로 추락 중
  | 'DEAD_CRACKED'; // 착지 충격으로 깨진 상태

export interface Egg {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;     // 현재 굴러간 각도 (라디안)
  direction: SlopeDirection;
  state: EggState;
  currentSegmentIndex: number;
  // 점프 관련
  jumpStartY: number;
  jumpStartX: number;
  jumpProgress: number; // 0 ~ 1
  jumpPeakHeight: number;
  // 낙하(드롭) 관련
  dropStartY: number;
  // 체력(내구도)
  maxHp: number;
  hp: number;
  // 시각 효과용
  squishX: number;
  squishY: number;
  flashDamage: boolean;
  crackLevel: number;   // 0(멀쩡) ~ 4(파괴 직전)
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
