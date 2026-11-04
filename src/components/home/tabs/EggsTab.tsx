import React, { useState } from 'react';
import { UserProgress, EggSkin, CostumeSlot, CostumeItem } from '../../../types/game';
import { EGG_SKINS, getEggSkinById } from '../../../data/eggSkins';
import { COSTUME_ITEMS, getCostumesBySlot } from '../../../data/eggCostumes';
import { selectEggSkin, buyEggSkinWithGold, equipCostume, clearAllCostumes } from '../../../utils/storage';
import { Check, Lock, Shield, Coins, Shirt, Egg, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { sound } from '../../../audio/sound';
import { EggIllustration } from '../../common/EggIllustration';

interface EggsTabProps {
  progress: UserProgress;
  onUpdateProgress: (updated: UserProgress) => void;
  onStartGame?: () => void;
}

type SubTab = 'SKINS' | 'COSTUMES';

export const EggsTab: React.FC<EggsTabProps> = ({ progress, onUpdateProgress }) => {
  const [subTab, setSubTab] = useState<SubTab>('SKINS');
  const [selectedPreviewId, setSelectedPreviewId] = useState<string>(progress.selectedEggId);
  const [costumeSlot, setCostumeSlot] = useState<CostumeSlot>('hat');

  const currentIndex = EGG_SKINS.findIndex((s) => s.id === selectedPreviewId);
  const previewSkin = EGG_SKINS[currentIndex !== -1 ? currentIndex : 0];
  const isEquipped = progress.selectedEggId === previewSkin.id;
  const isUnlocked = progress.unlockedEggIds.includes(previewSkin.id);

  // [무한의 계단식 좌우 이전/다음 슬라이드 탐색]
  const handlePrevSkin = () => {
    sound.playTurn();
    const prevIdx = (currentIndex - 1 + EGG_SKINS.length) % EGG_SKINS.length;
    setSelectedPreviewId(EGG_SKINS[prevIdx].id);
  };

  const handleNextSkin = () => {
    sound.playTurn();
    const nextIdx = (currentIndex + 1) % EGG_SKINS.length;
    setSelectedPreviewId(EGG_SKINS[nextIdx].id);
  };

  // 장착 또는 선택
  const handleSelectOrEquip = (skin: EggSkin) => {
    setSelectedPreviewId(skin.id);
    if (progress.unlockedEggIds.includes(skin.id)) {
      sound.playPerfect();
      const updated = selectEggSkin(skin.id);
      onUpdateProgress(updated);
    } else {
      sound.playTurn();
    }
  };

  // 골드 구매
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

  // 코스튬 착용/해제
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

  // 모든 의상 일괄 해제
  const handleClearAllCostumes = () => {
    sound.playImpact(5);
    const res = clearAllCostumes();
    if (res.success) {
      onUpdateProgress(res.progress);
    }
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'LEGENDARY':
        return 'bg-gradient-to-r from-amber-500 to-rose-500 text-white';
      case 'EPIC':
        return 'bg-purple-600 text-white';
      case 'RARE':
        return 'bg-sky-600 text-white';
      default:
        return 'bg-gray-300 text-gray-800';
    }
  };

  return (
    <div className="flex-1 flex flex-col px-3 py-1.5 safe-container overflow-hidden select-none">
      {/* 1. 상단 2단 탭 스위처: [🥚 달걀 도감] vs [👗 의상 코디실] */}
      <div className="flex items-center justify-between pb-1.5 px-0.5">
        <div className="flex items-center bg-[#2b1306]/90 p-1 rounded-2xl border-2 border-[#1a0a03] gap-1 shadow-md">
          <button
            type="button"
            onClick={() => setSubTab('SKINS')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-black text-xs transition-all cursor-pointer ${
              subTab === 'SKINS'
                ? 'btn-3d-amber text-[#1e1b18]'
                : 'text-amber-200/80 hover:text-white'
            }`}
          >
            <Egg size={13} className={subTab === 'SKINS' ? 'stroke-[2.5] text-[#1e1b18]' : ''} />
            <span className={subTab === 'SKINS' ? 'text-[#1e1b18]' : ''}>달걀 도감</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('COSTUMES')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-black text-xs transition-all cursor-pointer ${
              subTab === 'COSTUMES'
                ? 'btn-3d-amber text-[#1e1b18]'
                : 'text-amber-200/80 hover:text-white'
            }`}
          >
            <Shirt size={13} className={subTab === 'COSTUMES' ? 'stroke-[2.5] text-[#1e1b18]' : ''} />
            <span className={subTab === 'COSTUMES' ? 'text-[#1e1b18]' : ''}>의상 코디실</span>
          </button>
        </div>

        {/* 현재 수집 현황 원목 뱃지 */}
        <div className="wood-badge py-1 px-3">
          <span className="text-[11px] text-amber-200/90 font-bold">도감 수집</span>
          <span className="text-amber-300 font-black">{progress.unlockedEggIds.length}</span>
          <span className="text-white/40 font-bold">/</span>
          <span className="text-white font-black">{EGG_SKINS.length}</span>
        </div>
      </div>

      {/* 2. 상단 45%: 장인의 원목 쇼케이스 & 좌우 탐색 컨트롤러 */}
      <div className="panel-wood p-3.5 flex flex-col items-center justify-between relative shadow-2xl overflow-hidden shrink-0 min-h-[225px] border-4 border-[#2b1306]">
        {/* 상단: 캐릭터 이름 & 등급 뱃지 */}
        <div className="w-full flex items-center justify-between z-10 px-1">
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border border-black/30 shadow-xs ${getRarityBadge(previewSkin.rarity)}`}>
              {previewSkin.rarity}
            </span>
            <h2 className="text-base font-black text-white tracking-tight drop-shadow-[0_2px_3px_#1a0a03]">
              {previewSkin.name}
            </h2>
          </div>

          <div className="wood-badge py-0.5 px-2 bg-emerald-900/90 border-emerald-500 text-emerald-200 shadow-xs">
            <Shield size={11} className="text-emerald-400" />
            <span>+{previewSkin.hpBonus} HP</span>
          </div>
        </div>

        {/* 중앙: 대형 계란 일러스트 & 포근한 볏짚 둥지 발판 */}
        <div className="relative my-auto flex items-center justify-center">
          {/* 포근한 볏짚 둥지 발판 */}
          <div className="absolute -bottom-3 w-32 h-7 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 rounded-full border-2 border-[#2b1306] shadow-lg flex items-center justify-center overflow-hidden">
            <span className="text-[10px] opacity-40 text-amber-200">🌾🌾🌾🌾🌾</span>
          </div>

          <div className="relative w-24 h-28 flex items-center justify-center z-10">
            <EggIllustration
              skin={previewSkin}
              idPrefix="eggs-tab-hero-"
              equippedCostumes={previewSkin.hasFixedOutfit ? previewSkin.bundledCostumes : progress.equippedCostumes}
              className={`w-22 h-26 drop-shadow-2xl transition-all ${
                !isUnlocked ? 'filter grayscale-[80%] opacity-60' : 'opacity-100 scale-105'
              }`}
            />

            {!isUnlocked && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-[#1a0a03]/85 text-white flex items-center justify-center border-2 border-amber-400 shadow-xl">
                  <Lock size={20} className="text-amber-300" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 하단 3버튼 컨트롤러: [ ◀ ] [ MAIN ACTION ] [ ▶ ] */}
        <div className="w-full flex items-center justify-between gap-2 z-10 mt-1">
          {/* 이전 버튼 */}
          <button
            type="button"
            onClick={handlePrevSkin}
            className="btn-wood w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer shrink-0"
            aria-label="이전 계란"
          >
            <ChevronLeft size={22} className="stroke-[3] text-amber-100" />
          </button>

          {/* 중앙 메인 액션 버튼 */}
          <div className="flex-1">
            {isEquipped ? (
              <div className="btn-3d-emerald py-2 px-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-black shadow-md cursor-default">
                <Check size={16} className="stroke-[3]" />
                <span>장착 중 (EQUIPPED)</span>
              </div>
            ) : isUnlocked ? (
              <button
                type="button"
                onClick={() => handleSelectOrEquip(previewSkin)}
                className="btn-3d-amber w-full py-2 px-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-black cursor-pointer shadow-md text-[#1e1b18]"
              >
                <span className="text-[#1e1b18]">장착하기 (SELECT)</span>
              </button>
            ) : previewSkin.priceGold ? (
              <button
                type="button"
                onClick={handleBuySkin}
                className="btn-3d-amber w-full py-2 px-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-black cursor-pointer shadow-md text-[#1e1b18]"
              >
                <span className="text-sm leading-none">🪶</span>
                <span className="text-[#1e1b18]">{previewSkin.priceGold.toLocaleString()} 깃털로 입양</span>
              </button>
            ) : (
              <div className="wood-badge py-2 px-3 rounded-2xl bg-[#1a0a03]/90 text-amber-200/90 flex items-center justify-center gap-1.5 text-xs font-black shadow-inner">
                <Lock size={13} className="text-amber-400" />
                <span className="truncate">{previewSkin.unlockCondition}</span>
              </div>
            )}
          </div>

          {/* 다음 버튼 */}
          <button
            type="button"
            onClick={handleNextSkin}
            className="btn-wood w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer shrink-0"
            aria-label="다음 계란"
          >
            <ChevronRight size={22} className="stroke-[3] text-amber-100" />
          </button>
        </div>
      </div>

      {/* 3. 하단 55%: [4열 원목 달걀 보관함] or [4부위 의상 셀렉터] */}
      {subTab === 'SKINS' ? (
        <div className="flex-1 flex flex-col min-h-0 mt-2">
          {/* 4열 컴팩트 도감 그리드 (원목 계란판 트레이) */}
          <div className="flex-1 overflow-y-auto grid grid-cols-4 gap-2 pb-4 pr-0.5">
            {EGG_SKINS.map((skin) => {
              const isSkinUnlocked = progress.unlockedEggIds.includes(skin.id);
              const isSkinEquipped = progress.selectedEggId === skin.id;
              const isSkinSelected = previewSkin.id === skin.id;

              return (
                <div
                  key={skin.id}
                  onClick={() => handleSelectOrEquip(skin)}
                  className={`relative p-2 rounded-2xl border-2 flex flex-col items-center justify-between transition-all cursor-pointer select-none ${
                    isSkinSelected
                      ? 'border-amber-400 bg-gradient-to-b from-amber-100 to-amber-200 ring-2 ring-amber-400 shadow-md scale-102'
                      : isSkinEquipped
                      ? 'border-emerald-600 bg-gradient-to-b from-emerald-100 to-emerald-200 shadow-sm ring-1 ring-emerald-500'
                      : isSkinUnlocked
                      ? 'border-[#2b1306] bg-gradient-to-b from-[#fffcf7] to-[#faedd8] shadow-xs hover:border-amber-700'
                      : 'border-[#3a1d0d]/40 bg-[#2b1306]/20 opacity-60'
                  }`}
                >
                  {/* 장착 뱃지 */}
                  {isSkinEquipped && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black shadow-sm z-10 border border-[#064e3b]">
                      ✓
                    </span>
                  )}

                  {/* 미니 계란 일러스트 */}
                  <div className="relative w-12 h-14 flex items-center justify-center my-0.5">
                    <EggIllustration
                      skin={skin}
                      idPrefix={`grid-mini-${skin.id}-`}
                      equippedCostumes={skin.hasFixedOutfit ? skin.bundledCostumes : undefined}
                      className={`w-10 h-12 drop-shadow-sm ${!isSkinUnlocked ? 'filter grayscale-[90%]' : ''}`}
                    />
                    {!isSkinUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock size={14} className="text-[#2b1306]" />
                      </div>
                    )}
                  </div>

                  <span className={`text-[11px] font-black text-center truncate w-full mt-0.5 ${
                    isSkinUnlocked ? 'text-[#2b1306]' : 'text-amber-200/60'
                  }`}>
                    {skin.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 의상 코디 탭: 4부위 슬롯 스위처 & 의상 타일 */
        <div className="flex-1 flex flex-col min-h-0 mt-2">
          {/* 부위 슬롯 & 일괄 벗기 */}
          <div className="flex items-center justify-between pb-1.5 gap-1.5">
            <div className="flex-1 grid grid-cols-4 gap-1">
              {[
                { slot: 'hat' as const, label: '모자', icon: '🎩' },
                { slot: 'top' as const, label: '상의', icon: '👔' },
                { slot: 'bottom' as const, label: '하의', icon: '👖' },
                { slot: 'hand' as const, label: '손도구', icon: '🪄' },
              ].map((tab) => {
                const isActive = costumeSlot === tab.slot;
                const equippedItem = progress.equippedCostumes[tab.slot];
                return (
                  <button
                    key={tab.slot}
                    type="button"
                    onClick={() => {
                      setCostumeSlot(tab.slot);
                      sound.playTurn();
                    }}
                    className={`py-1.5 rounded-xl text-xs font-black flex items-center justify-center gap-1 border-2 transition-all cursor-pointer ${
                      isActive
                        ? 'btn-3d-amber text-[#1e1b18] border-[#2b1306]'
                        : 'wood-badge text-amber-100 justify-center'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    {equippedItem && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />}
                  </button>
                );
              })}
            </div>

            {/* 일괄 벗기 */}
            <button
              type="button"
              onClick={handleClearAllCostumes}
              className="btn-wood px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1 text-rose-300 border-rose-950 cursor-pointer shrink-0"
              title="모든 의상 벗기"
            >
              <RotateCcw size={12} />
              <span>모두 벗기</span>
            </button>
          </div>

          {/* 슬롯별 의상 리스트 그리드 (양피지 공방 타일) */}
          <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 pr-0.5 pb-4">
            {getCostumesBySlot(costumeSlot).map((item) => {
              const isOwned = progress.unlockedCostumeIds.includes(item.id);
              const isEquippedThis = progress.equippedCostumes[item.slot] === item.id;

              return (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-2xl border-2 flex flex-col justify-between transition-all ${
                    isEquippedThis
                      ? 'border-emerald-600 bg-gradient-to-b from-emerald-50 to-emerald-100 ring-2 ring-emerald-400 shadow-md'
                      : isOwned
                      ? 'panel-parchment'
                      : 'border-[#3a1d0d]/40 bg-[#2b1306]/20 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{item.iconText}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full border border-black/20 ${getRarityBadge(item.rarity)}`}>
                      {item.rarity}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-[#2b1306] mt-1 truncate">{item.name}</h4>

                  <div className="mt-2 pt-1 border-t border-[#2b1306]/15">
                    {isOwned ? (
                      <button
                        type="button"
                        onClick={() => handleToggleCostume(item)}
                        className={`w-full py-1.5 rounded-xl text-xs font-black cursor-pointer flex items-center justify-center gap-1 ${
                          isEquippedThis ? 'btn-3d-rose' : 'btn-3d-emerald'
                        }`}
                      >
                        {isEquippedThis ? '벗기' : '입히기'}
                      </button>
                    ) : (
                      <div className="w-full py-1.5 rounded-xl bg-[#2b1306]/20 border border-[#2b1306]/40 text-amber-200/70 flex items-center justify-center gap-1 text-[10px] font-black">
                        <Lock size={11} />
                        <span>미보유</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
