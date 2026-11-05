import React, { useState } from 'react';
import { UserProgress } from '../../../types/game';
import { saveUserProgress, claimDailyFreeGold } from '../../../utils/storage';
import { sound } from '../../../audio/sound';
import confetti from 'canvas-confetti';
import { HatchingModal } from '../HatchingModal';

interface ShopTabProps {
  progress: UserProgress;
  onUpdateProgress: (updated: UserProgress) => void;
}

export const ShopTab: React.FC<ShopTabProps> = ({ progress, onUpdateProgress }) => {
  const [showHatchModal, setShowHatchModal] = useState(false);
  const [_hatchCount, setHatchCount] = useState<1 | 10>(1);

  const todayStr = new Date().toISOString().slice(0, 10);
  const isFreeClaimedToday = progress.lastFreeGoldDate === todayStr;

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

  // 곡식(활동력) 구매: 깃털 -> 곡식
  const handleBuyWheat = (amount: number, cost: number) => {
    const currentFeathers = progress.feathers ?? progress.gold;
    if (currentFeathers < cost) {
      sound.playImpact(5);
      alert(`황금 깃털이 부족합니다! (필요: ${cost}개, 보유: ${currentFeathers}개)`);
      return;
    }

    sound.playHeal();
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    const updated = {
      ...progress,
      feathers: currentFeathers - cost,
      gold: currentFeathers - cost,
      wheat: Math.min((progress.maxWheat || 50), (progress.wheat || 0) + amount),
    };
    saveUserProgress(updated);
    onUpdateProgress(updated);
  };

  // 매일 무료 황금 깃털 (+50) 수령
  const handleClaimFreeDaily = () => {
    if (isFreeClaimedToday) {
      sound.playTurn();
      alert('오늘의 무료 깃털을 이미 수령했습니다! 내일 다시 방문해주세요 🌾');
      return;
    }

    const res = claimDailyFreeGold();
    if (res.success) {
      sound.playHeal();
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 } });
      onUpdateProgress(res.progress);
    }
  };

  // 계란 껍데기 50개 -> 300 깃털 환전
  const handleExchangeShells = () => {
    if ((progress.eggShells || 0) < 50) {
      sound.playImpact(5);
      alert(`계란 껍데기가 부족합니다! (필요: 50개, 보유: ${progress.eggShells || 0}개)\n중복 달걀 부화 시 껍데기가 지급됩니다.`);
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
    <div className="w-full h-full relative select-none">
      {/* 1. 상단: [1회 부화 (🪶 100)] 버튼 터치 영역 (Y: 39.0%, X: 20.5%) */}
      <button
        type="button"
        onClick={() => handleStartHatch(1)}
        className="pointer-events-auto absolute top-[39.0%] left-[20.5%] w-[27.5%] h-[7.2%] cursor-pointer active:scale-95 transition-transform group rounded-2xl"
        title="1회 달걀 부화 (🪶 100)"
      >
        <div className="w-full h-full rounded-2xl group-active:bg-amber-400/25 transition-colors" />
      </button>

      {/* 2. 상단: [10회 부화 (🪶 900)] 버튼 터치 영역 (Y: 39.0%, X: 52.0%) */}
      <button
        type="button"
        onClick={() => handleStartHatch(10)}
        className="pointer-events-auto absolute top-[39.0%] left-[52.0%] w-[27.5%] h-[7.2%] cursor-pointer active:scale-95 transition-transform group rounded-2xl"
        title="10회 연속 달걀 부화 (🪶 900)"
      >
        <div className="w-full h-full rounded-2xl group-active:bg-amber-400/25 transition-colors" />
      </button>

      {/* 3. 하단 상품 1: [곡식 10개 (🪶 50)] (Y: 55.0%, X: 10.0%) */}
      <button
        type="button"
        onClick={() => handleBuyWheat(10, 50)}
        className="pointer-events-auto absolute top-[55.0%] left-[10.0%] w-[39.0%] h-[12.0%] cursor-pointer active:scale-95 transition-transform group rounded-3xl"
        title="곡식 10개 구매 (🪶 50)"
      >
        <div className="w-full h-full rounded-3xl group-active:bg-amber-400/20 transition-colors" />
      </button>

      {/* 4. 하단 상품 2: [곡식 50개 (🪶 200)] (Y: 55.0%, X: 51.0%) */}
      <button
        type="button"
        onClick={() => handleBuyWheat(50, 200)}
        className="pointer-events-auto absolute top-[55.0%] left-[51.0%] w-[39.0%] h-[12.0%] cursor-pointer active:scale-95 transition-transform group rounded-3xl"
        title="곡식 50개 구매 (🪶 200)"
      >
        <div className="w-full h-full rounded-3xl group-active:bg-amber-400/20 transition-colors" />
      </button>

      {/* 5. 하단 상품 3: [깃털 바구니 / 매일 무료 깃털] (Y: 68.0%, X: 10.0%) */}
      <button
        type="button"
        onClick={handleClaimFreeDaily}
        className="pointer-events-auto absolute top-[68.0%] left-[10.0%] w-[39.0%] h-[12.0%] cursor-pointer active:scale-95 transition-transform group rounded-3xl"
        title={!isFreeClaimedToday ? "오늘의 무료 깃털 받기 (+50 🪶)" : "무료 깃털 이미 수령 완료"}
      >
        <div className="w-full h-full rounded-3xl group-active:bg-amber-400/20 transition-colors" />
      </button>

      {/* 6. 하단 상품 4: [황금 보물 상자 / 껍데기 50개 환전] (Y: 68.0%, X: 51.0%) */}
      <button
        type="button"
        onClick={handleExchangeShells}
        className="pointer-events-auto absolute top-[68.0%] left-[51.0%] w-[39.0%] h-[12.0%] cursor-pointer active:scale-95 transition-transform group rounded-3xl"
        title={`계란 껍데기 환전 (보유: ${progress.eggShells || 0}개)`}
      >
        <div className="w-full h-full rounded-3xl group-active:bg-amber-400/20 transition-colors" />
      </button>

      {/* 7. 달걀 부화 연출 모달 (1회 / 10회) */}
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
