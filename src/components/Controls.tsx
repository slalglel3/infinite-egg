import React from 'react';
import { RotateCw } from 'lucide-react';
import { getUIAsset } from '../assets/assetRegistry';

interface ControlsProps {
  onJump: () => void;
  onTurn: () => void;
  disabled?: boolean;
}

export const Controls: React.FC<ControlsProps> = ({ onJump, onTurn, disabled }) => {
  const handleTurnDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!disabled) onTurn();
  };

  const handleJumpDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!disabled) onJump();
  };

  const turnImg = getUIAsset('btn_wood_medium');
  const jumpImg = getUIAsset('btn_orange_jelly_medium');

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 pb-safe flex items-center justify-between gap-4 pointer-events-none z-20 select-none">
      {/* 1. [방향전환] 원목 조각 사각 버튼 (play.png 100% 매칭 - 왼쪽) */}
      <button
        type="button"
        onPointerDown={handleTurnDown}
        disabled={disabled}
        className="pointer-events-auto flex-1 max-w-[175px] h-22 rounded-3xl flex flex-col items-center justify-center cursor-pointer select-none touch-none active:translate-y-1.5 transition-all"
        aria-label="방향전환"
      >
        {turnImg ? (
          <img src={turnImg} alt="방향전환" className="w-full h-full object-contain drop-shadow-xl" />
        ) : (
          <div className="w-full h-full rounded-3xl bg-[#5c371e] text-[#f7e6c4] border-4 border-[#2b160a] shadow-[0_6px_0_#2b160a] flex flex-col items-center justify-center gap-1 active:shadow-[0_1px_0_#2b160a]">
            <RotateCw size={30} className="stroke-[3] text-amber-200" />
            <span
              style={{
                fontFamily: "'Fredoka', 'Jua', 'Black Han Sans', sans-serif",
                textShadow: '0 2px 0 #2b160a',
              }}
              className="text-lg font-black tracking-wider text-amber-100"
            >
              방향전환
            </span>
          </div>
        )}
      </button>

      {/* 2. [점프] 고광택 오렌지 3D 젤리 버튼 (play.png 100% 매칭 - 오른쪽) */}
      <button
        type="button"
        onPointerDown={handleJumpDown}
        disabled={disabled}
        className="pointer-events-auto flex-1 max-w-[175px] h-22 rounded-3xl flex flex-col items-center justify-center cursor-pointer select-none touch-none active:translate-y-1.5 transition-all"
        aria-label="점프"
      >
        {jumpImg ? (
          <img src={jumpImg} alt="점프" className="w-full h-full object-contain drop-shadow-xl" />
        ) : (
          <div className="w-full h-full rounded-3xl bg-gradient-to-b from-[#fcd34d] via-[#f59e0b] to-[#d97706] border-4 border-[#451a03] shadow-[0_6px_0_#451a03] flex flex-col items-center justify-center gap-1 active:shadow-[0_1px_0_#451a03]">
            {/* 솟구치는 곡선 화살표 아이콘 */}
            <svg viewBox="0 0 24 24" width="32" height="32" className="drop-shadow-sm">
              <path
                d="M 4 19 C 8 19, 10 14, 13 14 C 15 14, 16 10, 18 6"
                fill="none"
                stroke="#451a03"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <path
                d="M 13 6 L 19 6 L 19 12"
                fill="none"
                stroke="#451a03"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              style={{
                fontFamily: "'Fredoka', 'Jua', 'Black Han Sans', sans-serif",
                textShadow: '-1.5px -1.5px 0 #451a03, 1.5px -1.5px 0 #451a03, -1.5px 1.5px 0 #451a03, 1.5px 1.5px 0 #451a03, 0 2.5px 0 #240e02',
              }}
              className="text-xl font-black tracking-wider text-white"
            >
              점프
            </span>
          </div>
        )}
      </button>
    </div>
  );
};
