import React, { useState } from 'react';
import { UserProgress } from '../../../types/game';
import { ACHIEVEMENTS, getAchievementProgress } from '../../../data/achievements';
import { claimAchievementReward, isTutorialSeen, markTutorialSeen } from '../../../utils/storage';
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
  const [showTutorial, setShowTutorial] = useState(!isTutorialSeen('ACHIEVEMENTS'));

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
        <h2 className="text-lg font-black text-gray-800 flex items-center gap-1.5">
          <Award size={20} className="text-amber-500 fill-amber-500" />
          도전 과제
        </h2>
        <div className="flex items-center gap-1.5 bg-amber-100 text-amber-900 px-3.5 py-1 rounded-full text-xs font-black border border-amber-300 shadow-sm">
          <span>달성 현황:</span>
          <span className="text-amber-600 font-extrabold">{completedCount}</span>
          <span className="text-gray-400">/</span>
          <span>{ACHIEVEMENTS.length}</span>
        </div>
      </div>

      {/* [피드백 8] 큼직하고 시원한 도전과제 카드 목록 */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-4 pr-1">
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
              className={`rounded-3xl p-4.5 bg-white border-3 flex flex-col gap-3 shadow-md transition-all select-none ${
                isClaimed
                  ? 'border-gray-200 opacity-60 bg-gray-50'
                  : isDone
                  ? 'border-amber-400 bg-amber-50/70 shadow-xl ring-2 ring-amber-300 cursor-pointer active:scale-[0.98]'
                  : 'border-amber-100/90'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                {/* 타이틀 및 핵심 목표 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-gray-900 truncate">
                      {ach.title}
                    </h3>
                    {isClaimed && (
                      <span className="text-[10px] font-black text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                        달성 완료
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 font-bold mt-0.5">
                    {ach.desc}
                  </p>
                </div>

                {/* 보상 정보 & 액션 버튼 */}
                <div className="shrink-0 flex items-center gap-2">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 text-xs font-black text-amber-600">
                      <Coins size={14} className="text-amber-500" />
                      <span>+{ach.rewardGold}G</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-extrabold">
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
                      className="bg-gradient-to-r from-amber-400 to-amber-500 text-white font-black text-xs px-3.5 py-2 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center gap-1 animate-bounce cursor-pointer"
                    >
                      <Gift size={14} />
                      <span>보상 받기</span>
                    </button>
                  ) : null}
                </div>
              </div>

              {/* 큼직한 진행도 프로그레스 바 */}
              <div className="flex items-center gap-2.5">
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isDone
                        ? 'bg-gradient-to-r from-amber-400 to-emerald-500'
                        : 'bg-gradient-to-r from-amber-400 to-amber-500'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-xs font-black text-gray-700 shrink-0">
                  {Math.min(currentVal, ach.target).toLocaleString()} / {ach.target.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* [피드백 7 구현] 도전 과제 최초 진입 튜토리얼 모달 */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl border-4 border-amber-300 flex flex-col items-center gap-3.5 text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
              <Award size={34} className="fill-amber-500 text-amber-500" />
            </div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">도전 과제 시스템</h3>
            <p className="text-xs text-gray-600 font-semibold leading-relaxed">
              플레이를 통해 다양한 과제를 완수하고 푸짐한 보상을 획득하세요!<br /><br />
              🏆 <strong>목표를 달성한 카드</strong>는 황금빛으로 빛나며 터치하면 보너스 골드와 레벨업 경험치가 즉시 지급됩니다!
            </p>
            <button
              type="button"
              onClick={() => {
                sound.playTurn();
                markTutorialSeen('ACHIEVEMENTS');
                setShowTutorial(false);
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-white font-black text-sm rounded-2xl shadow-lg hover:from-amber-500 hover:to-amber-600 active:scale-95 transition-all cursor-pointer"
            >
              도전하러 가기!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
