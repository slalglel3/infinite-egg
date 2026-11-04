import React from 'react';
import { HomeTabType } from '../../types/game';
import { sound } from '../../audio/sound';

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

// 달걀 공방 & 시골 헛간 아케이드 5대 핵심 탭
const TABS: TabItem[] = [
  { id: 'EGGS', label: '도감', subLabel: 'EGGS', icon: '🥚' },
  { id: 'EVENTS', label: '이벤트', subLabel: 'EVENTS', icon: '🔥' },
  { id: 'MAIN', label: '홈', subLabel: 'HOME', icon: '🏠' },
  { id: 'ACHIEVEMENTS', label: '도전과제', subLabel: 'QUEST', icon: '📜' },
  { id: 'SHOP', label: '상점', subLabel: 'SHOP', icon: '🏪' },
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

  return (
    <nav className="w-full nav-wood-dock px-1.5 pt-1.5 pb-safe z-30 flex items-end justify-around select-none">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const isMain = tab.id === 'MAIN';

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabClick(tab.id)}
            className={`relative flex flex-col items-center justify-end flex-1 pb-1 transition-all select-none cursor-pointer ${
              isActive ? 'scale-105' : 'opacity-80 hover:opacity-100'
            }`}
          >
            {/* 1. 상단 아이콘 영역 */}
            {isMain ? (
              /* 중앙 홈 탭: 볏짚 둥지 화환 (Straw Wreath) 원형 돌출 버튼 */
              <div className="relative -mt-6 mb-0.5">
                <div className="nav-straw-wreath w-13 h-13 rounded-full flex items-center justify-center text-2xl shadow-xl transition-transform active:scale-95">
                  <span className="drop-shadow-md">🏠</span>
                </div>
              </div>
            ) : (
              /* 일반 탭 아이콘 */
              <div className="w-9 h-9 flex items-center justify-center text-2xl mb-0.5 transition-transform active:scale-95">
                <span className="drop-shadow-sm">{tab.icon}</span>
              </div>
            )}

            {/* 2. 하단 조각 나무 라벨 명판 (상점/SHOP, 보관함/SKINS 등) */}
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

            {/* 미션 알림 레드닷 뱃지 */}
            {tab.id === 'ACHIEVEMENTS' && achievementBadgeCount > 0 && (
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
