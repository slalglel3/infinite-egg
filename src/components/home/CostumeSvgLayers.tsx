import React from 'react';

interface CostumeProps {
  hatId?: string;
  topId?: string;
  bottomId?: string;
  handId?: string;
}

export const CostumeSvgLayers: React.FC<CostumeProps> = ({ hatId, topId, bottomId, handId }) => {
  return (
    <g className="egg-costumes pointer-events-none select-none">
      {/* 1. 하의 (Bottom) 레이어 - 계란 하단 (y: 80 ~ 106 부근) */}
      {bottomId === 'police_bottom' && (
        <g id="costume-police-bottom">
          {/* 가죽 벨트 */}
          <path
            d="M 16 80 Q 50 85 84 80 L 86 89 Q 50 94 14 89 Z"
            fill="#1e293b"
            stroke="#0f172a"
            strokeWidth="1.5"
          />
          {/* 황금 버클 */}
          <rect x="44" y="80" width="12" height="10" rx="2" fill="#fbbf24" stroke="#d97706" strokeWidth="1.2" />
          <rect x="47" y="83" width="6" height="4" rx="1" fill="#1e293b" />
          {/* 우측 수갑 파우치 */}
          <rect x="68" y="82" width="10" height="9" rx="2" fill="#334155" stroke="#0f172a" strokeWidth="1" />
        </g>
      )}

      {bottomId === 'cowboy_bottom' && (
        <g id="costume-cowboy-bottom">
          {/* 데님 청바지 하단 랩 */}
          <path
            d="M 12 78 Q 50 84 88 78 C 88 98 75 106 50 106 C 25 106 12 98 12 78 Z"
            fill="#1d4ed8"
            stroke="#1e3a8a"
            strokeWidth="1.5"
          />
          {/* 가죽 벨트 & 큰 황금 버클 */}
          <path d="M 14 78 Q 50 83 86 78 L 86 84 Q 50 89 14 84 Z" fill="#78350f" />
          <circle cx="50" cy="82" r="5" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
          {/* 주머니 스티치 */}
          <path d="M 22 86 Q 30 96 36 86" fill="none" stroke="#fbbf24" strokeWidth="1" strokeDasharray="1.5 1.5" />
          <path d="M 78 86 Q 70 96 64 86" fill="none" stroke="#fbbf24" strokeWidth="1" strokeDasharray="1.5 1.5" />
        </g>
      )}

      {bottomId === 'mermaid_bottom' && (
        <g id="costume-mermaid-bottom">
          {/* 에메랄드 인어 꼬리 비늘 & 지느러미 */}
          <path
            d="M 12 76 Q 50 84 88 76 C 84 98 70 106 50 106 C 30 106 16 98 12 76 Z"
            fill="url(#mermaidTailGrad)"
            stroke="#059669"
            strokeWidth="1.5"
          />
          {/* 하단 나풀거리는 지느러미 날개 */}
          <path
            d="M 50 104 C 36 108 24 116 28 122 C 38 120 46 112 50 106 C 54 112 62 120 72 122 C 76 116 64 108 50 104 Z"
            fill="#34d399"
            stroke="#059669"
            strokeWidth="1.5"
          />
          {/* 비늘 반짝임 결 */}
          <circle cx="38" cy="88" r="3" fill="#a7f3d0" opacity="0.8" />
          <circle cx="50" cy="94" r="3.5" fill="#a7f3d0" opacity="0.8" />
          <circle cx="62" cy="88" r="3" fill="#a7f3d0" opacity="0.8" />
        </g>
      )}

      {bottomId === 'king_bottom' && (
        <g id="costume-king-bottom">
          {/* 로열 황금 벨트 */}
          <path d="M 14 80 Q 50 86 86 80 L 87 88 Q 50 94 13 88 Z" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
          <circle cx="50" cy="84" r="5.5" fill="#ef4444" stroke="#fbbf24" strokeWidth="1.5" />
        </g>
      )}

      {/* 2. 상의 (Top) 레이어 - 계란 중단 (y: 54 ~ 78 부근) */}
      {topId === 'police_top' && (
        <g id="costume-police-top">
          {/* 경찰 셔츠 칼라 & 넥타이 */}
          <path d="M 38 60 L 50 67 L 62 60 L 50 56 Z" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
          {/* 검정 넥타이 */}
          <path d="M 48 64 L 52 64 L 54 78 L 50 82 L 46 78 Z" fill="#0f172a" />
          {/* 황금 경찰 배지 (좌측 가슴) */}
          <polygon points="32,66 36,63 40,66 38,71 34,71" fill="#fbbf24" stroke="#b45309" strokeWidth="0.8" />
        </g>
      )}

      {topId === 'cowboy_top' && (
        <g id="costume-cowboy-top">
          {/* 빨간 반다나 스카프 */}
          <polygon points="40,58 60,58 50,72" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
          <path d="M 36 58 Q 50 64 64 58" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
          {/* 브라운 스웨이드 조끼 앞섶 */}
          <path d="M 18 64 L 32 64 L 30 78 L 16 78 Z" fill="#92400e" opacity="0.9" />
          <path d="M 82 64 L 68 64 L 70 78 L 84 78 Z" fill="#92400e" opacity="0.9" />
        </g>
      )}

      {topId === 'mermaid_top' && (
        <g id="costume-mermaid-top">
          {/* 영롱한 보랏빛 조개 탑 (좌/우) */}
          <ellipse cx="34" cy="68" rx="8" ry="6.5" fill="#c084fc" stroke="#7e22ce" strokeWidth="1.2" />
          <path d="M 28 66 L 40 70 M 30 64 L 38 72 M 34 62 L 34 74" stroke="#f3e8ff" strokeWidth="1" />
          <ellipse cx="66" cy="68" rx="8" ry="6.5" fill="#c084fc" stroke="#7e22ce" strokeWidth="1.2" />
          <path d="M 60 70 L 72 66 M 62 72 L 70 64 M 66 62 L 66 74" stroke="#f3e8ff" strokeWidth="1" />
          {/* 중앙 진주 연결선 */}
          <path d="M 42 68 Q 50 70 58 68" stroke="#fdf4ff" strokeWidth="1.5" fill="none" />
          <circle cx="50" cy="69" r="2.5" fill="#ffffff" stroke="#e9d5ff" strokeWidth="1" />
        </g>
      )}

      {topId === 'king_top' && (
        <g id="costume-king-top">
          {/* 붉은 벨벳 망토 칼라 & 흰 털장식 */}
          <path d="M 24 54 Q 50 64 76 54 L 80 66 Q 50 74 20 66 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
          <path d="M 22 55 Q 50 63 78 55" stroke="#f8fafc" strokeWidth="4" strokeLinecap="round" fill="none" />
          {/* 망토 금장 보석 브로치 */}
          <circle cx="50" cy="65" r="3.5" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
        </g>
      )}

      {/* 3. 모자 (Hat) 레이어 - 계란 상단 머리 (y: 0 ~ 28 부근) */}
      {hatId === 'police_hat' && (
        <g id="costume-police-hat">
          {/* 남색 경찰모 본체 */}
          <path
            d="M 26 22 C 26 8 74 8 74 22 C 78 22 80 25 78 27 C 76 29 24 29 22 27 C 20 25 22 22 26 22 Z"
            fill="#1e3a8a"
            stroke="#0f172a"
            strokeWidth="2"
          />
          {/* 모자 챙 (바이저) */}
          <path d="M 22 26 Q 50 33 78 26 C 74 34 26 34 22 26 Z" fill="#0f172a" />
          {/* 황금 경찰 배지 */}
          <polygon points="50,12 55,16 53,23 47,23 45,16" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
          <circle cx="50" cy="18" r="1.5" fill="#dc2626" />
        </g>
      )}

      {hatId === 'cowboy_hat' && (
        <g id="costume-cowboy-hat">
          {/* 서부 페도라 넓은 챙 */}
          <path
            d="M 6 25 Q 50 16 94 25 C 96 28 88 33 50 31 C 12 33 4 28 6 25 Z"
            fill="#78350f"
            stroke="#451a03"
            strokeWidth="1.8"
          />
          {/* 둥근 가죽 모자 크라운 */}
          <path
            d="M 28 24 C 28 8 38 6 50 9 C 62 6 72 8 72 24 Z"
            fill="#92400e"
            stroke="#451a03"
            strokeWidth="1.8"
          />
          {/* 모자 밴드 */}
          <path d="M 28 22 Q 50 24 72 22 L 72 25 Q 50 27 28 25 Z" fill="#b45309" />
        </g>
      )}

      {hatId === 'mermaid_hat' && (
        <g id="costume-mermaid-hat">
          {/* 진주 바다 티아라 */}
          <path d="M 32 18 Q 50 12 68 18" stroke="#a7f3d0" strokeWidth="2" fill="none" />
          <circle cx="34" cy="17" r="2.5" fill="#ffffff" stroke="#6ee7b7" strokeWidth="1" />
          <circle cx="42" cy="13" r="2.5" fill="#ffffff" stroke="#6ee7b7" strokeWidth="1" />
          <circle cx="50" cy="11" r="3.2" fill="#ffffff" stroke="#6ee7b7" strokeWidth="1" />
          <circle cx="58" cy="13" r="2.5" fill="#ffffff" stroke="#6ee7b7" strokeWidth="1" />
          <circle cx="66" cy="17" r="2.5" fill="#ffffff" stroke="#6ee7b7" strokeWidth="1" />
          {/* 핑크 불가사리 장식 */}
          <polygon points="50,4 52,9 57,9 53,12 55,17 50,14 45,17 47,12 43,9 48,9" fill="#f43f5e" stroke="#be123c" strokeWidth="0.8" />
        </g>
      )}

      {hatId === 'king_hat' && (
        <g id="costume-king-hat">
          {/* 황금 왕관 */}
          <path
            d="M 28 20 L 26 6 L 38 12 L 50 2 L 62 12 L 74 6 L 72 20 Z"
            fill="#fbbf24"
            stroke="#b45309"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* 왕관 밴드 보석들 */}
          <rect x="28" y="16" width="44" height="5" rx="1.5" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
          <circle cx="38" cy="18.5" r="1.5" fill="#ef4444" />
          <circle cx="50" cy="18.5" r="2" fill="#3b82f6" />
          <circle cx="62" cy="18.5" r="1.5" fill="#10b981" />
          {/* 뾰족 꼭지 루비 구슬 */}
          <circle cx="26" cy="6" r="1.8" fill="#ef4444" />
          <circle cx="50" cy="2" r="2.2" fill="#ef4444" />
          <circle cx="74" cy="6" r="1.8" fill="#ef4444" />
        </g>
      )}

      {/* 4. 손 (Hand) 레이어 - 계란 양옆 소지품 (x: 2 ~ 14 또는 86 ~ 98) */}
      {handId === 'police_hand' && (
        <g id="costume-police-hand">
          {/* 우측 든 경찰봉 */}
          <line x1="86" y1="76" x2="100" y2="52" stroke="#0f172a" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="88" y1="72" x2="94" y2="70" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}

      {handId === 'cowboy_hand' && (
        <g id="costume-cowboy-hand">
          {/* 우측 올가미 로프 */}
          <ellipse cx="94" cy="64" rx="8" ry="12" fill="none" stroke="#d97706" strokeWidth="2.5" transform="rotate(20 94 64)" strokeDasharray="3 1.5" />
        </g>
      )}

      {handId === 'mermaid_hand' && (
        <g id="costume-mermaid-hand">
          {/* 우측 마법 삼지창 */}
          <line x1="86" y1="84" x2="94" y2="44" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
          {/* 삼지창 헤드 */}
          <path d="M 88 48 L 94 40 L 100 48 M 94 40 L 94 52" stroke="#f59e0b" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}

      {handId === 'king_hand' && (
        <g id="costume-king-hand">
          {/* 우측 황금 왕홀(셉터) */}
          <line x1="86" y1="84" x2="94" y2="48" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
          <circle cx="95" cy="46" r="5" fill="#ef4444" stroke="#fbbf24" strokeWidth="1.5" />
          <circle cx="95" cy="46" r="2" fill="#ffffff" opacity="0.7" />
        </g>
      )}

      {/* 인어공주 그라데이션 defs */}
      <defs>
        <linearGradient id="mermaidTailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
    </g>
  );
};
