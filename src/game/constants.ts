// 물리 및 게임 플레이 기본 상수
export const GAME_CONSTANTS = {
  // 거리 환산: 세로 100 픽셀 = 1m
  PIXELS_PER_METER: 100,

  // 슬로프 각도 (대각선 각도: 약 36.8도, 4:3 비율의 경사)
  SLOPE_COS: 4 / 5, // 0.8
  SLOPE_SIN: 3 / 5, // 0.6

  // 1 Step(블록 단위) 길이: 70px (무한의 계단처럼 빠른 리듬감)
  STEP_LENGTH: 70,

  // 도로(아스팔트) 외형 치수
  ROAD_WIDTH: 38,        // 도로 트랙의 전체 폭
  CURB_WIDTH: 5,         // 도로 양쪽 연석(Curb) 폭

  // 통통하고 사랑스러운 황금비율 달걀 치수 (가로 36px, 세로 48px, 비율 1 : 1.33)
  EGG_RADIUS_X: 18,
  EGG_RADIUS_Y: 24,

  // 기본 속도 및 가속 곡선
  INITIAL_SPEED: 260,    // 픽셀/초
  MAX_SPEED: 760,        // 최고 속도
  SPEED_INCREASE_INTERVAL_M: 80,
  SPEED_INCREASE_STEP: 25,

  // 점프 물리 (눈에 확실하게 보이는 고정 포물선 점프)
  JUMP_DURATION_SEC: 0.50,   // 체공 시간 0.5초
  JUMP_PEAK_PIXELS: 65,     // 공중으로 65픽셀 시원하게 솟구침!
  JUMP_DISTANCE_FORWARD: 190,// 점프 전진 거리

  // 내구도
  BASE_HP: 100,
  HP_PER_LEVEL: 0.05,
  DAMAGE_PER_HEIGHT_PIXEL: 0.28,
  MISJUMP_DAMAGE: 12,
  BANDAGE_HEAL_HP: 25,

  // 경험치 공식
  BASE_EXP_PER_METER: 1,

  // 색상 팔레트: 자연(Nature) & 아스팔트(Asphalt) 테마
  COLORS: {
    SKY_TOP: '#38bdf8',
    SKY_BOTTOM: '#e0f2fe',
    MOUNTAIN_FAR: '#93c5fd',
    MOUNTAIN_MID: '#86efac',
    GRASS_BASE: '#4ade80',
    GRASS_DARK: '#22c55e',
    
    ROAD_SURFACE: '#334155',
    ROAD_DARK: '#1e293b',
    ROAD_LINE: '#facc15',
    CURB_RED: '#ef4444',
    CURB_WHITE: '#f8fafc',

    EGG_BASE: '#fef08a',
    EGG_SHADOW: '#f59e0b',
    EGG_LINE: '#b45309',
    EGG_YOLK: '#f97316',
    EGG_WHITE: 'rgba(255, 255, 255, 0.85)',
  },
};
