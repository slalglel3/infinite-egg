import React, { useState } from 'react';
import { UserProgress } from '../../../types/game';
import { saveUserProgress, claimDailyFreeGold } from '../../../utils/storage';
import { ShoppingBag, Coins, Sparkles, Crown, Zap, Gift, Check, ArrowRight } from 'lucide-react';
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

  // [피드백 3 해결] 1일 1회 무료 골드 선물 수령
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

  // [피드백 4 & 7 연동] 황금 둥지 알 부화기 시작 (250 골드)
  const handleStartHatch = () => {
    if (progress.gold < 250) {
      alert('골드가 부족합니다! (필요 골드: 250)');
      return;
    }

    sound.playJump();
    // 250 골드 차감 후 부화 모달 오픈
    const updated = { ...progress, gold: progress.gold - 250 };
    saveUserProgress(updated);
    onUpdateProgress(updated);
    setShowHatchModal(true);
  };

  // 계란 껍데기로 골드 교환 (50 껍데기 -> 300 골드)
  const handleExchangeShells = () => {
    if ((progress.eggShells || 0) < 50) {
      alert('계란 껍데기가 부족합니다! (필요: 50개)');
      return;
    }
    sound.playHeal();
    const updated = {
      ...progress,
      eggShells: progress.eggShells - 50,
      gold: progress.gold + 300,
    };
    saveUserProgress(updated);
    onUpdateProgress(updated);
    alert('계란 껍데기 50개를 300 골드로 성공적으로 교환했습니다!');
  };

  return (
    <div className="flex-1 flex flex-col px-4 py-2 safe-container overflow-hidden">
      {/* 상단 헤더 & 재화 배지 */}
      <div className="flex items-center justify-between pb-2 px-1">
        <div>
          <h2 className="text-base font-black text-gray-800 flex items-center gap-1.5">
            <ShoppingBag size={18} className="text-amber-500 fill-amber-500" />
            달걀 상점
          </h2>
          <p className="text-[11px] text-gray-500 font-bold">
            신비한 알 부화기와 특별 보상을 만나보세요!
          </p>
        </div>

        {/* 2대 재화 (골드 & 계란 껍데기) */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-amber-500 text-white px-2.5 py-1 rounded-full text-xs font-black shadow-sm">
            <Coins size={13} className="text-yellow-200" />
            <span>{progress.gold.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 bg-rose-500 text-white px-2.5 py-1 rounded-full text-xs font-black shadow-sm" title="계란 껍데기 재화">
            <span>🥚 {progress.eggShells || 0}</span>
          </div>
        </div>
      </div>

      {/* 상점 상품 리스트 */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-4 pr-1">
        {/* 1. [황금 둥지 알 부화기] (피드백 4: 리본 드래그 & 태동 연출) */}
        <div className="rounded-3xl p-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-xl border-2 border-white/50 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black bg-white text-orange-600 px-2.5 py-0.5 rounded-full shadow-sm">
              인기 추천
            </span>
            <span className="text-xs font-bold text-yellow-200 flex items-center gap-1">
              <Sparkles size={14} />
              리본 풀기 인터랙티브 부화!
            </span>
          </div>

          <h3 className="text-xl font-black tracking-tight">황금 둥지 알 부화기</h3>
          <p className="text-xs text-white/90 font-medium mt-0.5">
            손으로 리본을 풀면 두근두근 태동과 함께 전설의 계란이 깨어납니다! (중복 시 계란 껍데기 지급)
          </p>

          <div className="mt-2.5 flex items-center gap-2 text-[10px] text-yellow-100 font-bold">
            <span>확률: 전설 3%</span>
            <span>•</span>
            <span>에픽 12%</span>
            <span>•</span>
            <span>레어 25%</span>
            <span>•</span>
            <span>일반 60%</span>
          </div>

          <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-black text-yellow-200">
              <Coins size={18} />
              <span className="text-lg">250 골드</span>
            </div>

            <button
              type="button"
              onClick={handleStartHatch}
              className="bg-white text-orange-600 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg hover:bg-yellow-50 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Gift size={15} />
              <span>알 부화시키기</span>
            </button>
          </div>
        </div>

        {/* 2. [무료 보상 & 골드 충전소] (피드백 3 해결) */}
        <div className="flex flex-col gap-2 bg-white/90 backdrop-blur-md rounded-2xl p-3.5 border border-amber-200 shadow-sm">
          <span className="text-xs font-black text-gray-800 flex items-center gap-1">
            <Coins size={14} className="text-amber-500" />
            골드 충전소 & 일일 무료 선물
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isFreeGoldClaimedToday}
              onClick={handleFreeGold}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                isFreeGoldClaimedToday
                  ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'
                  : 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100 active:scale-95 cursor-pointer shadow-sm'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isFreeGoldClaimedToday ? 'bg-gray-200 text-gray-400' : 'bg-emerald-200 text-emerald-700'
              }`}>
                {isFreeGoldClaimedToday ? <Check size={16} /> : <Gift size={16} />}
              </div>
              <span className="text-xs font-black text-gray-800">매일 무료 선물</span>
              <span className={`text-[10px] font-bold ${
                isFreeGoldClaimedToday ? 'text-gray-400' : 'text-emerald-600'
              }`}>
                {isFreeGoldClaimedToday ? '오늘 수령 완료' : '+100 골드 무료 받기'}
              </span>
            </button>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center gap-1 opacity-70">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <Coins size={16} />
              </div>
              <span className="text-xs font-black text-gray-800">골드 자루 (1,000)</span>
              <span className="text-[10px] font-bold text-gray-400">인앱 결제 (준비중)</span>
            </div>
          </div>
        </div>

        {/* 3. [계란 껍데기 교환소] (피드백 7 구현) */}
        <div className="flex flex-col gap-2 bg-white/90 backdrop-blur-md rounded-2xl p-3.5 border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-gray-800 flex items-center gap-1">
              <span>🥚</span>
              계란 껍데기 교환소
            </span>
            <span className="text-[10px] text-rose-600 font-bold">
              보유: {progress.eggShells || 0}개
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/70 border border-rose-200">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🥚</span>
              <div className="flex flex-col">
                <span className="text-xs font-black text-gray-800">골드 환전 팩 (300G)</span>
                <span className="text-[10px] text-gray-500 font-semibold">계란 껍데기 50개 필요</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExchangeShells}
              className="bg-rose-500 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-sm hover:bg-rose-600 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            >
              <span>환전하기</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* 4. [VIP & 편의성] */}
        <div className="flex flex-col gap-2 bg-white/90 backdrop-blur-md rounded-2xl p-3.5 border border-amber-200 shadow-sm">
          <span className="text-xs font-black text-gray-800 flex items-center gap-1">
            <Crown size={14} className="text-amber-500" />
            프리미엄 혜택
          </span>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-sky-50 to-amber-50 border border-amber-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                <Zap size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-gray-800">광고 제거 VIP 패키지</span>
                <span className="text-[10px] text-gray-500 font-semibold">광고 없는 쾌적한 질주 + 영구 경험치 1.2배</span>
              </div>
            </div>

            <button
              type="button"
              disabled
              className="bg-gray-200 text-gray-500 font-bold text-[11px] px-3 py-1.5 rounded-xl cursor-not-allowed"
            >
              출시 예정
            </button>
          </div>
        </div>
      </div>

      {/* 부화 모달 (피드백 4 & 7 리본 풀기 인터랙션) */}
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
