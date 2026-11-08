/**
 * Infinite Egg - Asset Registry & Interface Contract
 * 
 * 게임 로직에 실제 사용되는 필수 고해상도 에셋만을 정의하고 관리하는 레지스트리입니다.
 */

// 1. 5대 핵심 화면 풀스크린 마스터 에셋
import screenHome from './screens/screen_home.png';
import screenShop from './screens/screen_shop.png';
import screenSkin from './screens/screen_skin.png';
import screenMission from './screens/screen_mission.png';
import screenChallenge from './screens/screen_challenge.png';

// 2. 인게임 조작 및 HUD 에셋
import headerFeatherBoard from './ui/header_feather_board.png';
import btnWoodSquare from './ui/btn_wood_square.png';
import btnWoodMedium from './ui/btn_wood_medium.png';
import btnOrangeJellyMedium from './ui/btn_orange_jelly_medium.png';
import propGoldenFeather from './icons/prop_golden_feather.png';

// 3. 3D 달걀 원화 8종 (스킨 탭 및 메인 탭 렌더링용)
import eggArt1 from './eggs/art/egg_art_1.png';
import eggArt2 from './eggs/art/egg_art_2.png';
import eggArt3 from './eggs/art/egg_art_3.png';
import eggArt4 from './eggs/art/egg_art_4.png';
import eggArt5 from './eggs/art/egg_art_5.png';
import eggArt6 from './eggs/art/egg_art_6.png';
import eggArt7 from './eggs/art/egg_art_7.png';
import eggArt8 from './eggs/art/egg_art_8.png';

export const EGG_ART_LIST: string[] = [
  eggArt1,
  eggArt2,
  eggArt3,
  eggArt4,
  eggArt5,
  eggArt6,
  eggArt7,
  eggArt8,
];

// UI 에셋 인터페이스 규약 (실제 사용 키만 정의)
export type UIAssetKey =
  | 'screen_home'              // 홈/로비 전체 마스터 화면
  | 'screen_shop'              // 상점 전체 마스터 화면
  | 'screen_skin'              // 스킨/보관함 전체 마스터 화면
  | 'screen_mission'           // 미션 전체 마스터 화면
  | 'screen_challenge'         // 도전 모드 전체 마스터 화면
  | 'header_feather_board'     // 인게임 HUD 깃털 수량 목판
  | 'btn_wood_square'          // 인게임 HUD 일시정지 목판 버튼
  | 'btn_wood_medium'          // 인게임 방향전환 목판 버튼
  | 'btn_orange_jelly_medium'  // 인게임 점프 3D 오렌지 젤리 버튼
  | 'prop_golden_feather';     // 인게임 트랙 획득 황금 깃털

const UI_ASSETS: Record<UIAssetKey, string> = {
  screen_home: screenHome,
  screen_shop: screenShop,
  screen_skin: screenSkin,
  screen_mission: screenMission,
  screen_challenge: screenChallenge,
  header_feather_board: headerFeatherBoard,
  btn_wood_square: btnWoodSquare,
  btn_wood_medium: btnWoodMedium,
  btn_orange_jelly_medium: btnOrangeJellyMedium,
  prop_golden_feather: propGoldenFeather,
};

/**
 * UI 에셋 경로를 반환합니다.
 */
export function getUIAsset(key: UIAssetKey): string | null {
  return UI_ASSETS[key] || null;
}
