import React, { useState } from 'react';
import { UserProgress } from '../../../types/game';
import { EGG_SKINS } from '../../../data/eggSkins';
import { saveUserProgress } from '../../../utils/storage';
import { ShoppingBag, Coins, Sparkles, Crown, Zap, Gift, Check } from 'lucide-react';
import { sound } from '../../../audio/sound';
import confetti from 'canvas-confetti';

interface ShopTabProps {
  progress: UserProgress;
  onUpdateProgress: (updated: UserProgress) => void;
}

export const ShopTab: React.FC<ShopTabProps> = ({ progress, onUpdateProgress }) => {
  const [gachaResult, setGachaResult] = useState<string | null>(null);

  // 무료 골드 선물 받기 (1일 1회 / 쿨타임 시뮬레이션)
  const handleFreeGold = () => {
    sound.playHeal();
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    const updated = { ...progress, gold: progress.gold + 100 };
    saveUserProgress(updated);
    onUpdateProgress(updated);
    alert('무료 보상 100 골드를 획득했습니다!');
  };

  // 황금 둥지 알 뽑기 (250 골드)
  const handleGacha = () => {
    if (progress.gold < 250) {
      alert('골드가 부족합니다! (필요 골드: 250)');
      return;
    }

    sound.playImpact(8);
    // 미보유 스킨 중 랜덤 추첨 (다 보유 시 500골드 페이백)
    const lockedSkins = EGG_SKINS.filter((s) => !progress.unlockedEggIds.includes(s.id));

    if (lockedSkins.length === 0) {
      // 모든 스킨 보유 시 골드 2배 잭팟
      const updated = { ...progress, gold: progress.gold + 250 };
      saveUserProgress(updated);
      onUpdateProgress(updated);
      alert('모든 계란을 이미 보유 중입니다! 행운의 골드 500이 환급되었습니다!');
      return;
    }

    const randomSkin = lockedSkins[Math.floor(Math.random() * lockedSkins.length)];
    const updated: UserProgress = {
      ...progress,
      gold: progress.gold - 250,
      unlockedEggIds: [...progress.unlockedEggIds, randomSkin.id],
      selectedEggId: randomSkin.id,
    };

    saveUserProgress(updated);
    onUpdateProgress(updated);

    confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
    sound.playPerfect();
    setGachaResult(`축하합니다! 새로운 계란 [${randomSkin.name}]을(를) 부화시켰습니다!`);
  };

  return (
    <div className="flex-1 flex flex-col px-4 py-2 safe-container overflow-hidden">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between pb-2 px-1">
        <div>
          <h2 className="text-base font-black text-gray-800 flex items-center gap-1.5">
            <ShoppingBag size={18} className="text-amber-500 fill-amber-500" />
            달걀 상점
          </h2>
          <p className="text-[11px] text-gray-500 font-bold">
            특별 패키지와 한정판 계란을 만나보세요!
          </p>
        </div>
        <div className="flex items-center gap-1 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-sm">
          <Coins size={14} className="text-yellow-200" />
          <span>{progress.gold.toLocaleString()}</span>
        </div>
      </div>

      {/* 상점 쇼케이스 스크롤 뷰 */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-4 pr-1">
        {/* 가챠 당첨 팝업 알림 */}
        {gachaResult && (
          <div className="bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 p-3 rounded-2xl shadow-lg border-2 border-white flex items-center justify-between animate-bounce">
            <div className="flex items-center gap-2 font-black text-xs">
              <Sparkles size={16} />
              <span>{gachaResult}</span>
            </div>
            <button
              type="button"
              onClick={() => setGachaResult(null)}
              className="text-xs font-black bg-amber-950 text-white px-2 py-0.5 rounded-lg"
            >
              확인
            </button>
          </div>
        )}

        {/* 1. [황금 둥지 알 뽑기] (시그니처 가챠) */}
        <div className="rounded-3xl p-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-xl border-2 border-white/50 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black bg-white text-orange-600 px-2.5 py-0.5 rounded-full shadow-sm">
              인기 추천
            </span>
            <span className="text-xs font-bold text-yellow-200 flex items-center gap-1">
              <Sparkles size={14} />
              미해금 계란 확정 부화!
            </span>
          </div>

          <h3 className="text-xl font-black tracking-tight">황금 둥지 알 부화기</h3>
          <p className="text-xs text-white/90 font-medium mt-0.5">
            전설의 계란이 잠들어 있는 신비한 둥지에서 럭키 알을 깨워보세요!
          </p>

          <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-black text-yellow-200">
              <Coins size={18} />
              <span className="text-lg">250 골드</span>
            </div>

            <button
              type="button"
              onClick={handleGacha}
              className="bg-white text-orange-600 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg hover:bg-yellow-50 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={15} />
              <span>알 부화시키기</span>
            </button>
          </div>
        </div>

        {/* 2. [무료 보상 & 골드 충전소] */}
        <div className="flex flex-col gap-2 bg-white/90 backdrop-blur-md rounded-2xl p-3.5 border border-amber-200 shadow-sm">
          <span className="text-xs font-black text-gray-800 flex items-center gap-1">
            <Coins size={14} className="text-amber-500" />
            골드 충전소
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleFreeGold}
              className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center gap-1 hover:bg-amber-100 active:scale-95 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Gift size={16} />
              </div>
              <span className="text-xs font-black text-gray-800">매일 무료 선물</span>
              <span className="text-[11px] font-bold text-emerald-600">+100 골드 무료</span>
            </button>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center gap-1 opacity-70">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <Coins size={16} />
              </div>
              <span className="text-xs font-black text-gray-800">골드 자루 (1,000)</span>
              <span className="text-[11px] font-bold text-gray-400">인앱 결제 (준비중)</span>
            </div>
          </div>
        </div>

        {/* 3. [VIP & 편의성] */}
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
    </div>
  );
};
