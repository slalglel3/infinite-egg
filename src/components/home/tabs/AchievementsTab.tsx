import React, { useState } from 'react';
import { UserProgress } from '../../../types/game';
import { ACHIEVEMENTS, getAchievementProgress } from '../../../data/achievements';
import { claimAchievementReward } from '../../../utils/storage';
import { Award, CheckCircle, Coins, Sparkles, Gift } from 'lucide-react';
import { sound } from '../../../audio/sound';
import confetti from 'canvas-confetti';

interface AchievementsTabProps {
  progress: UserProgress;
  onUpdateProgress: (updated: UserProgress) => void;
}

export const AchievementsTab: React.FC<AchievementsTabProps> = ({
  progress,
  onUpdateProgress,
}) => {
  const handleClaim = (achId: string) => {
    sound.playHeal();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
    const res = claimAchievementReward(achId);
    if (res.success) {
      onUpdateProgress(res.progress);
    }
  };

  const completedCount = ACHIEVEMENTS.filter(
    (a) => getAchievementProgress(a.id, progress) >= a.target
  ).length;

  return (
    <div className="flex-1 flex flex-col px-3 py-1.5 safe-container overflow-hidden select-none">
      {/* 상단 농장 일과표 헤더 & 달성 현황 */}
      <div className="flex items-center justify-between pb-1.5 px-0.5">
        <h2 className="text-base font-black text-white flex items-center gap-1.5 drop-shadow-[0_2px_2px_#1a0a03]">
          <Award size={18} className="text-amber-400 fill-amber-500" />
          <span>농장 일과표</span>
        </h2>
        <div className="wood-badge py-1 px-3">
          <span className="text-[11px] text-amber-200/90 font-bold">일과 완료</span>
          <span className="text-amber-300 font-black">{completedCount}</span>
          <span className="text-white/40 font-bold">/</span>
          <span className="text-white font-black">{ACHIEVEMENTS.length}</span>
        </div>
      </div>

      {/* 농장 양피지 일과표 목록 */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pb-4 pr-0.5">
        {ACHIEVEMENTS.map((ach) => {
          const currentVal = getAchievementProgress(ach.id, progress);
          const isDone = currentVal >= ach.target;
          const isClaimed = progress.claimedAchievementIds.includes(ach.id);
          const percent = Math.min(100, Math.floor((currentVal / ach.target) * 100));

          return (
            <div
              key={ach.id}
              onClick={() => {
                if (isDone && !isClaimed) handleClaim(ach.id);
              }}
              className={`rounded-2xl p-3.5 border-3 flex flex-col gap-2.5 transition-all select-none shadow-md ${
                isClaimed
                  ? 'bg-[#2b1306]/20 border-[#2b1306]/40 opacity-70'
                  : isDone
                  ? 'panel-parchment ring-2 ring-amber-400 shadow-xl cursor-pointer active:scale-[0.98]'
                  : 'panel-parchment'
              }`}
            >
              <div className="flex items-center justify-between gap-2.5">
                {/* 타이틀 및 핵심 목표 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black text-[#2b1306] truncate">
                      {ach.title}
                    </h3>
                    {isClaimed && (
                      <span className="text-[9px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded-full">
                        ✓ 완료
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-amber-950 font-bold mt-0.5">
                    {ach.desc}
                  </p>
                </div>

                {/* 보상 정보 & 액션 버튼 */}
                <div className="shrink-0 flex items-center gap-2">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 text-xs font-black text-amber-800">
                      <Coins size={13} className="text-amber-500 fill-amber-400" />
                      <span>+{ach.rewardGold}G</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-extrabold">
                      +{ach.rewardExp} EXP
                    </span>
                  </div>

                  {isDone && !isClaimed ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClaim(ach.id);
                      }}
                      className="btn-3d-amber text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 animate-bounce cursor-pointer text-[#1e1b18] shrink-0"
                    >
                      <Gift size={13} className="text-[#1e1b18]" />
                      <span className="text-[#1e1b18] font-black">수령</span>
                    </button>
                  ) : null}
                </div>
              </div>

              {/* 원목 홈 프로그레스 바 */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-3 bg-[#1a0a03] rounded-full overflow-hidden p-0.5 border border-[#2b1306] shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isDone
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                        : 'bg-gradient-to-r from-amber-400 to-amber-500'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-[11px] font-black text-[#2b1306] shrink-0">
                  {Math.min(currentVal, ach.target).toLocaleString()} / {ach.target.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
