import React, { useState } from 'react';
import { EggSkin } from '../../types/game';
import { Sparkles, Heart } from 'lucide-react';
import { sound } from '../../audio/sound';

interface NestIllustrationProps {
  skin: EggSkin;
  onEggClick?: () => void;
}

export const NestIllustration: React.FC<NestIllustrationProps> = ({ skin, onEggClick }) => {
  const [bounced, setBounced] = useState(false);
  const [showHeart, setShowHeart] = useState(false);

  const handleClick = () => {
    setBounced(true);
    setShowHeart(true);
    sound.playJump();
    setTimeout(() => setBounced(false), 450);
    setTimeout(() => setShowHeart(false), 1200);
    if (onEggClick) onEggClick();
  };

  const { colors } = skin;

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* 둥지 뒤쪽 햇살 광채 오라 */}
      <div className="absolute -inset-10 bg-amber-400/20 rounded-full blur-2xl animate-pulse pointer-events-none" />

      {/* 탭 시 피어오르는 러블리 하트 애니메이션 */}
      {showHeart && (
        <div className="absolute -top-12 z-30 flex items-center gap-1 bg-white/95 px-3 py-1 rounded-full shadow-lg border border-pink-200 animate-bounce">
          <Heart size={16} className="text-rose-500 fill-rose-500" />
          <span className="text-xs font-black text-rose-600">방긋!</span>
        </div>
      )}

      {/* 둥지 & 달걀 컨테이너 */}
      <div
        onClick={handleClick}
        className="relative w-64 h-64 flex items-center justify-center cursor-pointer group"
      >
        {/* 달걀 본체 (둥지 안에 포근하게 쏙 안착) */}
        <div
          className={`absolute z-10 w-28 h-36 transition-transform duration-300 ${
            bounced ? '-translate-y-8 scale-105' : 'translate-y-2 group-hover:-translate-y-2'
          }`}
          style={{
            filter: 'drop-shadow(0 12px 14px rgba(0,0,0,0.35))',
          }}
        >
          <svg viewBox="0 0 100 120" className="w-full h-full overflow-visible">
            <defs>
              <radialGradient id={`eggGrad-${skin.id}`} cx="38%" cy="32%" r="65%">
                <stop offset="0%" stopColor={colors.top} />
                <stop offset="20%" stopColor={colors.mid1} />
                <stop offset="65%" stopColor={colors.mid2} />
                <stop offset="90%" stopColor={colors.bottom} />
                <stop offset="100%" stopColor={colors.shadow} />
              </radialGradient>
            </defs>

            {/* 통통하고 사랑스러운 황금비율 달걀 곡선 */}
            <path
              d="M 50 14 C 26 14 14 44 14 74 C 14 100 28 114 50 114 C 72 114 86 100 86 74 C 86 44 74 14 50 14 Z"
              fill={`url(#eggGrad-${skin.id})`}
              stroke={colors.line}
              strokeWidth="3.5"
            />

            {/* 특수 스킨 패턴 렌더링 */}
            {colors.pattern === 'SPOTS' && (
              <g fill={colors.line} opacity="0.4">
                <circle cx="30" cy="45" r="3" />
                <circle cx="42" cy="35" r="2.2" />
                <circle cx="68" cy="50" r="3.5" />
                <circle cx="75" cy="70" r="2.8" />
                <circle cx="28" cy="85" r="3" />
                <circle cx="58" cy="90" r="2.5" />
                <circle cx="48" cy="55" r="1.8" />
              </g>
            )}

            {colors.pattern === 'CRACKS' && (
              <path
                d="M 50 20 L 56 38 L 48 48 L 58 60 L 52 75 L 60 88"
                stroke="#15803d"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.6"
              />
            )}

            {colors.pattern === 'CYBER_LINES' && (
              <g stroke="#38bdf8" strokeWidth="1.8" fill="none" opacity="0.8">
                <path d="M 25 50 L 40 50 L 50 40 L 75 40" />
                <path d="M 30 75 L 45 75 L 55 85 L 70 85" />
                <circle cx="40" cy="50" r="2" fill="#38bdf8" />
                <circle cx="55" cy="85" r="2" fill="#38bdf8" />
              </g>
            )}

            {colors.pattern === 'FIRE_AURA' && (
              <g fill="#f97316" opacity="0.45">
                <circle cx="50" cy="18" r="5" />
                <circle cx="24" cy="50" r="6" />
                <circle cx="76" cy="50" r="6" />
                <circle cx="34" cy="92" r="5" />
                <circle cx="66" cy="92" r="5" />
              </g>
            )}

            {/* 반짝반짝 눈망울 */}
            <circle cx="37" cy="66" r="4.2" fill={colors.eyeColor} />
            <circle cx="63" cy="66" r="4.2" fill={colors.eyeColor} />
            <circle cx="35.5" cy="64.5" r="1.6" fill="#ffffff" />
            <circle cx="61.5" cy="64.5" r="1.6" fill="#ffffff" />

            {/* 볼터치 */}
            <ellipse cx="28" cy="74" rx="4.5" ry="2.8" fill={colors.cheekColor} opacity="0.85" />
            <ellipse cx="72" cy="74" rx="4.5" ry="2.8" fill={colors.cheekColor} opacity="0.85" />

            {/* 입 */}
            <path
              d="M 43 74 Q 50 80 57 74"
              stroke={colors.eyeColor}
              strokeWidth="2.8"
              fill="none"
              strokeLinecap="round"
            />

            {/* 상단 맑은 유광 하이라이트 */}
            <ellipse
              cx="36"
              cy="36"
              rx="9"
              ry="15"
              fill="#ffffff"
              opacity="0.75"
              transform="rotate(-22 36 36)"
            />
          </svg>
        </div>

        {/* 짚풀과 나뭇가지로 아늑하게 엮인 감성적인 "계란 둥지" (Nest) */}
        <div className="absolute bottom-4 z-20 w-56 h-28 pointer-events-none drop-shadow-xl">
          <svg viewBox="0 0 200 100" className="w-full h-full">
            {/* 둥지 밑바닥 어두운 그림자 */}
            <ellipse cx="100" cy="78" rx="86" ry="18" fill="#451a03" opacity="0.4" />

            {/* 둥지 바깥쪽 굵은 나뭇가지 베이스 */}
            <ellipse cx="100" cy="65" rx="84" ry="24" fill="#78350f" />
            <ellipse cx="100" cy="62" rx="80" ry="21" fill="#92400e" />

            {/* 둥지 내부 안락한 짚풀 레이어 */}
            <ellipse cx="100" cy="58" rx="72" ry="17" fill="#b45309" />
            <ellipse cx="100" cy="54" rx="64" ry="14" fill="#d97706" />

            {/* 엮인 지푸라기 텍스처 스트로크 */}
            <g stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" opacity="0.9">
              <path d="M 25 58 Q 50 75 90 70" />
              <path d="M 60 70 Q 110 82 160 65" />
              <path d="M 120 72 Q 155 76 182 56" />
              <path d="M 35 50 Q 80 66 130 62" />
              <path d="M 85 64 Q 135 68 175 48" />
              <path d="M 18 52 Q 60 78 115 75" />
            </g>

            {/* 밝은 볏짚 하이라이트 */}
            <g stroke="#fef08a" strokeWidth="1.8" strokeLinecap="round" opacity="0.8">
              <path d="M 40 64 Q 85 76 145 68" />
              <path d="M 75 73 Q 120 78 168 59" />
              <path d="M 30 54 Q 70 70 110 66" />
            </g>

            {/* 둥지에 꽂힌 싱그러운 초록 나뭇잎 장식 */}
            <path
              d="M 160 55 C 172 45 186 52 184 62 C 176 66 166 62 160 55 Z"
              fill="#22c55e"
              stroke="#15803d"
              strokeWidth="1.2"
            />
            <path
              d="M 32 60 C 20 52 16 64 22 70 C 28 72 34 68 32 60 Z"
              fill="#4ade80"
              stroke="#16a34a"
              strokeWidth="1.2"
            />
            {/* 푹신한 하얀 깃털 장식 */}
            <path
              d="M 142 66 C 152 64 158 72 150 76 C 144 76 138 72 142 66 Z"
              fill="#ffffff"
              opacity="0.85"
            />
          </svg>
        </div>
      </div>

      {/* 둥지 아래 캐릭터 이름 및 보너스 뱃지 */}
      <div className="flex flex-col items-center mt-1 text-center">
        <div className="flex items-center gap-1.5 bg-amber-500/20 backdrop-blur-sm px-3.5 py-1 rounded-full border border-amber-300/40">
          <Sparkles size={14} className="text-amber-500 animate-spin" />
          <span className="font-black text-amber-900 text-sm tracking-tight">
            {skin.name}
          </span>
          {skin.hpBonus > 0 && (
            <span className="bg-emerald-500 text-white font-extrabold text-[10px] px-1.5 py-0.2 rounded-full">
              HP +{skin.hpBonus}
            </span>
          )}
        </div>
        <p className="text-xs text-sky-900/80 font-bold mt-1 max-w-[240px]">
          {skin.tagline}
        </p>
      </div>
    </div>
  );
};
