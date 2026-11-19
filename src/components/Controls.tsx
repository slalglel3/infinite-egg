import React from 'react';
import { ArrowLeftRight, ArrowUp } from 'lucide-react';

interface ControlsProps {
  onJump: () => void;
  onTurn: () => void;
  disabled?: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  onJump,
  onTurn,
  disabled,
}) => {
  const btnTone = 'border-slate-900 bg-transparent text-slate-900 active:bg-slate-900/10';

  const handleTurnDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!disabled) onTurn();
  };

  const handleJumpDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!disabled) onJump();
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 max-w-[390px] mx-auto p-4 pb-6 pb-safe flex items-center justify-between gap-4 pointer-events-none z-20 select-none">
      {/* 1. [방향 전환] 조작 버튼 (왼쪽) */}
      <button
        type="button"
        onPointerDown={handleTurnDown}
        disabled={disabled}
        className={`flex-1 max-w-[170px] h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 cursor-pointer select-none touch-none transition-all ${btnTone} ${
          disabled ? 'pointer-events-none opacity-25' : 'pointer-events-auto'
        }`}
        aria-label="방향 전환"
      >
        <ArrowLeftRight size={26} className="stroke-[2]" />
        <span className="text-sm font-black tracking-wide">방향 전환</span>
      </button>

      {/* 2. [점프] 조작 버튼 (오른쪽) */}
      <button
        type="button"
        onPointerDown={handleJumpDown}
        disabled={disabled}
        className={`flex-1 max-w-[170px] h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 cursor-pointer select-none touch-none transition-all ${btnTone} ${
          disabled ? 'pointer-events-none opacity-25' : 'pointer-events-auto'
        }`}
        aria-label="점프"
      >
        <ArrowUp size={26} className="stroke-[2]" />
        <span className="text-sm font-black tracking-wide">점프</span>
      </button>
    </div>
  );
};
