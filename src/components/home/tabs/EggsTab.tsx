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

export interface ArtSkinItem {
  id: string;
  name: string;
  tagline: string;
  stats: string;
  artIndex: number;
  isLockedDefault?: boolean;
}

// 사용자 제공 원화(skin.png)의 6대 핵심 달걀 스킨 + 2개 잠금 슬롯
export const FEATURED_ART_SKINS: ArtSkinItem[] = [
  {
    id: 'baby_egg',
    name: '꼬마 에그',
    tagline: '바삭하게 깨진 껍질 모자를 쓴 아기 에그',
    stats: '점프력 +1.0% | 속도 +1.0%',
    artIndex: 0,
  },
  {
    id: 'baked_egg',
    name: '구운 달걀',
    tagline: '노릇노릇 촉촉한 온천 구운란',
    stats: '충격 흡수 +2.0% | 회복력 +1.0%',
    artIndex: 1,
  },
  {
    id: 'pirate_egg',
    name: '해적 달걀',
    tagline: '바다를 호령하는 당찬 해적 선장 에그',
    stats: '깃털 획득 +5.0% | 속도 +1.5%',
    artIndex: 2,
  },
  {
    id: 'winter_egg',
    name: '겨울 펭귄 달걀',
    tagline: '따뜻한 파란 후드를 쓴 방한 에그',
    stats: '미끄럼 방지 +3.0% | 점프력 +1.5%',
    artIndex: 3,
  },
  {
    id: 'astro_egg',
    name: '우주비행사 달걀',
    tagline: '무중력 우주를 유영하는 우주비행사',
    stats: '중력 감소 +5.0% | 체공 시간 +2.0%',
    artIndex: 4,
  },
  {
    id: 'chicken_egg',
    name: '닭 의상 달걀',
    tagline: '닭볏 깃털과 초록 망토를 두른 닭 코스튬',
    stats: '깃털 2배 확률 +3.0% | 점프력 +2.0%',
    artIndex: 5,
  },
  {
    id: 'locked_slot_1',
    name: '미지의 전설란',
    tagline: '달걀 부화기에서 해금 가능합니다',
    stats: '잠김 (??? )',
    artIndex: 6,
    isLockedDefault: true,
  },
  {
    id: 'locked_slot_2',
    name: '신비의 우주란',
    tagline: '달걀 부화기에서 해금 가능합니다',
    stats: '잠김 (??? )',
    artIndex: 7,
    isLockedDefault: true,
  },
];

