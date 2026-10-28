import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameStats, UserProgress } from '../types/game';
import { RotateCcw, Trophy, Sparkles, Home, Coins } from 'lucide-react';
import { getEggSkinById } from '../data/eggSkins';
import { CostumeSvgLayers } from './home/CostumeSvgLayers';

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
    <div
      onClick={onRestart}
      className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 animate-fade-in cursor-pointer select-none"
    >
      {/* 화면의 1/4 크기 컴팩트 중앙 팝업 (뒷배경이 시원하게 노출됨) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[270px] bg-white rounded-3xl p-4 shadow-2xl border-3 border-amber-300 flex flex-col items-center gap-2.5 text-center cursor-default animate-scale-up"
      >
        {/* 신기록 배지 */}
        {isNewRecord && stats.distanceMeters > 0 && (
          <div className="bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 font-black px-3 py-0.8 rounded-full text-[11px] shadow-sm flex items-center gap-1 -mb-1 animate-bounce">
            <Trophy size={13} />
            <span>최고 신기록 경신!</span>
          </div>
        )}

        {/* 상단: 아파하며 몸 여기저기 반창고를 붙인 귀여운 계란 캐릭터 일러스트 */}
        <div className="relative w-24 h-28 my-0.5 flex items-center justify-center">
          <svg viewBox="0 0 100 116" className="w-22 h-26 drop-shadow-md overflow-visible">
            <defs>
              <radialGradient id="hurtEggGrad" cx="42%" cy="36%" r="65%">
                <stop offset="0%" stopColor={currentSkin.colors.top} />
                <stop offset="22%" stopColor={currentSkin.colors.mid1} />
                <stop offset="65%" stopColor={currentSkin.colors.mid2} />
                <stop offset="92%" stopColor={currentSkin.colors.bottom} />
                <stop offset="100%" stopColor={currentSkin.colors.shadow} />
              </radialGradient>
            </defs>

            {/* 계란 몸통 (약간 찌그러진 아픈 느낌) */}
            <path
              d="M 50 10 C 74 10, 92 38, 92 65 C 92 90, 75 106, 50 106 C 25 106, 8 90, 8 65 C 8 38, 26 10, 50 10 Z"
              fill="url(#hurtEggGrad)"
              stroke={currentSkin.colors.line}
              strokeWidth="3.2"
              strokeLinejoin="round"
            />

            {/* 하이라이트 광택 */}
            <path
              d="M 42 16 C 30 22, 17 40, 17 56 C 17 62, 20 66, 24 60 C 27 46, 36 28, 46 20 C 47 18, 45 16, 42 16 Z"
              fill="#ffffff"
              opacity="0.65"
            />

            {/* 절규/아파하는 X_X 눈 */}
            {/* 왼쪽 X 눈 */}
            <line x1="33" y1="58" x2="43" y2="66" stroke={currentSkin.colors.eyeColor} strokeWidth="3" strokeLinecap="round" />
            <line x1="43" y1="58" x2="33" y2="66" stroke={currentSkin.colors.eyeColor} strokeWidth="3" strokeLinecap="round" />

            {/* 오른쪽 X 눈 */}
            <line x1="59" y1="58" x2="69" y2="66" stroke={currentSkin.colors.eyeColor} strokeWidth="3" strokeLinecap="round" />
            <line x1="69" y1="58" x2="59" y2="66" stroke={currentSkin.colors.eyeColor} strokeWidth="3" strokeLinecap="round" />

            {/* 푸른 눈물방울 */}
            <path d="M 28 66 C 25 72, 31 77, 34 74 C 36 71, 31 66, 28 66 Z" fill="#60a5fa" />
            <path d="M 74 66 C 77 72, 71 77, 68 74 C 66 71, 71 66, 74 66 Z" fill="#60a5fa" />

            {/* 아픈 핑크 볼터치 */}
            <ellipse cx="27" cy="72" rx="4.5" ry="3" fill={currentSkin.colors.cheekColor} opacity="0.8" />
            <ellipse cx="75" cy="72" rx="4.5" ry="3" fill={currentSkin.colors.cheekColor} opacity="0.8" />

            {/* 지그재그로 떨리는 아픈 입 (﹏) */}
            <path
              d="M 42 75 Q 46 71 50 75 Q 54 79 58 75"
              stroke={currentSkin.colors.eyeColor}
              strokeWidth="2.8"
              fill="none"
              strokeLinecap="round"
            />

            {/* 이마 땀방울 */}
            <path d="M 68 38 C 65 43, 70 47, 72 45 C 74 43, 70 38, 68 38 Z" fill="#93c5fd" />

            {/* 의상 계란인 경우 의상 렌더링 */}
            <CostumeSvgLayers
              hatId={currentSkin.hasFixedOutfit ? currentSkin.bundledCostumes?.hat : progress.equippedCostumes?.hat}
              topId={currentSkin.hasFixedOutfit ? currentSkin.bundledCostumes?.top : progress.equippedCostumes?.top}
              bottomId={currentSkin.hasFixedOutfit ? currentSkin.bundledCostumes?.bottom : progress.equippedCostumes?.bottom}
              handId={currentSkin.hasFixedOutfit ? currentSkin.bundledCostumes?.hand : progress.equippedCostumes?.hand}
            />

            {/* 몸 여기저기 붙은 귀여운 의료용 반창고들! */}
            {/* 1. 좌상단 X자 십자 반창고 */}
            <g transform="translate(20, 32) rotate(-15)">
              <rect x="-8" y="-3" width="16" height="6" rx="2" fill="#fed7aa" stroke="#ea580c" strokeWidth="1" />
              <rect x="-3" y="-8" width="6" height="16" rx="2" fill="#fed7aa" stroke="#ea580c" strokeWidth="1" />
              <circle cx="0" cy="0" r="1.5" fill="#f97316" />
            </g>

            {/* 2. 우측 중앙 비스듬한 일자 반창고 */}
            <g transform="translate(76, 52) rotate(25)">
              <rect x="-9" y="-3.5" width="18" height="7" rx="2.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
              <rect x="-3" y="-3" width="6" height="6" fill="#fecdd3" />
            </g>

            {/* 3. 하단 작은 반창고 */}
            <g transform="translate(50, 92) rotate(8)">
              <rect x="-10" y="-3.5" width="20" height="7" rx="2" fill="#fed7aa" stroke="#ea580c" strokeWidth="1" />
              <rect x="-3" y="-3" width="6" height="6" fill="#fdba74" />
            </g>
          </svg>
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

        {/* 2대 버튼: [다시 하기] & [홈] */}
        <div className="w-full flex flex-col gap-1.5 mt-0.5">
          <button
            type="button"
            onClick={onRestart}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 border-2 border-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 text-white font-black text-sm select-none cursor-pointer hover:brightness-105"
          >
            <RotateCcw size={16} className="stroke-[3]" />
            <span>다시 하기</span>
          </button>

          <button
            type="button"
            onClick={onGoHome}
            className="w-full py-2 rounded-2xl bg-white hover:bg-amber-50 border-2 border-amber-200 shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 text-gray-700 font-extrabold text-xs select-none cursor-pointer"
          >
            <Home size={15} className="text-amber-600" />
            <span>홈으로</span>
          </button>
        </div>
      </div>
    </div>
  );
};
