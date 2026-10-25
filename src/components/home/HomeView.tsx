import React, { useState } from 'react';
import { UserProgress, HomeTabType, EventMapItem } from '../../types/game';
import { getEggSkinById } from '../../data/eggSkins';
import { ACHIEVEMENTS, getAchievementProgress } from '../../data/achievements';
import { HomeHeader } from './HomeHeader';
import { BottomTabBar } from './BottomTabBar';
import { MainTab } from './tabs/MainTab';
import { EggsTab } from './tabs/EggsTab';
import { EventsTab } from './tabs/EventsTab';
import { AchievementsTab } from './tabs/AchievementsTab';
import { ShopTab } from './tabs/ShopTab';

interface HomeViewProps {
  progress: UserProgress;
  isMuted: boolean;
  onToggleMute: () => void;
  onStartGame: (eventMap?: EventMapItem) => void;
  onUpdateProgress: (updated: UserProgress) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  progress,
  isMuted,
  onToggleMute,
  onStartGame,
  onUpdateProgress,
}) => {
  const [activeTab, setActiveTab] = useState<HomeTabType>('MAIN');

  const currentSkin = getEggSkinById(progress.selectedEggId);

  // 수령 가능한 도전 과제 개수 계산 (하단 탭 뱃지)
  const unclaimedCount = ACHIEVEMENTS.filter((ach) => {
    const val = getAchievementProgress(ach.id, progress);
    const isDone = val >= ach.target;
    const isClaimed = progress.claimedAchievementIds.includes(ach.id);
    return isDone && !isClaimed;
  }).length;

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-amber-50 to-amber-100 flex flex-col justify-between select-none z-20 overflow-hidden">
      {/* 1. 상단 공통 헤더 */}
      <HomeHeader
        progress={progress}
        isMuted={isMuted}
        onToggleMute={onToggleMute}
      />

      {/* 2. 중앙 탭 컨텐츠 렌더링 영역 */}
      <main className="flex-1 flex flex-col min-h-0 w-full relative">
        {activeTab === 'MAIN' && (
          <MainTab
            progress={progress}
            currentSkin={currentSkin}
            onStartGame={() => onStartGame()}
            onGoToEggsTab={() => setActiveTab('EGGS')}
          />
        )}

        {activeTab === 'EGGS' && (
          <EggsTab
            progress={progress}
            onUpdateProgress={onUpdateProgress}
          />
        )}

        {activeTab === 'EVENTS' && (
          <EventsTab
            onStartEventGame={(eventMap) => onStartGame(eventMap)}
          />
        )}

        {activeTab === 'ACHIEVEMENTS' && (
          <AchievementsTab
            progress={progress}
            onUpdateProgress={onUpdateProgress}
          />
        )}

        {activeTab === 'SHOP' && (
          <ShopTab
            progress={progress}
            onUpdateProgress={onUpdateProgress}
          />
        )}
      </main>

      {/* 3. 하단 5대 탭 바텀 네비게이션 */}
      <BottomTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        achievementBadgeCount={unclaimedCount}
      />
    </div>
  );
};
