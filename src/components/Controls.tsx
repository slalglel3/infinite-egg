import React from 'react';
import { ArrowLeftRight, ArrowUpCircle } from 'lucide-react';

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

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 pb-safe flex items-center justify-between gap-4 pointer-events-none z-10">
      {/* 1. [방향 전환] 버튼 (왼쪽) */}
      <button
        type="button"
        onPointerDown={handleTurnDown}
        disabled={disabled}
        className="pointer-events-auto flex-1 max-w-[170px] h-20 rounded-3xl bg-gradient-to-b from-sky-400 to-sky-600 border-2 border-white/60 shadow-[0_8px_20px_rgba(2,132,199,0.5)] active:translate-y-1 active:shadow-sm transition-all flex flex-col items-center justify-center text-white font-extrabold select-none touch-none"
        aria-label="방향 전환"
      >
        <ArrowLeftRight size={28} className="mb-0.5 drop-shadow" />
        <span className="text-base tracking-wider drop-shadow">방향 전환</span>
        <span className="text-[10px] text-sky-100 font-normal opacity-80">(Z / X 키)</span>
      </button>

      {/* 2. [점프] 버튼 (오른쪽) */}
      <button
        type="button"
        onPointerDown={handleJumpDown}
        disabled={disabled}
        className="pointer-events-auto flex-1 max-w-[170px] h-20 rounded-3xl bg-gradient-to-b from-amber-400 to-amber-600 border-2 border-white/60 shadow-[0_8px_20px_rgba(217,119,6,0.5)] active:translate-y-1 active:shadow-sm transition-all flex flex-col items-center justify-center text-white font-extrabold select-none touch-none"
        aria-label="점프"
      >
        <ArrowUpCircle size={28} className="mb-0.5 drop-shadow" />
        <span className="text-base tracking-wider drop-shadow">점프</span>
        <span className="text-[10px] text-amber-100 font-normal opacity-80">(스페이스바)</span>
      </button>
    </div>
  );
};
