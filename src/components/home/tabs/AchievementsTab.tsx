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

type MissionSubTab = 'DAILY' | 'WEEKLY' | 'ACHIEVEMENTS' | 'SEASON';

interface MissionDef {
  id: string;
  title: string;
  desc: string;
  target: number;
  rewardGold: number;
}

const SUBTABS: { id: MissionSubTab; label: string; left: string; width: string }[] = [
  { id: 'DAILY', label: '일일', left: '11.3%', width: '18.1%' },
  { id: 'WEEKLY', label: '주간', left: '31.0%', width: '18.2%' },
  { id: 'ACHIEVEMENTS', label: '업적', left: '50.8%', width: '18.2%' },
  { id: 'SEASON', label: '시즌', left: '70.7%', width: '18.2%' },
];

const SUBTAB_MISSIONS: Record<MissionSubTab, MissionDef[]> = {
  DAILY: [
    { id: 'first_roll', title: '첫 걸음', desc: '내리막길을 100m 이상 질주하기', target: 100, rewardGold: 10 },
    { id: 'play_5', title: '초보 굴림이', desc: '총 5회 이상 게임 플레이하기', target: 5, rewardGold: 15 },
    { id: 'perfect_20', title: '타이밍의 달인', desc: '퍼펙트 턴 20회 달성하기', target: 20, rewardGold: 20 },
  ],
  WEEKLY: [
    { id: 'reach_800', title: '동굴 심층 탐험', desc: '초원을 지나 지하 동굴(800m)에 도달하기', target: 800, rewardGold: 100 },
    { id: 'play_20', title: '데굴데굴 장인', desc: '총 20회 이상 모험 질주하기', target: 20, rewardGold: 150 },
    { id: 'bandage_10', title: '생존 본능', desc: '반창고를 10회 획득하여 체력 회복', target: 10, rewardGold: 200 },
  ],
  ACHIEVEMENTS: [
    { id: 'reach_300', title: '고산 지대 돌파', desc: '설산을 지나 300m 이상 하강하기', target: 300, rewardGold: 200 },
    { id: 'reach_1500', title: '지각 층 돌파', desc: '지하 지각 암반대(1,500m)에 도달하기', target: 1500, rewardGold: 700 },
    { id: 'reach_2000', title: '지구 맨틀 정복', desc: '작열하는 지구 핵과 맨틀(2,000m)에 도달하기', target: 2000, rewardGold: 1200 },
  ],
  SEASON: [
    { id: 'season_dist', title: '시즌 1 마스터', desc: '시즌 누적 5,000m 주행 돌파', target: 5000, rewardGold: 500 },
    { id: 'golden_egg_unlocked', title: '황금알 수집가', desc: '눈부신 황금알 스킨 획득하기', target: 1, rewardGold: 500 },
    { id: 'season_speed', title: '초음속 굴림이', desc: '최대 속도 12m/s 이상 돌파하기', target: 12, rewardGold: 500 },
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

  const handleAction = (achId: string, isDone: boolean, isClaimed: boolean) => {
    if (isDone && !isClaimed) {
      handleClaim(achId);
    } else if (!isDone && onStartGame) {
      sound.playJump();
      onStartGame();
    }
  };

  const currentMissions = SUBTAB_MISSIONS[activeSubTab];

  const cardPositions = [
    { cardTop: '28.5%', btnTop: '34.0%', btnLeft: '72.5%', btnW: '17.0%', btnH: '6.0%' },
    { cardTop: '46.5%', btnTop: '52.5%', btnLeft: '72.5%', btnW: '17.0%', btnH: '6.0%' },
    { cardTop: '64.5%', btnTop: '69.5%', btnLeft: '72.5%', btnW: '17.0%', btnH: '6.0%' },
  ];

  return (
    <div className="w-full h-full relative select-none">
      {/* 1. 상단 4개 서브탭 터치 선택 바 (일일 / 주간 / 업적 / 시즌) (Y: 16.5%, H: 5.6%) */}
      {SUBTABS.map((tab) => {
        const isSelected = activeSubTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleSelectSubTab(tab.id)}
            style={{
              top: '16.5%',
              left: tab.left,
              width: tab.width,
              height: '5.6%',
            }}
            className={`pointer-events-auto absolute rounded-xl cursor-pointer active:scale-95 transition-all flex items-center justify-center ${
              isSelected
                ? 'ring-2 ring-amber-300 ring-offset-1 bg-amber-400/25 shadow-md'
                : 'hover:bg-black/10'
            }`}
            title={`${tab.label} 미션`}
          >
            <div className="w-full h-full rounded-xl" />
          </button>
        );
      })}

      {/* 2. 중앙 3대 미션 카드 및 액션 버튼 오버레이 */}
      {currentMissions.map((ach, idx) => {
        const currentVal = getAchievementProgress(ach.id, progress);
        const isDone = currentVal >= ach.target;
        const isClaimed = progress.claimedAchievementIds.includes(ach.id);
        const pos = cardPositions[idx];

        return (
          <React.Fragment key={ach.id}>
            {/* 비-일일 탭 선택 시 카드 본체 텍스트 오버레이 (주간/업적/시즌 내용 표시) */}
            {activeSubTab !== 'DAILY' && (
              <div
                style={{
                  top: pos.cardTop,
                  left: '11.0%',
                  width: '58.0%',
                  height: '14.0%',
                }}
                className="pointer-events-none absolute flex flex-col justify-center px-3 text-left"
              >
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-black text-[#2b1306] drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)] truncate">
                    {ach.title}
                  </h3>
                  <span className="text-[10px] font-black text-amber-900 bg-amber-100/90 border border-amber-300 px-1.5 py-0.2 rounded-full">
                    +{ach.rewardGold} 🪶
                  </span>
                </div>
                <p className="text-[10px] text-[#451a03] font-bold mt-0.5 line-clamp-1">
                  {ach.desc}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-[#3d1e0a]/30 overflow-hidden border border-[#2b1306]/30">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
                      style={{ width: `${Math.min(100, Math.floor((currentVal / ach.target) * 100))}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-black text-[#2b1306]">
                    {currentVal}/{ach.target}
                  </span>
                </div>
              </div>
            )}

            {/* 카드 우측 [받기! / 완료 / 도전] 3D 버튼 터치 영역 */}
            <button
              type="button"
              onClick={() => handleAction(ach.id, isDone, isClaimed)}
              style={{
                top: pos.btnTop,
                left: pos.btnLeft,
                width: pos.btnW,
                height: pos.btnH,
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
          </React.Fragment>
        );
      })}
    </div>
  );
};