export const EggsTab: React.FC<EggsTabProps> = ({ progress, onUpdateProgress }) => {
  // 기본 장착 스킨 매핑
  const initialSkinId = FEATURED_ART_SKINS.some(s => s.id === progress.selectedEggId)
    ? progress.selectedEggId
    : 'baby_egg';

  const [selectedSkinId, setSelectedSkinId] = useState<string>(initialSkinId);

  const selectedSkin = FEATURED_ART_SKINS.find((s) => s.id === selectedSkinId) || FEATURED_ART_SKINS[0];
  const isEquipped = progress.selectedEggId === selectedSkin.id || (progress.selectedEggId === 'classic' && selectedSkin.id === 'baby_egg');
  const isLocked = selectedSkin.isLockedDefault;

  // 스킨 슬롯 선택
  const handleSelectSlot = (skinId: string) => {
    sound.playTurn();
    setSelectedSkinId(skinId);
  };

  // 장착하기 버튼 클릭
  const handleEquipButton = () => {
    if (isLocked) {
      sound.playImpact(5);
      alert(`[${selectedSkin.name}]은(는) 아직 잠겨 있습니다!\n상점의 [달걀 부화기]에서 획득해 보세요 🥚✨`);
      return;
    }

    if (isEquipped) {
      sound.playTurn();
      return;
    }

    sound.playPerfect();
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.4 } });
    const updated = selectEggSkin(selectedSkin.id);
    onUpdateProgress(updated);
  };

  // 8대 슬롯 그리드 좌표 (2행 4열: screen_skin.png 원화 기준)
  const slotGrid = [
    // Row 1: x: 7.4% ~ 26.5%, 27.5% ~ 46.5%, 47.5% ~ 66.5%, 67.5% ~ 86.5% | y: 53.5% ~ 64.5%
    { id: 'baby_egg', top: '53.5%', left: '7.4%', w: '19.1%', h: '11.0%' },
    { id: 'baked_egg', top: '53.5%', left: '27.5%', w: '19.1%', h: '11.0%' },
    { id: 'pirate_egg', top: '53.5%', left: '47.5%', w: '19.1%', h: '11.0%' },
    { id: 'winter_egg', top: '53.5%', left: '67.5%', w: '19.1%', h: '11.0%' },
    // Row 2: y: 65.5% ~ 76.5%
    { id: 'astro_egg', top: '65.5%', left: '7.4%', w: '19.1%', h: '11.0%' },
    { id: 'chicken_egg', top: '65.5%', left: '27.5%', w: '19.1%', h: '11.0%' },
    { id: 'locked_slot_1', top: '65.5%', left: '47.5%', w: '19.1%', h: '11.0%' },
    { id: 'locked_slot_2', top: '65.5%', left: '67.5%', w: '19.1%', h: '11.0%' },
  ];

  return (
    <div className="w-full h-full relative select-none">
      {/* 1. 상단 쇼케이스: 대표 달걀 라이브 프리뷰 (둥지 위 3D 원화 에셋 호흡 애니메이션) */}
      <div className="pointer-events-none absolute top-[20.2%] left-[33.5%] w-[33.0%] aspect-square flex items-center justify-center animate-gentle-bob">
        <img
          src={EGG_ART_LIST[selectedSkin.artIndex]}
          alt={selectedSkin.name}
          className="w-full h-full object-contain drop-shadow-[0_12px_18px_rgba(40,15,5,0.7)]"
        />
      </div>

      {/* 2. 상단 쇼케이스: 목판 1 (달걀 이름) */}
      <div className="pointer-events-none absolute top-[35.5%] left-[38.0%] w-[24.0%] h-[4.0%] flex items-center justify-center text-center">
        <span 
          style={{ fontFamily: "'NanumSquareRound', 'Jua', sans-serif" }}
          className="text-xs sm:text-sm font-black text-amber-50 drop-shadow-[0_1.5px_1px_rgba(40,15,5,0.95)]"
        >
          {selectedSkin.name}
        </span>
      </div>

      {/* 3. 상단 쇼케이스: 목판 2 (스탯 및 효과) */}
      <div className="pointer-events-none absolute top-[41.2%] left-[32.0%] w-[36.0%] h-[6.5%] flex flex-col items-center justify-center text-center">
        <span 
          style={{ fontFamily: "'NanumSquareRound', 'Fredoka', sans-serif" }}
          className="text-[11px] sm:text-xs font-black text-[#fef08a] drop-shadow-[0_1.5px_1px_rgba(40,15,5,0.95)]"
        >
          {selectedSkin.stats}
        </span>
      </div>

      {/* 4. 중앙: [장착하기] 3D 버튼 인터랙티브 터치 영역 (Y: 49.8% ~ 55.3%, X: 35.5% ~ 64.5%) */}
      <button
        type="button"
        onClick={handleEquipButton}
        className="pointer-events-auto absolute top-[49.8%] left-[35.5%] w-[29.0%] h-[5.5%] cursor-pointer active:scale-95 transition-transform group rounded-2xl flex items-center justify-center"
        title={isEquipped ? '현재 장착 중' : isLocked ? '잠금 상태' : '장착하기'}
      >
        <div className="w-full h-full rounded-2xl group-active:bg-amber-400/25 transition-colors flex items-center justify-center">
          {isEquipped ? (
            <span 
              style={{ fontFamily: "'NanumSquareRound', 'Jua', sans-serif" }}
              className="text-xs sm:text-sm font-black text-[#451a03] flex items-center gap-1 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]"
            >
              <Check size={16} strokeWidth={3} className="text-[#451a03]" />
              <span>장착 중</span>
            </span>
          ) : isLocked ? (
            <span 
              style={{ fontFamily: "'NanumSquareRound', 'Jua', sans-serif" }}
              className="text-xs sm:text-sm font-black text-stone-300 flex items-center gap-1 drop-shadow-[0_1.5px_2px_rgba(40,15,5,0.95)]"
            >
              <Lock size={15} strokeWidth={3} className="text-stone-300" />
              <span>잠김</span>
            </span>
          ) : (
            <span 
              style={{ fontFamily: "'NanumSquareRound', 'Jua', sans-serif" }}
              className="text-xs sm:text-sm font-black text-[#451a03] flex items-center gap-1 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]"
            >
              장착하기
            </span>
          )}
        </div>
      </button>

      {/* 5. 하단: 8개 스킨 보관함 슬롯 터치 영역 (원화 슬롯 1:1 매핑) */}
      {slotGrid.map((slot) => {
        const isCurrentSelected = slot.id === selectedSkin.id;
        const skinItem = FEATURED_ART_SKINS.find((s) => s.id === slot.id);

        return (
          <button
            key={slot.id}
            type="button"
            onClick={() => handleSelectSlot(slot.id)}
            style={{
              top: slot.top,
              left: slot.left,
              width: slot.w,
              height: slot.h,
            }}
            className={`pointer-events-auto absolute rounded-2xl cursor-pointer active:scale-95 transition-all flex items-center justify-center ${
              isCurrentSelected ? 'ring-4 ring-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]' : ''
            }`}
            title={skinItem?.name}
            aria-label={skinItem?.name}
          >
            <span className="sr-only">{skinItem?.name}</span>
            {/* 터치 피드백 영역 */}
            <div className="w-full h-full rounded-2xl group-active:bg-amber-400/20 transition-colors" />
          </button>
        );
      })}
    </div>
  );
};
