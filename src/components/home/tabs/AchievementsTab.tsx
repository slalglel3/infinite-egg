import React from 'react';
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
    <div className="flex-1 flex flex-col px-4 py-2 safe-container overflow-hidden">
      {/* 상단 진행률 서머리 */}
      <div className="flex items-center justify-between pb-2 px-1">
        <div>
          <h2 className="text-base font-black text-gray-800 flex items-center gap-1.5">
            <Award size={18} className="text-amber-500 fill-amber-500" />
            도전 과제
          </h2>
          <p className="text-[11px] text-gray-500 font-bold">
            과제를 완수하고 보너스 골드와 경험치를 획득하세요!
          </p>
        </div>
        <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-black border border-amber-300">
          <span>{completedCount}</span>
          <span className="text-amber-500 font-bold">/</span>
          <span>{ACHIEVEMENTS.length}</span>
        </div>
      </div>

      {/* 도전과제 목록 */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pb-4 pr-1">
        {ACHIEVEMENTS.map((ach) => {
          const currentVal = getAchievementProgress(ach.id, progress);
          const isDone = currentVal >= ach.target;
          const isClaimed = progress.claimedAchievementIds.includes(ach.id);
          const percent = Math.min(100, Math.floor((currentVal / ach.target) * 100));

          return (
            <div
              key={ach.id}
              className={`rounded-2xl p-3.5 bg-white border-2 flex items-center justify-between gap-3 shadow-sm transition-all ${
                isClaimed
                  ? 'border-gray-200 opacity-60 bg-gray-50'
                  : isDone
                  ? 'border-amber-400 bg-amber-50/50 shadow-md ring-1 ring-amber-300'
                  : 'border-amber-100'
              }`}
            >
              {/* 왼쪽 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black text-gray-800 truncate">
                    {ach.title}
                  </h3>
                  {isClaimed && (
                    <span className="text-[10px] font-black text-gray-500 bg-gray-200 px-1.5 py-0.2 rounded">
                      완료
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500 font-medium mt-0.5 leading-snug">
                  {ach.desc}
                </p>

                {/* 프로그레스 바 */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isDone
                          ? 'bg-gradient-to-r from-amber-400 to-emerald-500'
                          : 'bg-gradient-to-r from-amber-400 to-amber-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-gray-500 shrink-0">
                    {Math.min(currentVal, ach.target).toLocaleString()} / {ach.target.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 오른쪽 보상 & 수령 버튼 */}
              <div className="flex flex-col items-end shrink-0 gap-1.5">
                <div className="flex items-center gap-1 text-xs font-black text-amber-600">
                  <Coins size={13} className="text-amber-500" />
                  <span>+{ach.rewardGold}</span>
                  <span className="text-[10px] text-gray-400 font-bold">/</span>
                  <span className="text-emerald-600 font-bold">+{ach.rewardExp}EXP</span>
                </div>

                {isClaimed ? (
                  <div className="flex items-center gap-1 text-xs font-bold text-gray-400 py-1 px-2">
                    <CheckCircle size={15} className="text-emerald-500" />
                    <span>수령 완료</span>
                  </div>
                ) : isDone ? (
                  <button
                    type="button"
                    onClick={() => handleClaim(ach.id)}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1 animate-bounce cursor-pointer"
                  >
                    <Gift size={13} />
                    <span>보상 받기</span>
                  </button>
                ) : (
                  <div className="text-[11px] font-bold text-gray-400 py-1 px-2 bg-gray-100 rounded-lg">
                    진행 중
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
