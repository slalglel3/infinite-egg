/**
 * Infinite Egg - Asset Registry & Interface Contract
 * 
 * UI 세션이 생성/슬라이싱한 고해상도 투명 PNG 에셋들을 중앙에서 관리하는 레지스트리입니다.
 * 에셋 파일이 없을 경우 기존 SVG/CSS 컴포넌트로 자동 폴백(Fallback)되어 게임이 깨지지 않습니다.
 */

// 1. 투명 PNG 에셋 정적 임포트 (Vite singlefile 인라인 지원)
import screenHome from './screens/screen_home.png';
import screenShop from './screens/screen_shop.png';
import screenSkin from './screens/screen_skin.png';
import screenMission from './screens/screen_mission.png';
import screenChallenge from './screens/screen_challenge.png';

import bgBarnSunlight from './backgrounds/bg_barn_sunlight.png';
import bgBarnLoft from './backgrounds/bg_barn_loft.png';

import headerProfileBoard from './ui/header_profile_board.png';
import headerWheatBoard from './ui/header_wheat_board.png';
import headerFeatherBoard from './ui/header_feather_board.png';
import headerShellBoard from './ui/header_shell_board.png';
import btnSettingsCog from './ui/btn_settings_cog.png';

import dockWoodPlank from './ui/dock_wood_plank.png';
import tabShop from './ui/tab_shop.png';
import tabSkin from './ui/tab_skin.png';
import tabHomeCenter from './ui/tab_home_center.png';
import tabMission from './ui/tab_mission.png';
import tabChallenge from './ui/tab_challenge.png';

import btnOrangeJellyLarge from './ui/btn_orange_jelly_large.png';
import btnOrangeJellyMedium from './ui/btn_orange_jelly_medium.png';
import btnWoodMedium from './ui/btn_wood_medium.png';
import btnWoodSquare from './ui/btn_wood_square.png';
import tagWheatCost from './ui/tag_wheat_cost.png';

import nestStrawHero from './ui/nest_straw_hero.png';
import panelRopeWoodLarge from './ui/panel_rope_wood_large.png';
import panelWoodCardSlot from './ui/panel_wood_card_slot.png';

import trackWoodenBridge from './tracks/track_wooden_bridge.png';
import propGoldenFeather from './icons/prop_golden_feather.png';
import iconTurnArrow from './icons/icon_turn_arrow.png';
import iconJumpArrow from './icons/icon_jump_arrow.png';

import eggBabySprout from './eggs/egg_baby_sprout.png';
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

// 2. 공통 UI 에셋 키 정의
export type UIAssetKey =
  // 5대 핵심 화면 풀스크린 마스터 에셋 (100% 무왜곡 매칭)
  | 'screen_home'              // 3번 탭: 홈/로비 전체 마스터 화면
  | 'screen_shop'              // 1번 탭: 상점 전체 마스터 화면
  | 'screen_skin'              // 2번 탭: 스킨/보관함 전체 마스터 화면
  | 'screen_mission'           // 4번 탭: 미션 전체 마스터 화면
  | 'screen_challenge'         // 5번 탭: 도전 모드 전체 마스터 화면
  // 배경
  | 'bg_barn_sunlight'         // 헛간 햇살 배경 (홈/로비)
  | 'bg_barn_loft'             // 헛간 다락방 인게임 배경 (플레이)
  // 상단 헤더
  | 'header_profile_board'     // 프로필 목판 (LV.3 계란이)
  | 'header_wheat_board'       // 활동력 곡식 목판 (🌾 24/50)
  | 'header_feather_board'     // 황금 깃털 목판 (🪶 1,245)
  | 'header_shell_board'       // 계란 껍데기 목판 (🥚 껍데기 상점용)
  | 'btn_settings_cog'         // 설정 톱니바퀴 목판 버튼
  // 하단 독 (5대 탭)
  | 'dock_wood_plank'          // 하단 통나무 짚풀 베이스 프레임
  | 'tab_shop'                 // 1번 탭: 상점 아이콘+목판
  | 'tab_skin'                 // 2번 탭: 스킨 아이콘+목판
  | 'tab_home_center'          // 3번 탭: 중앙 원형 짚풀 둥지 집
  | 'tab_mission'              // 4번 탭: 미션 아이콘+목판
  | 'tab_challenge'            // 5번 탭: 도전 아이콘+목판
  // 버튼 & 패널
  | 'btn_orange_jelly_large'   // 초대형 오렌지 3D 젤리 버튼 ('출발하기!')
  | 'btn_orange_jelly_medium'  // 중형 오렌지 3D 젤리 버튼 ('점프', '받기', '입장', '장착됨')
  | 'btn_wood_medium'          // 목판 사각 버튼 ('방향전환', '도전', '잠금')
  | 'btn_wood_square'          // 정사각 목판 버튼 ('<', '>', '⏸')
  | 'panel_rope_wood_large'    // 밧줄로 묶인 대형 메인 목판 패널
  | 'panel_wood_card_slot'     // 오목한 나무 슬롯 카드 (그리드/아이템/미션)
  | 'tag_wheat_cost'           // '활동력 🌾 5' 목판 태그
  | 'nest_straw_hero'          // 대형 짚풀 둥지 (계란이 앉아 있는 둥지)
  // 인게임 트랙 & 조작계
  | 'track_wooden_bridge'      // 밧줄 통나무 목재 다리 발판
  | 'track_nest_checkpoint'    // 코너 짚풀 둥지 체크포인트
  | 'prop_golden_feather'      // 인게임 황금 깃털 수집 아이템
  | 'icon_turn_arrow'          // 회전 화살표 아이콘 (방향전환)
  | 'icon_jump_arrow';         // 솟구치는 곡선 화살표 아이콘 (점프)

