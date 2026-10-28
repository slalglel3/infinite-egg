import React, { useState } from 'react';
import { UserProgress } from '../../../types/game';
import { saveUserProgress, claimDailyFreeGold, isTutorialSeen, markTutorialSeen } from '../../../utils/storage';
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
  const [showTutorial, setShowTutorial] = useState(!isTutorialSeen('SHOP'));

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

  // [피드백 6 연동] 황금 둥지 알 부화기 시작 (카드 자체 클릭)
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

  // 계란 껍데기로 골드 교환 (50 껍데기 -> 300 골드)
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
    alert('계란 껍데기 50개를 300 골드로 성공적으로 교환했습니다!');
  };

  return (
    <div className="flex-1 flex flex-col px-4 py-2 safe-container overflow-hidden">
      {/* 상단 헤더 & 재화 배지 */}
      <div className="flex items-center justify-between pb-2 px-1">
        <h2 className="text-lg font-black text-gray-800 flex items-center gap-1.5">
          <ShoppingBag size={20} className="text-amber-500 fill-amber-500" />
          달걀 상점
        </h2>

        {/* 2대 재화 (골드 & 계란 껍데기) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-md border border-amber-300">
            <Coins size={14} className="text-yellow-200" />
            <span>{progress.gold.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 bg-rose-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-md border border-rose-300" title="계란 껍데기 재화">
            <span>🥚 {progress.eggShells || 0}</span>
          </div>
        </div>
      </div>

      {/* [피드백 6 & 7 & 8] 큼직하고 세련된 상점 액션 타일 리스트 */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 pb-4 pr-1">
        {/* 1. [황금 둥지 알 부화기] - 카드 전체가 거대한 인터랙티브 가챠 버튼! */}
        <div
          onClick={handleStartHatch}
          className="rounded-3xl p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-2xl border-3 border-white/60 relative overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all select-none ring-2 ring-white/40"
        >
          {/* 빛나는 블러 배경 */}
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-2 relative z-10">
            <span className="text-xs font-black bg-white text-orange-600 px-3 py-1 rounded-full shadow-md">
              BEST 가챠
            </span>
            <span className="text-xs font-black text-yellow-200 flex items-center gap-1 drop-shadow">
              <Sparkles size={15} />
              리본 풀기 인터랙티브 부화!
            </span>
          </div>

          <div className="flex items-center justify-between my-2 relative z-10">
            <div>
              <h3 className="text-2xl font-black tracking-tight drop-shadow-md">
                황금 둥지 알 부화기
              </h3>
              <p className="text-xs text-yellow-100 font-extrabold mt-1">
                전설의 계란 & 전용 의상 세트 부화 (중복 시 껍데기 환급)
              </p>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-3xl shadow-inner shrink-0 ml-2 animate-bounce">
              🎁
            </div>
          </div>

          {/* 터치하여 바로 시작 버튼 배너 */}
          <div className="mt-4 pt-3 border-t border-white/30 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-1.5 font-black text-yellow-200">
              <Coins size={20} className="text-yellow-300" />
              <span className="text-xl">250 골드</span>
            </div>

            <span className="bg-white text-orange-600 font-black text-xs px-4 py-2 rounded-xl shadow-lg flex items-center gap-1">
              <Gift size={15} />
              <span>터치하여 부화 시작 ▶</span>
            </span>
          </div>
        </div>

        {/* 2. [매일 무료 선물 & 골드 충전소] - 큼직한 원터치 액션 타일 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 매일 무료 선물 버튼 */}
          <button
            type="button"
            disabled={isFreeGoldClaimedToday}
            onClick={handleFreeGold}
            className={`p-4 rounded-3xl border-3 flex flex-col items-center justify-center gap-2 transition-all select-none shadow-md ${
              isFreeGoldClaimedToday
                ? 'bg-gray-100 border-gray-300 opacity-65 cursor-not-allowed'
                : 'bg-gradient-to-b from-emerald-50 to-emerald-100 border-emerald-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ring-2 ring-emerald-200'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${
              isFreeGoldClaimedToday ? 'bg-gray-200 text-gray-400' : 'bg-emerald-500 text-white animate-pulse'
            }`}>
              {isFreeGoldClaimedToday ? <Check size={22} /> : '🎁'}
            </div>
            <div className="text-center">
              <span className="text-sm font-black text-gray-900 block">매일 무료 선물</span>
              <span className={`text-xs font-black mt-0.5 block ${
                isFreeGoldClaimedToday ? 'text-gray-400' : 'text-emerald-700'
              }`}>
                {isFreeGoldClaimedToday ? '오늘 수령 완료' : '+100 골드 받기'}
              </span>
            </div>
          </button>

          {/* 인앱 결제 (준비중) */}
          <div className="p-4 rounded-3xl bg-gray-50 border-3 border-gray-200 flex flex-col items-center justify-center gap-2 opacity-70 select-none">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl text-amber-600">
              💰
            </div>
            <div className="text-center">
              <span className="text-sm font-black text-gray-800 block">골드 자루 (1,000)</span>
              <span className="text-xs font-bold text-gray-500 mt-0.5 block">정식 출시 준비중</span>
            </div>
          </div>
        </div>

        {/* 3. [계란 껍데기 환전소] - 카드 전체가 원클릭 환전 버튼! */}
        <div
          onClick={handleExchangeShells}
          className="rounded-3xl p-4 bg-gradient-to-r from-rose-500 via-rose-600 to-amber-600 text-white shadow-xl border-3 border-white/50 flex items-center justify-between cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-2xl shadow-inner">
              🥚
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white drop-shadow">계란 껍데기 환전</span>
                <span className="text-[10px] font-black bg-white/25 px-2 py-0.5 rounded-full text-yellow-200">
                  보유: {progress.eggShells || 0}개
                </span>
              </div>
              <p className="text-xs font-extrabold text-rose-100 mt-0.5">
                껍데기 50개 ➔ 300 골드로 즉시 교환
              </p>
            </div>
          </div>

          <div className="bg-white text-rose-600 font-black text-xs px-3.5 py-2 rounded-xl shadow-md flex items-center gap-1 shrink-0">
            <span>환전하기</span>
            <ArrowRight size={13} />
          </div>
        </div>

        {/* 4. [VIP 혜택] */}
        <div className="rounded-3xl p-4 bg-white/95 border-2 border-amber-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md text-xl">
              <Crown size={22} />
            </div>
            <div>
              <span className="text-sm font-black text-gray-900 block">광고 제거 VIP 패키지</span>
              <span className="text-xs text-gray-500 font-bold block mt-0.5">쾌적한 무광고 + 영구 EXP 1.2배</span>
            </div>
          </div>
          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
            출시 예정
          </span>
        </div>
      </div>

      {/* [피드백 7 구현] 달걀 상점 최초 진입 튜토리얼 모달 */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl border-4 border-amber-300 flex flex-col items-center gap-3.5 text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
              <ShoppingBag size={34} className="fill-amber-500 text-amber-500" />
            </div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">달걀 상점 안내</h3>
            <p className="text-xs text-gray-600 font-semibold leading-relaxed">
              매일 무료 골드를 받고 알 부화기에서 새로운 계란을 부화시켜보세요!<br /><br />
              🎁 <strong>황금 부화기</strong>에서 리본을 풀면 전설의 계란이 태어납니다. 이미 보유한 계란은 <strong>계란 껍데기</strong>로 환급되어 골드로 환전할 수 있습니다!
            </p>
            <button
              type="button"
              onClick={() => {
                sound.playTurn();
                markTutorialSeen('SHOP');
                setShowTutorial(false);
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-white font-black text-sm rounded-2xl shadow-lg hover:from-amber-500 hover:to-amber-600 active:scale-95 transition-all cursor-pointer"
            >
              상점 둘러보기!
            </button>
          </div>
        </div>
      )}

      {/* 부화 모달 (리본 풀기 인터랙션) */}
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
