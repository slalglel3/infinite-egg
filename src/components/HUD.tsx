import React from 'react';
import { GameStats } from '../types/game';
import { Pause, Flame } from 'lucide-react';

interface HUDProps {
  stats: GameStats;
  userLevel: number;
  onToggleMute: () => void;
  isMuted: boolean;
  onPause?: () => void;
}

export const HUD: React.FC<HUDProps> = ({ stats, onPause }) => {
  const hpRatio = Math.max(0, Math.min(1, stats.hp / stats.maxHp));

  return (
    <div className="absolute top-0 left-0 right-0 p-3 pt-safe flex flex-col gap-1.5 pointer-events-none z-20 select-none">
      {/* 1. 상단 메인 HUD (play.png 100% 매칭): [일시정지 ⏸] + [1,248 m 거리 목판] + [🪶 38 깃털 목판] */}
      <div className="flex items-center justify-between gap-2">
        {/* 좌측: 일시정지 목판 버튼 */}
        <button
          type="button"
          onClick={onPause}
          className="pointer-events-auto bg-[#5c371e] text-amber-100 border-3 border-[#2b160a] shadow-[0_4px_0_#2b160a] w-10 h-10 rounded-2xl flex items-center justify-center cursor-pointer active:translate-y-0.5 active:shadow-[0_1px_0_#2b160a] transition-all"
          title="일시 정지"
        >
          <Pause size={18} className="text-amber-200 fill-amber-200 stroke-none" />
        </button>

        {/* 중앙: 밧줄로 매달린 대형 거리 전광판 목판 */}
        <div className="bg-[#5c371e] text-[#f7e6c4] border-3 border-[#2b160a] shadow-[0_4px_0_#2b160a] px-5 py-1.5 rounded-2xl flex items-baseline gap-1.5">
          <span
            style={{
              fontFamily: "'Fredoka', 'Jua', 'Black Han Sans', sans-serif",
            }}
            className="text-2xl sm:text-3xl font-black text-amber-100 tracking-wider"
          >
            {stats.distanceMeters.toLocaleString()}
          </span>
          <span className="text-sm font-black text-amber-300">m</span>
        </div>

        {/* 우측: 획득 황금 깃털 목판 */}
        <div className="bg-[#5c371e] text-[#f7e6c4] border-3 border-[#2b160a] shadow-[0_4px_0_#2b160a] px-3.5 py-1.5 rounded-2xl flex items-center gap-1.5">
          <span className="text-base text-yellow-400">🪶</span>
          <span className="text-sm font-black text-amber-100">
            {stats.itemsCollected || 0}
          </span>
        </div>
      </div>

      {/* 2. 하단 서브 인디케이터 (내구도 게이지 & 퍼펙트 콤보) */}
      <div className="flex justify-between items-center px-1 text-xs font-black mt-0.5">
        {/* 미니 내구도(HP) 게이지 */}
        <div className="flex items-center gap-1.5 bg-[#2b160a]/80 px-2.5 py-1 rounded-full border border-amber-900/60 shadow-sm backdrop-blur-xs">
          <span className="text-[10px] text-amber-300">HP</span>
          <div className="w-16 h-2 bg-[#170a03] rounded-full overflow-hidden p-0.2 border border-white/10">
            <div
              className={`h-full rounded-full transition-all duration-150 ${
                hpRatio < 0.3 ? 'bg-rose-500 animate-pulse' : hpRatio < 0.6 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${hpRatio * 100}%` }}
            />
          </div>
        </div>

        {/* 퍼펙트 콤보 뱃지 */}
        {stats.perfectLandings > 0 && (
          <div className="flex items-center gap-1 bg-amber-500 text-[#2b160a] px-2.5 py-0.5 rounded-full border-2 border-[#2b160a] shadow-[0_2px_0_#2b160a] animate-bounce">
            <Flame size={12} className="text-[#2b160a] fill-[#2b160a]" />
            <span>PERFECT × {stats.perfectLandings}</span>
          </div>
        )}
      </div>
    </div>
  );
};
