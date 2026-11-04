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
      {/* 상단 헤더: 원목 상점 명판 & 실시간 2대 재화 */}
      <div className="flex items-center justify-between pb-1.5 px-0.5">
        <h2 className="text-base font-black text-white flex items-center gap-1.5 drop-shadow-[0_2px_2px_#1a0a03]">
          <ShoppingBag size={18} className="text-amber-400 fill-amber-500" />
          <span>시골 만물상</span>
        </h2>

        {/* 2대 재화 원목 뱃지 */}
        <div className="flex items-center gap-1.5">
          <div className="wood-badge py-1 px-2.5">
            <Coins size={13} className="text-amber-300 fill-amber-400 shrink-0" />
            <span className="text-xs font-black text-amber-100">{progress.gold.toLocaleString()}</span>
          </div>
          <div className="wood-badge py-1 px-2.5" title="달걀 껍데기">
            <span className="text-xs shrink-0">🥚</span>
            <span className="text-xs font-black text-rose-300">{progress.eggShells || 0}</span>
          </div>
        </div>
      </div>

      {/* 상점 3대 농장 액션 패널 */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pb-4 pr-0.5">
        {/* 1. [매일 아침 햇살 선물 (Daily Free Gift)] */}
        <div className="panel-parchment p-3.5 flex items-center justify-between border-3 border-[#2b1306]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-amber-300 to-amber-500 border-2.5 border-[#2b1306] flex items-center justify-center text-2xl shadow-[0_3px_0_#8f3400] shrink-0">
              🎁
            </div>
            <div>
              <span className="text-xs font-black text-[#2b1306] block">매일 아침 햇살 선물</span>
              <span className="text-[11px] font-extrabold text-emerald-800 block mt-0.5">
                {isFreeGoldClaimedToday ? '✓ 오늘 수령 완료' : '+100 골드 즉시 수령 가능!'}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={isFreeGoldClaimedToday}
            onClick={handleFreeGold}
            className={`py-2 px-3.5 rounded-2xl font-black text-xs cursor-pointer shadow-md flex items-center gap-1 shrink-0 ${
              isFreeGoldClaimedToday
                ? 'wood-badge bg-[#1a0a03]/80 text-amber-200/50 border-[#2b1306] cursor-not-allowed opacity-75'
                : 'btn-3d-emerald'
            }`}
          >
            {isFreeGoldClaimedToday ? <Check size={14} /> : <Gift size={14} />}
            <span>{isFreeGoldClaimedToday ? '수령 완료' : '무료 수령'}</span>
          </button>
        </div>

        {/* 2. [황금 둥지 부화기 (Golden Nest Incubator)] — 메인 킬러 콘텐츠 */}
        <div
          onClick={handleStartHatch}
          className="panel-wood p-4 relative overflow-hidden cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all border-4 border-[#2b1306] shadow-2xl flex flex-col justify-between"
        >
          {/* 황금빛 볏짚 둥지 앰비언트 글로우 */}
          <div 
            className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full blur-2xl pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(254, 240, 138, 0.4) 0%, rgba(245, 158, 11, 0.2) 60%, transparent 80%)'
            }}
          />

          <div className="flex items-center justify-between z-10 mb-1">
            <span className="wood-badge py-0.5 px-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-[#2b1306] font-black border-[#2b1306] shadow-sm text-[10px]">
              둥지 가챠
            </span>
            <span className="text-xs font-black text-amber-200 flex items-center gap-1 drop-shadow">
              <Sparkles size={14} className="text-yellow-300" />
              <span>전설 알 & 의상 세트</span>
            </span>
          </div>

          {/* 중앙 황금 알 & 볏짚 둥지 */}
          <div className="flex items-center justify-between my-2 z-10">
            <div>
              <h3
                style={{
                  fontFamily: "'Fredoka', 'Jua', 'Black Han Sans', sans-serif",
                  textShadow: '-1.5px -1.5px 0 #2b1306, 1.5px -1.5px 0 #2b1306, -1.5px 1.5px 0 #2b1306, 1.5px 1.5px 0 #2b1306, 0 3px 0 #1a0a03',
                }}
                className="text-2xl font-black text-amber-300"
              >
                황금 둥지 부화기
              </h3>
              <p className="text-xs font-black text-amber-100 mt-1 drop-shadow">
                리본을 풀면 새끼 계란이 부화해요! (중복 시 껍데기 환급)
              </p>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-amber-400/30 border-2 border-amber-300/60 flex items-center justify-center text-3xl shadow-inner shrink-0 ml-2 animate-bounce">
              ✨🥚
            </div>
          </div>

          {/* 부화 시작 원목 액션 바 */}
          <div className="mt-2 pt-2 border-t border-amber-200/20 flex items-center justify-between z-10">
            <div className="flex items-center gap-1 font-black text-amber-200 drop-shadow">
              <Coins size={16} className="text-yellow-300" />
              <span className="text-lg">250 골드</span>
            </div>

            <span className="btn-3d-amber py-2 px-4 rounded-xl text-xs font-black flex items-center gap-1 shadow-lg text-[#1e1b18]">
              <span>부화 시작 ▶</span>
            </span>
          </div>
        </div>

        {/* 3. [달걀 껍데기 공방 교환소] */}
        <div
          onClick={handleExchangeShells}
          className="panel-parchment p-3.5 flex items-center justify-between cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all border-3 border-[#2b1306]"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-rose-200 to-rose-300 border-2 border-[#2b1306] flex items-center justify-center text-2xl shadow-inner shrink-0">
              🥚
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-[#2b1306]">달걀 껍데기 공방 환전</span>
                <span className="text-[9px] font-black bg-[#2b1306]/15 text-[#2b1306] px-1.5 py-0.2 rounded-full border border-[#2b1306]/20">
                  보유: {progress.eggShells || 0}개
                </span>
              </div>
              <p className="text-[11px] font-extrabold text-amber-900 mt-0.5">
                껍데기 50개 ➔ 300 골드로 즉시 교환
              </p>
            </div>
          </div>

          <div className="btn-3d-amber py-1.5 px-3 rounded-xl text-xs font-black flex items-center gap-1 text-[#1e1b18] shrink-0">
            <span>환전</span>
            <ArrowRight size={12} className="stroke-[2.5]" />
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
