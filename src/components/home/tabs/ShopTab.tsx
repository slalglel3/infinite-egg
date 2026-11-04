import React, { useState } from 'react';
import { UserProgress } from '../../../types/game';
import { saveUserProgress, claimDailyFreeGold } from '../../../utils/storage';
import { ShoppingBag, Sparkles, Gift, Check, ArrowRight } from 'lucide-react';
import { sound } from '../../../audio/sound';
import confetti from 'canvas-confetti';
import { HatchingModal } from '../HatchingModal';

interface ShopTabProps {
  progress: UserProgress;
  onUpdateProgress: (updated: UserProgress) => void;
}

export const ShopTab: React.FC<ShopTabProps> = ({ progress, onUpdateProgress }) => {
  const [showHatchModal, setShowHatchModal] = useState(false);
  const [hatchCount, setHatchCount] = useState<1 | 10>(1);
  const [subSection, setSubSection] = useState<'MAIN' | 'SHELL_SHOP'>('MAIN');

  const todayStr = new Date().toISOString().slice(0, 10);
  const isFreeGoldClaimedToday = progress.lastFreeGoldDate === todayStr;

  // 1회 또는 10회 부화 시작
  const handleStartHatch = (count: 1 | 10) => {
    const cost = count === 1 ? 100 : 900;
    const currentFeathers = progress.feathers ?? progress.gold;

    if (currentFeathers < cost) {
      sound.playImpact(5);
      alert(`황금 깃털이 부족합니다! (필요: ${cost}개, 보유: ${currentFeathers}개)`);
      return;
    }

    sound.playJump();
    const updated = {
      ...progress,
      feathers: currentFeathers - cost,
      gold: currentFeathers - cost,
    };
    saveUserProgress(updated);
    onUpdateProgress(updated);
    setHatchCount(count);
    setShowHatchModal(true);
  };

  // 곡식(활동력) 구매: 깃털 50 -> 곡식 10
  const handleBuyWheat = (amount: number, cost: number) => {
    const currentFeathers = progress.feathers ?? progress.gold;
    if (currentFeathers < cost) {
      sound.playImpact(5);
      alert(`황금 깃털이 부족합니다! (필요: ${cost}개, 보유: ${currentFeathers}개)`);
      return;
    }

    sound.playHeal();
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    const updated = {
      ...progress,
      feathers: currentFeathers - cost,
      gold: currentFeathers - cost,
      wheat: Math.min((progress.maxWheat || 50), (progress.wheat || 0) + amount),
    };
    saveUserProgress(updated);
    onUpdateProgress(updated);
  };

  // 계란 껍데기 50개 -> 300 깃털 환전
  const handleExchangeShells = () => {
    if ((progress.eggShells || 0) < 50) {
      sound.playImpact(5);
      alert('계란 껍데기가 부족합니다! (필요: 50개)');
      return;
    }
    sound.playHeal();
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    const currentFeathers = progress.feathers ?? progress.gold;
    const updated = {
      ...progress,
      eggShells: progress.eggShells - 50,
      feathers: currentFeathers + 300,
      gold: currentFeathers + 300,
    };
    saveUserProgress(updated);
    onUpdateProgress(updated);
  };

  return (
    <div className="flex-1 flex flex-col px-3 py-1.5 safe-container overflow-hidden select-none">
      {/* 상단 탭 헤더: [상점] 타이틀 & 껍데기 상점 전환 버튼 */}
      <div className="flex items-center justify-between pb-1.5 px-0.5">
        <h2 className="text-base font-black text-amber-100 flex items-center gap-1.5 drop-shadow-[0_2px_2px_#1a0a03]">
          <ShoppingBag size={18} className="text-amber-400 fill-amber-500" />
          <span>{subSection === 'MAIN' ? '상점' : '계란 껍데기 상점'}</span>
        </h2>

        <button
          type="button"
          onClick={() => setSubSection(subSection === 'MAIN' ? 'SHELL_SHOP' : 'MAIN')}
          className="bg-[#5c371e] text-amber-100 border-2 border-[#2b1306] shadow-[0_2px_0_#2b1306] px-2.5 py-1 rounded-xl text-xs font-black cursor-pointer active:translate-y-0.5 transition-all flex items-center gap-1"
        >
          <span>{subSection === 'MAIN' ? '🥚 껍데기 상점 이동 ▶' : '🏪 일반 상점 복귀'}</span>
        </button>
      </div>

      {/* 상점 메인 컨텐츠 영역 */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-4 pr-0.5">
        {subSection === 'MAIN' ? (
          <>
            {/* 1. [행운의 둥지 부화기 (shop.png 100% 매칭)] */}
            <div className="bg-[#4a2811] border-4 border-[#241005] shadow-[0_6px_0_#241005] rounded-3xl p-4 flex flex-col items-center relative text-center">
              <span className="text-sm font-black text-amber-200 tracking-wide mb-2">
                행운의 둥지 부화기
              </span>

              {/* 중앙 부화 둥지 & 달걀 */}
              <div className="relative w-28 h-28 my-1 flex items-center justify-center">
                <div className="text-5xl filter drop-shadow-lg animate-bounce">
                  🪹
                </div>
                <div className="absolute top-4 text-4xl">
                  🥚
                </div>
              </div>

              {/* 2대 고광택 오렌지 부화 버튼: [1회 부화 🪶 100] & [10회 부화 🪶 900] */}
              <div className="w-full grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => handleStartHatch(1)}
                  className="py-2.5 px-2 rounded-2xl bg-gradient-to-b from-[#fcd34d] via-[#f59e0b] to-[#d97706] border-3 border-[#451a03] shadow-[0_4px_0_#451a03] text-[#241005] font-black text-xs cursor-pointer active:translate-y-1 active:shadow-none flex flex-col items-center justify-center gap-0.5"
                >
                  <span className="text-sm font-black">1회 부화</span>
                  <span className="text-[11px] font-black flex items-center gap-0.5">
                    🪶 100
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStartHatch(10)}
                  className="py-2.5 px-2 rounded-2xl bg-gradient-to-b from-[#fcd34d] via-[#f59e0b] to-[#d97706] border-3 border-[#451a03] shadow-[0_4px_0_#451a03] text-[#241005] font-black text-xs cursor-pointer active:translate-y-1 active:shadow-none flex flex-col items-center justify-center gap-0.5"
                >
                  <span className="text-sm font-black">10회 부화</span>
                  <span className="text-[11px] font-black flex items-center gap-0.5 text-[#451a03]">
                    🪶 900 (10% 할인!)
                  </span>
                </button>
              </div>
            </div>

            {/* 2. [재화 구매 (shop.png 100% 매칭)] */}
            <div className="bg-[#4a2811] border-4 border-[#241005] shadow-[0_6px_0_#241005] rounded-3xl p-4 flex flex-col gap-2.5">
              <span className="text-sm font-black text-amber-200 text-center tracking-wide">
                재화 구매
              </span>

              {/* 4개 오목한 나무 슬롯 카드 그리드 */}
              <div className="grid grid-cols-2 gap-2">
                {/* 1. 곡식 한 움 (10개) */}
                <div
                  onClick={() => handleBuyWheat(10, 50)}
                  className="bg-[#31180a] border-3 border-[#1d0c03] rounded-2xl p-2.5 flex items-center justify-between cursor-pointer hover:border-amber-400 active:scale-95 transition-all shadow-inner"
                >
                  <div className="text-3xl">🌾</div>
                  <div className="text-right">
                    <span className="text-xs font-black text-amber-100 block">곡식 한 움</span>
                    <span className="text-[10px] text-amber-300 font-extrabold block">(10개)</span>
                    <span className="text-xs font-black text-yellow-300 mt-1 block">🪶 50</span>
                  </div>
                </div>

                {/* 2. 곡식 자루 (50개) */}
                <div
                  onClick={() => handleBuyWheat(50, 200)}
                  className="bg-[#31180a] border-3 border-[#1d0c03] rounded-2xl p-2.5 flex items-center justify-between cursor-pointer hover:border-amber-400 active:scale-95 transition-all shadow-inner"
                >
                  <div className="text-3xl">🧺</div>
                  <div className="text-right">
                    <span className="text-xs font-black text-amber-100 block">곡식 자루</span>
                    <span className="text-[10px] text-amber-300 font-extrabold block">(50개)</span>
                    <span className="text-xs font-black text-yellow-300 mt-1 block">🪶 200</span>
                  </div>
                </div>

                {/* 3. 깃털 바구니 */}
                <div
                  onClick={() => alert('인앱 결제 시스템 준비 중입니다.')}
                  className="bg-[#31180a] border-3 border-[#1d0c03] rounded-2xl p-2.5 flex items-center justify-between cursor-pointer hover:border-amber-400 active:scale-95 transition-all shadow-inner"
                >
                  <div className="text-3xl">🪶</div>
                  <div className="text-right">
                    <span className="text-xs font-black text-amber-100 block">깃털 바구니</span>
                    <span className="text-xs font-black text-emerald-400 mt-2 block">₩1,500</span>
                  </div>
                </div>

                {/* 4. 황금 상자 팩 */}
                <div
                  onClick={() => alert('인앱 결제 시스템 준비 중입니다.')}
                  className="bg-[#31180a] border-3 border-[#1d0c03] rounded-2xl p-2.5 flex items-center justify-between cursor-pointer hover:border-amber-400 active:scale-95 transition-all shadow-inner"
                >
                  <div className="text-3xl animate-bounce">📦</div>
                  <div className="text-right">
                    <span className="text-xs font-black text-amber-100 block">황금 상자 팩</span>
                    <span className="text-xs font-black text-emerald-400 mt-2 block">₩5,500</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* [계란 껍데기 상점 서브 섹션] */
          <div className="bg-[#4a2811] border-4 border-[#241005] shadow-[0_6px_0_#241005] rounded-3xl p-4 flex flex-col gap-3">
            <div className="text-center">
              <span className="text-sm font-black text-amber-200 tracking-wide block">
                🥚 계란 껍데기 암시장 교환소
              </span>
              <p className="text-xs text-amber-200/70 mt-1">
                중복 부화로 획득한 계란 껍데기를 황금 깃털로 즉시 교환하세요!
              </p>
            </div>

            {/* 껍데기 보유 현황 */}
            <div className="bg-[#2d1506] p-3 rounded-2xl border-2 border-[#1c0c03] flex items-center justify-between">
              <span className="text-xs font-black text-amber-100">현재 보유 껍데기</span>
              <span className="text-base font-black text-amber-300">🥚 {progress.eggShells || 0}개</span>
            </div>

            {/* 교환 상품 카드 */}
            <div
              onClick={handleExchangeShells}
              className="bg-[#31180a] border-3 border-[#1d0c03] rounded-2xl p-3 flex items-center justify-between cursor-pointer hover:border-amber-400 active:scale-95 transition-all shadow-inner"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-3xl">🥚 ➔ 🪶</span>
                <div>
                  <span className="text-xs font-black text-amber-100 block">황금 깃털 환전</span>
                  <span className="text-[11px] text-amber-300/80 block mt-0.5">껍데기 50개 ➔ 깃털 300개</span>
                </div>
              </div>

              <button
                type="button"
                className="py-1.5 px-3 rounded-xl bg-gradient-to-b from-amber-400 to-amber-600 text-[#241005] font-black text-xs cursor-pointer shadow-md"
              >
                교환
              </button>
            </div>
          </div>
        )}
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
