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
    <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 pb-safe flex items-center justify-between gap-4 pointer-events-none z-20 select-none">
      {/* 1. [방향 전환] 3D 청키 버튼 (왼쪽) */}
      <button
        type="button"
        onPointerDown={handleTurnDown}
        disabled={disabled}
        className="btn-3d-sky pointer-events-auto flex-1 max-w-[170px] h-20 rounded-3xl flex flex-col items-center justify-center cursor-pointer select-none touch-none"
        aria-label="방향 전환"
      >
        <ArrowLeftRight size={28} className="stroke-[3] mb-0.5" />
        <span className="text-base font-black tracking-wide">방향 전환</span>
        <span className="text-[10px] text-sky-200 font-bold opacity-90">(Z / X)</span>
      </button>

      {/* 2. [점프] 3D 청키 버튼 (오른쪽) */}
      <button
        type="button"
        onPointerDown={handleJumpDown}
        disabled={disabled}
        className="btn-3d-amber pointer-events-auto flex-1 max-w-[170px] h-20 rounded-3xl flex flex-col items-center justify-center cursor-pointer select-none touch-none"
        aria-label="점프"
      >
        <ArrowUpCircle size={28} className="stroke-[3] mb-0.5" />
        <span className="text-base font-black tracking-wide">점프</span>
        <span className="text-[10px] text-amber-200 font-bold opacity-90">(Space)</span>
      </button>
    </div>
  );
};
