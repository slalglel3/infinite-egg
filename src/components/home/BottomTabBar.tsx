import React from 'react';
import { HomeTabType } from '../../types/game';
import { Egg, Flame, Home, Award, ShoppingBag } from 'lucide-react';
import { sound } from '../../audio/sound';

interface BottomTabBarProps {
  activeTab: HomeTabType;
  onTabChange: (tab: HomeTabType) => void;
  achievementBadgeCount?: number;
}

interface TabItem {
  id: HomeTabType;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const TABS: TabItem[] = [
  { id: 'EGGS', label: '계란', icon: Egg },
  { id: 'EVENTS', label: '이벤트', icon: Flame },
  { id: 'MAIN', label: '메인', icon: Home },
  { id: 'ACHIEVEMENTS', label: '도전과제', icon: Award },
  { id: 'SHOP', label: '상점', icon: ShoppingBag },
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
    <nav className="w-full bg-[#1e1b18] border-t-3 border-[#3f3a34] shadow-[0_-8px_25px_rgba(0,0,0,0.4)] px-2 pt-1 pb-safe z-30 flex items-center justify-around select-none">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const isMain = tab.id === 'MAIN';

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabClick(tab.id)}
            className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-all select-none cursor-pointer ${
              isActive ? 'scale-105' : 'opacity-65 hover:opacity-90'
            }`}
          >
            {/* 3D 탭 버튼 캡슐 */}
            <div
              className={`flex items-center justify-center transition-all ${
                isMain
                  ? isActive
                    ? 'btn-3d-amber w-12 h-12 -mt-4 rounded-2xl flex items-center justify-center'
                    : 'w-11 h-11 -mt-3 rounded-2xl bg-[#2b2724] text-amber-400 border-2 border-[#3f3a34]'
                  : isActive
                  ? 'w-10 h-10 rounded-2xl bg-amber-400 text-[#1e1b18] border-2 border-[#1e1b18] shadow-[0_3px_0_#92400e]'
                  : 'w-10 h-10 text-gray-400'
              }`}
            >
              <Icon size={isMain ? 24 : 20} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
            </div>

            {/* 탭 라벨 */}
            <span
              className={`text-[11px] font-black mt-1 tracking-tight ${
                isActive ? 'text-amber-400' : 'text-gray-400'
              }`}
            >
              {tab.label}
            </span>

            {/* 도전 과제 보상 획득 가능 붉은 배지 */}
            {tab.id === 'ACHIEVEMENTS' && achievementBadgeCount > 0 && (
              <span className="absolute top-0 right-3 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm animate-pulse border border-[#4c0519]">
                {achievementBadgeCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
