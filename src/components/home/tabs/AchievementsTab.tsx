import React from 'react';

export const AchievementsTab: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col gap-3 select-none">
      <div className="w-full flex items-center justify-between text-xs font-mono text-slate-500">
        <span>TAB 4 / 5</span>
        <span>MISSIONS (미션)</span>
      </div>

      <div className="flex-1 border border-dashed border-slate-400 rounded-2xl flex flex-col items-center justify-center p-4 gap-2 text-center">
        <span className="text-sm font-black text-slate-800">미션 탭 (일일 · 주간 · 월간 · 누적)</span>
        <span className="text-xs font-mono text-slate-400">
          추후 재설계될 탭 #4 영역
        </span>
      </div>
    </div>
  );
};
