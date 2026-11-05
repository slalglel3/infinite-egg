import React, { useState } from 'react';
import { UserProgress } from '../../../types/game';
import { selectEggSkin } from '../../../utils/storage';
import { sound } from '../../../audio/sound';
import confetti from 'canvas-confetti';
import { EGG_ART_LIST } from '../../../assets/assetRegistry';
import { Check, Lock } from 'lucide-react';

interface EggsTabProps {
  progress: UserProgress;
  onUpdateProgress: (updated: UserProgress) => void;
  onStartGame?: () => void;
}

// 사용자 제공 원화(skin.png)의 8대 대표 달걀 스킨 정의
export interface ArtSkinItem {
  id: string;
  name: string;
  tagline: string;
  artIndex: number;
}

export const FEATURED_ART_SKINS: ArtSkinItem[] = [
  { id: 'classic', name: '황금 달걀', tagline: '자연산 유기농 황금빛 달걀', artIndex: 0 },
  { id: 'soft_boiled', name: '촉촉 반숙란', tagline: '탱글탱글 노른자가 살아있는 반숙', artIndex: 1 },
  { id: 'quail', name: '점박이 메추리알', tagline: '앙증맞은 천연 야생 메추리알', artIndex: 2 },
  { id: 'dino', name: '아기 공룡알', tagline: '선사 시대의 신비로운 원시 에그', artIndex: 3 },
  { id: 'cyber', name: '사이버 에그 2099', tagline: '미래형 홀로그램 네온 달걀', artIndex: 4 },
  { id: 'galaxy', name: '은하수 오로라란', tagline: '우주의 별빛이 쏟아지는 신비란', artIndex: 5 },
  { id: 'police_egg', name: '정의의 경찰란', tagline: '내리막길의 질서를 지키는 수호자', artIndex: 6 },
  { id: 'golden', name: '눈부신 황금알', tagline: '찬란한 광채를 내뿜는 전설의 알', artIndex: 7 },
];

export const EggsTab: React.FC<EggsTabProps> = ({ progress, onUpdateProgress }) => {
  const [selectedSkinId, setSelectedSkinId] = useState<string>(progress.selectedEggId || 'classic');

  const selectedSkin = FEATURED_ART_SKINS.find((s) => s.id === selectedSkinId) || FEATURED_ART_SKINS[0];
  const isEquipped = progress.selectedEggId === selectedSkin.id;
  const isUnlocked = progress.unlockedEggIds.includes(selectedSkin.id);

  // 스킨 슬롯 선택
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
      {/* 1. 상단 쇼케이스: 대표 달걀 라이브 프리뷰 (선택된 스킨이 1번 기본형이 아닐 때만 3D 원화 에셋 오버레이) */}
      {selectedSkin.artIndex !== 0 && (
        <div className="pointer-events-none absolute top-[18%] left-[35%] w-[30%] aspect-square flex items-center justify-center animate-bounce-gentle">
          <img
            src={EGG_ART_LIST[selectedSkin.artIndex]}
            alt={selectedSkin.name}
            className="w-full h-full object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.6)]"
          />
        </div>
      )}

      {/* 2. 상단 쇼케이스: 계란 이름 및 설명 (계란과 분리되어 받침대 위에 고정된 독립 텍스트) */}
      <div className="pointer-events-none absolute top-[32.5%] left-[20%] right-[20%] flex flex-col items-center leading-tight">
        <span className="text-xs sm:text-sm font-black text-amber-50 drop-shadow-[0_2px_2px_#1e0c03]">
          {selectedSkin.name}
        </span>
        <span className="text-[10px] text-amber-200/90 font-bold drop-shadow-[0_1px_1px_#1e0c03]">
          {selectedSkin.tagline}
        </span>
      </div>

      {/* 3. 중앙: [장착하기] 3D 버튼 인터랙티브 터치 영역 (Y: 39.4%, X: 28.5%, W: 43.0%, H: 7.6%) */}
      <button
        type="button"
        onClick={handleEquipButton}
        className="pointer-events-auto absolute top-[39.4%] left-[28.5%] w-[43.0%] h-[7.6%] cursor-pointer active:scale-95 transition-transform group rounded-2xl flex items-center justify-center"
        title={isEquipped ? '현재 장착 중' : isUnlocked ? '장착하기' : '잠금 상태'}
      >
        <div className="w-full h-full rounded-2xl group-active:bg-amber-400/25 transition-colors flex items-center justify-center">
          {/* 장착 상태 피드백 */}
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

      {/* 4. 하단: 원화 8대 달걀 슬롯 터치 그리드 (2행 x 4열) */}
      {/* 1행 (Y: 60.5%, H: 12.2%) */}
      {FEATURED_ART_SKINS.slice(0, 4).map((skin, idx) => {
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
      {FEATURED_ART_SKINS.slice(4, 8).map((skin, idx) => {
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
