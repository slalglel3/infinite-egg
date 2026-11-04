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
    <div className="absolute inset-0 bg-black/75 backdrop-blur-[4px] flex items-center justify-center p-4 z-50 animate-fade-in select-none">
      {/* 아늑한 헛간 치료실 & 원목 전광판 패널 */}
      <div className="panel-wood w-full max-w-[350px] p-5 flex flex-col items-center gap-2.5 text-center shadow-2xl border-4 border-[#2b1306] animate-scale-up relative">
        {/* 상단 밧줄 매듭 장식 */}
        <div className="absolute -top-3.5 left-6 text-sm opacity-80 pointer-events-none">🪢</div>
        <div className="absolute -top-3.5 right-6 text-sm opacity-80 pointer-events-none">🪢</div>

        {/* 상단: 묵직한 3D GAME OVER 텍스트 */}
        <h2
          style={{
            fontFamily: "'Fredoka', 'Jua', 'Black Han Sans', sans-serif",
            textShadow: '-2px -2px 0 #2b1306, 2px -2px 0 #2b1306, -2px 2px 0 #2b1306, 2px 2px 0 #2b1306, 0 4px 0 #1a0a03',
          }}
          className="text-4xl font-black text-rose-400 tracking-wider -mt-1"
        >
          GAME OVER
        </h2>

        {/* 신기록 엠블럼 */}
        {isNewRecord && stats.distanceMeters > 0 && (
          <div className="wood-badge py-1 px-3.5 bg-gradient-to-r from-amber-400 to-amber-500 text-[#2b1306] font-black text-xs shadow-md border-2 border-[#2b1306] flex items-center gap-1.5 animate-bounce">
            <Trophy size={14} className="fill-[#2b1306] text-[#2b1306]" />
            <span>최고 신기록 경신!</span>
          </div>
        )}

        {/* 상단 캐릭터: 포근한 볏짚 둥지에서 쉬고 있는 아픈 달걀 */}
        <div className="relative w-24 h-24 my-1 flex items-center justify-center">
          {/* 바닥 볏짚 둥지 */}
          <div className="absolute -bottom-2 w-24 h-6 bg-amber-800/60 rounded-full border border-amber-600/40 blur-[1px] flex items-center justify-center">
            <span className="text-[10px] opacity-40 text-amber-200">🌾🌾🌾</span>
          </div>

          <EggIllustration
            skin={currentSkin}
            equippedCostumes={currentSkin.hasFixedOutfit ? currentSkin.bundledCostumes : progress.equippedCostumes}
            expression="HURT"
            idPrefix="gameover-hero-"
            className="w-18 h-22 drop-shadow-xl overflow-visible animate-pulse relative z-10"
          />
        </div>

        {/* 헛간 원목 거리 전광판 스코어보드 */}
        <div className="w-full bg-[#1a0a03] rounded-2xl p-3 border-2 border-amber-600/60 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] flex flex-col items-center gap-1.5 text-white">
          <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
            RUN DISTANCE
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

          {/* 획득 보상 원목 뱃지 바 */}
          <div className="w-full pt-1.5 mt-0.5 border-t border-white/15 flex items-center justify-around text-xs font-black">
            <div className="flex items-center gap-1 text-emerald-400">
              <Sparkles size={12} />
              <span>+{stats.distanceMeters} EXP</span>
            </div>

            {earnedGold > 0 && (
              <div className="flex items-center gap-1 text-yellow-300">
                <span className="text-sm">🪶</span>
                <span>+{earnedGold} 깃털</span>
              </div>
            )}

            {leveledUp && (
              <span className="bg-emerald-600 text-white px-2 py-0.2 rounded-full text-[10px] font-black border border-white/40 animate-pulse">
                Lv.{progress.level} UP!
              </span>
            )}
          </div>
        </div>

        {/* 하단 2대 3D 볼륨 버튼: [ 🔄 다시 하기 ] & [ 🏠 홈으로 ] */}
        <div className="w-full grid grid-cols-2 gap-3 mt-2">
          <button
            type="button"
            onClick={onRestart}
            className="h-14 rounded-2xl bg-gradient-to-b from-[#fcd34d] via-[#f59e0b] to-[#d97706] border-4 border-[#451a03] shadow-[0_4px_0_#451a03] flex items-center justify-center gap-2 text-base font-black cursor-pointer text-white active:translate-y-1 active:shadow-none transition-all"
          >
            <RotateCcw size={18} className="stroke-[3] text-white" />
            <span
              style={{
                textShadow: '-1.5px -1.5px 0 #451a03, 1.5px -1.5px 0 #451a03, -1.5px 1.5px 0 #451a03, 1.5px 1.5px 0 #451a03, 0 2.5px 0 #240e02',
              }}
              className="text-white tracking-wide"
            >
              다시 하기
            </span>
          </button>

          <button
            type="button"
            onClick={onGoHome}
            className="h-14 rounded-2xl bg-[#5c371e] text-[#f7e6c4] border-4 border-[#2b160a] shadow-[0_4px_0_#2b160a] flex items-center justify-center gap-2 text-base font-black cursor-pointer active:translate-y-1 active:shadow-none transition-all"
          >
            <Home size={18} className="stroke-[3] text-amber-200" />
            <span
              style={{
                textShadow: '0 1.5px 0 #2b160a',
              }}
              className="text-amber-100 tracking-wide"
            >
              홈으로
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
