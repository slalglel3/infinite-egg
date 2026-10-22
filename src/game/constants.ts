// 물리 및 게임 플레이 기본 상수
export const GAME_CONSTANTS = {
  // 거리 환산: 세로 100 픽셀 = 1m
  PIXELS_PER_METER: 100,

  // 슬로프 각도 (대각선 각도: 약 36.8도, 4:3 비율의 경사)
  SLOPE_COS: 4 / 5, // 0.8
  SLOPE_SIN: 3 / 5, // 0.6

  // 1 Step(블록 단위) 길이: 70px
  STEP_LENGTH: 70,

  // 도로(아스팔트) 외형 치수
  ROAD_WIDTH: 38,
  CURB_WIDTH: 5,

  // 통통하고 사랑스러운 황금비율 달걀 치수 (가로 36px, 세로 48px, 비율 1 : 1.33)
  EGG_RADIUS_X: 18,
  EGG_RADIUS_Y: 24,

  // [피드백 3] 50m마다 속도 상승, 2000m에서 최고 속도(780) 도달
  INITIAL_SPEED: 260,
  MAX_SPEED: 780,
  SPEED_INCREASE_INTERVAL_M: 50, // 50m마다 가속!
  SPEED_INCREASE_STEP: 13,        // (780 - 260) / 40단계 = 13

  // 점프 물리
  JUMP_DURATION_SEC: 0.50,
  JUMP_PEAK_PIXELS: 65,
  JUMP_DISTANCE_FORWARD: 190,

  // [피드백 4] 판정 범위 절반 축소 (정밀한 손맛)
  PERFECT_JUMP_MARGIN: 24, // 절벽 끝 24px 이내 (기존 48px의 절반)
  PERFECT_TURN_MARGIN: 18, // 코너 끝 18px 이내 (기존 38px의 절반)

  // 내구도
  BASE_HP: 100,
  HP_PER_LEVEL: 0.05,
  DAMAGE_PER_HEIGHT_PIXEL: 0.32,
  MISJUMP_DAMAGE: 14,

  // [피드백 6] 반창고 발생 빈도 및 회복량
  BANDAGE_HEAL_HP: 25,
  BANDAGE_MIN_INTERVAL_M: 60, // 60m마다 체크
  BANDAGE_SPAWN_CHANCE: 0.50, // 50% 확률 스폰

  BASE_EXP_PER_METER: 1,
};
