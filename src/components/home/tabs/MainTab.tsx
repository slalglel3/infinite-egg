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

  // 기본 baby_sprout 외 다른 커스텀 스킨 장착 여부
  const isCustomSkin = currentSkin.id !== 'baby_sprout' && currentSkin.id !== 'classic' && currentSkin.id !== 'default';

  return (
    <div className="w-full h-full relative select-none">
      {/* 1. 중앙: 둥지 터치 영역 (스킨 변경 이동) (Y: 28% ~ 58%, X: 15% ~ 85%) */}
      <div
        onClick={onGoToEggsTab}
        className="pointer-events-auto absolute top-[28%] left-[15%] right-[15%] h-[30%] flex items-center justify-center cursor-pointer group active:scale-95 transition-transform"
        title="터치하여 스킨 및 의상 변경"
      >
        {/* 기본 달걀 외 다른 커스텀 스킨 장착 시 둥지 위에 자연스럽게 렌더링 */}
        {isCustomSkin && (
          <div className="w-[36%] aspect-square flex items-center justify-center animate-bounce-gentle drop-shadow-xl">
            <NestIllustration
              skin={currentSkin}
              equippedCostumes={progress.equippedCostumes}
              onEggClick={onGoToEggsTab}
            />
          </div>
        )}
      </div>

      {/* 2. 하단: [출발하기!] 대형 3D 버튼 인터랙티브 터치 영역 (Y: 62.1%, X: 31.6%, W: 36.8%, H: 10.3%) */}
      <button
        type="button"
        onClick={handleStart}
        className="pointer-events-auto absolute top-[62.1%] left-[31.6%] w-[36.8%] h-[10.3%] flex items-center justify-center cursor-pointer active:scale-95 transition-transform group rounded-3xl"
        title="출발하기!"
      >
        {/* 버튼 터치 시 미세한 황금빛 광휘 피드백 */}
        <div className="w-full h-full rounded-3xl group-active:bg-amber-400/20 transition-colors" />
      </button>
    </div>
  );
};
