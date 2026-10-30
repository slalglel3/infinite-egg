import React from 'react';
import { GameStats } from '../types/game';
import { Volume2, VolumeX, Shield, Zap, Award, Flame } from 'lucide-react';

interface HUDProps {
  stats: GameStats;
  userLevel: number;
  onToggleMute: () => void;
  isMuted: boolean;
}

export const HUD: React.FC<HUDProps> = ({ stats, userLevel, onToggleMute, isMuted }) => {
  const hpRatio = Math.max(0, Math.min(1, stats.hp / stats.maxHp));

  // HP 게이지 색상
  let hpGradient = 'linear-gradient(180deg, #34d399 0%, #059669 100%)';
  let hpBorder = '#064e3b';
  if (hpRatio < 0.3) {
    hpGradient = 'linear-gradient(180deg, #f87171 0%, #dc2626 100%)';
    hpBorder = '#450a0a';
  } else if (hpRatio < 0.6) {
    hpGradient = 'linear-gradient(180deg, #fbbf24 0%, #d97706 100%)';
    hpBorder = '#78350f';
  }

  return (
    <div className="absolute top-0 left-0 right-0 p-3 pt-safe flex flex-col gap-1.5 pointer-events-none z-20 select-none">
      {/* 1. 상단 메인 HUD: [HP 게이지 바] + [중앙 아케이드 거리 전광판] + [우측 컨트롤러] */}
      <div className="flex items-center justify-between gap-2">
        {/* 좌측: 3D 내구도 게이지 캡슐 */}
        <div className="flex items-center gap-1.5 bg-[#1e1b18]/85 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border-2 border-[#3f3a34] shadow-[0_4px_10px_rgba(0,0,0,0.4)]">
          <Shield
            size={16}
            className={hpRatio < 0.3 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}
          />
          <div className="flex flex-col gap-0.5">
            <div className="w-20 sm:w-24 h-3.5 bg-[#09090b] rounded-full p-0.5 border border-white/20 overflow-hidden shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-150 shadow-sm"
                style={{
                  width: `${hpRatio * 100}%`,
                  background: hpGradient,
                  border: `1px solid ${hpBorder}`,
                }}
              />
            </div>
          </div>
        </div>

        {/* 중앙: 무한의 계단식 굵은 아케이드 거리 전광판 */}
        <div className="flex flex-col items-center drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
          <div className="flex items-baseline gap-1">
            <span
              style={{
                fontFamily: "'Fredoka', 'Jua', 'Black Han Sans', sans-serif",
                textShadow: '-2px -2px 0 #18181b, 2px -2px 0 #18181b, -2px 2px 0 #18181b, 2px 2px 0 #18181b, 0 4px 0 #09090b',
              }}
              className="text-4xl sm:text-5xl font-black text-amber-300 tracking-wider leading-none"
            >
              {stats.distanceMeters.toLocaleString()}
            </span>
            <span
              style={{
                textShadow: '-1.5px -1.5px 0 #18181b, 1.5px -1.5px 0 #18181b, -1.5px 1.5px 0 #18181b, 1.5px 1.5px 0 #18181b',
              }}
              className="text-sm font-black text-white/90"
            >
              m
            </span>
          </div>
        </div>

        {/* 우측: 레벨 뱃지 & 사운드 토글 */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <div className="flex items-center gap-1 bg-amber-500 text-white font-black px-2.5 py-1 rounded-xl text-xs border-2 border-[#1e1b18] shadow-[0_3px_0_#92400e]">
            <Award size={13} className="stroke-[2.5]" />
            <span>Lv.{userLevel}</span>
          </div>

          <button
            type="button"
            onClick={onToggleMute}
            className="w-8 h-8 rounded-xl bg-white text-[#1e1b18] border-2 border-[#1e1b18] shadow-[0_3px_0_#94a3b8] flex items-center justify-center active:translate-y-0.5 active:shadow-none cursor-pointer transition-transform"
            aria-label="음소거 토글"
          >
            {isMuted ? <VolumeX size={16} className="text-rose-600" /> : <Volume2 size={16} className="text-emerald-600" />}
          </button>
        </div>
      </div>

      {/* 2. 하단 서브 인디케이터 (속도 & 퍼펙트 콤보) */}
      <div className="flex justify-between items-center px-1 text-xs font-black">
        <div className="flex items-center gap-1 bg-[#1e1b18]/70 px-2 py-0.5 rounded-lg border border-white/20 text-white/90 shadow-sm backdrop-blur-sm">
          <Zap size={12} className="text-amber-400" />
          <span>{Math.round(stats.speed / 10)} km/h</span>
        </div>

        {stats.perfectLandings > 0 && (
          <div className="flex items-center gap-1 bg-emerald-600 text-white px-2.5 py-0.5 rounded-full border-2 border-[#064e3b] shadow-[0_2px_0_#065f46] animate-bounce">
            <Flame size={12} className="text-yellow-300 fill-yellow-300" />
            <span>PERFECT × {stats.perfectLandings}</span>
          </div>
        )}
      </div>
    </div>
  );
};
