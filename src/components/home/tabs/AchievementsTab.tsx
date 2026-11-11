import React, { useState } from 'react';
import { UserProgress } from '../../../types/game';
import { getAchievementProgress } from '../../../data/achievements';
import { claimAchievementReward } from '../../../utils/storage';
import { sound } from '../../../audio/sound';
import confetti from 'canvas-confetti';
import { Check } from 'lucide-react';

interface AchievementsTabProps {
  progress: UserProgress;
  onUpdateProgress: (updated: UserProgress) => void;
  onStartGame?: () => void;
}

type MissionSubTab = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUMULATIVE';

interface MissionDef {
  id: string;
  title: string;
  desc: string;
  target: number;
  rewardFeathers: number;
}

const SUBTABS: { id: MissionSubTab; label: string; left: string; width: string }[] = [
  { id: 'DAILY', label: '일일', left: '11.0%', width: '18.5%' },
  { id: 'WEEKLY', label: '주간', left: '30.8%', width: '18.5%' },
  { id: 'MONTHLY', label: '월간', left: '50.6%', width: '18.5%' },
  { id: 'CUMULATIVE', label: '누적', left: '70.4%', width: '18.5%' },
];

const SUBTAB_MISSIONS: Record<MissionSubTab, MissionDef[]> = {
  DAILY: [
    { id: 'daily_play_3', title: '게임 3회 플레이하기', desc: '내리막길을 3회 질주하기', target: 3, rewardFeathers: 15 },
    { id: 'daily_dist_300', title: '내리막길 300m 돌파', desc: '한 게임에서 300m 이상 질주', target: 300, rewardFeathers: 20 },
    { id: 'daily_perfect_10', title: '퍼펙트 턴 10회 달성', desc: '완벽한 타이밍으로 10회 회전', target: 10, rewardFeathers: 25 },
  ],
  WEEKLY: [
    { id: 'weekly_play_15', title: '주간 질주 15회 달성', desc: '이번 주 총 15회 모험 플레이', target: 15, rewardFeathers: 80 },
    { id: 'weekly_dist_2000', title: '누적 주행 2,000m 돌파', desc: '주간 누적 2,000m 완주하기', target: 2000, rewardFeathers: 120 },
    { id: 'weekly_feathers_500', title: '황금 깃털 500개 획득', desc: '인게임 및 상점에서 깃털 수집', target: 500, rewardFeathers: 150 },
  ],
  MONTHLY: [
    { id: 'monthly_dist_10000', title: '월간 대모험 10,000m', desc: '한 달간 총 10,000m 완주 돌파', target: 10000, rewardFeathers: 300 },
    { id: 'monthly_score_5000', title: '최고 점수 5,000점 달성', desc: '전설의 고난도 코스 정복', target: 5000, rewardFeathers: 400 },
    { id: 'monthly_hatch_10', title: '달걀 부화 10회 도전', desc: '상점 부화기에서 신규 에그 부화', target: 10, rewardFeathers: 500 },
  ],
  CUMULATIVE: [
    { id: 'cumul_dist_50000', title: '전설의 굴림이', desc: '누적 주행 50,000m 돌파하기', target: 50000, rewardFeathers: 1000 },
    { id: 'cumul_all_skins', title: '모든 에그 수집가', desc: '6대 핵심 달걀 스킨 모두 해금', target: 6, rewardFeathers: 1500 },
    { id: 'cumul_perfect_500', title: '신의 컨트롤러', desc: '누적 퍼펙트 턴 500회 달성', target: 500, rewardFeathers: 2000 },
  ],
};

export const AchievementsTab: React.FC<AchievementsTabProps> = ({
  progress,
  onUpdateProgress,
  onStartGame,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<MissionSubTab>('DAILY');

  const handleSelectSubTab = (tab: MissionSubTab) => {
    sound.playTurn();
    setActiveSubTab(tab);
  };

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

  const currentMissions = SUBTAB_MISSIONS[activeSubTab];

  // 3개 미션 카드 위치
  const cardPositions = [
    { cardTop: '28.0%', btnTop: '34.2%', btnLeft: '72.5%', btnW: '17.0%', btnH: '6.0%' },
    { cardTop: '46.0%', btnTop: '52.2%', btnLeft: '72.5%', btnW: '17.0%', btnH: '6.0%' },
    { cardTop: '64.0%', btnTop: '70.2%', btnLeft: '72.5%', btnW: '17.0%', btnH: '6.0%' },
  ];

  return (
    <div className="w-full h-full relative select-none">
      {/* 1. 상단 4개 서브탭 터치 선택 바 (일일 / 주간 / 월간 / 누적) (Y: 13.5% ~ 19.5%) */}
      {SUBTABS.map((tab) => {
        const isActive = activeSubTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleSelectSubTab(tab.id)}
            style={{
              top: '13.5%',
              left: tab.left,
              width: tab.width,
              height: '6.0%',
            }}
            className={`pointer-events-auto absolute cursor-pointer rounded-2xl active:scale-95 transition-all flex items-center justify-center ${
              isActive
                ? 'ring-3 ring-amber-400 bg-amber-400/20 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                : 'hover:bg-amber-400/10'
            }`}
            title={`${tab.label} 미션`}
          >
            <div className="w-full h-full rounded-2xl" />
          </button>
        );
      })}

      {/* 2. 3개 미션 카드 라이브 인터랙션 및 수령 버튼 영역 */}
      {currentMissions.map((mission, idx) => {
        const pos = cardPositions[idx];
        const currentVal = getAchievementProgress(mission.id, progress);
        const isDone = currentVal >= mission.target;
        const isClaimed = progress.claimedAchievementIds.includes(mission.id);

        return (
          <div key={mission.id}>
            {/* 수령하기 / 바로가기 터치 버튼 */}
            <button
              type="button"
              onClick={() => {
                if (isDone && !isClaimed) {
                  handleClaim(mission.id);
                } else if (!isDone && onStartGame) {
                  sound.playJump();
                  onStartGame();
                }
              }}
              style={{
                top: pos.btnTop,
                left: pos.btnLeft,
                width: pos.btnW,
                height: pos.btnH,
              }}
              className="pointer-events-auto absolute cursor-pointer active:scale-95 transition-transform rounded-2xl flex items-center justify-center group"
              title={isClaimed ? '수령 완료' : isDone ? '보상 받기!' : '바로가기'}
            >
              <div className="w-full h-full rounded-2xl group-active:bg-amber-400/30 transition-colors flex items-center justify-center">
                {isClaimed ? (
                  <span 
                    style={{ fontFamily: "'NanumSquareRound', 'Jua', sans-serif" }}
                    className="text-xs sm:text-sm font-black text-amber-200/60 flex items-center gap-1 drop-shadow-[0_1px_1px_rgba(40,15,5,0.9)]"
                  >
                    <Check size={14} strokeWidth={3} />
                    <span>완료</span>
                  </span>
                ) : isDone ? (
                  <span 
                    style={{ fontFamily: "'NanumSquareRound', 'Jua', sans-serif" }}
                    className="text-xs sm:text-sm font-black text-[#fef08a] animate-pulse drop-shadow-[0_1.5px_2px_rgba(40,15,5,0.95)]"
                  >
                    받기!
                  </span>
                ) : (
                  <span 
                    style={{ fontFamily: "'NanumSquareRound', 'Jua', sans-serif" }}
                    className="text-xs sm:text-sm font-black text-amber-100 drop-shadow-[0_1.5px_2px_rgba(40,15,5,0.95)]"
                  >
                    이동
                  </span>
                )}
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
};
