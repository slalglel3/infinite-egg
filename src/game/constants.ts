// 물리 및 게임 플레이 기본 상수
export const GAME_CONSTANTS = {
  // 거리 환산: 세로 120 픽셀 = 1m (현실적이고 시각적으로 직관적인 비례)
  PIXELS_PER_METER: 120,

  // 슬로프 각도 (대각선 각도: 약 36.8도, 4:3 비율의 경사)
  SLOPE_ANGLE: Math.atan2(3, 4), // 약 0.6435 rad (36.87도)
  SLOPE_COS: 4 / 5, // 0.8
  SLOPE_SIN: 3 / 5, // 0.6

  // 슬로프 외형
  SLOPE_WIDTH: 22, // 미끄럼틀 트랙의 두께
  EGG_RADIUS_X: 18,
  EGG_RADIUS_Y: 23,

  // 기본 속도 및 가속 곡선 (기획서 8-2)
  INITIAL_SPEED: 260, // 픽셀/초 (약 2.1 m/s)
  MAX_SPEED: 720,     // 2000m 도달 시 최고 속도
  SPEED_INCREASE_INTERVAL_M: 100, // 100m마다 가속
  SPEED_INCREASE_STEP: 23,        // 100m마다 증가하는 픽셀/초

  // 점프 물리
  JUMP_DURATION_SEC: 0.52,   // 고정 점프 체공 시간
  JUMP_PEAK_PIXELS: 55,     // 점프 시 최고 정점 높이 (픽셀)
  JUMP_DISTANCE_FORWARD: 200,// 기본 점프 수평/사선 도달 거리

  // 내구도 (기획서 4, 5, 6)
  BASE_HP: 100,
  HP_PER_LEVEL: 0.05, // 100레벨 시 내구도 105 (+5% 마이너 보정)
  
  // 내구도 감소 계수 (낙하 높이차 당 내구도 감소)
  // 이상적 착지와의 높이차(Δh) 10px 당 약 2~4 HP 감소
  DAMAGE_PER_HEIGHT_PIXEL: 0.28,
  MISJUMP_DAMAGE: 16, // 일반 길에서 헛점프 후 착지 시 받는 기본 큰 충격량

  // 아이템 회복량
  BANDAGE_HEAL_HP: 20,

  // 경험치 공식 (1m = 1 EXP)
  // 하루 10시간 * 100일 = 1000시간 = 100레벨 기준
  BASE_EXP_PER_METER: 1,

  // 색상 팔레트
  COLORS: {
    EGG_BODY: '#fffbeb',
    EGG_SHADOW: '#fed7aa',
    EGG_YOLK: '#f59e0b',
    EGG_CRACK: '#78350f',
    SLOPE_MAIN: '#38bdf8',
    SLOPE_BORDER: '#0284c7',
    SLOPE_HIGHLIGHT: '#bae6fd',
    BG_TOP: '#f0f9ff',
    BG_BOTTOM: '#e0f2fe',
  },
};
