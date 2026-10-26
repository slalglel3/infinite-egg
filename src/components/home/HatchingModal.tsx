import React, { useState, useRef, useEffect } from 'react';
import { UserProgress, EggSkin, EggRarity } from '../../types/game';
import { EGG_SKINS } from '../../data/eggSkins';
import { saveUserProgress, selectEggSkin } from '../../utils/storage';
import { Sparkles, Check, Gift } from 'lucide-react';
import { sound } from '../../audio/sound';
import confetti from 'canvas-confetti';

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
  const dragStartX = useRef(0);
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

  // 터치/마우스 리본 드래그 핸들러
  const handlePointerDown = (e: React.PointerEvent) => {
    if (stage !== 'RIBBON') return;
    setIsDragging(true);
    dragStartX.current = e.clientX;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || stage !== 'RIBBON') return;
    const deltaX = Math.max(0, e.clientX - dragStartX.current);
    const newProgress = Math.min(100, Math.floor((deltaX / 140) * 100));
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
      // 드래그가 덜 끝났으면 원위치
      setDragProgress(0);
    }
  };

  // 2단계: 태동 & 뜸 들이기 연출 (2.5초)
  const startThumping = () => {
    setStage('THUMPING');
    sound.playImpact(8);

    // 심장 박동 / 태동 효과음 시뮬레이션
    let thumpCount = 0;
    const interval = setInterval(() => {
      thumpCount++;
      sound.playTurn();
      if (thumpCount >= 4) {
        clearInterval(interval);
      }
    }, 550);

    // 2.5초 후 3단계 대폭발 부화!
    setTimeout(() => {
      setStage('HATCHED');
      sound.playPerfect();
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });

      // 유저 프로그레스 영속화
      if (hatchResult) {
        if (hatchResult.isDuplicate) {
          const updated = {
            ...progress,
            eggShells: (progress.eggShells || 0) + hatchResult.rewardShells,
          };
          saveUserProgress(updated);
          onUpdateProgress(updated);
        } else {
          const updated = {
            ...progress,
            unlockedEggIds: [...progress.unlockedEggIds, hatchResult.skin.id],
            selectedEggId: hatchResult.skin.id,
          };
          saveUserProgress(updated);
          onUpdateProgress(updated);
        }
      }
    }, 2500);
  };

  // 장착하기 클릭
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

      {/* 씬 1: 리본 풀기 단계 */}
      {stage === 'RIBBON' && (
        <div className="flex flex-col items-center text-center animate-fade-in">
          <span className="text-amber-400 font-black text-sm tracking-widest flex items-center gap-1.5 mb-1">
            <Gift size={16} /> 신비로운 선물 알
          </span>
          <h2 className="text-2xl font-black text-white drop-shadow">
            리본을 오른쪽으로 풀어보세요!
          </h2>
          <p className="text-xs text-amber-200/80 font-bold mt-1 max-w-xs">
            알에 묶인 황금 리본 매듭을 오른쪽으로 드래그하면 알이 깨어나기 시작합니다!
          </p>

          {/* 리본 묶인 알 비주얼 */}
          <div
            onPointerDown={handlePointerDown}
            className="relative w-64 h-74 my-6 flex items-center justify-center cursor-grab active:cursor-grabbing"
          >
            {/* 알 본체 (황금 펄 알) */}
            <svg viewBox="0 0 100 116" className="w-56 h-66 drop-shadow-2xl">
              <defs>
                <radialGradient id="ribbonEggGrad" cx="40%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#fef3c7" />
                  <stop offset="40%" stopColor="#fde68a" />
                  <stop offset="85%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </radialGradient>
              </defs>
              <path
                d="M 50 10 C 74 10, 92 38, 92 65 C 92 90, 75 106, 50 106 C 25 106, 8 90, 8 65 C 8 38, 26 10, 50 10 Z"
                fill="url(#ribbonEggGrad)"
                stroke="#b45309"
                strokeWidth="3"
              />
              <path
                d="M 42 16 C 30 22, 17 40, 17 56 C 17 62, 20 66, 24 60 C 27 46, 36 28, 46 20 C 47 18, 45 16, 42 16 Z"
                fill="#ffffff"
                opacity="0.6"
              />
            </svg>

            {/* 둘러진 붉은 선물 리본 밴드 */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-75"
              style={{
                transform: `translateX(${dragProgress * 1.5}px)`,
                opacity: Math.max(0, 1 - dragProgress / 90),
              }}
            >
              <svg viewBox="0 0 200 240" className="w-full h-full overflow-visible">
                {/* 가로 리본 띠 */}
                <rect x="25" y="110" width="150" height="26" rx="4" fill="#ef4444" stroke="#991b1b" strokeWidth="2.5" />
                <rect x="25" y="118" width="150" height="8" fill="#fca5a5" opacity="0.6" />

                {/* 중앙 화려한 선물 나비 매듭 (Bow) */}
                <g id="ribbon-bow" transform="translate(100, 123)">
                  {/* 좌측 루프 */}
                  <path d="M 0 0 C -35 -30 -50 15 0 0" fill="#dc2626" stroke="#991b1b" strokeWidth="2.5" />
                  {/* 우측 루프 */}
                  <path d="M 0 0 C 35 -30 50 15 0 0" fill="#dc2626" stroke="#991b1b" strokeWidth="2.5" />
                  {/* 펄럭이는 리본 끝자락 */}
                  <path d="M -5 5 L -25 45 L -10 38 L 0 5" fill="#ef4444" stroke="#991b1b" strokeWidth="2" />
                  <path d="M 5 5 L 25 45 L 10 38 L 0 5" fill="#ef4444" stroke="#991b1b" strokeWidth="2" />
                  {/* 중앙 매듭 버튼 */}
                  <circle cx="0" cy="0" r="10" fill="#fef08a" stroke="#ca8a04" strokeWidth="2.5" />
                  <circle cx="-2" cy="-2" r="3" fill="#ffffff" />
                </g>
              </svg>
            </div>
          </div>

          {/* 슬라이드 가이드 바 */}
          <div className="w-64 bg-white/20 rounded-full h-4 overflow-hidden border border-white/40 p-0.5 relative">
            <div
              className="bg-gradient-to-r from-amber-400 to-rose-500 h-full rounded-full transition-all duration-100 flex items-center justify-end pr-1"
              style={{ width: `${Math.max(8, dragProgress)}%` }}
            >
              <span className="text-[9px] font-black text-white">👉</span>
            </div>
          </div>
          <span className="text-[11px] font-black text-white/80 mt-1.5">
            {dragProgress > 0 ? `${dragProgress}% 풀림` : '손가락을 대고 오른쪽으로 쭉 미세요'}
          </span>
        </div>
      )}

      {/* 씬 2: 태동 & 뜸 들이기 단계 (Thump & Shake) */}
      {stage === 'THUMPING' && (
        <div className="flex flex-col items-center text-center animate-fade-in">
          <span className="text-amber-400 font-black text-sm tracking-widest animate-pulse">
            두근... 두근... 태동 중!
          </span>
          <h2 className="text-2xl font-black text-white drop-shadow mt-1">
            신비로운 기운이 차오릅니다!
          </h2>

          {/* 태동하는 알 애니메이션 */}
          <div className="relative w-64 h-74 my-6 flex items-center justify-center">
            {/* 주변 빛 광채 */}
            <div className="absolute w-56 h-56 bg-amber-400/40 rounded-full blur-2xl animate-ping" />

            <div className="animate-thump-shake relative">
              <svg viewBox="0 0 100 116" className="w-56 h-66 drop-shadow-2xl">
                <defs>
                  <radialGradient id="thumpEggGrad" cx="40%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#fffbeb" />
                    <stop offset="40%" stopColor="#fef08a" />
                    <stop offset="85%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#b45309" />
                  </radialGradient>
                </defs>
                <path
                  d="M 50 10 C 74 10, 92 38, 92 65 C 92 90, 75 106, 50 106 C 25 106, 8 90, 8 65 C 8 38, 26 10, 50 10 Z"
                  fill="url(#thumpEggGrad)"
                  stroke="#78350f"
                  strokeWidth="3.5"
                />

                {/* 빛나는 균열 (Cracks with Gold Light) */}
                <path
                  d="M 50 30 L 58 50 L 46 62 L 60 76 L 52 90"
                  stroke="#ffffff"
                  strokeWidth="3.5"
                  fill="none"
                  strokeLinecap="round"
                  className="animate-pulse"
                />
              </svg>
            </div>
          </div>

          <p className="text-xs text-amber-200 font-bold animate-bounce">
            잠시만 숨을 죽여주세요...!
          </p>
        </div>
      )}

      {/* 씬 3: 대폭발 & 부화 완료 단계 */}
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

          {/* 중앙 부화한 달걀 일러스트 쇼케이스 */}
          <div className="relative w-48 h-56 my-4 flex items-center justify-center p-3 bg-white/10 rounded-3xl border border-white/20 shadow-2xl backdrop-blur-md">
            <svg viewBox="0 0 100 116" className="w-40 h-48 drop-shadow-2xl">
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
            </svg>
          </div>

          <h3 className="text-xl font-black text-amber-300">
            {hatchResult.skin.name}
          </h3>
          <p className="text-xs text-white/90 font-bold mt-0.5">
            {hatchResult.skin.tagline}
          </p>

          {/* 중복 시 계란 껍데기 보상 알림 */}
          {hatchResult.isDuplicate ? (
            <div className="mt-3 bg-amber-500/30 border border-amber-300 p-2.5 rounded-2xl flex items-center gap-2 text-xs font-black text-amber-200">
              <span className="text-lg">🥚</span>
              <span>
                이미 보유 중인 계란으로 <strong>계란 껍데기 +{hatchResult.rewardShells}개</strong>를 획득했습니다!
              </span>
            </div>
          ) : (
            <div className="mt-3 bg-emerald-500/30 border border-emerald-300 p-2 rounded-2xl text-xs font-black text-emerald-200">
              ✓ 도감에 등록되고 기본 계란으로 즉시 장착되었습니다!
            </div>
          )}

          {/* 하단 버튼 */}
          <div className="w-full mt-4 flex gap-2">
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
