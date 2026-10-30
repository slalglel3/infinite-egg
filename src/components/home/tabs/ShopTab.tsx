import React, { useState } from 'react';
import { UserProgress } from '../../../types/game';
import { saveUserProgress, claimDailyFreeGold } from '../../../utils/storage';
import { ShoppingBag, Coins, Sparkles, Gift, Check, ArrowRight } from 'lucide-react';
import { sound } from '../../../audio/sound';
import confetti from 'canvas-confetti';
import { HatchingModal } from '../HatchingModal';

interface ShopTabProps {
  progress: UserProgress;
  onUpdateProgress: (updated: UserProgress) => void;
}

export const ShopTab: React.FC<ShopTabProps> = ({ progress, onUpdateProgress }) => {
  const [showHatchModal, setShowHatchModal] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const isFreeGoldClaimedToday = progress.lastFreeGoldDate === todayStr;

  // 1일 1회 무료 골드 선물 수령
  const handleFreeGold = () => {
    if (isFreeGoldClaimedToday) return;

    const res = claimDailyFreeGold();
    if (res.success) {
      sound.playHeal();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      onUpdateProgress(res.progress);
    } else {
      alert(res.message);
    }
  };

  // 황금 알 부화기 시작
  const handleStartHatch = () => {
    if (progress.gold < 250) {
      sound.playImpact(5);
      alert('골드가 부족합니다! (필요 골드: 250)');
      return;
    }

    sound.playJump();
    const updated = { ...progress, gold: progress.gold - 250 };
    saveUserProgress(updated);
    onUpdateProgress(updated);
    setShowHatchModal(true);
  };

  // 계란 껍데기 50개 -> 300 골드 환전
  const handleExchangeShells = () => {
    if ((progress.eggShells || 0) < 50) {
      sound.playImpact(5);
      alert('계란 껍데기가 부족합니다! (필요: 50개)');
      return;
    }
    sound.playHeal();
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    const updated = {
      ...progress,
      eggShells: progress.eggShells - 50,
      gold: progress.gold + 300,
    };
    saveUserProgress(updated);
    onUpdateProgress(updated);
  };

  return (
    <div className="flex-1 flex flex-col px-3 py-1.5 safe-container overflow-hidden select-none">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between pb-1.5 px-0.5">
        <h2 className="text-base font-black text-[#1e1b18] flex items-center gap-1.5">
          <ShoppingBag size={18} className="text-amber-500 fill-amber-500" />
          <span>신비한 상점</span>
        </h2>

        {/* 2대 재화 캡슐 */}
        <div className="flex items-center gap-1.5">
          <div className="hud-capsule">
            <Coins size={13} className="text-amber-500 fill-amber-400" />
            <span className="text-xs font-black">{progress.gold.toLocaleString()}</span>
          </div>
          <div className="hud-capsule" title="계란 껍데기">
            <span className="text-xs">🥚</span>
            <span className="text-xs font-black text-rose-700">{progress.eggShells || 0}</span>
          </div>
        </div>
      </div>

      {/* 상점 3대 아케이드 액션 패널 */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pb-4 pr-0.5">
        {/* 1. [일일 무료 선물 보물상자] */}
        <div className="panel-arcade p-3 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-amber-50 border-3 border-[#1e1b18]">
          <div className="flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 border-2 border-[#1e1b18] flex items-center justify-center text-2xl shadow-[0_3px_0_#92400e]">
              🎁
            </div>
            <div>
              <span className="text-xs font-black text-[#1e1b18] block">매일 무료 골드 선물</span>
              <span className="text-[11px] font-extrabold text-emerald-700 block mt-0.5">
                {isFreeGoldClaimedToday ? '✓ 오늘 수령 완료' : '+100 골드 즉시 지급!'}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={isFreeGoldClaimedToday}
            onClick={handleFreeGold}
            className={`py-2 px-3.5 rounded-2xl font-black text-xs cursor-pointer shadow-md flex items-center gap-1 shrink-0 ${
              isFreeGoldClaimedToday
                ? 'bg-gray-300 text-gray-500 border-2 border-gray-400 cursor-not-allowed opacity-75'
                : 'btn-3d-emerald'
            }`}
          >
            {isFreeGoldClaimedToday ? <Check size={14} /> : <Gift size={14} />}
            <span>{isFreeGoldClaimedToday ? '수령 완료' : 'FREE GET!'}</span>
          </button>
        </div>

        {/* 2. [전설의 황금 알 부화기 (Egg Gacha)] — 메인 킬러 콘텐츠 */}
        <div
          onClick={handleStartHatch}
          className="panel-arcade p-4 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-white shadow-2xl relative overflow-hidden cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all border-3 border-[#1e1b18]"
        >
          {/* 장식용 은은한 블러 원 */}
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between z-10 mb-1">
            <span className="text-[10px] font-black bg-white text-orange-600 px-2.5 py-0.5 rounded-full shadow-md border border-black/10">
              BEST 가챠
            </span>
            <span
              style={{ textShadow: '-1px -1px 0 #18181b, 1px -1px 0 #18181b, -1px 1px 0 #18181b, 1px 1px 0 #18181b' }}
              className="text-xs font-black text-amber-200 flex items-center gap-1"
            >
              <Sparkles size={14} className="text-yellow-300" />
              <span>전설 알 & 의상 세트</span>
            </span>
          </div>

          {/* 중앙 황금 알 일러스트 */}
          <div className="flex items-center justify-between my-2 z-10">
            <div>
              <h3
                style={{
                  fontFamily: "'Fredoka', 'Jua', 'Black Han Sans', sans-serif",
                  textShadow: '-1.5px -1.5px 0 #18181b, 1.5px -1.5px 0 #18181b, -1.5px 1.5px 0 #18181b, 1.5px 1.5px 0 #18181b, 0 3px 0 #09090b',
                }}
                className="text-2xl font-black text-white"
              >
                황금 둥지 알 부화기
              </h3>
              <p
                style={{ textShadow: '0 1.5px 3px rgba(0,0,0,0.7)' }}
                className="text-xs font-black text-white mt-1"
              >
                터치 시 리본 풀기 인터랙티브 부화! (중복 시 껍데기 환급)
              </p>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-white/25 backdrop-blur-md border-2 border-white/50 flex items-center justify-center text-3xl shadow-inner shrink-0 ml-2 animate-bounce">
              ✨🥚
            </div>
          </div>

          {/* 부화 시작 3D 버튼 바 */}
          <div className="mt-2 pt-2 border-t border-white/30 flex items-center justify-between z-10">
            <div
              style={{ textShadow: '-1px -1px 0 #18181b, 1px -1px 0 #18181b, -1px 1px 0 #18181b, 1px 1px 0 #18181b' }}
              className="flex items-center gap-1 font-black text-amber-200"
            >
              <Coins size={16} className="text-yellow-300" />
              <span className="text-lg">250 골드</span>
            </div>

            <span className="btn-3d-amber py-2 px-4 rounded-xl text-xs font-black flex items-center gap-1 shadow-lg text-[#1e1b18]">
              <span>부화 시작 ▶</span>
            </span>
          </div>
        </div>

        {/* 3. [계란 껍데기 암시장 환전소] */}
        <div
          onClick={handleExchangeShells}
          className="panel-arcade p-3 bg-gradient-to-r from-rose-500 via-rose-600 to-amber-600 text-white flex items-center justify-between cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all border-3 border-[#1e1b18]"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-2xl shadow-inner shrink-0">
              🥚
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white drop-shadow">계란 껍데기 환전</span>
                <span className="text-[9px] font-black bg-black/40 px-1.5 py-0.2 rounded-full text-amber-200 border border-white/20">
                  보유: {progress.eggShells || 0}개
                </span>
              </div>
              <p className="text-[11px] font-extrabold text-white mt-0.5 drop-shadow-sm">
                껍데기 50개 ➔ 300 골드로 즉시 교환
              </p>
            </div>
          </div>

          <div className="btn-3d-square py-1.5 px-3 rounded-xl text-xs font-black flex items-center gap-1 text-[#1e1b18] shrink-0">
            <span>환전</span>
            <ArrowRight size={12} />
          </div>
        </div>
      </div>

      {/* 부화 모달 (리본 풀기) */}
      {showHatchModal && (
        <HatchingModal
          progress={progress}
          onClose={() => setShowHatchModal(false)}
          onUpdateProgress={onUpdateProgress}
        />
      )}
    </div>
  );
};
