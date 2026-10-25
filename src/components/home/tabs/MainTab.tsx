import React from 'react';
import { UserProgress, EggSkin } from '../../../types/game';
import { NestIllustration } from '../NestIllustration';
import { Play, Trophy, Sparkles, Footprints, ShieldAlert } from 'lucide-react';
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
    <div className="flex-1 flex flex-col items-center justify-between px-5 py-2 safe-container overflow-y-auto">
      {/* 1. 상단 미니 배너: 타이틀 로고 */}
      <div className="flex flex-col items-center text-center mt-1">
        <h1 className="text-3xl font-black text-amber-500 drop-shadow-[0_2px_6px_rgba(245,158,11,0.3)] tracking-tight">
          무한의 계란
        </h1>
        <p className="text-xs font-bold text-sky-800/80 mt-0.5">
          Infinite Egg • 아늑한 둥지에서 출발!
        </p>
      </div>

      {/* 2. 중앙: 아름다운 계란 둥지 (Nest) */}
      <div className="my-auto py-2 flex flex-col items-center">
        <NestIllustration skin={currentSkin} onEggClick={onGoToEggsTab} />
        
        {/* 계란 변경 퀵 버튼 */}
        <button
          type="button"
          onClick={onGoToEggsTab}
          className="mt-2 text-xs font-extrabold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-full border border-amber-300 shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          계란 교체하기 ↷
        </button>
      </div>

      {/* 3. 하단 컨트롤 & 거대한 게임 시작 버튼 */}
      <div className="w-full max-w-sm flex flex-col gap-3 mb-3">
        {/* 플레이 통계 요약 미니 카드 */}
        <div className="grid grid-cols-2 gap-2 bg-white/80 backdrop-blur-md p-2.5 rounded-2xl border border-amber-200 shadow-sm text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-700 font-bold">
            <Trophy size={14} className="text-amber-500" />
            <span>최고 {progress.bestDistanceMeters.toLocaleString()}m</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-700 font-bold">
            <Footprints size={14} className="text-sky-500" />
            <span>총 {progress.totalGamesPlayed}판 질주</span>
          </div>
        </div>

        {/* 무한의 계단 / 협타디 스타일 큼직하고 강렬한 [게임 시작] 버튼 */}
        <button
          type="button"
          onClick={handleStart}
          className="w-full h-18 rounded-3xl bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 border-3 border-white/80 shadow-[0_10px_25px_rgba(245,158,11,0.5)] active:translate-y-1 active:shadow-md transition-all flex items-center justify-center gap-3 text-white font-black text-2xl select-none cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/25 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <Play size={24} className="fill-white stroke-none ml-0.5" />
          </div>
          <span className="tracking-wide drop-shadow-md">게임 시작</span>
        </button>

        {/* 팁 안내 */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-sky-900/70 font-semibold text-center">
          <ShieldAlert size={12} className="text-amber-600" />
          <span>팁: 방향 전환 직후 바로 점프가 나올 수 있으니 긴장을 늦추지 마세요!</span>
        </div>
      </div>
    </div>
  );
};
