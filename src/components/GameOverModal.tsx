import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameStats, UserProgress } from '../types/game';
import { RotateCcw, Trophy, Sparkles, Home, Coins } from 'lucide-react';
import { getEggSkinById } from '../data/eggSkins';
import { EggIllustration } from './common/EggIllustration';

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
  progress,
  leveledUp,
  isNewRecord,
  earnedGold = 0,
  onRestart,
  onGoHome,
}) => {
  const currentSkin = getEggSkinById(progress.selectedEggId);

  useEffect(() => {
    if (isNewRecord && stats.distanceMeters > 0) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    }

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
    // [피드백 반영] 화면 밖 클릭 시 무분별한 재시작 방지 (onClick={onRestart} 제거)
    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 animate-fade-in select-none">
      {/* 화면의 1/4 크기 컴팩트 중앙 팝업 */}
      <div className="w-full max-w-[280px] bg-white rounded-3xl p-4 shadow-2xl border-3 border-amber-300 flex flex-col items-center gap-2.5 text-center cursor-default animate-scale-up">
        {/* 신기록 배지 */}
        {isNewRecord && stats.distanceMeters > 0 && (
          <div className="bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 font-black px-3 py-0.8 rounded-full text-[11px] shadow-sm flex items-center gap-1 -mb-1 animate-bounce">
            <Trophy size={13} />
            <span>최고 신기록 경신!</span>
          </div>
        )}

        {/* 상단: 아파하며 몸 여기저기 반창고를 붙인 귀여운 달걀 캐릭터 일러스트 (모든 스킨 고유 외형 유지) */}
        <div className="relative w-22 h-26 my-0.5 flex items-center justify-center">
          <EggIllustration
            skin={currentSkin}
            equippedCostumes={currentSkin.hasFixedOutfit ? currentSkin.bundledCostumes : progress.equippedCostumes}
            expression="HURT"
            idPrefix="gameover-"
            className="w-20 h-24 drop-shadow-md overflow-visible"
          />
        </div>

        {/* 기록 통계 카드 */}
        <div className="w-full bg-amber-50/90 rounded-2xl p-2.5 border border-amber-200 flex flex-col gap-1.5 shadow-sm">
          <div className="flex justify-between items-baseline px-1 border-b border-amber-200/80 pb-1">
            <span className="text-[11px] font-bold text-gray-500">하강 고도</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-2xl font-black text-amber-600 tracking-tight">
                {stats.distanceMeters.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-amber-700">m</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-black px-1 text-gray-700">
            <div className="flex items-center gap-1 text-amber-700">
              <Sparkles size={12} />
              <span>+{stats.distanceMeters} EXP</span>
              {earnedGold > 0 && (
                <>
                  <span className="text-gray-300 font-normal">|</span>
                  <span className="flex items-center gap-0.5 text-amber-600 font-extrabold">
                    <Coins size={12} /> +{earnedGold}G
                  </span>
                </>
              )}
            </div>
            {leveledUp && (
              <span className="bg-emerald-500 text-white px-2 py-0.2 rounded-full text-[10px] font-black animate-pulse">
                Lv.{progress.level} UP!
              </span>
            )}
          </div>
        </div>

        {/* 2대 버튼: [🔄 다시 하기] & [🏠 홈으로] 2열 나란히 배치 */}
        <div className="w-full grid grid-cols-2 gap-2 mt-1">
          <button
            type="button"
            onClick={onRestart}
            className="py-2.5 px-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 active:scale-95 transition-all text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-400 select-none"
          >
            <RotateCcw size={15} className="stroke-[3]" />
            <span>다시 하기</span>
          </button>

          <button
            type="button"
            onClick={onGoHome}
            className="py-2.5 px-2 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 active:scale-95 transition-all text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer border border-amber-300 select-none"
          >
            <Home size={15} className="stroke-[2.5]" />
            <span>홈으로</span>
          </button>
        </div>
      </div>
    </div>
  );
};
