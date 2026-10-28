import React, { useState, useRef, useEffect } from 'react';
import { UserProgress, EggSkin, EggRarity } from '../../types/game';
import { EGG_SKINS } from '../../data/eggSkins';
import { saveUserProgress, selectEggSkin } from '../../utils/storage';
import { Sparkles, Check, Gift, PackageOpen } from 'lucide-react';
import { sound } from '../../audio/sound';
import confetti from 'canvas-confetti';
import { CostumeSvgLayers } from './CostumeSvgLayers';

interface HatchingModalProps {
  progress: UserProgress;
  onClose: () => void;
  onUpdateProgress: (updated: UserProgress) => void;
}

type HatchStage = 'RIBBON' | 'THUMPING' | 'HATCHED';

interface HatchResult {
  skin: EggSkin;
  isDuplicate: boolean;
  rewardShells: number;
}

export const HatchingModal: React.FC<HatchingModalProps> = ({
  progress,
  onClose,
  onUpdateProgress,
}) => {
  const [stage, setStage] = useState<HatchStage>('RIBBON');
  const [dragProgress, setDragProgress] = useState(0); // 0 ~ 100 (%)
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const [hatchResult, setHatchResult] = useState<HatchResult | null>(null);

  // 가챠 결과 추첨 (확률 테이블: LEGENDARY 3%, EPIC 12%, RARE 25%, COMMON 60%)
  useEffect(() => {
    const rollRarity = (): EggRarity => {
      const rand = Math.random() * 100;
      if (rand < 3) return 'LEGENDARY';
      if (rand < 15) return 'EPIC';
      if (rand < 40) return 'RARE';
      return 'COMMON';
    };

    const targetRarity = rollRarity();
    let candidateSkins = EGG_SKINS.filter((s) => s.rarity === targetRarity);
    if (candidateSkins.length === 0) {
      candidateSkins = EGG_SKINS;
    }
    const chosenSkin = candidateSkins[Math.floor(Math.random() * candidateSkins.length)];
    const isDup = progress.unlockedEggIds.includes(chosenSkin.id);

    let shells = 0;
    if (isDup) {
      switch (chosenSkin.rarity) {
        case 'LEGENDARY': shells = 200; break;
        case 'EPIC': shells = 80; break;
        case 'RARE': shells = 35; break;
        default: shells = 15; break;
      }
    }

    setHatchResult({
      skin: chosenSkin,
      isDuplicate: isDup,
      rewardShells: shells,
    });
  }, [progress.unlockedEggIds]);

  // [피드백 7] 상자 위 리본 끈을 위/대각선으로 당기는 드래그 핸들러
  const handlePointerDown = (e: React.PointerEvent) => {
    if (stage !== 'RIBBON') return;
    setIsDragging(true);
    dragStartY.current = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || stage !== 'RIBBON') return;
    const deltaY = Math.max(0, dragStartY.current - e.clientY); // 위로 당김
    const newProgress = Math.min(100, Math.floor((deltaY / 120) * 100));
    setDragProgress(newProgress);

    if (newProgress >= 100) {
      setIsDragging(false);
      startThumping();
    }
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragProgress < 100) {
      setDragProgress(0);
    }
  };

  // 2단계: 상자 내부 태동 & 뜸 들이기 연출 (2.5초)
  const startThumping = () => {
    setStage('THUMPING');
    sound.playImpact(8);

    let thumpCount = 0;
    const interval = setInterval(() => {
      thumpCount++;
      sound.playTurn();
      if (thumpCount >= 4) {
        clearInterval(interval);
      }
    }, 550);

    setTimeout(() => {
      setStage('HATCHED');
      sound.playPerfect();
      confetti({ particleCount: 140, spread: 90, origin: { y: 0.5 } });

      if (hatchResult) {
        if (hatchResult.isDuplicate) {
          const updated = {
            ...progress,
            eggShells: (progress.eggShells || 0) + hatchResult.rewardShells,
          };
          saveUserProgress(updated);
          onUpdateProgress(updated);
        } else {
          // [피드백 2 반영] 의상 계란을 얻으면 번들 의상 세트도 함께 자동 지급!
          const newUnlockedCostumes = [...progress.unlockedCostumeIds];
          if (hatchResult.skin.bundledCostumes) {
            Object.values(hatchResult.skin.bundledCostumes).forEach((cId) => {
              if (cId && !newUnlockedCostumes.includes(cId)) {
                newUnlockedCostumes.push(cId);
              }
            });
          }

          const updated = {
            ...progress,
            unlockedEggIds: [...progress.unlockedEggIds, hatchResult.skin.id],
            unlockedCostumeIds: newUnlockedCostumes,
            selectedEggId: hatchResult.skin.id,
          };
          saveUserProgress(updated);
          onUpdateProgress(updated);
        }
      }
    }, 2500);
  };

  // 장착하고 닫기
  const handleEquipHatched = () => {
    if (hatchResult && !hatchResult.isDuplicate) {
      const updated = selectEggSkin(hatchResult.skin.id);
      onUpdateProgress(updated);
    }
    onClose();
  };

  const getRarityBadge = (rarity: EggRarity) => {
    switch (rarity) {
      case 'LEGENDARY':
        return 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md';
      case 'EPIC':
        return 'bg-purple-600 text-white';
      case 'RARE':
        return 'bg-sky-600 text-white';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none touch-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* 닫기 버튼 */}
      {stage === 'HATCHED' && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 text-white/80 hover:text-white font-black text-xl p-2 cursor-pointer"
        >
          ✕
        </button>
      )}

      {/* 씬 1: [피드백 7] 선물 상자의 리본 끈 풀기 단계 */}
      {stage === 'RIBBON' && (
        <div className="flex flex-col items-center text-center animate-fade-in">
          <span className="text-amber-400 font-black text-sm tracking-widest flex items-center gap-1.5 mb-1">
            <Gift size={16} /> 신비로운 선물 상자
          </span>
          <h2 className="text-2xl font-black text-white drop-shadow">
            상자 위의 리본을 위로 풀어보세요!
          </h2>
          <p className="text-xs text-amber-200/80 font-bold mt-1 max-w-xs">
            상자 뚜껑 위의 빨간 리본 끈을 손으로 잡고 위로 쭉 당기면 매듭이 스르륵 풀립니다!
          </p>

          {/* 선물 상자 & 리본 당기기 비주얼 */}
          <div
            onPointerDown={handlePointerDown}
            className="relative w-64 h-72 my-5 flex items-center justify-center cursor-grab active:cursor-grabbing"
          >
            <svg viewBox="0 0 200 220" className="w-56 h-64 drop-shadow-2xl overflow-visible">
              <defs>
                {/* 선물 상자 본체 그라데이션 */}
                <linearGradient id="boxBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="60%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#b45309" />
                </linearGradient>
                {/* 뚜껑 그라데이션 */}
                <linearGradient id="boxLidGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>

              {/* 1. 상자 바닥 그림자 */}
              <ellipse cx="100" cy="195" rx="65" ry="14" fill="#020617" opacity="0.4" />

              {/* 2. 상자 몸통 */}
              <rect x="45" y="100" width="110" height="90" rx="10" fill="url(#boxBodyGrad)" stroke="#78350f" strokeWidth="2.5" />
              {/* 상자 세로 리본 띠 */}
              <rect x="88" y="100" width="24" height="90" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />

              {/* 3. 상자 뚜껑 (Lid) */}
              <rect x="38" y="80" width="124" height="26" rx="6" fill="url(#boxLidGrad)" stroke="#78350f" strokeWidth="2.5" />
              {/* 뚜껑 가로/세로 리본 */}
              <rect x="88" y="80" width="24" height="26" fill="#ef4444" />
              <rect x="38" y="88" width="124" height="10" fill="#dc2626" opacity="0.6" />

              {/* 4. 상자 위의 리본 나비 매듭 (Bow) */}
              <g id="box-ribbon-bow" transform="translate(100, 80)">
                {/* 좌측 나비 루프 */}
                <path
                  d="M 0 0 C -38 -32 -48 10 0 0"
                  fill="#ef4444"
                  stroke="#991b1b"
                  strokeWidth="2.5"
                  style={{
                    transform: `scale(${Math.max(0.2, 1 - dragProgress / 120)})`,
                    transformOrigin: '0 0',
                  }}
                />
                {/* 우측 나비 루프 */}
                <path
                  d="M 0 0 C 38 -32 48 10 0 0"
                  fill="#ef4444"
                  stroke="#991b1b"
                  strokeWidth="2.5"
                  style={{
                    transform: `scale(${Math.max(0.2, 1 - dragProgress / 120)})`,
                    transformOrigin: '0 0',
                  }}
                />

                {/* [피드백 7 핵심] 위로 자연스럽게 당겨지는 리본 끈 꼬리 (Ribbon Pull Tail) */}
                <path
                  d={`M 0 0 Q ${15 + dragProgress * 0.2} ${-15 - dragProgress * 0.8} ${25 + dragProgress * 0.1} ${-30 - dragProgress * 0.9}`}
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth={Math.max(4, 7 - dragProgress * 0.04)}
                  strokeLinecap="round"
                />

                {/* 중앙 매듭 버클 */}
                <circle cx="0" cy="0" r="8" fill="#fef08a" stroke="#ca8a04" strokeWidth="2" />
              </g>
            </svg>

            {/* 당김 힌트 플로팅 손가락 */}
            <div
              className="absolute pointer-events-none transition-all duration-75 flex flex-col items-center"
              style={{
                top: `${40 - dragProgress * 0.5}px`,
                right: '48px',
                opacity: dragProgress > 80 ? 0 : 1,
              }}
            >
              <span className="text-2xl animate-bounce">👆</span>
              <span className="text-[10px] font-black text-yellow-300 bg-black/60 px-1.5 py-0.5 rounded-full mt-0.5">
                위로 당기기!
              </span>
            </div>
          </div>

          {/* 슬라이드 가이드 바 */}
          <div className="w-64 bg-white/20 rounded-full h-4 overflow-hidden border border-white/40 p-0.5 relative">
            <div
              className="bg-gradient-to-r from-amber-400 to-rose-500 h-full rounded-full transition-all duration-100 flex items-center justify-end pr-1"
              style={{ width: `${Math.max(8, dragProgress)}%` }}
            >
              <span className="text-[9px] font-black text-white">🎀</span>
            </div>
          </div>
          <span className="text-[11px] font-black text-white/80 mt-1.5">
            {dragProgress > 0 ? `${dragProgress}% 풀림` : '리본 끈을 잡고 위로 쭉 당기세요!'}
          </span>
        </div>
      )}

      {/* 씬 2: 상자 내부 태동 & 뜸 들이기 단계 (Thump & Shake) */}
      {stage === 'THUMPING' && (
        <div className="flex flex-col items-center text-center animate-fade-in">
          <span className="text-amber-400 font-black text-sm tracking-widest animate-pulse">
            두근... 두근... 상자가 들썩입니다!
          </span>
          <h2 className="text-2xl font-black text-white drop-shadow mt-1">
            상자 속에서 무언가 깨어나고 있습니다!
          </h2>

          {/* 들썩이는 선물 상자 애니메이션 */}
          <div className="relative w-64 h-72 my-5 flex items-center justify-center">
            {/* 주변 빛 광채 */}
            <div className="absolute w-56 h-56 bg-amber-400/40 rounded-full blur-2xl animate-ping" />

            <div className="animate-thump-shake relative">
              <svg viewBox="0 0 200 220" className="w-56 h-64 drop-shadow-2xl overflow-visible">
                {/* 상자 몸통 */}
                <rect x="45" y="100" width="110" height="90" rx="10" fill="#f59e0b" stroke="#78350f" strokeWidth="2.5" />
                <rect x="88" y="100" width="24" height="90" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />

                {/* 들썩거리는 뚜껑과 새어나오는 황금 빛줄기 */}
                <g transform="translate(0, -12) rotate(-4 100 80)">
                  <rect x="38" y="80" width="124" height="26" rx="6" fill="#fbbf24" stroke="#78350f" strokeWidth="2.5" />
                  <rect x="88" y="80" width="24" height="26" fill="#ef4444" />
                </g>

                {/* 상자 틈새로 새어나오는 찬란한 빛 */}
                <line x1="50" y1="92" x2="150" y2="88" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" className="animate-pulse" />
              </svg>
            </div>
          </div>

          <p className="text-xs text-amber-200 font-bold animate-bounce">
            잠시만 숨을 죽여주세요...!
          </p>
        </div>
      )}

      {/* 씬 3: 상자 활짝 열림 & 부화 완료 단계 */}
      {stage === 'HATCHED' && hatchResult && (
        <div className="flex flex-col items-center text-center animate-scale-up max-w-sm w-full">
          {/* 희귀도 배지 */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className={`text-xs font-black px-3.5 py-1 rounded-full ${getRarityBadge(hatchResult.skin.rarity)}`}>
              {hatchResult.skin.rarity}
            </span>
          </div>

          {/* 타이틀 */}
          <h2 className="text-2xl font-black text-white drop-shadow">
            {hatchResult.isDuplicate ? '중복 계란 획득!' : '새로운 계란 부화 완료!'}
          </h2>

          {/* 중앙 부화한 달걀 일러스트 쇼케이스 (고유 의상 포함) */}
          <div className="relative w-48 h-54 my-3 flex items-center justify-center p-3 bg-white/10 rounded-3xl border border-white/20 shadow-2xl backdrop-blur-md">
            <svg viewBox="0 0 100 116" className="w-38 h-46 drop-shadow-2xl overflow-visible">
              <defs>
                <radialGradient id={`hatchedGrad-${hatchResult.skin.id}`} cx="42%" cy="36%" r="65%">
                  <stop offset="0%" stopColor={hatchResult.skin.colors.top} />
                  <stop offset="22%" stopColor={hatchResult.skin.colors.mid1} />
                  <stop offset="65%" stopColor={hatchResult.skin.colors.mid2} />
                  <stop offset="92%" stopColor={hatchResult.skin.colors.bottom} />
                  <stop offset="100%" stopColor={hatchResult.skin.colors.shadow} />
                </radialGradient>
              </defs>
              <path
                d="M 50 10 C 74 10, 92 38, 92 65 C 92 90, 75 106, 50 106 C 25 106, 8 90, 8 65 C 8 38, 26 10, 50 10 Z"
                fill={`url(#hatchedGrad-${hatchResult.skin.id})`}
                stroke={hatchResult.skin.colors.line}
                strokeWidth="3.2"
                strokeLinejoin="round"
              />
              <path
                d="M 42 16 C 30 22, 17 40, 17 56 C 17 62, 20 66, 24 60 C 27 46, 36 28, 46 20 C 47 18, 45 16, 42 16 Z"
                fill="#ffffff"
                opacity="0.7"
              />
              <circle cx="38" cy="62" r="4.2" fill={hatchResult.skin.colors.eyeColor} />
              <circle cx="64" cy="62" r="4.2" fill={hatchResult.skin.colors.eyeColor} />
              <circle cx="36.5" cy="60.5" r="1.6" fill="#ffffff" />
              <circle cx="62.5" cy="60.5" r="1.6" fill="#ffffff" />
              <ellipse cx="29" cy="70" rx="4.8" ry="3" fill={hatchResult.skin.colors.cheekColor} opacity="0.85" />
              <ellipse cx="73" cy="70" rx="4.8" ry="3" fill={hatchResult.skin.colors.cheekColor} opacity="0.85" />
              <path d="M 44 70 Q 51 76 58 70" stroke={hatchResult.skin.colors.eyeColor} strokeWidth="2.8" fill="none" strokeLinecap="round" />

              {/* [피드백 2] 의상 계란인 경우 고유 의상 함께 렌더링 */}
              {hatchResult.skin.bundledCostumes && (
                <CostumeSvgLayers
                  hatId={hatchResult.skin.bundledCostumes.hat}
                  topId={hatchResult.skin.bundledCostumes.top}
                  bottomId={hatchResult.skin.bundledCostumes.bottom}
                  handId={hatchResult.skin.bundledCostumes.hand}
                />
              )}
            </svg>
          </div>

          <h3 className="text-xl font-black text-amber-300">
            {hatchResult.skin.name}
          </h3>
          <p className="text-xs text-white/90 font-bold mt-0.5">
            {hatchResult.skin.tagline}
          </p>

          {/* 의상 세트 번들 획득 알림 */}
          {!hatchResult.isDuplicate && hatchResult.skin.bundledCostumes && (
            <div className="mt-2 bg-purple-500/30 border border-purple-300 p-2 rounded-2xl flex items-center justify-center gap-1.5 text-[11px] font-black text-purple-200">
              <Sparkles size={13} className="text-yellow-300" />
              <span>보너스: <strong>해당 의상 4부위 세트</strong>가 영구 해금되었습니다!</span>
            </div>
          )}

          {/* 중복 시 계란 껍데기 보상 알림 */}
          {hatchResult.isDuplicate ? (
            <div className="mt-2 bg-amber-500/30 border border-amber-300 p-2.5 rounded-2xl flex items-center gap-2 text-xs font-black text-amber-200">
              <span className="text-lg">🥚</span>
              <span>
                이미 보유 중인 계란으로 <strong>계란 껍데기 +{hatchResult.rewardShells}개</strong>를 획득했습니다!
              </span>
            </div>
          ) : (
            <div className="mt-2 bg-emerald-500/30 border border-emerald-300 p-1.5 rounded-2xl text-[11px] font-black text-emerald-200">
              ✓ 도감에 등록되고 기본 계란으로 즉시 장착되었습니다!
            </div>
          )}

          {/* 하단 버튼 */}
          <div className="w-full mt-3 flex gap-2">
            {!hatchResult.isDuplicate ? (
              <button
                type="button"
                onClick={handleEquipHatched}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black text-sm rounded-2xl shadow-xl active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check size={16} />
                <span>장착하고 닫기</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 font-black text-sm rounded-2xl shadow-xl active:scale-95 transition-all cursor-pointer"
              >
                확인
              </button>
            )}
          </div>
        </div>
      )}

      {/* 키프레임 스타일 */}
      <style>{`
        @keyframes thumpShake {
          0%, 100% { transform: scale(1) rotate(0deg); }
          20% { transform: scale(1.08, 0.94) rotate(-4deg); }
          40% { transform: scale(0.95, 1.08) rotate(4deg); }
          60% { transform: scale(1.12, 0.92) rotate(-3deg); }
          80% { transform: scale(0.98, 1.05) rotate(2deg); }
        }
        .animate-thump-shake {
          animation: thumpShake 0.45s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