// 3. 캐릭터 스킨 에셋 키
export type EggAssetKey =
  | 'egg_baby_sprout'          // 꼬마 에그 (새싹)
  | 'egg_cracked_shell'        // 껍질 깬 달걀
  | 'egg_fried_chick'          // 구운 달걀 / 병아리
  | 'egg_pirate'               // 해적 에그
  | 'egg_winter_beanie'        // 털모자 에그
  | 'egg_astronaut'            // 우주인 에그
  | 'egg_chicken_apron';       // 닭 앞치마 에그

// 4. 에셋 저장소 맵핑 (슬라이싱된 PNG 연결)
const UI_ASSETS: Partial<Record<UIAssetKey, string>> = {
  screen_home: screenHome,
  screen_shop: screenShop,
  screen_skin: screenSkin,
  screen_mission: screenMission,
  screen_challenge: screenChallenge,
  bg_barn_sunlight: bgBarnSunlight,
  bg_barn_loft: bgBarnLoft,
  header_profile_board: headerProfileBoard,
  header_wheat_board: headerWheatBoard,
  header_feather_board: headerFeatherBoard,
  header_shell_board: headerShellBoard,
  btn_settings_cog: btnSettingsCog,
  dock_wood_plank: dockWoodPlank,
  tab_shop: tabShop,
  tab_skin: tabSkin,
  tab_home_center: tabHomeCenter,
  tab_mission: tabMission,
  tab_challenge: tabChallenge,
  btn_orange_jelly_large: btnOrangeJellyLarge,
  btn_orange_jelly_medium: btnOrangeJellyMedium,
  btn_wood_medium: btnWoodMedium,
  btn_wood_square: btnWoodSquare,
  tag_wheat_cost: tagWheatCost,
  nest_straw_hero: nestStrawHero,
  panel_rope_wood_large: panelRopeWoodLarge,
  panel_wood_card_slot: panelWoodCardSlot,
  track_wooden_bridge: trackWoodenBridge,
  prop_golden_feather: propGoldenFeather,
  icon_turn_arrow: iconTurnArrow,
  icon_jump_arrow: iconJumpArrow,
};

const EGG_ASSETS: Partial<Record<EggAssetKey, string>> = {
  egg_baby_sprout: eggBabySprout,
};

/**
 * UI 에셋 경로를 반환합니다.
 * 아직 PNG 에셋이 생성되지 않은 경우 null을 반환하여 기존 컴포넌트로 자동 폴백됩니다.
 */
export function getUIAsset(key: UIAssetKey): string | null {
  return UI_ASSETS[key] || null;
}

/**
 * 계란 캐릭터 PNG 에셋 경로를 반환합니다.
 */
export function getEggAsset(key: EggAssetKey): string | null {
  return EGG_ASSETS[key] || null;
}

/**
 * 에셋 등록 헬퍼 (동적 등록 지원)
 */
export function registerUIAsset(key: UIAssetKey, url: string): void {
  UI_ASSETS[key] = url;
}

export function registerEggAsset(key: EggAssetKey, url: string): void {
  EGG_ASSETS[key] = url;
}
