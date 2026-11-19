import React from 'react';
import { Play } from 'lucide-react';
import { sound } from '../../../audio/sound';

interface MainTabProps {
  onStartGame: () => void;
}

export const MainTab: React.FC<MainTabProps> = ({ onStartGame }) => {
  const handleStart = () => {
    sound.playJump();
    onStartGame();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-between gap-4 select-none">
      {/* 상단 탭 식별 뼈대 */}
      <div className="w-full flex items-center justify-between text-xs font-mono text-slate-500">
        <span>TAB 3 / 5</span>
        <span>HOME (MAIN)</span>
      </div>

      {/* 중앙 캐릭터 스테이지 와이어프레임 */}
      <div className="w-full flex-1 border border-dashed border-slate-400 rounded-2xl flex flex-col items-center justify-center gap-3 p-4">
        <svg viewBox="0 0 100 116" className="w-24 h-28" fill="none">
          <path
            d="M 50 10 C 74 10, 92 38, 92 65 C 92 90, 75 106, 50 106 C 25 106, 8 90, 8 65 C 8 38, 26 10, 50 10 Z"
            stroke="#0f172a"
            strokeWidth="2.5"
          />
          <line x1="50" y1="12" x2="50" y2="104" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="3 3" />
          <line x1="10" y1="62" x2="90" y2="62" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="3 3" />
          <circle cx="38" cy="62" r="3" stroke="#0f172a" strokeWidth="1.8" />
          <circle cx="64" cy="62" r="3" stroke="#0f172a" strokeWidth="1.8" />
          <path d="M 44 71 Q 51 77 58 71" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="text-xs font-mono text-slate-500">
          [메인 스테이지 / 계란 배치 뼈대]
        </span>
      </div>

      {/* 하단 플레이 시작 와이어프레임 버튼 */}
      <button
        type="button"
        onClick={handleStart}
        className="w-full max-w-sm h-16 rounded-2xl border-2 border-slate-900 bg-transparent text-slate-900 flex items-center justify-center gap-2.5 text-lg font-black cursor-pointer active:bg-slate-900/10 transition-colors"
      >
        <Play size={20} className="stroke-[2.5]" />
        <span>플레이 시작 (PLAY)</span>
      </button>
    </div>
  );
};
