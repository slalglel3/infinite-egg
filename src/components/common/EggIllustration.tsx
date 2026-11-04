import React from 'react';
import { EggSkin } from '../../types/game';
import { CostumeSvgLayers } from '../home/CostumeSvgLayers';

export interface EggIllustrationProps {
  skin: EggSkin;
  equippedCostumes?: {
    hat?: string;
    top?: string;
    bottom?: string;
    hand?: string;
  };
  expression?: 'NORMAL' | 'SURPRISED' | 'PAIN' | 'DIZZY' | 'HURT';
  className?: string;
  idPrefix?: string;
  /** Whether to show wings in unfolded/spread state (e.g. when jumping) */
  wingsSpread?: boolean;
  /** Evolution stage for Devil Egg (0: base, 1: horns, 2: wings) - defaults to 2 for preview/home */
  devilStage?: number;
}

export const EggIllustration: React.FC<EggIllustrationProps> = ({
  skin,
  equippedCostumes,
  expression = 'NORMAL',
  className = 'w-full h-full overflow-visible',
  idPrefix = 'egg-',
  wingsSpread = false,
  devilStage = 2,
}) => {
  const { colors } = skin;
  const gradId = `${idPrefix}grad-${skin.id}`;
  const sideShadowId = `${idPrefix}sideshadow-${skin.id}`;
  const highlightId = `${idPrefix}highlight-${skin.id}`;

  // 고유 의상 고정 계란이면 번들 의상 세트 사용, 아니면 전달받은 유저 커스텀 의상
  const effectiveCostumes = skin.hasFixedOutfit && skin.bundledCostumes
    ? skin.bundledCostumes
    : equippedCostumes;

  return (
    <svg viewBox="0 0 100 116" className={className}>
      <defs>
        {/* 1. 스킨별 기본 방사형 그라데이션 */}
        <radialGradient id={gradId} cx="42%" cy="36%" r="65%">
          <stop offset="0%" stopColor={colors.top} />
          <stop offset="22%" stopColor={colors.mid1} />
          <stop offset="65%" stopColor={colors.mid2} />
          <stop offset="92%" stopColor={colors.bottom} />
          <stop offset="100%" stopColor={colors.shadow} />
        </radialGradient>

        {/* 2. 3D 입체 볼륨감 우측 곡면 섀도우 */}
        <linearGradient id={sideShadowId} x1="0%" y1="0%" x2="100%" y2="50%">
          <stop offset="0%" stopColor={colors.shadow} stopOpacity="0" />
          <stop offset="60%" stopColor={colors.shadow} stopOpacity="0.15" />
          <stop offset="100%" stopColor={colors.shadow} stopOpacity="0.45" />
        </linearGradient>

        {/* 3. 좌측 상단 초승달 하이라이트 광택 */}
        <linearGradient id={highlightId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#fff8eb" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#fef3c7" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* [레이어 1] 실제 달걀 외곽선 베지어 패스 (황금비율 실물 달걀 곡선) */}
      <path
        d="M 50 10 C 74 10, 92 38, 92 65 C 92 90, 75 106, 50 106 C 25 106, 8 90, 8 65 C 8 38, 26 10, 50 10 Z"
        fill={`url(#${gradId})`}
        stroke={colors.line}
        strokeWidth="3.2"
        strokeLinejoin="round"
      />

      {/* [레이어 2] 우측 곡면 3D 섀도우 */}
      <path
        d="M 50 10 C 74 10, 92 38, 92 65 C 92 90, 75 106, 50 106 C 68 106, 82 86, 82 65 C 82 40, 68 16, 50 10 Z"
        fill={`url(#${sideShadowId})`}
      />

      {/* [레이어 3] 좌측 상단 초승달 하이라이트 */}
      <path
        d="M 42 16 C 30 22, 17 40, 17 56 C 17 62, 20 66, 24 60 C 27 46, 36 28, 46 20 C 47 18, 45 16, 42 16 Z"
        fill={`url(#${highlightId})`}
      />

      {/* [레이어 4] 스킨별 고유 패턴 & 파츠 오버레이 */}
      {/* 4.1 점박이 메추리알 */}
      {colors.pattern === 'SPOTS' && (
        <g fill={colors.line} opacity="0.38">
          <ellipse cx="32" cy="46" rx="3.5" ry="4" transform="rotate(-15 32 46)" />
          <ellipse cx="46" cy="34" rx="2.5" ry="2.8" transform="rotate(20 46 34)" />
          <ellipse cx="68" cy="48" rx="4" ry="4.5" transform="rotate(10 68 48)" />
          <ellipse cx="76" cy="70" rx="3.2" ry="3.5" transform="rotate(-25 76 70)" />
          <ellipse cx="30" cy="84" rx="3" ry="3" />
          <ellipse cx="58" cy="88" rx="2.8" ry="2.8" />
          <ellipse cx="48" cy="58" rx="2" ry="2" />
        </g>
      )}

      {/* 4.2 아기 공룡알 (균열선) */}
      {colors.pattern === 'CRACKS' && (
        <path
          d="M 50 20 L 57 38 L 47 50 L 60 62 L 52 78 L 62 92"
          stroke="#15803d"
          strokeWidth="2.8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.65"
        />
      )}

      {/* 4.3 사이버 에그 2099 (회로 라인) */}
      {colors.pattern === 'CYBER_LINES' && (
        <g stroke="#38bdf8" strokeWidth="2.0" fill="none" opacity="0.85">
          <path d="M 26 50 L 42 50 L 52 38 L 78 38" />
          <path d="M 30 74 L 46 74 L 56 86 L 72 86" />
          <circle cx="42" cy="50" r="2.2" fill="#38bdf8" />
          <circle cx="56" cy="86" r="2.2" fill="#38bdf8" />
        </g>
      )}

      {/* 4.4 불사조 화염란 (화염 구) */}
      {colors.pattern === 'FIRE_AURA' && (
        <g fill="#f97316" opacity="0.4">
          <circle cx="50" cy="18" r="5" />
          <circle cx="22" cy="52" r="6" />
          <circle cx="78" cy="52" r="6" />
          <circle cx="34" cy="88" r="5" />
          <circle cx="66" cy="88" r="5" />
        </g>
      )}

      {/* 4.5 황금알 광채 */}
      {colors.pattern === 'GOLD_SHINE' && (
        <g fill="#fef08a" opacity="0.65">
          <polygon points="50,22 52,28 58,30 52,32 50,38 48,32 42,30 48,28" />
          <polygon points="74,48 75.5,52 80,53 75.5,54 74,58 72.5,54 68,53 72.5,52" />
        </g>
      )}

      {/* 4.6 [사이버 메탈란] 둘레 8개 정밀 메탈릭 볼트 나사 (십자 홈 포함) */}
      {colors.pattern === 'METAL_BOLTS' && (
        <g fill="#94a3b8" stroke="#334155" strokeWidth="1.2">
          {[
            { cx: 32, cy: 22 },
            { cx: 68, cy: 22 },
            { cx: 16, cy: 46 },
            { cx: 84, cy: 46 },
            { cx: 15, cy: 74 },
            { cx: 85, cy: 74 },
            { cx: 30, cy: 98 },
            { cx: 70, cy: 98 },
          ].map((b, i) => (
            <g key={i}>
              <circle cx={b.cx} cy={b.cy} r="3.8" />
              <line x1={b.cx - 2.2} y1={b.cy} x2={b.cx + 2.2} y2={b.cy} stroke="#1e293b" strokeWidth="1" />
              <line x1={b.cx} y1={b.cy - 2.2} x2={b.cx} y2={b.cy + 2.2} stroke="#1e293b" strokeWidth="1" />
            </g>
          ))}
        </g>
      )}

      {/* 4.7 [치명적인 맹독란] 4개의 보글보글 독성 기포 방울 */}
      {colors.pattern === 'POISON_BUBBLES' && (
        <g>
          {[
            { cx: 32, cy: 36, r: 5.5 },
            { cx: 72, cy: 48, r: 6.5 },
            { cx: 28, cy: 76, r: 5.8 },
            { cx: 64, cy: 88, r: 4.8 },
          ].map((b, i) => (
            <g key={i}>
              <circle cx={b.cx} cy={b.cy} r={b.r} fill="#22c55e" opacity="0.8" stroke="#bbf7d0" strokeWidth="1.2" />
              <circle cx={b.cx - b.r * 0.3} cy={b.cy - b.r * 0.3} r={b.r * 0.28} fill="#ffffff" />
            </g>
          ))}
        </g>
      )}

      {/* 4.8 [순백의 천사란] 머리 위 황금 헤일로 & 3단 입체 깃털 날개 */}
      {colors.pattern === 'ANGEL_WINGS' && (
        <g id="angel-features">
          {/* 황금 헤일로 (찬란한 광채 림) */}
          <ellipse cx="50" cy="-2" rx="22" ry="6" fill="none" stroke="#facc15" strokeWidth="3.5" />
          <ellipse cx="50" cy="-2" rx="22" ry="6" fill="none" stroke="#fef08a" strokeWidth="1.8" opacity="0.9" />

          {/* 천사 날개 (3단 깃털 레이어와 황금빛 림 디테일) */}
          {wingsSpread ? (
            <g fill="#ffffff" stroke="#f59e0b" strokeWidth="1.8" strokeLinejoin="round">
              {/* 활짝 펼쳐진 좌측 3단 깃털 날개 */}
              <path d="M 18 50 C 6 36, -8 24, -20 32 C -24 38, -16 48, -4 54 C -16 58, -18 68, -6 74 C 4 72, 12 68, 18 64 Z" />
              <path d="M 2 46 C -8 40, -14 36, -18 34" stroke="#cbd5e1" strokeWidth="1.2" fill="none" />
              <path d="M 4 58 C -4 56, -10 56, -14 56" stroke="#cbd5e1" strokeWidth="1.2" fill="none" />

              {/* 활짝 펼쳐진 우측 3단 깃털 날개 */}
              <path d="M 82 50 C 94 36, 108 24, 120 32 C 124 38, 116 48, 104 54 C 116 58, 118 68, 106 74 C 96 72, 88 68, 82 64 Z" />
              <path d="M 98 46 C 108 40, 114 36, 118 34" stroke="#cbd5e1" strokeWidth="1.2" fill="none" />
              <path d="M 96 58 C 104 56, 110 56, 114 56" stroke="#cbd5e1" strokeWidth="1.2" fill="none" />
            </g>
          ) : (
            <g fill="#ffffff" stroke="#f59e0b" strokeWidth="1.8" strokeLinejoin="round">
              {/* 포근하게 계란을 감싼 좌측 볼륨 깃털 날개 */}
              <path d="M 16 42 C 4 50, 2 68, 10 78 C 18 86, 28 88, 34 84 C 36 74, 30 62, 22 54 C 20 46, 18 42, 16 42 Z" />
              {/* 깃털 겹침 음영 결 */}
              <path d="M 10 60 Q 20 66 28 68" stroke="#cbd5e1" strokeWidth="1.3" fill="none" />
              <path d="M 12 70 Q 20 76 28 78" stroke="#cbd5e1" strokeWidth="1.3" fill="none" />

              {/* 포근하게 계란을 감싼 우측 볼륨 깃털 날개 */}
              <path d="M 84 42 C 96 50, 98 68, 90 78 C 82 86, 72 88, 66 84 C 64 74, 70 62, 78 54 C 80 46, 82 42, 84 42 Z" />
              {/* 깃털 겹침 음영 결 */}
              <path d="M 90 60 Q 80 66 72 68" stroke="#cbd5e1" strokeWidth="1.3" fill="none" />
              <path d="M 88 70 Q 80 76 72 78" stroke="#cbd5e1" strokeWidth="1.3" fill="none" />
            </g>
          )}
        </g>
      )}

      {/* 4.9 [심연의 악마란] 악마 뿔 & 3단 박쥐/드래곤 날개 */}
      {colors.pattern === 'DEVIL' && (
        <g id="devil-features">
          {/* 악마 뿔 (stage >= 1) */}
          {devilStage >= 1 && (
            <g>
              <path d="M 32 20 Q 14 4 16 -8 Q 28 4 38 20 Z" fill="#dc2626" stroke="#450a0a" strokeWidth="2" />
              <path d="M 68 20 Q 86 4 84 -8 Q 72 4 62 20 Z" fill="#dc2626" stroke="#450a0a" strokeWidth="2" />
            </g>
          )}

          {/* 박쥐/드래곤 날개 (stage >= 2) - 날카로운 골격과 붉은 피막 */}
          {devilStage >= 2 && (
            wingsSpread ? (
              <g fill="#450a0a" stroke="#dc2626" strokeWidth="2" strokeLinejoin="round">
                {/* 펼쳐진 좌측 박쥐 날개 */}
                <path d="M 18 50 L 4 30 L -8 18 L -6 28 L -20 38 C -14 48, -4 50, -2 56 C -14 62, -12 74, 4 74 C 12 72, 16 68, 20 60 Z" />
                <line x1="-8" y1="18" x2="-2" y2="56" stroke="#ef4444" strokeWidth="1.4" />
                <line x1="-8" y1="18" x2="4" y2="74" stroke="#ef4444" strokeWidth="1.4" />
                {/* 뼈대 발톱 하이라이트 */}
                <circle cx="-8" cy="18" r="2.2" fill="#fca5a5" />

                {/* 펼쳐진 우측 박쥐 날개 */}
                <path d="M 82 50 L 96 30 L 108 18 L 106 28 L 120 38 C 114 48, 104 50, 102 56 C 114 62, 112 74, 96 74 C 88 72, 84 68, 80 60 Z" />
                <line x1="108" y1="18" x2="102" y2="56" stroke="#ef4444" strokeWidth="1.4" />
                <line x1="108" y1="18" x2="96" y2="74" stroke="#ef4444" strokeWidth="1.4" />
                {/* 뼈대 발톱 하이라이트 */}
                <circle cx="108" cy="18" r="2.2" fill="#fca5a5" />
              </g>
            ) : (
              <g fill="#450a0a" stroke="#dc2626" strokeWidth="1.8" strokeLinejoin="round">
                {/* 접힌 좌측 박쥐 날개 */}
                <path d="M 16 46 L 4 36 L 6 48 L -4 60 C 6 62, 12 60, 16 54 L 8 68 C 18 70, 26 66, 30 62 Z" />
                <line x1="4" y1="36" x2="-4" y2="60" stroke="#ef4444" strokeWidth="1.2" />
                <circle cx="4" cy="36" r="1.8" fill="#fca5a5" />

                {/* 접힌 우측 박쥐 날개 */}
                <path d="M 84 46 L 96 36 L 94 48 L 104 60 C 94 62, 88 60, 84 54 L 92 68 C 82 70, 74 66, 70 62 Z" />
                <line x1="96" y1="36" x2="104" y2="60" stroke="#ef4444" strokeWidth="1.2" />
                <circle cx="96" cy="36" r="1.8" fill="#fca5a5" />
              </g>
            )
          )}
        </g>
      )}

      {/* [레이어 5] 표정 (Expression) */}
      {expression === 'HURT' ? (
        <g>
          {/* 절규/아파하는 X_X 눈 */}
          <line x1="33" y1="58" x2="43" y2="66" stroke={colors.eyeColor} strokeWidth="3" strokeLinecap="round" />
          <line x1="43" y1="58" x2="33" y2="66" stroke={colors.eyeColor} strokeWidth="3" strokeLinecap="round" />
          <line x1="59" y1="58" x2="69" y2="66" stroke={colors.eyeColor} strokeWidth="3" strokeLinecap="round" />
          <line x1="69" y1="58" x2="59" y2="66" stroke={colors.eyeColor} strokeWidth="3" strokeLinecap="round" />

          {/* 푸른 눈물방울 */}
          <path d="M 28 66 C 25 72, 31 77, 34 74 C 36 71, 31 66, 28 66 Z" fill="#60a5fa" />
          <path d="M 74 66 C 77 72, 71 77, 68 74 C 66 71, 71 66, 74 66 Z" fill="#60a5fa" />

          {/* 볼터치 */}
          <ellipse cx="27" cy="72" rx="4.5" ry="3" fill={colors.cheekColor} opacity="0.8" />
          <ellipse cx="75" cy="72" rx="4.5" ry="3" fill={colors.cheekColor} opacity="0.8" />

          {/* 지그재그로 떨리는 아픈 입 (﹏) */}
          <path
            d="M 42 75 Q 46 71 50 75 Q 54 79 58 75"
            stroke={colors.eyeColor}
            strokeWidth="2.8"
            fill="none"
            strokeLinecap="round"
          />

          {/* 이마 땀방울 */}
          <path d="M 68 38 C 65 43, 70 47, 72 45 C 74 43, 70 38, 68 38 Z" fill="#93c5fd" />

          {/* 몸에 붙은 귀여운 반창고 3종 */}
          <g transform="translate(20, 32) rotate(-15)">
            <rect x="-8" y="-3" width="16" height="6" rx="2" fill="#fed7aa" stroke="#ea580c" strokeWidth="1" />
            <rect x="-3" y="-8" width="6" height="16" rx="2" fill="#fed7aa" stroke="#ea580c" strokeWidth="1" />
            <circle cx="0" cy="0" r="1.5" fill="#f97316" />
          </g>
          <g transform="translate(76, 52) rotate(25)">
            <rect x="-9" y="-3.5" width="18" height="7" rx="2.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <rect x="-3" y="-3" width="6" height="6" fill="#fecdd3" />
          </g>
          <g transform="translate(50, 92) rotate(8)">
            <rect x="-10" y="-3.5" width="20" height="7" rx="2" fill="#fed7aa" stroke="#ea580c" strokeWidth="1" />
            <rect x="-3" y="-3" width="6" height="6" fill="#fdba74" />
          </g>
        </g>
      ) : skin.specialType === 'METAL' ? (
        <g>
          {/* 사이버 메탈란: 왼쪽 렌즈눈 & 오른쪽 네온 그린 LED 사이버 눈 (볼터치 없음) */}
          <circle cx="38" cy="62" r="3.2" fill="#334155" />
          <circle cx="64" cy="62" r="8" fill="rgba(74, 222, 128, 0.35)" />
          <circle cx="64" cy="62" r="5" fill="#22c55e" stroke="#15803d" strokeWidth="1.8" />
          <circle cx="62.5" cy="60.5" r="1.6" fill="#ffffff" />
          <line x1="44" y1="72" x2="56" y2="72" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      ) : skin.specialType === 'DEVIL' ? (
        <g>
          {/* 심연의 악마란: 붉은 눈 & 악마 이빨 미소 */}
          <circle cx="38" cy="62" r="4.2" fill="#ef4444" />
          <circle cx="64" cy="62" r="4.2" fill="#ef4444" />
          <circle cx="36.5" cy="60.5" r="1.6" fill="#fca5a5" />
          <circle cx="62.5" cy="60.5" r="1.6" fill="#fca5a5" />
          <ellipse cx="29" cy="70" rx="4.5" ry="2.5" fill="#7f1d1d" opacity="0.6" />
          <ellipse cx="73" cy="70" rx="4.5" ry="2.5" fill="#7f1d1d" opacity="0.6" />
          <path d="M 44 68 Q 51 77 58 68 Z" fill="#020617" />
          <polygon points="45,68 47,72 49,68" fill="#ffffff" />
          <polygon points="53,68 55,72 57,68" fill="#ffffff" />
        </g>
      ) : (
        <g>
          {/* 기본/일반 달걀: 귀여운 눈망울 & 하이라이트 & 핑크 볼터치 & 방긋 미소 */}
          <circle cx="38" cy="62" r="4.2" fill={colors.eyeColor} />
          <circle cx="64" cy="62" r="4.2" fill={colors.eyeColor} />
          <circle cx="36.5" cy="60.5" r="1.6" fill="#ffffff" />
          <circle cx="62.5" cy="60.5" r="1.6" fill="#ffffff" />
          <ellipse cx="29" cy="70" rx="4.8" ry="3" fill={colors.cheekColor} opacity="0.85" />
          <ellipse cx="73" cy="70" rx="4.8" ry="3" fill={colors.cheekColor} opacity="0.85" />
          <path
            d="M 44 70 Q 51 76 58 70"
            stroke={colors.eyeColor}
            strokeWidth="2.8"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* [레이어 6] 의상 코스튬 레이어 (4부위) */}
      {effectiveCostumes && (
        <CostumeSvgLayers
          hatId={effectiveCostumes.hat}
          topId={effectiveCostumes.top}
          bottomId={effectiveCostumes.bottom}
          handId={effectiveCostumes.hand}
        />
      )}
    </svg>
  );
};
