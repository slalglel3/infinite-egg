import React from 'react';
import { GameStats } from '../types/game';
import { Volume2, VolumeX, Home, Pause, Play } from 'lucide-react';

interface HUDProps {
  stats: GameStats;
  onToggleMute: () => void;
  onGoHome: () => void;
  onTogglePause: () => void;
  isMuted: boolean;
  isPaused: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  onToggleMute,
  onGoHome,
  onTogglePause,
  isMuted,
  isPaused,
}) => {
  const hpRatio = Math.max(0, Math.min(1, stats.hp / stats.maxHp));

  let hpColor = '#059669';
  if (hpRatio < 0.3) {
    hpColor = '#dc2626';
  } else if (hpRatio < 0.6) {
    hpColor = '#d97706';
  }

  const cardSurface = 'border-slate-900 bg-transparent text-slate-900';
  const subSurface = 'border-slate-400 bg-transparent text-slate-700';

  return (
    <div className="absolute top-0 left-0 right-0 max-w-[390px] mx-auto p-3 pt-safe flex flex-col gap-1.5 pointer-events-none z-20 select-none">
      {/* 1. 상단 메인 HUD */}
      <div className="flex items-center justify-between gap-2">
        {/* 좌측: HP 게이지 & 수치 */}
        <div className={`flex flex-col gap-1 px-2.5 py-1.5 rounded-xl border-[1.5px] min-w-[96px] ${cardSurface}`}>
          <div className="flex items-center justify-between text-[10px] font-bold font-mono">
            <span>HP</span>
            <span style={{ color: hpColor }}>
              {Math.ceil(stats.hp)}/{Math.ceil(stats.maxHp)}
            </span>
          </div>
          <div className="w-20 h-2.5 rounded-full border border-slate-900 bg-transparent overflow-hidden p-[1.5px]">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${hpRatio * 100}%`,
                backgroundColor: 'transparent',
                border: `1.5px solid ${hpColor}`,
              }}
            />
          </div>
        </div>

        {/* 중앙: 주행 거리 */}
        <div className={`px-3.5 py-1 rounded-xl border-[1.5px] flex items-baseline gap-1 ${cardSurface}`}>
          <span className="text-3xl sm:text-4xl font-black font-mono leading-none">
            {stats.distanceMeters.toLocaleString()}
          </span>
          <span className="text-xs font-bold font-mono text-slate-600">m</span>
        </div>

        {/* 우측: 일시정지 & 음소거 & 홈 이동 버튼 */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={onTogglePause}
            className={`w-9 h-9 rounded-xl border-[1.5px] flex items-center justify-center active:scale-95 transition-transform ${
              isPaused
                ? 'border-amber-600 text-amber-700 bg-amber-50/90'
                : `${cardSurface}`
            }`}
            aria-label={isPaused ? '게임 재개' : '일시 정지'}
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className={`w-9 h-9 rounded-xl border-[1.5px] flex items-center justify-center active:scale-95 transition-transform ${cardSurface}`}
            aria-label="음소거 토글"
          >
            {isMuted ? <VolumeX size={16} className="text-rose-600" /> : <Volume2 size={16} />}
          </button>

          <button
            type="button"
            onClick={onGoHome}
            className={`w-9 h-9 rounded-xl border-[1.5px] flex items-center justify-center active:scale-95 transition-transform ${cardSurface}`}
            aria-label="홈으로"
          >
            <Home size={16} />
          </button>
        </div>
      </div>

      {/* 2. 하단 서브 상태 (속도, 물리 상태, 일시정지 배지) */}
      <div className="flex items-center justify-between gap-1 flex-wrap px-0.5 text-[10px] font-bold font-mono">
        <div className="flex items-center gap-1.5">
          <div className={`px-2 py-0.5 rounded-lg border ${subSurface}`}>
            {Math.round(stats.speed / 10)} km/h · {stats.eggState}
          </div>
          {isPaused && (
            <div className="px-2 py-0.5 rounded-lg border border-amber-600 bg-amber-50/90 text-amber-800">
              PAUSED (P / Esc)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
