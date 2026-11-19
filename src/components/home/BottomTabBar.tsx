import React from 'react';
import { HomeTabType } from '../../types/game';
import { sound } from '../../audio/sound';

interface BottomTabBarProps {
  activeTab: HomeTabType;
  onTabChange: (tab: HomeTabType) => void;
}

interface TabItem {
  id: HomeTabType;
  num: number;
  label: string;
}

const TABS: TabItem[] = [
  { id: 'EGGS', num: 1, label: '도감' },
  { id: 'EVENTS', num: 2, label: '이벤트' },
  { id: 'MAIN', num: 3, label: '홈' },
  { id: 'ACHIEVEMENTS', num: 4, label: '도전과제' },
  { id: 'SHOP', num: 5, label: '상점' },
];

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const handleTabClick = (tab: HomeTabType) => {
    sound.playTurn();
    onTabChange(tab);
  };

  return (
    <nav className="w-full border-t-2 border-slate-900 bg-white px-2 pt-2 pb-safe z-30 grid grid-cols-5 gap-1.5 select-none">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabClick(tab.id)}
            className={`h-13 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
              isActive
                ? 'border-2 border-slate-900 bg-slate-900/5 text-slate-900 font-black'
                : 'border border-slate-300 bg-transparent text-slate-500 font-bold hover:border-slate-500'
            }`}
          >
            <span className="text-[10px] font-mono leading-none opacity-60">
              {tab.num}
            </span>
            <span className="text-[11px] sm:text-xs leading-tight tracking-tight whitespace-nowrap">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
