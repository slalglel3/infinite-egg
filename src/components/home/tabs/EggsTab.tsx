import React, { useState } from 'react';
import { UserProgress, EggSkin, CostumeSlot, CostumeItem } from '../../../types/game';
import { EGG_SKINS, getEggSkinById } from '../../../data/eggSkins';
import { COSTUME_ITEMS, COSTUME_SETS, getCostumesBySlot } from '../../../data/eggCostumes';
import { selectEggSkin, buyEggSkinWithGold, equipCostume, buyCostume, equipCostumeSet, clearAllCostumes } from '../../../utils/storage';
import { Check, Lock, Sparkles, Shield, Coins, Play, Shirt, Egg, Sparkle, RotateCcw, AlertCircle } from 'lucide-react';
import { sound } from '../../../audio/sound';
import { CostumeSvgLayers } from '../CostumeSvgLayers';

interface EggsTabProps {
  progress: UserProgress;
  onUpdateProgress: (updated: UserProgress) => void;
  onStartGame?: () => void;
}

type SubTab = 'SKINS' | 'COSTUMES';

export const EggsTab: React.FC<EggsTabProps> = ({ progress, onUpdateProgress, onStartGame }) => {
  const [subTab, setSubTab] = useState<SubTab>('SKINS');
  const [selectedPreviewId, setSelectedPreviewId] = useState<string>(progress.selectedEggId);
  const [costumeSlot, setCostumeSlot] = useState<CostumeSlot>('hat');

  const previewSkin = getEggSkinById(selectedPreviewId);
  const equippedSkin = getEggSkinById(progress.selectedEggId);
  const isEquipped = progress.selectedEggId === previewSkin.id;
  const isUnlocked = progress.unlockedEggIds.includes(previewSkin.id);

  // [피드백 2 완벽 개선] 그리드에서 계란 탭 시: 보유 중이면 즉시 장착, 미보유면 미리보기
  const handleSelectSkin = (skin: EggSkin) => {
    setSelectedPreviewId(skin.id);
    if (progress.unlockedEggIds.includes(skin.id)) {
      sound.playPerfect();
      const updated = selectEggSkin(skin.id);
      onUpdateProgress(updated);
    } else {
      sound.playTurn();
    }
  };

  const handleBuySkin = () => {
    if (!previewSkin.priceGold) return;
    const res = buyEggSkinWithGold(previewSkin.id, previewSkin.priceGold);
    if (res.success) {
      sound.playHeal();
      onUpdateProgress(res.progress);
    } else {
      alert(res.message || '골드가 부족합니다.');
    }
  };

  // 코스튬 착용/해제 토글
  const handleToggleCostume = (item: CostumeItem) => {
    const isOwned = progress.unlockedCostumeIds.includes(item.id);
    if (!isOwned) return;

    sound.playTurn();
    const currentlyEquipped = progress.equippedCostumes[item.slot] === item.id;
    const nextCostumeId = currentlyEquipped ? undefined : item.id;
    const res = equipCostume(item.slot, nextCostumeId);
    if (res.success) {
      onUpdateProgress(res.progress);
    }
  };

  // [피드백 4] 특정 슬롯 의상 단독 해제
  const handleRemoveSlotCostume = (slot: CostumeSlot) => {
    sound.playTurn();
    const res = equipCostume(slot, undefined);
    if (res.success) {
      onUpdateProgress(res.progress);
    }
  };

  // [피드백 4] 모든 의상 일괄 해제
  const handleClearAllCostumes = () => {
    sound.playImpact(5);
    const res = clearAllCostumes();
    if (res.success) {
      onUpdateProgress(res.progress);
    }
  };

  // 코스튬 구매
  const handleBuyCostumeItem = (item: CostumeItem, currency: 'GOLD' | 'SHELLS') => {
    const res = buyCostume(item.id, currency);
    if (res.success) {
      sound.playHeal();
      onUpdateProgress(res.progress);
    } else {
      alert(res.message || '재화가 부족합니다.');
    }
  };

  // 풀세트 일괄 장착
  const handleEquipSet = (itemIds: string[]) => {
    sound.playPerfect();
    const res = equipCostumeSet(itemIds);
    if (res.success) {
      onUpdateProgress(res.progress);
    }
  };

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

  // [피드백 2 & 3] 의상 계란 여부 확인
  const isCustomizableSkin = !equippedSkin.hasFixedOutfit;

  return (
    <div className="flex-1 flex flex-col px-4 py-2 safe-container overflow-hidden">
      {/* 서브 탭 스위처: [🥚 계란 도감] vs [👗 의상 코디] */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center bg-amber-200/70 p-1 rounded-2xl gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => setSubTab('SKINS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
              subTab === 'SKINS'
                ? 'bg-amber-500 text-white shadow-md scale-102'
                : 'text-amber-900 hover:text-amber-950'
            }`}
          >
            <Egg size={14} />
            <span>계란 도감</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('COSTUMES')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
              subTab === 'COSTUMES'
                ? 'bg-amber-500 text-white shadow-md scale-102'
                : 'text-amber-900 hover:text-amber-950'
            }`}
          >
            <Shirt size={14} />
            <span>의상 코디 (4부위)</span>
          </button>
        </div>

        {/* 재화 상태 요약 */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full text-[11px] font-black border border-amber-300">
            <Coins size={12} className="text-amber-600" />
            <span>{progress.gold.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 bg-rose-50 text-rose-800 px-2.5 py-1 rounded-full text-[11px] font-black border border-rose-200" title="계란 껍데기">
            <span>🥚 {progress.eggShells || 0}</span>
          </div>
        </div>
      </div>

      {/* 1. 상단: 실시간 계란 & 코스튬 쇼케이스 카드 */}
      <div className="w-full bg-white/95 rounded-3xl p-3.5 shadow-xl border-2 border-amber-200 flex flex-col gap-2.5 shrink-0">
        <div className="flex items-center gap-3">
          {/* 달걀 + 의상 비주얼 프리뷰 (세로 비율 단축 통통한 실물 달걀 곡선) */}
          <div className="relative w-22 h-26 shrink-0 flex items-center justify-center p-1 bg-gradient-to-b from-sky-50 to-amber-50 rounded-2xl border border-amber-100 shadow-inner overflow-hidden">
            <svg viewBox="0 0 100 116" className="w-18 h-22 drop-shadow-md overflow-visible">
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

              {/* 통통한 실물 달걀 베지어 패스 */}
              <path
                d="M 50 10 C 74 10, 92 38, 92 65 C 92 90, 75 106, 50 106 C 25 106, 8 90, 8 65 C 8 38, 26 10, 50 10 Z"
                fill={`url(#previewGrad-${previewSkin.id})`}
                stroke={previewSkin.colors.line}
                strokeWidth="3.2"
                strokeLinejoin="round"
              />
              <path
                d="M 42 16 C 30 22, 17 40, 17 56 C 17 62, 20 66, 24 60 C 27 46, 36 28, 46 20 C 47 18, 45 16, 42 16 Z"
                fill="url(#previewHighlightGrad)"
              />
              <circle cx="38" cy="62" r="4.2" fill={previewSkin.colors.eyeColor} />
              <circle cx="64" cy="62" r="4.2" fill={previewSkin.colors.eyeColor} />
              <circle cx="36.5" cy="60.5" r="1.6" fill="#ffffff" />
              <circle cx="62.5" cy="60.5" r="1.6" fill="#ffffff" />
              <ellipse cx="29" cy="70" rx="4.8" ry="3" fill={previewSkin.colors.cheekColor} opacity="0.85" />
              <ellipse cx="73" cy="70" rx="4.8" ry="3" fill={previewSkin.colors.cheekColor} opacity="0.85" />
              <path d="M 44 70 Q 51 76 58 70" stroke={previewSkin.colors.eyeColor} strokeWidth="2.8" fill="none" strokeLinecap="round" />

              {/* 의상 레이어 실시간 렌더링 (고유 의상 계란이면 번들 의상, 순수 계란이면 유저 장착 의상) */}
              <CostumeSvgLayers
                hatId={previewSkin.hasFixedOutfit ? previewSkin.bundledCostumes?.hat : progress.equippedCostumes.hat}
                topId={previewSkin.hasFixedOutfit ? previewSkin.bundledCostumes?.top : progress.equippedCostumes.top}
                bottomId={previewSkin.hasFixedOutfit ? previewSkin.bundledCostumes?.bottom : progress.equippedCostumes.bottom}
                handId={previewSkin.hasFixedOutfit ? previewSkin.bundledCostumes?.hand : progress.equippedCostumes.hand}
              />
            </svg>

            {!isUnlocked && (
              <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center backdrop-blur-[1px]">
                <Lock size={22} className="text-white drop-shadow" />
              </div>
            )}
          </div>

          {/* 달걀 스펙 및 버튼 */}
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${getRarityBadge(previewSkin.rarity)}`}>
                {previewSkin.rarity}
              </span>
              <h2 className="text-base font-black text-gray-800 truncate tracking-tight">
                {previewSkin.name}
              </h2>
              {isEquipped && (
                <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <Check size={10} className="stroke-[3]" /> 장착중
                </span>
              )}
            </div>

            <p className="text-xs text-amber-900/80 font-bold mt-0.5 truncate">
              {previewSkin.tagline}
            </p>

            {/* 체력 보너스 */}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg text-[10px] font-extrabold border border-emerald-200">
                <Shield size={11} />
                <span>체력 보너스: +{previewSkin.hpBonus} HP</span>
              </div>
            </div>
          </div>
        </div>

        {/* 액션 바: [선택/장착 상태] & [🎮 지금 바로 플레이 ▶] 버튼 */}
        <div className="pt-2 border-t border-amber-100 flex items-center justify-between gap-2">
          <div className="text-[11px] text-gray-500 font-semibold truncate flex-1">
            {isUnlocked ? (
              <span className="text-emerald-600 font-bold">✓ 탭하면 즉시 장착됩니다.</span>
            ) : previewSkin.priceGold ? (
              <button
                type="button"
                onClick={handleBuySkin}
                className="bg-amber-500 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Coins size={12} />
                <span>{previewSkin.priceGold.toLocaleString()} 골드로 해금</span>
              </button>
            ) : (
              <span className="text-gray-400">조건: {previewSkin.unlockCondition}</span>
            )}
          </div>

          {/* [피드백 2 핵심: 고른 계란으로 즉시 게임 시작] */}
          {onStartGame && isUnlocked && (
            <button
              type="button"
              onClick={onStartGame}
              className="bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black text-xs px-4 py-2 rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Play size={13} className="fill-white" />
              <span>바로 플레이 ▶</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 하단 컨텐츠: [계란 도감 목록] or [의상 코디네이터] */}
      {subTab === 'SKINS' ? (
        <div className="flex-1 mt-2.5 flex flex-col min-h-0">
          {/* 2. 하단: [피드백 8] 큼직하고 시원한 3열 계란 컬렉션 그리드 */}
          <div className="flex items-center justify-between pb-1 px-1">
            <span className="text-xs font-black text-gray-800 flex items-center gap-1">
              <Sparkles size={14} className="text-amber-500" />
              계란 컬렉션 ({progress.unlockedEggIds.length} / {EGG_SKINS.length})
            </span>
            <span className="text-[11px] text-emerald-700 font-extrabold">터치하면 즉시 장착</span>
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-2.5 pb-4 pr-1">
            {EGG_SKINS.map((skin) => {
              const isSkinUnlocked = progress.unlockedEggIds.includes(skin.id);
              const isSkinEquipped = progress.selectedEggId === skin.id;

              return (
                <div
                  key={skin.id}
                  onClick={() => handleSelectSkin(skin)}
                  className={`relative flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white border-2 transition-all cursor-pointer select-none ${
                    isSkinEquipped
                      ? 'border-emerald-500 ring-2 ring-emerald-300 shadow-lg scale-102 bg-emerald-50/40'
                      : isSkinUnlocked
                      ? 'border-amber-200 hover:border-amber-400 shadow-sm'
                      : 'border-gray-200 opacity-75 hover:opacity-90 shadow-sm'
                  }`}
                >
                  {/* 장착 체크 배지 */}
                  {isSkinEquipped && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shadow-md z-20">
                      ✓
                    </span>
                  )}

                  {/* 계란 큼직한 일러스트 (피드백 3: 미해금 독립 의상 계란도 의상 착용 상태로 반투명 렌더링) */}
                  <div className="relative w-16 h-20 flex items-center justify-center my-1">
                    <svg
                      viewBox="0 0 100 116"
                      className={`w-14 h-18 drop-shadow-md overflow-visible transition-opacity ${
                        !isSkinUnlocked ? 'opacity-55' : 'opacity-100'
                      }`}
                    >
                      <defs>
                        <radialGradient id={`miniGrad-${skin.id}`} cx="38%" cy="32%" r="65%">
                          <stop offset="0%" stopColor={skin.colors.top} />
                          <stop offset="20%" stopColor={skin.colors.mid1} />
                          <stop offset="65%" stopColor={skin.colors.mid2} />
                          <stop offset="90%" stopColor={skin.colors.bottom} />
                          <stop offset="100%" stopColor={skin.colors.shadow} />
                        </radialGradient>
                      </defs>
                      <path
                        d="M 50 10 C 74 10, 92 38, 92 65 C 92 90, 75 106, 50 106 C 25 106, 8 90, 8 65 C 8 38, 26 10, 50 10 Z"
                        fill={`url(#miniGrad-${skin.id})`}
                        stroke={skin.colors.line}
                        strokeWidth="3.5"
                        strokeLinejoin="round"
                      />
                      <circle cx="40" cy="64" r="3.2" fill={skin.colors.eyeColor} />
                      <circle cx="60" cy="64" r="3.2" fill={skin.colors.eyeColor} />

                      {/* [피드백 3 완벽 구현] 독립 의상 계란은 리스트에서도 고유 의상을 입은 모습으로 렌더링! */}
                      {skin.hasFixedOutfit && skin.bundledCostumes && (
                        <CostumeSvgLayers
                          hatId={skin.bundledCostumes.hat}
                          topId={skin.bundledCostumes.top}
                          bottomId={skin.bundledCostumes.bottom}
                          handId={skin.bundledCostumes.hand}
                        />
                      )}
                    </svg>

                    {!isSkinUnlocked && (
                      <div className="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center gap-0.5 backdrop-blur-[0.5px]">
                        <Lock size={18} className="text-white drop-shadow" />
                      </div>
                    )}
                  </div>

                  <span className="text-xs font-black text-gray-800 text-center truncate w-full mt-1">
                    {skin.name}
                  </span>
                  <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full mt-0.5 ${getRarityBadge(skin.rarity)}`}>
                    {skin.rarity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 의상 코디 탭: [피드백 3 & 4] 순수 달걀만 커스텀 가능, 개별 해제 및 일괄 해제 탑재 */
        <div className="flex-1 mt-2 flex flex-col min-h-0">
          {/* [피드백 3] 고유 의상 계란 착용 시 친절한 안내 & 전환 배너 */}
          {!isCustomizableSkin && (
            <div className="mb-2 p-2.5 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-center justify-between gap-2 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-amber-600 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-black text-amber-950">
                    [{equippedSkin.name}]은(는) 고유 유니폼을 착용한 계란입니다.
                  </span>
                  <span className="text-[10px] text-amber-800 font-semibold">
                    자유롭게 의상을 갈아입히려면 기본 달걀 등 순수 달걀을 선택해주세요!
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sound.playPerfect();
                  const updated = selectEggSkin('classic');
                  onUpdateProgress(updated);
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] px-2.5 py-1.5 rounded-xl shadow shrink-0 active:scale-95 cursor-pointer"
              >
                기본 달걀로 전환
              </button>
            </div>
          )}

          {/* 슬롯 스위처 및 [일괄 해제] 바 */}
          <div className="flex items-center justify-between pb-1.5">
            <div className="flex-1 grid grid-cols-4 gap-1.5 mr-2">
              {[
                { slot: 'hat' as const, label: '모자', icon: '🎩' },
                { slot: 'top' as const, label: '상의', icon: '👔' },
                { slot: 'bottom' as const, label: '하의', icon: '👖' },
                { slot: 'hand' as const, label: '손', icon: '🪄' },
              ].map((tab) => {
                const isSlotActive = costumeSlot === tab.slot;
                const equippedItem = progress.equippedCostumes[tab.slot];
                return (
                  <button
                    key={tab.slot}
                    type="button"
                    onClick={() => {
                      setCostumeSlot(tab.slot);
                      sound.playTurn();
                    }}
                    className={`p-1.5 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer border ${
                      isSlotActive
                        ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                        : 'bg-white text-gray-700 border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    {equippedItem && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </button>
                );
              })}
            </div>

            {/* [피드백 4 반영] 모든 의상 일괄 해제 버튼 */}
            <button
              type="button"
              onClick={handleClearAllCostumes}
              className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-300 rounded-xl text-[11px] font-black flex items-center gap-1 active:scale-95 transition-all cursor-pointer shrink-0 shadow-sm"
              title="현재 착용한 모든 의상을 벗습니다"
            >
              <RotateCcw size={12} />
              <span>모두 벗기</span>
            </button>
          </div>

          {/* 현재 선택된 슬롯의 착용 상태 및 개별 해제 버튼 */}
          {progress.equippedCostumes[costumeSlot] && (
            <div className="flex items-center justify-between px-2 py-1 mb-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-[11px] font-bold text-emerald-800">
                현재 부위 착용 중
              </span>
              <button
                type="button"
                onClick={() => handleRemoveSlotCostume(costumeSlot)}
                className="text-[10px] font-black text-rose-600 hover:text-rose-700 underline cursor-pointer"
              >
                이 부위 벗기 ✕
              </button>
            </div>
          )}

          {/* 슬롯별 의상 아이템 리스트 */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 pb-4">
            <div className="grid grid-cols-2 gap-2">
              {getCostumesBySlot(costumeSlot).map((item) => {
                const isOwned = progress.unlockedCostumeIds.includes(item.id);
                const isEquippedThis = progress.equippedCostumes[item.slot] === item.id;

                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-2xl bg-white border-2 flex flex-col justify-between transition-all ${
                      isEquippedThis
                        ? 'border-emerald-500 ring-2 ring-emerald-300 shadow-md bg-emerald-50/20'
                        : isOwned
                        ? 'border-amber-200 hover:border-amber-400'
                        : 'border-gray-200 opacity-90'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xl">{item.iconText}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${getRarityBadge(item.rarity)}`}>
                          {item.rarity}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-gray-800 mt-1 truncate">{item.name}</h4>
                      <p className="text-[10px] text-gray-500 font-semibold line-clamp-1">{item.desc}</p>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between">
                      {/* [피드백 2 완벽 해결] 독립 의상 계란 전용 번들 의상은 해당 계란 미보유 시 개별 구매 불가 */}
                      {item.requiredEggSkinId && !progress.unlockedEggIds.includes(item.requiredEggSkinId) ? (
                        <div className="w-full py-1.5 px-1.5 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-center gap-1 text-[10px] font-black text-amber-900 shadow-inner">
                          <Lock size={12} className="text-amber-700 shrink-0" />
                          <span className="truncate">[{getEggSkinById(item.requiredEggSkinId).name}] 획득 시 지급</span>
                        </div>
                      ) : isOwned ? (
                        <button
                          type="button"
                          onClick={() => handleToggleCostume(item)}
                          className={`w-full py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            isEquippedThis
                              ? 'bg-rose-500 text-white hover:bg-rose-600'
                              : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
                          }`}
                        >
                          {isEquippedThis ? '벗기' : '입히기'}
                        </button>
                      ) : (
                        <div className="w-full flex gap-1">
                          {item.priceGold ? (
                            <button
                              type="button"
                              onClick={() => handleBuyCostumeItem(item, 'GOLD')}
                              className="flex-1 py-1 rounded-xl bg-amber-500 text-white font-black text-[11px] hover:bg-amber-600 active:scale-95 flex items-center justify-center gap-0.5 cursor-pointer shadow-sm"
                            >
                              <Coins size={11} />
                              <span>{item.priceGold}G</span>
                            </button>
                          ) : null}
                          {item.priceShells ? (
                            <button
                              type="button"
                              onClick={() => handleBuyCostumeItem(item, 'SHELLS')}
                              className="flex-1 py-1 rounded-xl bg-rose-500 text-white font-black text-[11px] hover:bg-rose-600 active:scale-95 flex items-center justify-center gap-0.5 cursor-pointer shadow-sm"
                              title="계란 껍데기로 구매"
                            >
                              <span>🥚{item.priceShells}</span>
                            </button>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ⭐ 테마 세트 일괄 착용 바 */}
            <div className="mt-2 p-2.5 rounded-2xl bg-amber-100/70 border border-amber-300 flex flex-col gap-1.5">
              <span className="text-[11px] font-black text-amber-950 flex items-center gap-1">
                <Sparkle size={13} className="text-amber-600" />
                테마 세트 원클릭 착용 (보유 아이템 자동 장착)
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {COSTUME_SETS.map((set) => (
                  <button
                    key={set.id}
                    type="button"
                    onClick={() => handleEquipSet(set.itemIds)}
                    className="p-1.5 bg-white rounded-xl border border-amber-200 text-xs font-bold text-gray-800 flex items-center justify-center gap-1 hover:bg-amber-50 active:scale-95 cursor-pointer shadow-sm"
                  >
                    <span>{set.icon}</span>
                    <span className="truncate">{set.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
