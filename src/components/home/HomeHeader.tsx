import React from 'react';
import { UserProgress } from '../../types/game';
import { Trophy, Coins, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { sound } from '../../audio/sound';

interface HomeHeaderProps {
  progress: UserProgress;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  progress,
  isMuted,
  onToggleMute,
}) => {
  return (
    <header className="w-full flex items-center justify-between p-4 pt-safe z-20">
      {/* 1. 레벨 & 경험치 카드 */}
      <div className="flex items-center gap-2.5 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-md border-2 border-amber-200">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white font-black text-sm shadow-sm">
          {progress.level}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="font-extrabold text-xs text-gray-800">레벨 {progress.level}</span>
            <Sparkles size={11} className="text-amber-500" />
          </div>
          <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all"
              style={{
                width: `${Math.min(100, (progress.exp / (progress.exp + progress.nextLevelExp)) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. 보유 골드 & 최고 기록 & 사운드 토글 */}
      <div className="flex items-center gap-2">
        {/* 보유 골드 */}
        <div className="flex items-center gap-1.5 bg-amber-500/90 text-white backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-md border border-amber-300">
          <Coins size={16} className="text-yellow-200" />
          <span className="font-black text-xs tracking-wide">
            {progress.gold.toLocaleString()}
          </span>
        </div>

        {/* 최고 기록 */}
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-md border border-amber-200 text-amber-700">
          <Trophy size={14} className="text-amber-600" />
          <span className="font-black text-xs">
            {progress.bestDistanceMeters.toLocaleString()}m
          </span>
        </div>

        {/* 음소거 버튼 */}
        <button
          type="button"
          onClick={onToggleMute}
          className="w-9 h-9 rounded-2xl bg-white/90 backdrop-blur-md flex items-center justify-center text-gray-700 shadow-md border border-white hover:bg-white active:scale-95 transition-all cursor-pointer"
          aria-label={isMuted ? '음소거 해제' : '음소거'}
        >
          {isMuted ? <VolumeX size={17} className="text-red-500" /> : <Volume2 size={17} className="text-sky-600" />}
        </button>
      </div>
    </header>
  );
};
