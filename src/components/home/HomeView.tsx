import React, { useState } from 'react';
import { UserProgress, HomeTabType, EventMapItem } from '../../types/game';
import { getEggSkinById } from '../../data/eggSkins';
import { ACHIEVEMENTS, getAchievementProgress } from '../../data/achievements';
import { getUIAsset } from '../../assets/assetRegistry';
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

  // 5대 핵심 화면 마스터 에셋 매핑 (각 탭마다 전용 고화질 1536x2752 화면 표시)
  const screenAssetMap: Record<HomeTabType, string | null> = {
    MAIN: getUIAsset('screen_home'),
    SHOP: getUIAsset('screen_shop'),
    SKINS: getUIAsset('screen_skin'),
    MISSIONS: getUIAsset('screen_mission'),
    CHALLENGE: getUIAsset('screen_challenge'),
  };

  const currentScreen = screenAssetMap[activeTab] || getUIAsset('screen_home');

  return (
    <div className="absolute inset-0 bg-[#1a0a03] flex items-center justify-center select-none z-20 overflow-hidden">
      {/* 9:16 모바일 마스터 프레임 (왜곡 없이 100% 비율 고정) */}
      <div 
        className="relative w-full h-full max-w-[480px] aspect-[1536/2752] max-h-screen flex flex-col justify-between overflow-hidden shadow-2xl bg-cover bg-center"
        style={currentScreen ? { backgroundImage: `url(${currentScreen})` } : undefined}
      >
        {/* 1. 상단 공통 헤더 (라이브 데이터 텍스트 오버레이) */}
        <HomeHeader
          progress={progress}
          isMuted={isMuted}
          onToggleMute={onToggleMute}
          onUpdateProgress={onUpdateProgress}
          isShellShopOpen={activeTab === 'SHOP'}
        />

        {/* 2. 중앙 탭 컨텐츠 렌더링 영역 */}
        <main className="flex-1 w-full relative overflow-hidden">
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

        {/* 3. 하단 5대 탭 터치 바텀 네비게이션 */}
        <BottomTabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          achievementBadgeCount={unclaimedCount}
        />
      </div>
    </div>
  );
};
