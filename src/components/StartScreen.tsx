import React from 'react';
import { UserProgress } from '../types/game';
import { Play, Trophy, Sparkles, HelpCircle } from 'lucide-react';

interface StartScreenProps {
  progress: UserProgress;
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ progress, onStart }) => {
  const [showHowTo, setShowHowTo] = React.useState(false);

  return (
    <div className="absolute inset-0 bg-sky-900/60 backdrop-blur-md flex flex-col items-center justify-between p-6 z-20 safe-container">
      {/* 상단: 타이틀 로고 & 통통하고 예쁜 계란 일러스트 (인게임과 100% 동일 비례) */}
      <div className="flex flex-col items-center mt-6 text-center">
        {/* 달걀 캐릭터 애니메이션 (가로:세로 황금비율 적용) */}
        <div className="relative w-26 h-30 mb-3 animate-bounce">
          <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-2xl">
            <defs>
              <radialGradient id="titleEggGrad" cx="38%" cy="32%" r="65%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="20%" stopColor="#fffbeb" />
                <stop offset="65%" stopColor="#fef08a" />
                <stop offset="90%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </radialGradient>
            </defs>
            {/* 통통하고 부드러운 실제 달걀 곡선 (위는 살짝 좁고 아래는 풍만하게 둥근 형태) */}
            <path
              d="M 50 14 C 26 14 14 44 14 74 C 14 100 28 114 50 114 C 72 114 86 100 86 74 C 86 44 74 14 50 14 Z"
              fill="url(#titleEggGrad)"
              stroke="#92400e"
              strokeWidth="3.5"
            />
            {/* 눈망울 */}
            <circle cx="37" cy="66" r="4.2" fill="#78350f" />
            <circle cx="63" cy="66" r="4.2" fill="#78350f" />
            <circle cx="35.5" cy="64.5" r="1.6" fill="#ffffff" />
            <circle cx="61.5" cy="64.5" r="1.6" fill="#ffffff" />
            {/* 핑크 볼터치 */}
            <ellipse cx="28" cy="74" rx="4.5" ry="2.8" fill="#fca5a5" opacity="0.85" />
            <ellipse cx="72" cy="74" rx="4.5" ry="2.8" fill="#fca5a5" opacity="0.85" />
            {/* 방긋 웃는 입 */}
            <path d="M 43 74 Q 50 80 57 74" stroke="#78350f" strokeWidth="2.8" fill="none" strokeLinecap="round" />
            {/* 상단 맑은 유광 하이라이트 */}
            <ellipse cx="36" cy="36" rx="9" ry="15" fill="#ffffff" opacity="0.75" transform="rotate(-22 36 36)" />
          </svg>
        </div>

        <h1 className="text-4xl font-black text-amber-300 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] tracking-tight">
          무한의 계란
        </h1>
        <p className="text-sky-100 font-bold text-sm mt-1 drop-shadow">
          Infinite Egg • 데굴데굴 내리막길 질주!
        </p>
      </div>

      {/* 중앙: 유저 레벨 및 최고 기록 카드 */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        <div className="bg-white/95 rounded-3xl p-5 shadow-2xl border-4 border-amber-300 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-amber-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <Trophy size={20} />
              </div>
              <span className="font-bold text-gray-700 text-sm">최고 기록</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-black text-2xl text-amber-600">
                {progress.bestDistanceMeters.toLocaleString()}
              </span>
              <span className="text-gray-500 font-bold text-sm">m</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-bold text-gray-600">
              <span className="flex items-center gap-1 text-amber-600 font-extrabold text-sm">
                <Sparkles size={15} /> Lv.{progress.level}
              </span>
              <span>다음 레벨까지: {progress.nextLevelExp.toLocaleString()} m</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (progress.exp / (progress.exp + progress.nextLevelExp)) * 100)}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-gray-500 text-center mt-0.5">
              ※ 오래 굴러갈수록 레벨이 오르고 계란 내구도가 미세하게 단단해져요!
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowHowTo(!showHowTo)}
          className="flex items-center justify-center gap-1.5 text-sky-100 font-bold text-xs py-1"
        >
          <HelpCircle size={15} />
          <span>게임 방법 & 규칙 보기</span>
        </button>

        {showHowTo && (
          <div className="bg-sky-950/90 text-white rounded-2xl p-4 text-xs flex flex-col gap-2 border border-white/20 shadow-xl animate-in fade-in">
            <p className="font-bold text-amber-300 text-sm">🎮 플레이 방법</p>
            <div className="flex flex-col gap-1.5 text-sky-100 leading-relaxed">
              <p>• 🥚 <b>자동 굴림:</b> 계란이 중력에 의해 슬로프를 데굴데굴 굴러갑니다.</p>
              <p>• 🚀 <b>[점프]:</b> 끊어진 길을 뛰어넘으세요! 65픽셀 공중으로 시원하게 솟구칩니다.</p>
              <p>• 🔄 <b>[방향 전환]:</b> 코너에서 반대 방향으로 꺾어 내려갑니다.</p>
              <p>• 🩹 <b>반창고:</b> 길에 놓인 반창고를 먹으면 껍질 내구도가 치료(+25 HP)됩니다.</p>
            </div>
          </div>
        )}
      </div>

      {/* 하단: 게임 시작 버튼 */}
      <div className="w-full max-w-sm mb-4">
        <button
          onClick={onStart}
          className="w-full h-16 rounded-3xl bg-gradient-to-b from-amber-400 to-amber-500 border-4 border-white shadow-[0_10px_25px_rgba(245,158,11,0.5)] active:translate-y-1 active:shadow-md transition-all flex items-center justify-center gap-3 text-white font-black text-2xl tracking-wide select-none cursor-pointer"
        >
          <Play size={26} className="fill-white" />
          <span>게임 시작!</span>
        </button>
      </div>
    </div>
  );
};
