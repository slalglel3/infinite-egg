import React, { useEffect } from 'react';
import { GameStats, UserProgress } from '../types/game';
import { RotateCcw, Home } from 'lucide-react';

interface GameOverModalProps {
  stats: GameStats;
  reason: 'CRACKED' | 'FALL';
  progress: UserProgress;
  isNewRecord: boolean;
  onRestart: () => void;
  onGoHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  reason,
  progress,
  isNewRecord,
  onRestart,
  onGoHome,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onRestart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRestart]);

  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 select-none">
      <div className="w-full max-w-[330px] p-5 rounded-2xl border-2 border-slate-900 bg-white flex flex-col items-center gap-3 text-center">
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-2xl font-black font-mono tracking-wider text-slate-900">
            GAME OVER
          </h2>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border border-rose-600 text-rose-600">
            {reason === 'CRACKED' ? 'CRACKED (내구도 0)' : 'FALL (경로 이탈/추락)'}
          </span>
        </div>

        {isNewRecord && stats.distanceMeters > 0 && (
          <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full border border-emerald-700 text-emerald-700">
            NEW RECORD
          </span>
        )}

        {/* 핵심 플레이 지표 요약 박스 */}
        <div className="w-full border border-slate-900 rounded-xl p-3 flex flex-col gap-2 font-mono text-xs">
          <div className="flex items-baseline justify-center gap-1 pb-2 border-b border-slate-300">
            <span className="text-3xl font-black text-slate-900">
              {stats.distanceMeters.toLocaleString()}
            </span>
            <span className="text-sm font-bold text-slate-600">m</span>
          </div>

          <div className="flex justify-between text-slate-700">
            <span>최고 기록</span>
            <span className="font-bold text-slate-900">{progress.bestDistanceMeters.toLocaleString()} m</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>반창고 획득</span>
            <span className="font-bold text-slate-900">{stats.itemsCollected}</span>
          </div>
        </div>

        {/* 재시작 / 홈 버튼 */}
        <div className="w-full grid grid-cols-2 gap-2.5 mt-1">
          <button
            type="button"
            onClick={onRestart}
            className="h-12 rounded-xl border-2 border-slate-900 bg-transparent text-slate-900 font-black text-sm flex items-center justify-center gap-1.5 active:bg-slate-900/10"
          >
            <RotateCcw size={16} />
            <span>다시 시작</span>
          </button>

          <button
            type="button"
            onClick={onGoHome}
            className="h-12 rounded-xl border-2 border-slate-900 bg-transparent text-slate-900 font-black text-sm flex items-center justify-center gap-1.5 active:bg-slate-900/10"
          >
            <Home size={16} />
            <span>홈으로</span>
          </button>
        </div>
      </div>
    </div>
  );
};
