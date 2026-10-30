import React from 'react';
import { UserProgress, EggSkin } from '../../../types/game';
import { NestIllustration } from '../NestIllustration';
import { Play, Trophy, Footprints, Sparkles, Shirt } from 'lucide-react';
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
    <div className="flex-1 flex flex-col items-center justify-between px-4 py-2 safe-container overflow-hidden select-none">
      {/* 1. 상단: 무한의 계단 스타일 아케이드 전광판 타이틀 */}
      <div className="flex flex-col items-center text-center mt-0.5">
        <h1
          style={{
            fontFamily: "'Fredoka', 'Jua', 'Black Han Sans', sans-serif",
            textShadow: '-2px -2px 0 #18181b, 2px -2px 0 #18181b, -2px 2px 0 #18181b, 2px 2px 0 #18181b, 0 4px 0 #09090b',
          }}
          className="text-3xl sm:text-4xl font-black text-amber-400 tracking-wider"
        >
          무한의 계란
        </h1>

        {/* 아케이드 BEST 전광판 */}
        <div className="mt-1 flex items-center gap-1.5 bg-[#1e1b18] px-3.5 py-1 rounded-full border-2 border-[#f59e0b] shadow-[0_3px_0_#92400e]">
          <Trophy size={14} className="text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-black text-white/90">BEST</span>
          <span className="text-sm font-black text-amber-300 tracking-tight">
            {progress.bestDistanceMeters.toLocaleString()} m
          </span>
        </div>
      </div>

      {/* 2. 중앙: 웅장한 계란 둥지 (Nest) 쇼케이스 */}
      <div className="my-auto py-1 flex flex-col items-center">
        <NestIllustration
          skin={currentSkin}
          equippedCostumes={progress.equippedCostumes}
          onEggClick={onGoToEggsTab}
        />

        {/* 퀵 코디 이동 3D 캡슐 버튼 */}
        <button
          type="button"
          onClick={onGoToEggsTab}
          className="btn-3d-square mt-2 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-black text-[#1e1b18] cursor-pointer"
        >
          <Shirt size={14} className="text-amber-600" />
          <span>의상 코디실 ↷</span>
        </button>
      </div>

      {/* 3. 하단 컨트롤러: 초대형 3D [ ▶ PLAY ] 아케이드 버튼 */}
      <div className="w-full max-w-sm flex flex-col gap-2.5 mb-2">
        {/* 아케이드 플레이 미니 통계 바 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-center gap-1.5 bg-white/95 px-3 py-1.5 rounded-xl border-2 border-[#1e1b18] shadow-[0_3px_0_#1e1b18] text-center">
            <Trophy size={14} className="text-amber-500" />
            <span className="text-xs font-black text-[#1e1b18]">{progress.bestDistanceMeters.toLocaleString()}m</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 bg-white/95 px-3 py-1.5 rounded-xl border-2 border-[#1e1b18] shadow-[0_3px_0_#1e1b18] text-center">
            <Footprints size={14} className="text-sky-500" />
            <span className="text-xs font-black text-[#1e1b18]">{progress.totalGamesPlayed}판 질주</span>
          </div>
        </div>

        {/* 초대형 3D 주황 아케이드 [ PLAY ] 버튼 */}
        <button
          type="button"
          onClick={handleStart}
          className="btn-3d-amber w-full h-17 rounded-3xl flex items-center justify-center gap-3 cursor-pointer group text-[#1e1b18]"
        >
          <div className="w-10 h-10 rounded-2xl bg-black/15 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <Play size={24} className="fill-[#1e1b18] stroke-[#1e1b18] ml-0.5" />
          </div>
          <span
            style={{
              fontFamily: "'Fredoka', 'Jua', 'Black Han Sans', sans-serif",
            }}
            className="text-2xl sm:text-3xl font-black tracking-wider text-[#1e1b18] drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]"
          >
            PLAY ▶
          </span>
        </button>
      </div>
    </div>
  );
};
