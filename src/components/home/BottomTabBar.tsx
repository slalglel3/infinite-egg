import React from 'react';
import { HomeTabType } from '../../types/game';
import { sound } from '../../audio/sound';
import { getUIAsset } from '../../assets/assetRegistry';

interface BottomTabBarProps {
  activeTab: HomeTabType;
  onTabChange: (tab: HomeTabType) => void;
  achievementBadgeCount?: number;
}

interface TabItem {
  id: HomeTabType;
  label: string;
  subLabel: string;
  icon: string;
}

// 팜하우스 테마 5대 핵심 탭 (좌측부터: 상점, 스킨, 홈, 미션, 도전)
const TABS: TabItem[] = [
  { id: 'SHOP', label: '상점', subLabel: 'SHOP', icon: '🏪' },
  { id: 'SKINS', label: '스킨', subLabel: 'SKIN', icon: '👕' },
  { id: 'MAIN', label: '홈', subLabel: 'HOME', icon: '🏠' },
  { id: 'MISSIONS', label: '미션', subLabel: 'MISSION', icon: '📋' },
  { id: 'CHALLENGE', label: '도전', subLabel: 'CHALLENGE', icon: '⚔️' },
];

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabChange,
  achievementBadgeCount = 0,
}) => {
  const handleTabClick = (tab: HomeTabType) => {
    sound.playTurn();
    onTabChange(tab);
  };

  const tabAssetMap: Record<HomeTabType, string | null> = {
    SHOP: getUIAsset('tab_shop'),
    SKINS: getUIAsset('tab_skin'),
    MAIN: getUIAsset('tab_home_center'),
    MISSIONS: getUIAsset('tab_mission'),
    CHALLENGE: getUIAsset('tab_challenge'),
  };

  const dockPlank = getUIAsset('dock_wood_plank');

  return (
    <nav 
      className="w-full nav-wood-dock px-1.5 pt-1.5 pb-safe z-30 flex items-end justify-around select-none"
      style={dockPlank ? { backgroundImage: `url(${dockPlank})`, backgroundSize: 'cover', backgroundPosition: 'bottom' } : undefined}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const isMain = tab.id === 'MAIN';
        const assetImg = tabAssetMap[tab.id];

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabClick(tab.id)}
            className={`relative flex flex-col items-center justify-end flex-1 pb-1 transition-all select-none cursor-pointer ${
              isActive ? 'scale-105' : 'opacity-85 hover:opacity-100'
            }`}
          >
            {/* 1. 탭 아이콘 & 라벨 렌더링 */}
            {assetImg ? (
              /* 신규 슬라이싱 고화질 탭 PNG (아이콘+명판 일체형) */
              <div className={`relative flex items-center justify-center transition-transform active:scale-95 ${
                isMain ? '-mt-6 w-16 h-18 drop-shadow-xl' : 'w-14 h-16 drop-shadow-md'
              }`}>
                <img
                  src={assetImg}
                  alt={tab.label}
                  className="w-full h-full object-contain select-none pointer-events-none"
                />
              </div>
            ) : (
              /* 구버전 CSS 폴백 (에셋 없을 때만 렌더링) */
              <>
                {isMain ? (
                  <div className="relative -mt-7 mb-0.5">
                    <div className="nav-straw-wreath w-13 h-13 rounded-full flex items-center justify-center text-2xl shadow-xl transition-transform active:scale-95">
                      <span className="drop-shadow-md">🏠</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center mb-0.5 transition-transform active:scale-95">
                    <span className="text-2xl drop-shadow-sm">{tab.icon}</span>
                  </div>
                )}
                <div
                  className={`w-14 py-0.5 rounded-lg border-2 flex flex-col items-center justify-center leading-none shadow-sm transition-all ${
                    isActive
                      ? 'bg-gradient-to-b from-[#e5a93b] to-[#b47118] border-[#381a06] text-[#2b1204]'
                      : 'bg-gradient-to-b from-[#7a441e] to-[#54290d] border-[#291205] text-[#d4a87a]'
                  }`}
                >
                  <span className={`text-[11px] font-black tracking-tight ${isActive ? 'text-[#1e0d02]' : 'text-amber-100'}`}>
                    {tab.label}
                  </span>
                  <span className={`text-[8px] font-extrabold tracking-tighter scale-90 ${isActive ? 'text-[#381a06]' : 'text-amber-200/60'}`}>
                    {tab.subLabel}
                  </span>
                </div>
              </>
            )}

            {/* 미션 알림 레드닷 뱃지 */}
            {tab.id === 'MISSIONS' && achievementBadgeCount > 0 && (
              <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-bounce border border-[#4c0519]">
                {achievementBadgeCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
