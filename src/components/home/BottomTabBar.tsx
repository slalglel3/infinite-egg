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
    <nav className="w-full bg-white/95 backdrop-blur-lg border-t-2 border-amber-200/80 shadow-[0_-8px_25px_rgba(0,0,0,0.08)] px-2 pt-2 pb-safe z-30 flex items-center justify-around">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const isMain = tab.id === 'MAIN';

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabClick(tab.id)}
            className={`relative flex flex-col items-center justify-center flex-1 py-1.5 transition-all select-none cursor-pointer ${
              isActive ? 'scale-105' : 'opacity-65 hover:opacity-90'
            }`}
          >
            {/* 메인 탭 특별 원형 하이라이트 또는 일반 탭 활성 캡슐 */}
            <div
              className={`flex items-center justify-center transition-all ${
                isMain
                  ? isActive
                    ? 'w-12 h-12 -mt-4 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-500/40 border-2 border-white'
                    : 'w-11 h-11 -mt-3 rounded-2xl bg-amber-100 text-amber-700'
                  : isActive
                  ? 'w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 font-bold'
                  : 'w-10 h-10 text-gray-500'
              }`}
            >
              <Icon size={isMain ? 24 : 20} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
            </div>

            {/* 탭 라벨 */}
            <span
              className={`text-[11px] font-black mt-0.5 tracking-tight ${
                isActive ? 'text-amber-800' : 'text-gray-500 font-bold'
              }`}
            >
              {tab.label}
            </span>

            {/* 도전 과제 보상 획득 가능 붉은 배지 */}
            {tab.id === 'ACHIEVEMENTS' && achievementBadgeCount > 0 && (
              <span className="absolute top-0 right-3 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm animate-pulse">
                {achievementBadgeCount}
              </span>
            )}

            {/* 활성 인디케이터 점 */}
            {isActive && !isMain && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-0.5" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
