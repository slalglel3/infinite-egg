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
      {/* 1. [방향 전환] 모바일 3D 아케이드 버튼 (왼쪽) */}
      <button
        type="button"
        onPointerDown={handleTurnDown}
        disabled={disabled}
        className="btn-3d-sky pointer-events-auto flex-1 max-w-[175px] h-21 rounded-3xl flex flex-col items-center justify-center gap-1 cursor-pointer select-none touch-none active:scale-95 transition-transform"
        aria-label="방향 전환"
      >
        <ArrowLeftRight size={32} className="stroke-[3.5]" />
        <span className="text-lg font-black tracking-wider drop-shadow-sm">방향 전환</span>
      </button>

      {/* 2. [점프] 모바일 3D 아케이드 버튼 (오른쪽) */}
      <button
        type="button"
        onPointerDown={handleJumpDown}
        disabled={disabled}
        className="btn-3d-amber pointer-events-auto flex-1 max-w-[175px] h-21 rounded-3xl flex flex-col items-center justify-center gap-1 cursor-pointer select-none touch-none active:scale-95 transition-transform"
        aria-label="점프"
      >
        <ArrowUpCircle size={32} className="stroke-[3.5]" />
        <span className="text-lg font-black tracking-wider drop-shadow-sm">점프</span>
      </button>
    </div>
  );
};
