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

// 8대 대표 원화 스킨 ID 매핑
const ART_SKIN_MAP: Record<string, number> = {
  classic: 0,
  soft_boiled: 1,
  quail: 2,
  dino: 3,
  cyber: 4,
  galaxy: 5,
  police_egg: 6,
  golden: 7,
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

  const isCustomEgg = currentSkin.id !== 'classic' && currentSkin.id !== 'default' && currentSkin.id !== 'baby_sprout';
  const customArtIndex = ART_SKIN_MAP[currentSkin.id] ?? 0;
  const customArtSrc = EGG_ART_LIST[customArtIndex] || EGG_ART_LIST[0];

  return (
    <div className="w-full h-full relative select-none">
      {/* 1. 둥지 뒤쪽 원목 이름 팻말 라이브 텍스트 (블랭킹 처리된 팻말 위에 현재 장착된 달걀 이름 표시) */}
      <div className="pointer-events-none absolute top-[30.8%] left-[36.0%] w-[28.0%] h-[3.2%] flex items-center justify-center text-center z-10">
        <span
          style={{ fontFamily: "'Fredoka', 'Jua', 'Black Han Sans', sans-serif" }}
          className="text-[11px] sm:text-xs font-black text-amber-50 drop-shadow-[0_1.5px_1px_#2b1306] truncate px-1"
        >
          {currentSkin.name}
        </span>
      </div>

      {/* 2. 중앙: 둥지 터치 영역 (스킨 변경 이동) (Y: 28% ~ 56%, X: 15% ~ 85%) */}
      <div
        onClick={onGoToEggsTab}
        className="pointer-events-auto absolute top-[28%] left-[15%] right-[15%] h-[28%] flex items-center justify-center cursor-pointer group active:scale-95 transition-transform z-10"
        title="터치하여 스킨 및 달걀 변경"
      >
        {/* 기본 달걀 외 다른 3D 원화 달걀 장착 시 둥지 안쪽에 자연스럽게 안착 */}
        {isCustomEgg && (
          <div className="absolute top-[30%] w-[28%] aspect-square flex items-center justify-center pointer-events-none">
            <img
              src={customArtSrc}
              alt={currentSkin.name}
              className="w-full h-full object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.6)]"
            />
          </div>
        )}
      </div>

      {/* 3. 하단: [출발하기!] 대형 3D 버튼 인터랙티브 터치 영역 (Y: 62.1%, X: 31.6%, W: 36.8%, H: 10.3%) */}
      <button
        type="button"
        onClick={handleStart}
        className="pointer-events-auto absolute top-[62.1%] left-[31.6%] w-[36.8%] h-[10.3%] flex items-center justify-center cursor-pointer active:scale-95 transition-transform group rounded-3xl z-10"
        title="출발하기!"
      >
        {/* 버튼 터치 시 미세한 황금빛 광휘 피드백 */}
        <div className="w-full h-full rounded-3xl group-active:bg-amber-400/20 transition-colors" />
      </button>
    </div>
  );
};
