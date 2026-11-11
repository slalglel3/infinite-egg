import React from 'react';
import { UserProgress, EggSkin } from '../../../types/game';
import { sound } from '../../../audio/sound';
import { EGG_ART_LIST } from '../../../assets/assetRegistry';

interface MainTabProps {
  progress: UserProgress;
  currentSkin: EggSkin;
  onStartGame: () => void;
  onGoToEggsTab: () => void;
}

// 6대 대표 원화 스킨 ID 매핑 (인덱스 0~5)
const ART_SKIN_MAP: Record<string, number> = {
  baby_egg: 0,
  classic: 0,
  default: 0,
  baked_egg: 1,
  soft_boiled: 1,
  pirate_egg: 2,
  quail: 2,
  winter_egg: 3,
  dino: 3,
  astro_egg: 4,
  cyber: 4,
  chicken_egg: 5,
  galaxy: 5,
};

export const MainTab: React.FC<MainTabProps> = ({
  progress: _progress,
  currentSkin,
  onStartGame,
  onGoToEggsTab,
}) => {
  const handleStart = () => {
    sound.playJump();
    onStartGame();
  };

  const customArtIndex = ART_SKIN_MAP[currentSkin.id] ?? 0;
  // If not baby_egg, render custom 3D egg artwork sitting gracefully in nest
  const isCustomEgg = customArtIndex > 0;
  const customArtSrc = EGG_ART_LIST[customArtIndex] || EGG_ART_LIST[0];

  return (
    <div className="w-full h-full relative select-none">
      {/* 1. 둥지 뒤쪽 원목 이름 팻말 라이브 텍스트 (원목 팻말 위에 현재 장착된 달걀 이름 표시) */}
      <div className="pointer-events-none absolute top-[30.4%] left-[38.8%] w-[22.4%] h-[4.0%] flex items-center justify-center text-center z-10">
        <span
          style={{ fontFamily: "'NanumSquareRound', 'Jua', 'Black Han Sans', sans-serif" }}
          className="text-xs sm:text-sm font-black text-amber-50 drop-shadow-[0_2px_2px_rgba(40,15,5,0.95)] truncate px-1"
        >
          {currentSkin.name}
        </span>
      </div>

      {/* 2. 중앙: 둥지 안 달걀 (원화 둥지 내부에 완벽히 안착 & 터치 시 스킨 변경) */}
      <div
        onClick={onGoToEggsTab}
        className="pointer-events-auto absolute top-[39.2%] left-[33.5%] w-[33.0%] aspect-square flex items-center justify-center cursor-pointer group active:scale-95 transition-transform z-10"
        title="터치하여 스킨 및 달걀 변경"
      >
        <div className="w-full h-full flex items-center justify-center pointer-events-none animate-gentle-bob">
          <img
            src={customArtSrc}
            alt={currentSkin.name}
            className="w-full h-full object-contain drop-shadow-[0_12px_18px_rgba(40,15,5,0.75)]"
          />
        </div>
      </div>

      {/* 3. 하단: [출발하기!] 대형 3D 버튼 인터랙티브 터치 영역 (Y: 62.1%, X: 31.6%, W: 36.8%, H: 10.3%) */}
      <button
        type="button"
        onClick={handleStart}
        className="pointer-events-auto absolute top-[62.1%] left-[31.6%] w-[36.8%] h-[10.3%] flex items-center justify-center cursor-pointer active:scale-95 transition-transform group rounded-3xl z-10"
        title="출발하기!"
        aria-label="출발하기!"
      >
        <span className="sr-only">출발하기!</span>
        {/* 버튼 터치 시 미세한 황금빛 광휘 피드백 */}
        <div className="w-full h-full rounded-3xl group-active:bg-amber-400/25 transition-colors" />
      </button>
    </div>
  );
};
