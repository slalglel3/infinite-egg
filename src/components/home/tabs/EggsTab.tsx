import React, { useState } from 'react';
import { UserProgress } from '../../../types/game';
import { EGG_SKINS, getEggSkinById } from '../../../data/eggSkins';
import { selectEggSkin } from '../../../utils/storage';
import { sound } from '../../../audio/sound';
import confetti from 'canvas-confetti';
import { EggIllustration } from '../../common/EggIllustration';
import { Check, Lock } from 'lucide-react';

interface EggsTabProps {
  progress: UserProgress;
  onUpdateProgress: (updated: UserProgress) => void;
  onStartGame?: () => void;
}

// 8대 대표 달걀 스킨 매핑 (원화 2x4 슬롯 그리드 1:1 대응)
const GRID_SKIN_IDS = [
  'classic',
  'soft_boiled',
  'quail',
  'golden',
  'police_egg',
  'princess_egg',
  'angel_egg',
  'galaxy',
];

export const EggsTab: React.FC<EggsTabProps> = ({ progress, onUpdateProgress }) => {
  const [selectedSkinId, setSelectedSkinId] = useState<string>(progress.selectedEggId || 'classic');

  const selectedSkin = getEggSkinById(selectedSkinId) || EGG_SKINS[0];
  const isEquipped = progress.selectedEggId === selectedSkin.id;
  const isUnlocked = progress.unlockedEggIds.includes(selectedSkin.id);

  // 스킨 선택
  const handleSelectSlot = (skinId: string) => {
    sound.playTurn();
    setSelectedSkinId(skinId);
  };

  // 장착하기 버튼 클릭
  const handleEquipButton = () => {
    if (isEquipped) {
      sound.playTurn();
      return;
    }

    if (!isUnlocked) {
      sound.playImpact(5);
      alert(`[${selectedSkin.name}]은(는) 아직 잠겨 있습니다!\n상점의 [달걀 부화]에서 획득해 보세요 🥚✨`);
      return;
    }

    sound.playPerfect();
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.4 } });
    const updated = selectEggSkin(selectedSkin.id);
    onUpdateProgress(updated);
  };

  return (
    <div className="w-full h-full relative select-none">
      {/* 1. 상단: 쇼케이스 대표 달걀 라이브 프리뷰 (Y: 17% ~ 37%) */}
      <div className="pointer-events-none absolute top-[17%] left-[20%] right-[20%] h-[20%] flex flex-col items-center justify-center">
        {/* 달걀 일러스트 부유 애니메이션 */}
        <div className="w-[45%] max-w-[130px] aspect-square flex items-center justify-center animate-bounce-gentle drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]">
          <EggIllustration skin={selectedSkin} />
        </div>

        {/* 달걀 이름 및 짧은 능력치 태그 */}
        <div className="mt-1 flex flex-col items-center leading-tight">
          <span className="text-xs sm:text-sm font-black text-amber-50 drop-shadow-[0_2px_2px_#1e0c03]">
            {selectedSkin.name}
          </span>
          <span className="text-[10px] text-amber-200/90 font-bold drop-shadow-[0_1px_1px_#1e0c03]">
            {selectedSkin.tagline || selectedSkin.desc.slice(0, 24)}
          </span>
        </div>
      </div>

      {/* 2. 중앙: [장착하기] 3D 버튼 인터랙티브 터치 영역 (Y: 39.4%, X: 28.5%, W: 43.0%, H: 7.6%) */}
      <button
        type="button"
        onClick={handleEquipButton}
        className="pointer-events-auto absolute top-[39.4%] left-[28.5%] w-[43.0%] h-[7.6%] cursor-pointer active:scale-95 transition-transform group rounded-2xl flex items-center justify-center"
        title={isEquipped ? '현재 장착 중' : isUnlocked ? '장착하기' : '잠금 상태'}
      >
        <div className="w-full h-full rounded-2xl group-active:bg-amber-400/25 transition-colors flex items-center justify-center">
          {/* 이미 장착 중인 경우 버튼 위에 선명한 '장착 중' 상태 오버레이 */}
          {isEquipped ? (
            <span className="text-xs sm:text-sm font-black text-emerald-100 flex items-center gap-1 drop-shadow-[0_1.5px_2px_#064e3b]">
              <Check size={16} strokeWidth={3} className="text-emerald-300" />
              <span>장착 중</span>
            </span>
          ) : !isUnlocked ? (
            <span className="text-xs sm:text-sm font-black text-amber-200 flex items-center gap-1 drop-shadow-[0_1.5px_2px_#451a03]">
              <Lock size={15} strokeWidth={2.5} className="text-amber-300" />
              <span>잠김</span>
            </span>
          ) : null}
        </div>
      </button>

      {/* 3. 하단: 8대 달걀 슬롯 터치 그리드 (2행 x 4열) */}
      {/* 1행 (Y: 60.5%, H: 12.2%) */}
      {GRID_SKIN_IDS.slice(0, 4).map((skinId, idx) => {
        const skin = getEggSkinById(skinId);
        if (!skin) return null;
        const isSlotEquipped = progress.selectedEggId === skin.id;
        const isSlotSelected = selectedSkinId === skin.id;
        const isSlotUnlocked = progress.unlockedEggIds.includes(skin.id);

        const leftPositions = ['7.2%', '29.2%', '51.2%', '73.2%'];

        return (
          <button
            key={skin.id}
            type="button"
            onClick={() => handleSelectSlot(skin.id)}
            style={{ left: leftPositions[idx] }}
            className={`pointer-events-auto absolute top-[60.5%] w-[20.0%] h-[12.2%] rounded-2xl cursor-pointer active:scale-95 transition-all p-1 flex flex-col justify-between ${
              isSlotSelected ? 'ring-3 ring-amber-400 bg-amber-400/15' : ''
            }`}
            title={skin.name}
          >
            {/* 상단 우측: 장착 상태 체크 뱃지 */}
            <div className="w-full flex justify-end">
              {isSlotEquipped && (
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow border border-white">
                  <Check size={11} strokeWidth={3} />
                </span>
              )}
            </div>

            {/* 하단 우측: 미해금 잠금 아이콘 */}
            <div className="w-full flex justify-end">
              {!isSlotUnlocked && (
                <span className="w-4 h-4 rounded-full bg-black/60 text-amber-300 flex items-center justify-center shadow">
                  <Lock size={10} strokeWidth={2.5} />
                </span>
              )}
            </div>
          </button>
        );
      })}

      {/* 2행 (Y: 73.5%, H: 12.2%) */}
      {GRID_SKIN_IDS.slice(4, 8).map((skinId, idx) => {
        const skin = getEggSkinById(skinId);
        if (!skin) return null;
        const isSlotEquipped = progress.selectedEggId === skin.id;
        const isSlotSelected = selectedSkinId === skin.id;
        const isSlotUnlocked = progress.unlockedEggIds.includes(skin.id);

        const leftPositions = ['7.2%', '29.2%', '51.2%', '73.2%'];

        return (
          <button
            key={skin.id}
            type="button"
            onClick={() => handleSelectSlot(skin.id)}
            style={{ left: leftPositions[idx] }}
            className={`pointer-events-auto absolute top-[73.5%] w-[20.0%] h-[12.2%] rounded-2xl cursor-pointer active:scale-95 transition-all p-1 flex flex-col justify-between ${
              isSlotSelected ? 'ring-3 ring-amber-400 bg-amber-400/15' : ''
            }`}
            title={skin.name}
          >
            {/* 상단 우측: 장착 상태 체크 뱃지 */}
            <div className="w-full flex justify-end">
              {isSlotEquipped && (
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow border border-white">
                  <Check size={11} strokeWidth={3} />
                </span>
              )}
            </div>

            {/* 하단 우측: 미해금 잠금 아이콘 */}
            <div className="w-full flex justify-end">
              {!isSlotUnlocked && (
                <span className="w-4 h-4 rounded-full bg-black/60 text-amber-300 flex items-center justify-center shadow">
                  <Lock size={10} strokeWidth={2.5} />
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
