import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameStats, UserProgress } from '../types/game';
import { RotateCcw, Trophy, Home, Coins, Sparkles } from 'lucide-react';
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
        particleCount: 80,
        spread: 70,
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
    <div className="absolute inset-0 bg-black/75 backdrop-blur-[3px] flex items-center justify-center p-4 z-50 animate-fade-in select-none">
      {/* 아케이드 머신 스타일 프레임 패널 */}
      <div className="panel-arcade w-full max-w-[310px] p-4 flex flex-col items-center gap-2 text-center shadow-2xl border-4 border-[#1e1b18] animate-scale-up">
        {/* 상단: 무한의 계단 스타일 3D GAME OVER 텍스트 */}
        <h2
          style={{
            fontFamily: "'Fredoka', 'Jua', 'Black Han Sans', sans-serif",
            textShadow: '-2px -2px 0 #18181b, 2px -2px 0 #18181b, -2px 2px 0 #18181b, 2px 2px 0 #18181b, 0 4px 0 #4c0519',
          }}
          className="text-3xl font-black text-rose-500 tracking-wider -mt-1"
        >
          GAME OVER
        </h2>

        {/* 신기록 뱃지 */}
        {isNewRecord && stats.distanceMeters > 0 && (
          <div className="bg-gradient-to-r from-amber-400 to-yellow-400 text-[#1e1b18] font-black px-3.5 py-1 rounded-full text-xs shadow-md border-2 border-[#1e1b18] flex items-center gap-1.5 animate-bounce">
            <Trophy size={14} className="fill-[#1e1b18]" />
            <span>최고 신기록 경신!</span>
          </div>
        )}

        {/* 상단 캐릭터: 반창고 붙인 아픈 달걀 */}
        <div className="relative w-20 h-24 my-1 flex items-center justify-center">
          <EggIllustration
            skin={currentSkin}
            equippedCostumes={currentSkin.hasFixedOutfit ? currentSkin.bundledCostumes : progress.equippedCostumes}
            expression="HURT"
            idPrefix="gameover-hero-"
            className="w-18 h-22 drop-shadow-md overflow-visible animate-pulse"
          />
        </div>

        {/* 아케이드 거리 전광판 스코어보드 */}
        <div className="w-full bg-[#1e1b18] rounded-2xl p-3 border-2 border-[#f59e0b] shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)] flex flex-col items-center gap-1.5 text-white">
          <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
            DISTANCE
          </span>

          <div className="flex items-baseline gap-1">
            <span
              style={{
                fontFamily: "'Fredoka', 'Jua', 'Black Han Sans', sans-serif",
                textShadow: '0 2px 4px rgba(245, 158, 11, 0.5)',
              }}
              className="text-4xl font-black text-amber-300 tracking-tight"
            >
              {stats.distanceMeters.toLocaleString()}
            </span>
            <span className="text-sm font-bold text-amber-400">m</span>
          </div>

          {/* 획득 보상 아케이드 뱃지 바 */}
          <div className="w-full pt-1.5 mt-0.5 border-t border-white/20 flex items-center justify-around text-xs font-black">
            <div className="flex items-center gap-1 text-emerald-400">
              <Sparkles size={12} />
              <span>+{stats.distanceMeters} EXP</span>
            </div>

            {earnedGold > 0 && (
              <div className="flex items-center gap-1 text-yellow-300">
                <Coins size={12} className="fill-yellow-300" />
                <span>+{earnedGold} G</span>
              </div>
            )}

            {leveledUp && (
              <span className="bg-emerald-500 text-white px-2 py-0.2 rounded-full text-[10px] font-black border border-white/40 animate-pulse">
                Lv.{progress.level} UP!
              </span>
            )}
          </div>
        </div>

        {/* 하단 2대 3D 볼륨 버튼: [ 🔄 REPLAY ] & [ 🏠 HOME ] */}
        <div className="w-full grid grid-cols-2 gap-2 mt-1">
          <button
            type="button"
            onClick={onRestart}
            className="btn-3d-emerald py-2.5 px-2 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-black cursor-pointer shadow-lg"
          >
            <RotateCcw size={15} className="stroke-[3]" />
            <span>다시 하기</span>
          </button>

          <button
            type="button"
            onClick={onGoHome}
            className="btn-3d-amber py-2.5 px-2 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-black cursor-pointer shadow-lg"
          >
            <Home size={15} className="stroke-[2.5]" />
            <span>홈으로</span>
          </button>
        </div>
      </div>
    </div>
  );
};
