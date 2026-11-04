import React from 'react';
import { UserProgress, EggSkin } from '../../../types/game';
import { NestIllustration } from '../NestIllustration';
import { sound } from '../../../audio/sound';

interface MainTabProps {
  progress: UserProgress;
  currentSkin: EggSkin;
  onStartGame: () => void;
  onGoToEggsTab: () => void;
}

export const MainTab: React.FC<MainTabProps> = ({
  progress,
  currentSkin,
  onStartGame,
  onGoToEggsTab,
}) => {
  const handleStart = () => {
    sound.playJump();
    onStartGame();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-between px-4 py-1.5 safe-container overflow-hidden select-none">
      {/* 1. 상단: 콘셉트 이미지 1:1 반영 캐릭터 이름 나무 명판 (꼬마 에그) */}
      <div className="flex flex-col items-center z-20 mt-1">
        <div className="wood-badge px-4 py-1 text-xs font-black shadow-lg flex items-center gap-1.5 border-2 border-[#2b1306]">
          <span className="text-amber-200">🌱</span>
          <span className="text-white drop-shadow tracking-wide">{currentSkin.name}</span>
        </div>
      </div>

      {/* 2. 중앙: 지푸라기와 나뭇가지로 짠 따뜻한 둥지 쇼케이스 */}
      <div className="my-auto py-1 flex flex-col items-center relative">
        <NestIllustration
          skin={currentSkin}
          equippedCostumes={progress.equippedCostumes}
          onEggClick={onGoToEggsTab}
        />
      </div>

      {/* 3. 하단: 밧줄로 묶인 조각 나무 간판 & 초대형 [출발하기! (PLAY)] 버튼 */}
      <div className="w-full max-w-xs flex flex-col items-center mb-1.5 z-20">
        {/* 밧줄로 묶인 원목 간판 거치대 (Rope Signboard) */}
        <div className="signboard-wood-frame w-full p-2.5 pt-3 pb-3 flex flex-col items-center gap-2">
          {/* 간판 좌우 상단 매듭 밧줄 시각 디테일 */}
          <div className="absolute -top-3 left-4 text-xs font-black text-amber-200 opacity-80 pointer-events-none">
            🪢
          </div>
          <div className="absolute -top-3 right-4 text-xs font-black text-amber-200 opacity-80 pointer-events-none">
            🪢
          </div>

          {/* 상단 미니 뱃지 (활동력 ⚡ 5 or 최고 기록) */}
          <div className="wood-badge py-0.5 px-3 -mt-5 shadow-md flex items-center gap-1 text-[11px] font-black border-2 border-[#2b1306]">
            <span className="text-amber-300">활동력</span>
            <span className="text-yellow-400">⚡</span>
            <span className="text-white">5</span>
            <span className="text-amber-200/50 mx-0.5">|</span>
            <span className="text-amber-200 text-[10px]">{progress.bestDistanceMeters}m</span>
          </div>

          {/* 초대형 쫀득한 골든 앰버 [출발하기! (PLAY)] 버튼 */}
          <button
            type="button"
            onClick={handleStart}
            className="btn-play-sunshine w-full h-17 rounded-3xl flex flex-col items-center justify-center cursor-pointer group active:scale-95 transition-transform"
          >
            <span
              style={{
                fontFamily: "'Fredoka', 'Jua', 'Black Han Sans', sans-serif",
                WebkitTextStroke: '1.2px #2b1306',
                textShadow: '-2px -2px 0 #2b1306, 2px -2px 0 #2b1306, -2px 2px 0 #2b1306, 2px 2px 0 #2b1306, 0 4px 0 #170902',
              }}
              className="text-2xl sm:text-3xl font-black text-white tracking-wider leading-none drop-shadow-md"
            >
              출발하기!
            </span>
            <span
              style={{
                fontFamily: "'Fredoka', 'Jua', sans-serif",
                textShadow: '0 1.5px 2px rgba(43, 19, 6, 0.7)',
              }}
              className="text-xs sm:text-sm font-black text-yellow-100 tracking-wider mt-0.5"
            >
              (PLAY)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
