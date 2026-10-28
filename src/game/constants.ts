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

  // [피드백 1 반영] 세로 비율을 단축하여 더욱 통통하고 포근한 실물 달걀 치수 (가로 38px, 세로 44px, 비율 1 : 1.16)
  EGG_RADIUS_X: 19,
  EGG_RADIUS_Y: 22,

  // [피드백 3] 50m마다 속도 상승, 2000m에서 최고 속도(780) 도달
  INITIAL_SPEED: 260,
  MAX_SPEED: 780,
  SPEED_INCREASE_INTERVAL_M: 50, // 50m마다 가속!
  SPEED_INCREASE_STEP: 13,        // (780 - 260) / 40단계 = 13

  // 점프 물리
  JUMP_DURATION_SEC: 0.50,
  JUMP_PEAK_PIXELS: 65,
  JUMP_DISTANCE_FORWARD: 190,

  // 점프 판정 범위 (절벽 끝 25px 이내 최적 도약)
  PERFECT_JUMP_MARGIN: 25,

  // 내구도
  BASE_HP: 100,
  HP_PER_LEVEL: 0.05,
  // [피드백 12 반영] 높이 차이에 따른 충격 내구도 감소량 2배 상향 (0.32 -> 0.64)
  DAMAGE_PER_HEIGHT_PIXEL: 0.64,
  MISJUMP_DAMAGE: 14,

  // [피드백 6] 반창고 발생 빈도 및 회복량
  BANDAGE_HEAL_HP: 25,
  BANDAGE_MIN_INTERVAL_M: 60, // 60m마다 체크
  BANDAGE_SPAWN_CHANCE: 0.50, // 50% 확률 스폰

  BASE_EXP_PER_METER: 1,
};
