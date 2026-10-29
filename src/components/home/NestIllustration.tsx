import React, { useState, useEffect, useRef } from 'react';
import { EggSkin } from '../../types/game';
import { Sparkles, Heart } from 'lucide-react';
import { sound } from '../../audio/sound';
import { EggIllustration } from '../common/EggIllustration';

interface NestIllustrationProps {
  skin: EggSkin;
  equippedCostumes?: {
    hat?: string;
    top?: string;
    bottom?: string;
    hand?: string;
  };
  onEggClick?: () => void;
}

type EggMotion = 'IDLE' | 'WIGGLE' | 'HOP' | 'TILT' | 'TOUCH_JUMP';

export const NestIllustration: React.FC<NestIllustrationProps> = ({ skin, equippedCostumes, onEggClick }) => {
  const [motion, setMotion] = useState<EggMotion>('IDLE');
  const [showHeart, setShowHeart] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 랜덤 움직임 루프 (1.8초 ~ 3.2초 주기마다 무작위 액션 실행)
  useEffect(() => {
    const scheduleNextMotion = () => {
      const delay = 1800 + Math.random() * 1600; // 1.8초 ~ 3.4초
      timerRef.current = setTimeout(() => {
        // 유저 터치 점프 중이 아닐 때만 랜덤 동작
        setMotion((prev) => {
          if (prev === 'TOUCH_JUMP') return prev;

          const rand = Math.random();
          if (rand < 0.40) {
            return 'WIGGLE'; // 40% 확률: 좌우 뒤뚱뒤뚱 흔들리기
          } else if (rand < 0.75) {
            return 'HOP';    // 35% 확률: 살짝 통통 점프
          } else {
            return 'TILT';   // 25% 확률: 갸우뚱 고개 까딱
          }
        });

        // 일정 시간 후 다시 부드러운 IDLE 상태로 복귀
        setTimeout(() => {
          setMotion((prev) => (prev === 'TOUCH_JUMP' ? prev : 'IDLE'));
        }, 700);

        scheduleNextMotion();
      }, delay);
    };

    scheduleNextMotion();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // 유저 직접 탭/클릭 시 반응
  const handleEggClick = () => {
    setMotion('TOUCH_JUMP');
    setShowHeart(true);
    sound.playJump();

    setTimeout(() => {
      setMotion('IDLE');
    }, 600);

    setTimeout(() => {
      setShowHeart(false);
    }, 1300);

    if (onEggClick) onEggClick();
  };

  const { colors } = skin;

  // 모션별 CSS 변환 클래스
  const getMotionClass = () => {
    switch (motion) {
      case 'WIGGLE':
        return 'animate-egg-wiggle';
      case 'HOP':
        return 'animate-egg-hop';
      case 'TILT':
        return 'animate-egg-tilt';
      case 'TOUCH_JUMP':
        return '-translate-y-8 scale-105 duration-200';
      default:
        return 'animate-egg-breathe';
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none py-2">
      {/* 둥지 뒤쪽 은은한 햇살 광채 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

      {/* 탭 시 피어오르는 하트 이펙트 */}
      {showHeart && (
        <div className="absolute -top-6 z-40 flex items-center gap-1 bg-white/95 px-3 py-1 rounded-full shadow-lg border border-pink-200 animate-bounce">
          <Heart size={15} className="text-rose-500 fill-rose-500" />
          <span className="text-xs font-black text-rose-600">방긋!</span>
        </div>
      )}

      {/* 
        [3중 입체 샌드위치 구조]
        1) Nest Back (둥지 뒷면 테두리 & 깊은 바닥)
        2) Egg Character (둥지 사이에 쏙 들어간 계란)
        3) Nest Front (둥지 앞면 림 & 나뭇가지들로 계란 하단 덮음)
      */}
      <div
        onClick={handleEggClick}
        className="relative w-80 h-64 flex items-center justify-center cursor-pointer group"
      >
        {/* ======================================================== */}
        {/* LAYER 1: 둥지 뒷면 (Nest Back & Inner Bed) - z-index: 10 */}
        {/* ======================================================== */}
        <div className="absolute bottom-6 w-72 h-44 z-10 pointer-events-none drop-shadow-sm">
          <svg viewBox="0 0 300 180" className="w-full h-full">
            {/* 둥지 안쪽 깊은 바닥 공간 (어두운 브라운) */}
            <ellipse cx="150" cy="85" rx="100" ry="42" fill="#78441f" />
            <ellipse cx="150" cy="88" rx="88" ry="34" fill="#5c3214" />

            {/* 둥지 뒷면 테두리 림 (갈색 아웃라인 & 볏짚) */}
            <path
              d="M 45 85 C 45 45, 110 32, 150 32 C 190 32, 255 45, 255 85"
              fill="none"
              stroke="#432818"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d="M 50 85 C 50 49, 112 36, 150 36 C 188 36, 250 49, 250 85"
              fill="none"
              stroke="#d49a5b"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* 뒷쪽 나뭇결 하이라이트 지푸라기 */}
            <path
              d="M 80 50 Q 150 42 220 54"
              fill="none"
              stroke="#eec28d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* ======================================================== */}
        {/* LAYER 2: 계란 캐릭터 (Egg in Nest) - z-index: 20       */}
        {/* ======================================================== */}
        <div
          className={`absolute z-20 w-32 h-38 flex items-center justify-center transition-transform ${getMotionClass()}`}
          style={{
            bottom: '48px', // 둥지 안쪽 바닥에 쏙 안착하여 하단 30%가 둥지 앞면에 묻힘
            filter: 'drop-shadow(0 10px 12px rgba(0,0,0,0.3))',
          }}
        >
          {/* 
            [피드백 1 반영: 세로 비율을 단축하여 통통하고 귀여운 황금비율 달걀 SVG]
            - 상단: 부드러운 첨단 포물선
            - 60% 지점 (y=65): 최대 폭 지점
            - 하단 (y=106): 풍만하고 둥근 둔단 곡선
          */}
          <EggIllustration
            skin={skin}
            equippedCostumes={equippedCostumes}
            idPrefix="home-nest-"
            className="w-full h-full overflow-visible"
          />
        </div>

        {/* ======================================================== */}
        {/* LAYER 3: 둥지 앞면 (Nest Front & Twigs) - z-index: 30     */}
        {/* ======================================================== */}
        {/* 
          [참고 이미지 1 완벽 반영 둥지 앞면]
          - 계란의 아래쪽 약 30%를 포근하게 감싸는 그릇 형태 앞면 림
          - 두꺼운 짙은 갈색 아웃라인 (#432818)
          - 따뜻하고 밝은 볏짚 황토색 몸체 (#e5b47a)
          - 양옆과 바닥으로 삐죽삐죽 튀어나온 귀여운 나뭇가지 가지들
          - 둥지 결 곡선 텍스처 스트로크
        */}
        <div className="absolute bottom-6 w-72 h-44 z-30 pointer-events-none drop-shadow-xl">
          <svg viewBox="0 0 300 180" className="w-full h-full overflow-visible">
            {/* 둥지 밑바닥 깊은 그림자 */}
            <ellipse cx="150" cy="158" rx="105" ry="16" fill="#30190a" opacity="0.35" />

            {/* 둥지 앞면 그릇 본체 (외곽선 포함) */}
            <path
              d="
                M 35 88
                C 38 128, 70 162, 150 162
                C 230 162, 262 128, 265 88
                C 260 98, 230 108, 150 108
                C 70 108, 40 98, 35 88
                Z
              "
              fill="#e7b87c"
              stroke="#432818"
              strokeWidth="8"
              strokeLinejoin="round"
            />

            {/* 둥지 앞면 입구 림 상단 자연스러운 곡면 굴곡 */}
            <path
              d="M 35 88 C 70 104, 110 108, 150 108 C 190 108, 230 104, 265 88"
              fill="none"
              stroke="#432818"
              strokeWidth="8"
              strokeLinecap="round"
            />

            {/* 둥지 표면 볏짚/나뭇가지 텍스처 결 라인들 (이미지 1 스타일) */}
            <g stroke="#9c6332" strokeWidth="3.2" strokeLinecap="round" fill="none">
              <path d="M 52 108 C 85 125, 125 128, 160 126" />
              <path d="M 175 126 C 205 124, 235 116, 250 106" />
              <path d="M 68 128 C 105 142, 150 144, 195 138" />
              <path d="M 120 148 C 145 150, 175 148, 205 142" />
              <path d="M 90 148 C 108 152, 130 152, 148 150" />
            </g>

            {/* 밝은 짚풀 하이라이트 라인 */}
            <g stroke="#fce4ba" strokeWidth="2.2" strokeLinecap="round" fill="none">
              <path d="M 46 98 C 75 110, 115 114, 150 114" />
              <path d="M 165 114 C 200 112, 230 106, 254 96" />
              <path d="M 80 135 C 115 144, 155 145, 185 140" />
            </g>

            {/* 
              [참고 이미지 1 핵심 디테일: 삐죽삐죽 튀어나온 나뭇가지 가지들 (Twigs)]
            */}
            {/* 좌측 튀어나온 가지 1 (상단) */}
            <path
              d="M 40 85 C 25 78, 12 70, 6 68 C 15 78, 28 88, 38 95"
              fill="#e7b87c"
              stroke="#432818"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            {/* 좌측 튀어나온 가지 2 (하단) */}
            <path
              d="M 42 122 C 26 124, 14 125, 8 126 C 18 132, 32 134, 48 132"
              fill="#e7b87c"
              stroke="#432818"
              strokeWidth="5"
              strokeLinejoin="round"
            />

            {/* 우측 튀어나온 가지 1 (상단) */}
            <path
              d="M 260 88 C 272 80, 285 70, 292 65 C 285 78, 274 90, 262 98"
              fill="#e7b87c"
              stroke="#432818"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            {/* 우측 튀어나온 가지 2 (하단) */}
            <path
              d="M 258 120 C 274 124, 288 128, 294 130 C 282 135, 268 134, 252 130"
              fill="#e7b87c"
              stroke="#432818"
              strokeWidth="5"
              strokeLinejoin="round"
            />

            {/* 바닥 쪽 튀어나온 가지 (하단 밑둥) */}
            <path
              d="M 125 160 C 110 166, 95 170, 88 172 C 102 174, 120 170, 136 164"
              fill="#e7b87c"
              stroke="#432818"
              strokeWidth="5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* 둥지 아래 캐릭터 정보 배지 */}
      <div className="flex flex-col items-center -mt-2 text-center z-30">
        <div className="flex items-center gap-1.5 bg-amber-500/20 backdrop-blur-sm px-3.5 py-1 rounded-full border border-amber-300/50">
          <Sparkles size={14} className="text-amber-500 animate-spin" />
          <span className="font-black text-amber-950 text-sm tracking-tight">
            {skin.name}
          </span>
          {skin.hpBonus > 0 && (
            <span className="bg-emerald-500 text-white font-extrabold text-[10px] px-1.5 py-0.2 rounded-full">
              HP +{skin.hpBonus}
            </span>
          )}
        </div>
        <p className="text-xs text-amber-950/80 font-bold mt-1 max-w-[240px]">
          {skin.tagline}
        </p>
      </div>

      {/* 커스텀 키프레임 스타일 (Wiggle, Hop, Tilt, Breathe) */}
      <style>{`
        @keyframes eggBreathe {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-3px) scale(1.02);
          }
        }
        .animate-egg-breathe {
          animation: eggBreathe 2.4s ease-in-out infinite;
        }

        @keyframes eggWiggle {
          0% { transform: rotate(0deg); }
          20% { transform: rotate(-7deg) translateX(-2px); }
          40% { transform: rotate(7deg) translateX(2px); }
          60% { transform: rotate(-4deg) translateX(-1px); }
          80% { transform: rotate(3deg) translateX(1px); }
          100% { transform: rotate(0deg) translateX(0); }
        }
        .animate-egg-wiggle {
          animation: eggWiggle 0.65s ease-in-out;
        }

        @keyframes eggHop {
          0% { transform: translateY(0) scale(1, 1); }
          30% { transform: translateY(-16px) scale(0.96, 1.05); }
          55% { transform: translateY(0) scale(1.06, 0.94); }
          75% { transform: translateY(-4px) scale(0.98, 1.02); }
          100% { transform: translateY(0) scale(1, 1); }
        }
        .animate-egg-hop {
          animation: eggHop 0.55s ease-in-out;
        }

        @keyframes eggTilt {
          0% { transform: rotate(0deg); }
          30% { transform: rotate(8deg) translateY(-2px); }
          70% { transform: rotate(8deg) translateY(-2px); }
          100% { transform: rotate(0deg) translateY(0); }
        }
        .animate-egg-tilt {
          animation: eggTilt 0.8s ease-in-out;
        }
      `}</style>
    </div>
  );
};
