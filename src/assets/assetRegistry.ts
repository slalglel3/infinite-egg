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

// 2. 3D 달걀 원화 8종 (스킨 탭 및 메인 탭 렌더링용)
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
  | 'screen_challenge';        // 도전 모드 전체 마스터 화면

const UI_ASSETS: Record<UIAssetKey, string> = {
  screen_home: screenHome,
  screen_shop: screenShop,
  screen_skin: screenSkin,
  screen_mission: screenMission,
  screen_challenge: screenChallenge,
};

/**
 * UI 에셋 경로를 반환합니다.
 */
export function getUIAsset(key: UIAssetKey): string | null {
  return UI_ASSETS[key] || null;
}
