import React, { useState } from 'react';
import { UserProgress, EggSkin } from '../../../types/game';
import { EGG_SKINS, getEggSkinById } from '../../../data/eggSkins';
import { selectEggSkin, buyEggSkinWithGold } from '../../../utils/storage';
import { Check, Lock, Sparkles, Shield, Coins } from 'lucide-react';
import { sound } from '../../../audio/sound';

interface EggsTabProps {
  progress: UserProgress;
  onUpdateProgress: (updated: UserProgress) => void;
}

export const EggsTab: React.FC<EggsTabProps> = ({ progress, onUpdateProgress }) => {
  const [selectedPreviewId, setSelectedPreviewId] = useState<string>(progress.selectedEggId);
  const previewSkin = getEggSkinById(selectedPreviewId);

  const isEquipped = progress.selectedEggId === previewSkin.id;
  const isUnlocked = progress.unlockedEggIds.includes(previewSkin.id);

  const handleSelectSkin = (skin: EggSkin) => {
    setSelectedPreviewId(skin.id);
    sound.playTurn();
  };

  const handleEquip = () => {
    if (isUnlocked && !isEquipped) {
      sound.playPerfect();
      const updated = selectEggSkin(previewSkin.id);
      onUpdateProgress(updated);
    }
  };

  const handleBuy = () => {
    if (!previewSkin.priceGold) return;
    const res = buyEggSkinWithGold(previewSkin.id, previewSkin.priceGold);
    if (res.success) {
      sound.playHeal();
      onUpdateProgress(res.progress);
    } else {
      alert(res.message || '골드가 부족합니다.');
    }
  };

  // 희귀도 배지 스타일
  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'LEGENDARY':
        return 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm';
      case 'EPIC':
        return 'bg-purple-600 text-white';
      case 'RARE':
        return 'bg-sky-600 text-white';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <div className="flex-1 flex flex-col px-4 py-2 safe-container overflow-hidden">
      {/* 1. 상단: 선택된 계란 대형 쇼케이스 카드 */}
      <div className="w-full bg-white/95 rounded-3xl p-4 shadow-xl border-2 border-amber-200 flex flex-col gap-3">
        <div className="flex items-center gap-4">
          {/* 달걀 비주얼 프리뷰 */}
          <div className="relative w-22 h-28 shrink-0 flex items-center justify-center p-1 bg-gradient-to-b from-sky-50 to-amber-50 rounded-2xl border border-amber-100 shadow-inner">
            <svg viewBox="0 0 100 132" className="w-18 h-24 drop-shadow-md">
              <defs>
                <radialGradient id={`previewGrad-${previewSkin.id}`} cx="42%" cy="36%" r="65%">
                  <stop offset="0%" stopColor={previewSkin.colors.top} />
                  <stop offset="22%" stopColor={previewSkin.colors.mid1} />
                  <stop offset="65%" stopColor={previewSkin.colors.mid2} />
                  <stop offset="92%" stopColor={previewSkin.colors.bottom} />
                  <stop offset="100%" stopColor={previewSkin.colors.shadow} />
                </radialGradient>
                <linearGradient id="previewHighlightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#fff8eb" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              {/* 이미지 2 스타일 실제 자연 달걀 곡선 */}
              <path
                d="M 50 6 C 74 6, 92 42, 92 78 C 92 106, 75 126, 50 126 C 25 126, 8 106, 8 78 C 8 42, 26 6, 50 6 Z"
                fill={`url(#previewGrad-${previewSkin.id})`}
                stroke={previewSkin.colors.line}
                strokeWidth="3.2"
                strokeLinejoin="round"
              />
              {/* 좌상단 초승달 하이라이트 */}
              <path
                d="M 42 12 C 30 18, 17 38, 17 62 C 17 68, 20 72, 24 66 C 27 50, 36 28, 46 18 C 47 16, 45 12, 42 12 Z"
                fill="url(#previewHighlightGrad)"
              />
              <circle cx="38" cy="72" r="4.2" fill={previewSkin.colors.eyeColor} />
              <circle cx="64" cy="72" r="4.2" fill={previewSkin.colors.eyeColor} />
              <circle cx="36.5" cy="70.5" r="1.6" fill="#ffffff" />
              <circle cx="62.5" cy="70.5" r="1.6" fill="#ffffff" />
              <ellipse cx="29" cy="80" rx="4.8" ry="3" fill={previewSkin.colors.cheekColor} opacity="0.85" />
              <ellipse cx="73" cy="80" rx="4.8" ry="3" fill={previewSkin.colors.cheekColor} opacity="0.85" />
              <path d="M 44 80 Q 51 86 58 80" stroke={previewSkin.colors.eyeColor} strokeWidth="2.8" fill="none" strokeLinecap="round" />
            </svg>

            {!isUnlocked && (
              <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center backdrop-blur-[1px]">
                <Lock size={22} className="text-white drop-shadow" />
              </div>
            )}
          </div>

          {/* 달걀 스펙 및 설명 */}
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${getRarityBadge(previewSkin.rarity)}`}>
                {previewSkin.rarity}
              </span>
              <h2 className="text-lg font-black text-gray-800 truncate tracking-tight">
                {previewSkin.name}
              </h2>
            </div>

            <p className="text-xs text-amber-900/80 font-bold mt-0.5">
              {previewSkin.tagline}
            </p>

            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg text-[11px] font-extrabold border border-emerald-200">
                <Shield size={12} />
                <span>체력 보너스: +{previewSkin.hpBonus} HP</span>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 상태 버튼: 장착중 / 장착하기 / 해금 조건 / 골드 구매 */}
        <div className="pt-1 border-t border-amber-100 flex items-center justify-between gap-2">
          <div className="text-[11px] text-gray-500 font-semibold truncate flex-1">
            {isUnlocked ? (
              <span className="text-emerald-600 font-bold">✓ 보유 중인 계란입니다.</span>
            ) : (
              <span>획득 조건: {previewSkin.unlockCondition}</span>
            )}
          </div>

          {isEquipped ? (
            <button
              type="button"
              disabled
              className="bg-emerald-500 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1 shadow-sm opacity-90 cursor-default"
            >
              <Check size={14} className="stroke-[3]" />
              <span>장착중</span>
            </button>
          ) : isUnlocked ? (
            <button
              type="button"
              onClick={handleEquip}
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs px-5 py-2 rounded-xl shadow-md active:scale-95 transition-all cursor-pointer"
            >
              장착하기
            </button>
          ) : previewSkin.priceGold ? (
            <button
              type="button"
              onClick={handleBuy}
              className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Coins size={14} />
              <span>{previewSkin.priceGold.toLocaleString()} 골드 구매</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="bg-gray-200 text-gray-500 font-bold text-xs px-3 py-2 rounded-xl cursor-not-allowed flex items-center gap-1"
            >
              <Lock size={12} />
              <span>미해금</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 하단: 전체 계란 도감 목록 (그리드) */}
      <div className="flex-1 mt-3 flex flex-col min-h-0">
        <div className="flex items-center justify-between pb-1.5 px-1">
          <span className="text-xs font-black text-gray-700 flex items-center gap-1">
            <Sparkles size={14} className="text-amber-500" />
            계란 컬렉션 ({progress.unlockedEggIds.length} / {EGG_SKINS.length})
          </span>
          <span className="text-[11px] text-gray-400 font-bold">원하는 계란을 선택하세요</span>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-4 gap-2.5 pb-4 pr-1">
          {EGG_SKINS.map((skin) => {
            const isSkinUnlocked = progress.unlockedEggIds.includes(skin.id);
            const isSkinSelected = selectedPreviewId === skin.id;
            const isSkinEquipped = progress.selectedEggId === skin.id;

            return (
              <div
                key={skin.id}
                onClick={() => handleSelectSkin(skin)}
                className={`relative flex flex-col items-center justify-center p-2 rounded-2xl bg-white border-2 transition-all cursor-pointer select-none ${
                  isSkinSelected
                    ? 'border-amber-500 ring-2 ring-amber-300 shadow-md scale-102'
                    : 'border-amber-100/80 hover:border-amber-300'
                }`}
              >
                {/* 장착중 배지 */}
                {isSkinEquipped && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shadow-sm z-10">
                    ✓
                  </span>
                )}

                {/* 계란 미니 일러스트 */}
                <div className="relative w-12 h-15 flex items-center justify-center my-0.5">
                  <svg viewBox="0 0 100 132" className="w-10 h-13 drop-shadow">
                    <defs>
                      <radialGradient id={`miniGrad-${skin.id}`} cx="38%" cy="32%" r="65%">
                        <stop offset="0%" stopColor={skin.colors.top} />
                        <stop offset="20%" stopColor={skin.colors.mid1} />
                        <stop offset="65%" stopColor={skin.colors.mid2} />
                        <stop offset="90%" stopColor={skin.colors.bottom} />
                        <stop offset="100%" stopColor={skin.colors.shadow} />
                      </radialGradient>
                    </defs>
                    {/* 실물 달걀 황금비율 곡선 (상단 슬림, 최대폭 y=60%) */}
                    <path
                      d="M 50 6 C 74 6, 92 42, 92 78 C 92 106, 75 126, 50 126 C 25 126, 8 106, 8 78 C 8 42, 26 6, 50 6 Z"
                      fill={`url(#miniGrad-${skin.id})`}
                      stroke={skin.colors.line}
                      strokeWidth="3.5"
                      strokeLinejoin="round"
                    />
                    {/* 좌상단 부드러운 하이라이트 */}
                    <path
                      d="M 30 20 C 38 12, 48 10, 48 10 C 32 18, 24 38, 25 60 C 20 48, 22 30, 30 20 Z"
                      fill="#ffffff"
                      opacity="0.5"
                    />
                    <circle cx="40" cy="74" r="3.2" fill={skin.colors.eyeColor} />
                    <circle cx="60" cy="74" r="3.2" fill={skin.colors.eyeColor} />
                  </svg>

                  {!isSkinUnlocked && (
                    <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                      <Lock size={15} className="text-white drop-shadow" />
                    </div>
                  )}
                </div>

                <span className="text-[10px] font-black text-gray-800 text-center truncate w-full mt-0.5">
                  {skin.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
