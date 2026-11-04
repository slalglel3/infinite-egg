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
    <div className="absolute inset-0 bg-barn-workshop flex flex-col justify-between select-none z-20 overflow-hidden">
      {/* 따뜻한 햇살 광선 & 떠다니는 깃털/나뭇잎 장식 레이어 */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
        {/* 상단 좌측에서 쏟아지는 햇살 빛줄기 (God Rays) */}
        <div 
          className="absolute -top-10 -left-10 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255,250,200,0.6) 0%, rgba(255,220,120,0.2) 50%, transparent 80%)'
          }}
        />
        {/* 떠다니는 깃털과 나뭇잎 이모지 장식 */}
        <span className="absolute top-28 left-8 text-amber-200 text-lg opacity-60 animate-pulse">🍃</span>
        <span className="absolute top-44 right-12 text-yellow-100 text-sm opacity-50">🪶</span>
        <span className="absolute bottom-48 left-16 text-emerald-200 text-xs opacity-50">🌱</span>
        <span className="absolute bottom-56 right-20 text-amber-300 text-sm opacity-60">🍂</span>
      </div>

      {/* 1. 상단 공통 헤더 (상점 탭일 때만 껍데기 재화 추가 노출) */}
      <HomeHeader
        progress={progress}
        isMuted={isMuted}
        onToggleMute={onToggleMute}
        onUpdateProgress={onUpdateProgress}
        isShellShopOpen={activeTab === 'SHOP'}
      />

      {/* 2. 중앙 탭 컨텐츠 렌더링 영역 */}
      <main className="flex-1 flex flex-col min-h-0 w-full relative">
        {activeTab === 'MAIN' && (
          <MainTab
            progress={progress}
            currentSkin={currentSkin}
            onStartGame={() => onStartGame()}
            onGoToEggsTab={() => setActiveTab('SKINS')}
          />
        )}

        {activeTab === 'SKINS' && (
          <EggsTab
            progress={progress}
            onUpdateProgress={onUpdateProgress}
            onStartGame={() => onStartGame()}
          />
        )}

        {activeTab === 'CHALLENGE' && (
          <EventsTab
            onStartEventGame={(eventMap) => onStartGame(eventMap)}
          />
        )}

        {activeTab === 'MISSIONS' && (
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
