import React from 'react';
import { UserProgress, EggSkin } from '../../../types/game';
import { NestIllustration } from '../NestIllustration';
import { sound } from '../../../audio/sound';
import { getUIAsset, getEggAsset } from '../../../assets/assetRegistry';

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

  const nestHero = getUIAsset('nest_straw_hero');
  const eggSprout = getEggAsset('egg_baby_sprout');
  const tagWheat = getUIAsset('tag_wheat_cost');
  const btnStart = getUIAsset('btn_orange_jelly_large');

  return (
    <div className="flex-1 flex flex-col items-center justify-between px-4 py-2 safe-container overflow-hidden select-none">
      {/* 1. 중앙: 헛간 볏짚 둥지 & 꼬마 에그 영웅 쇼케이스 (home.png 100% 매칭) */}
      <div className="flex-1 flex flex-col items-center justify-center w-full my-auto z-10">
        {nestHero ? (
          <div
            onClick={onGoToEggsTab}
            className="relative w-full max-w-[340px] aspect-[4/3] flex items-center justify-center cursor-pointer group select-none transition-transform active:scale-95"
            title="터치하여 스킨 및 의상 변경"
          >
            {/* 고해상도 볏짚 둥지 에셋 */}
            <img
              src={nestHero}
              alt="볏짚 둥지"
              className="w-full h-full object-contain drop-shadow-2xl"
            />

            {/* 볏짚 둥지 위에 앉아 숨쉬는 꼬마 에그 (스킨 변경 연동) */}
            <div className="absolute top-[20%] w-[42%] aspect-square flex items-center justify-center">
              {eggSprout ? (
                <img
                  src={eggSprout}
                  alt={currentSkin.name}
                  className="w-full h-full object-contain drop-shadow-lg transition-transform group-hover:scale-105"
                />
              ) : (
                <NestIllustration
                  skin={currentSkin}
                  equippedCostumes={progress.equippedCostumes}
                  onEggClick={onGoToEggsTab}
                />
              )}
            </div>
          </div>
        ) : (
          /* 구버전 SVG 둥지 폴백 */
          <div className="my-auto py-2 flex flex-col items-center relative">
            <NestIllustration
              skin={currentSkin}
              equippedCostumes={progress.equippedCostumes}
              onEggClick={onGoToEggsTab}
            />
          </div>
        )}
      </div>

      {/* 2. 하단: [활동력 🌾 5] 태그 & [출발하기!] 대형 오렌지 3D 버튼 (home.png 100% 매칭) */}
      <div className="w-full max-w-sm flex flex-col items-center mb-3 z-20">
        {/* 활동력 소모 목판 태그 */}
        {tagWheat ? (
          <div className="h-8 -mb-1 z-10 drop-shadow-md flex items-center justify-center">
            <img src={tagWheat} alt="활동력 🌾 5" className="h-full object-contain select-none pointer-events-none" />
          </div>
        ) : (
          <div className="bg-[#42220d] text-[#fde047] border-2 border-[#241005] px-3.5 py-0.5 rounded-t-xl text-xs font-black shadow-md flex items-center gap-1 z-10 -mb-1">
            <span>활동력</span>
            <span>🌾 5</span>
          </div>
        )}

        {/* 초대형 오렌지 3D 젤리 버튼 (출발하기!) */}
        <button
          type="button"
          onClick={handleStart}
          className="w-full h-18 flex items-center justify-center cursor-pointer group active:scale-95 transition-all"
        >
          {btnStart ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={btnStart}
                alt="출발하기"
                className="w-full h-full object-contain drop-shadow-2xl select-none pointer-events-none"
              />
              <span
                style={{
                  fontFamily: "'Fredoka', 'Jua', 'Black Han Sans', sans-serif",
                  textShadow: '-2px -2px 0 #451a03, 2px -2px 0 #451a03, -2px 2px 0 #451a03, 2px 2px 0 #451a03, 0 3px 0 #240e02',
                }}
                className="absolute text-2xl sm:text-3xl font-black text-white tracking-wider pb-1"
              >
                출발하기!
              </span>
            </div>
          ) : (
            <div className="w-full h-16 rounded-3xl bg-gradient-to-b from-[#fcd34d] via-[#f59e0b] to-[#d97706] border-4 border-[#451a03] shadow-[0_6px_0_#451a03] flex items-center justify-center gap-2 group-active:translate-y-1.5 group-active:shadow-[0_1px_0_#451a03]">
              <span
                style={{
                  fontFamily: "'Fredoka', 'Jua', 'Black Han Sans', sans-serif",
                  textShadow: '-2px -2px 0 #451a03, 2px -2px 0 #451a03, -2px 2px 0 #451a03, 2px 2px 0 #451a03, 0 3px 0 #240e02',
                }}
                className="text-3xl font-black text-white tracking-wider"
              >
                출발하기!
              </span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
