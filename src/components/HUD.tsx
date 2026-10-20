import React from 'react';
import { GameStats } from '../types/game';
import { Volume2, VolumeX, Shield, Zap, Award } from 'lucide-react';
import { sound } from '../audio/sound';

interface HUDProps {
  stats: GameStats;
  userLevel: number;
  onToggleMute: () => void;
  isMuted: boolean;
}

export const HUD: React.FC<HUDProps> = ({ stats, userLevel, onToggleMute, isMuted }) => {
  const hpRatio = Math.max(0, Math.min(1, stats.hp / stats.maxHp));

  // HP 바 색상
  let hpColor = '#10b981'; // 초록
  if (hpRatio < 0.3) {
    hpColor = '#ef4444'; // 위험 빨강
  } else if (hpRatio < 0.6) {
    hpColor = '#f59e0b'; // 경고 노랑
  }

  return (
    <div className="absolute top-0 left-0 right-0 p-3 pt-safe flex flex-col gap-2 pointer-events-none z-10">
      {/* 상단 1행: 거리 & 레벨 & 사운드 토글 */}
      <div className="flex items-center justify-between">
        {/* 하강 고도 기록 (m) */}
        <div className="flex items-baseline gap-1.5 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 shadow-lg">
          <span className="text-amber-400 font-extrabold text-2xl tracking-tight">
            {stats.distanceMeters.toLocaleString()}
          </span>
          <span className="text-white/80 font-bold text-sm">m</span>
        </div>

        {/* 유저 레벨 및 사운드 버튼 */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-1 bg-amber-500/90 text-white font-extrabold px-3 py-1 rounded-full text-xs shadow-md border border-amber-300">
            <Award size={14} />
            <span>Lv.{userLevel}</span>
          </div>

          <button
            onClick={onToggleMute}
            className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg"
            aria-label="음소거 토글"
          >
            {isMuted ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} className="text-green-400" />}
          </button>
        </div>
      </div>

      {/* 상단 2행: 내구도(HP) 게이지 바 */}
      <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/20 shadow-md">
        <Shield size={18} className={hpRatio < 0.3 ? 'text-red-400 animate-pulse' : 'text-amber-400'} />
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex justify-between items-center text-xs font-bold text-white/90">
            <span>계란 내구도</span>
            <span>
              {Math.ceil(stats.hp)} / {Math.ceil(stats.maxHp)}
            </span>
          </div>
          {/* 프로그레스 바 */}
          <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full rounded-full transition-all duration-150 ease-out shadow-sm"
              style={{
                width: `${hpRatio * 100}%`,
                backgroundColor: hpColor,
                boxShadow: hpRatio < 0.3 ? '0 0 8px #ef4444' : 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* 상단 3행: 속도 및 퍼펙트 착지 카운터 */}
      <div className="flex justify-between items-center text-xs font-semibold text-white/80 px-1">
        <div className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-lg backdrop-blur-sm">
          <Zap size={13} className="text-yellow-300" />
          <span>속도: {Math.round(stats.speed / 10)} km/h</span>
        </div>

        {stats.perfectLandings > 0 && (
          <div className="flex items-center gap-1 bg-emerald-500/80 text-white font-bold px-2 py-0.5 rounded-lg shadow-sm">
            <span>PERFECT × {stats.perfectLandings}</span>
          </div>
        )}
      </div>
    </div>
  );
};
