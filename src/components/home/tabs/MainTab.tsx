import React from 'react';
import { UserProgress, EggSkin } from '../../../types/game';
import { NestIllustration } from '../NestIllustration';
import { Play, Trophy, Footprints, Shirt, Sparkles } from 'lucide-react';
import { sound } from '../../../audio/sound';
import { getUIAsset } from '../../../assets/assetRegistry';

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
      {/* 1. 상단: 장인의 달걀 공방 타이틀 & 장착 스킨 명판 */}
      <div className="flex flex-col items-center z-20 mt-1 gap-1">
        <h1
          style={{
            fontFamily: "'Fredoka', 'Jua', 'Black Han Sans', sans-serif",
            textShadow: '-2px -2px 0 #2b1306, 2px -2px 0 #2b1306, -2px 2px 0 #2b1306, 2px 2px 0 #2b1306, 0 4px 0 #170902',
          }}
          className="text-2xl sm:text-3xl font-black text-amber-300 tracking-wider drop-shadow"
        >
          무한의 계란
        </h1>

        {/* 장착 중인 캐릭터 명판 (원목 조각 뱃지) */}
        <div className="wood-badge px-3.5 py-0.5 text-xs font-black shadow-md flex items-center gap-1.5 border-2 border-[#2b1306]">
          <Sparkles size={12} className="text-amber-300" />
          <span className="text-white drop-shadow tracking-wide">{currentSkin.name}</span>
          {currentSkin.hpBonus > 0 && (
            <span className="bg-emerald-600/90 text-white text-[9px] px-1.5 py-0.2 rounded-full border border-emerald-400">
              +{currentSkin.hpBonus} HP
            </span>
          )}
        </div>
      </div>

      {/* 2. 중앙: 장인의 따뜻한 지푸라기 둥지 쇼케이스 & 의상실 이동 버튼 */}
      <div className="my-auto py-1 flex flex-col items-center relative z-10">
        <NestIllustration
          skin={currentSkin}
          equippedCostumes={progress.equippedCostumes}
          onEggClick={onGoToEggsTab}
        />

        {/* 의상실 바로가기 원목 캡슐 버튼 */}
        <button
          type="button"
          onClick={onGoToEggsTab}
          className="wood-badge mt-2 px-3.5 py-1 rounded-full flex items-center gap-1.5 text-xs font-black cursor-pointer active:scale-95 transition-transform"
        >
          <Shirt size={13} className="text-amber-300" />
          <span className="text-amber-100">의상 코디실 ↷</span>
        </button>
      </div>

      {/* 3. 하단: 원목 기록 전광판 & 초대형 3D [ 굴러가기! PLAY ▶ ] 버튼 */}
      <div className="w-full max-w-sm flex flex-col items-center gap-2 mb-2 z-20">
        {/* 실제 게임 누적 통계 바 (최고 기록 & 누적 주행) */}
        <div className="w-full grid grid-cols-2 gap-2">
          <div className="wood-badge py-1.5 px-2.5 justify-center rounded-xl text-center">
            <Trophy size={13} className="text-amber-300 shrink-0" />
            <span className="text-xs font-black text-amber-100">{progress.bestDistanceMeters.toLocaleString()}m 최고</span>
          </div>
          <div className="wood-badge py-1.5 px-2.5 justify-center rounded-xl text-center">
            <Footprints size={13} className="text-sky-300 shrink-0" />
            <span className="text-xs font-black text-amber-100">{progress.totalGamesPlayed}판 질주</span>
          </div>
        </div>

        {/* 밧줄 목판 프레임 위에 얹힌 [활동력 🌾 5] 태그 & [출발하기!] 대형 오렌지 3D 버튼 */}
        <div className="w-full flex flex-col items-center">
          {/* 활동력 소모 목판 태그 */}
          {getUIAsset('tag_wheat_cost') ? (
            <div className="h-7 -mb-1 z-10 drop-shadow-md">
              <img src={getUIAsset('tag_wheat_cost')!} alt="활동력 🌾 5" className="h-full object-contain" />
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
            {getUIAsset('btn_orange_jelly_large') ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={getUIAsset('btn_orange_jelly_large')!}
                  alt="출발하기"
                  className="w-full h-full object-contain drop-shadow-2xl"
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
    </div>
  );
};
