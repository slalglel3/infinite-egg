import React from 'react';
import { UserProgress } from '../../../types/game';
import { ACHIEVEMENTS, getAchievementProgress } from '../../../data/achievements';
import { claimAchievementReward } from '../../../utils/storage';
import { sound } from '../../../audio/sound';
import confetti from 'canvas-confetti';
import { Check } from 'lucide-react';

interface AchievementsTabProps {
  progress: UserProgress;
  onUpdateProgress: (updated: UserProgress) => void;
  onStartGame?: () => void;
}

// 3대 대표 미션 카드 (원화 mission.png 3개 카드와 1:1 매핑)
const MISSION_IDS = ['first_roll', 'play_5', 'perfect_20'];

export const AchievementsTab: React.FC<AchievementsTabProps> = ({
  progress,
  onUpdateProgress,
  onStartGame,
}) => {
  const handleClaim = (achId: string) => {
    sound.playHeal();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
    const res = claimAchievementReward(achId);
    if (res.success) {
      onUpdateProgress(res.progress);
    }
  };

  const handleAction = (achId: string, isDone: boolean, isClaimed: boolean) => {
    if (isDone && !isClaimed) {
      handleClaim(achId);
    } else if (!isDone && onStartGame) {
      sound.playJump();
      onStartGame();
    }
  };

  const buttonPositions = [
    { top: '34.0%', left: '72.5%', width: '17.0%', height: '6.0%' }, // 미션 1 버튼
    { top: '52.5%', left: '72.5%', width: '17.0%', height: '6.0%' }, // 미션 2 버튼
    { top: '69.5%', left: '72.5%', width: '17.0%', height: '6.0%' }, // 미션 3 버튼
  ];

  return (
    <div className="w-full h-full relative select-none">
      {MISSION_IDS.map((achId, idx) => {
        const ach = ACHIEVEMENTS.find((a) => a.id === achId);
        if (!ach) return null;

        const currentVal = getAchievementProgress(ach.id, progress);
        const isDone = currentVal >= ach.target;
        const isClaimed = progress.claimedAchievementIds.includes(ach.id);
        const pos = buttonPositions[idx];

        return (
          <button
            key={ach.id}
            type="button"
            onClick={() => handleAction(ach.id, isDone, isClaimed)}
            style={{
              top: pos.top,
              left: pos.left,
              width: pos.width,
              height: pos.height,
            }}
            className={`pointer-events-auto absolute rounded-2xl cursor-pointer active:scale-95 transition-transform flex items-center justify-center ${
              isDone && !isClaimed
                ? 'ring-2 ring-amber-300 ring-offset-1 animate-pulse bg-amber-400/20'
                : ''
            }`}
            title={
              isClaimed
                ? `${ach.title} (보상 수령 완료)`
                : isDone
                ? `${ach.title} (보상 받기: +${ach.rewardGold} 🪶)`
                : `${ach.title} (도전하기)`
            }
          >
            {/* 수령 완료 상태 오버레이 */}
            {isClaimed && (
              <span className="text-[11px] font-black text-emerald-100 flex items-center gap-0.5 drop-shadow-[0_1.5px_2px_#064e3b]">
                <Check size={14} strokeWidth={3} className="text-emerald-300" />
                <span>완료</span>
              </span>
            )}

            {/* 수령 가능 상태 오버레이 */}
            {isDone && !isClaimed && (
              <span className="text-[11px] font-black text-amber-50 drop-shadow-[0_1.5px_2px_#78350f]">
                받기!
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
