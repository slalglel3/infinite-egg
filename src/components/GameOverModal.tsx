import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameStats, UserProgress } from '../types/game';
import { RotateCcw, Trophy, Sparkles, Home, Coins } from 'lucide-react';

interface GameOverModalProps {
  stats: GameStats;
  reason: 'CRACKED' | 'FALL';
  progress: UserProgress;
  leveledUp: boolean;
  isNewRecord: boolean;
  earnedGold?: number;
  onRestart: () => void;
  onGoHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  reason,
  progress,
  leveledUp,
  isNewRecord,
  earnedGold = 0,
  onRestart,
  onGoHome,
}) => {
  useEffect(() => {
    if (isNewRecord && stats.distanceMeters > 0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    // 스페이스바 / 엔터키로 즉시 재시작 지원
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onRestart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNewRecord, stats.distanceMeters, onRestart]);

  return (
    <div
      onClick={onRestart}
      className="absolute inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-5 z-50 animate-in fade-in cursor-pointer select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border-4 border-amber-300 flex flex-col items-center gap-4 text-center cursor-default"
      >
        {/* 상단: 상태 및 일러스트 */}
        <div className="flex flex-col items-center">
          {reason === 'CRACKED' ? (
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center border-2 border-amber-200 mb-2">
              <span className="text-4xl">🍳</span>
            </div>
          ) : (
            <div className="w-20 h-20 bg-sky-50 rounded-full flex items-center justify-center border-2 border-sky-200 mb-2">
              <span className="text-4xl">😱</span>
            </div>
          )}

          <h2 className="text-2xl font-black text-gray-800 tracking-tight">
            {reason === 'CRACKED' ? '계란이 파삭 깨졌어요!' : '절벽 밖으로 떨어졌어요!'}
          </h2>
          <p className="text-xs text-gray-500 font-bold mt-0.5">
            {reason === 'CRACKED'
              ? '너무 높은 곳에서 착지해 충격을 받았어요.'
              : '제때 점프나 방향 전환을 하지 못했어요.'}
          </p>
        </div>

        {/* 신기록 배지 */}
        {isNewRecord && stats.distanceMeters > 0 && (
          <div className="bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 font-black px-4 py-1.5 rounded-full text-xs shadow-md flex items-center gap-1.5 animate-bounce">
            <Trophy size={16} />
            <span>최고 신기록 경신!</span>
          </div>
        )}

        {/* 이번 판 기록 통계 박스 */}
        <div className="w-full bg-amber-50/80 rounded-2xl p-4 border border-amber-200 flex flex-col gap-2.5">
          <div className="flex justify-between items-baseline border-b border-amber-200/60 pb-2">
            <span className="text-xs font-bold text-gray-600">하강 높이</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-amber-600">
                {stats.distanceMeters.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-amber-700">m</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/80 p-2 rounded-xl flex flex-col items-center">
              <span className="text-gray-500 font-semibold">퍼펙트 착지</span>
              <span className="font-extrabold text-emerald-600 text-base">
                {stats.perfectLandings} 회
              </span>
            </div>
            <div className="bg-white/80 p-2 rounded-xl flex flex-col items-center">
              <span className="text-gray-500 font-semibold">반창고 치료</span>
              <span className="font-extrabold text-sky-600 text-base">
                {stats.itemsCollected} 개
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-bold pt-1 text-gray-700">
            <div className="flex items-center gap-1 text-amber-700">
              <Sparkles size={14} />
              <span>+{stats.distanceMeters} EXP</span>
              {earnedGold > 0 && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="flex items-center gap-0.5 text-amber-600 font-extrabold">
                    <Coins size={13} /> +{earnedGold}G
                  </span>
                </>
              )}
            </div>
            {leveledUp && (
              <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse">
                레벨 업! Lv.{progress.level}
              </span>
            )}
          </div>
        </div>

        {/* 2개 버튼: [다시 도전하기] & [홈으로 이동] */}
        <div className="w-full flex flex-col gap-2 mt-1">
          <button
            type="button"
            onClick={onRestart}
            className="w-full h-14 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 border-2 border-white shadow-[0_6px_20px_rgba(245,158,11,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 text-white font-black text-lg select-none cursor-pointer"
          >
            <RotateCcw size={20} className="stroke-[3]" />
            <span>다시 도전하기!</span>
          </button>

          <button
            type="button"
            onClick={onGoHome}
            className="w-full h-12 rounded-2xl bg-white hover:bg-amber-50/50 border-2 border-amber-200 shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 text-gray-700 font-extrabold text-sm select-none cursor-pointer"
          >
            <Home size={18} className="text-amber-600" />
            <span>홈으로 이동</span>
          </button>
        </div>

        <p className="text-[11px] text-gray-400 font-medium">
          스페이스바나 엔터를 누르면 바로 다시 도전할 수 있어요.
        </p>
      </div>
    </div>
  );
};
