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
}

// 팜하우스 테마 5대 핵심 탭 (좌측부터: 상점, 스킨, 홈, 미션, 도전)
const TABS: TabItem[] = [
  { id: 'SHOP', label: '상점' },
  { id: 'SKINS', label: '스킨' },
  { id: 'MAIN', label: '홈' },
  { id: 'MISSIONS', label: '미션' },
  { id: 'CHALLENGE', label: '도전' },
];

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab: _activeTab,
  onTabChange,
  achievementBadgeCount = 0,
}) => {
  const handleTabClick = (tab: HomeTabType) => {
    sound.playTurn();
    onTabChange(tab);
  };

  return (
    <nav className="w-full h-[12%] pb-2 px-1 z-30 flex items-center justify-around select-none">
      {TABS.map((tab) => {
        const isMission = tab.id === 'MISSIONS';

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabClick(tab.id)}
            className="relative w-1/5 h-full flex flex-col items-center justify-center cursor-pointer active:scale-90 transition-transform group"
            title={tab.label}
          >
            {/* 터치 피드백 영역 */}
            <div className="w-12 h-12 rounded-2xl group-active:bg-amber-400/20 transition-colors" />

            {/* 미션 탭 수령 가능한 보상 알림 뱃지 */}
            {isMission && achievementBadgeCount > 0 && (
              <span className="absolute top-1 right-2 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg border border-white animate-pulse">
                {achievementBadgeCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
