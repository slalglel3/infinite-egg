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
      {/* 상단: 타이틀 로고 & 계란 일러스트 */}
      <div className="flex flex-col items-center mt-6 text-center">
        {/* 달걀 캐릭터 애니메이션 */}
        <div className="relative w-28 h-32 mb-4 animate-bounce">
          <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-2xl">
            <defs>
              <radialGradient id="titleEggGrad" cx="40%" cy="35%" r="65%">
                <stop offset="0%" stop-color="#ffffff" />
                <stop offset="40%" stop-color="#fffbeb" />
                <stop offset="85%" stop-color="#fef08a" />
                <stop offset="100%" stop-color="#f59e0b" />
              </radialGradient>
            </defs>
            <path
              d="M 50 8 C 32 8 18 36 17 65 C 16 92 29 114 50 114 C 71 114 84 92 83 65 C 82 36 68 8 50 8 Z"
              fill="url(#titleEggGrad)"
              stroke="#b45309"
              strokeWidth="3.5"
            />
            {/* 눈망울 */}
            <circle cx="36" cy="65" r="4" fill="#78350f" />
            <circle cx="64" cy="65" r="4" fill="#78350f" />
            <circle cx="37.5" cy="63.5" r="1.5" fill="#ffffff" />
            <circle cx="65.5" cy="63.5" r="1.5" fill="#ffffff" />
            {/* 볼터치 */}
            <ellipse cx="28" cy="72" rx="4" ry="2.5" fill="#fca5a5" opacity="0.8" />
            <ellipse cx="72" cy="72" rx="4" ry="2.5" fill="#fca5a5" opacity="0.8" />
            {/* 방긋 웃는 입 */}
            <path d="M 44 73 Q 50 78 56 73" stroke="#78350f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* 광택 */}
            <ellipse cx="36" cy="35" rx="8" ry="16" fill="#ffffff" opacity="0.7" transform="rotate(-25 36 35)" />
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
          {/* 최고 기록 */}
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

          {/* 유저 레벨 & 경험치 프로그레스 */}
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

        {/* 조작 설명 모달 토글 버튼 */}
        <button
          onClick={() => setShowHowTo(!showHowTo)}
          className="flex items-center justify-center gap-1.5 text-sky-100 font-bold text-xs py-1"
        >
          <HelpCircle size={15} />
          <span>게임 방법 & 규칙 보기</span>
        </button>

        {/* 조작법 안내 팝업 카드 */}
        {showHowTo && (
          <div className="bg-sky-950/90 text-white rounded-2xl p-4 text-xs flex flex-col gap-2 border border-white/20 shadow-xl animate-in fade-in">
            <p className="font-bold text-amber-300 text-sm">🎮 플레이 방법</p>
            <div className="flex flex-col gap-1.5 text-sky-100 leading-relaxed">
              <p>• 🥚 <b>자동 굴림:</b> 중력에 의해 계란은 스스로 굴러 내려갑니다.</p>
              <p>• 🚀 <b>[점프]:</b> 길이 끊어진 곳에서 뛰어넘으세요! 끝자락에서 뛰어야 충격이 없습니다.</p>
              <p>• 🔄 <b>[방향 전환]:</b> 코너 끝에서 누르세요! 너무 일찍 누르면 높은 곳에서 쿵 떨어져 금이 갑니다.</p>
              <p>• 🩹 <b>반창고:</b> 길에 있는 반창고를 먹으면 깨진 껍질이 치유됩니다.</p>
            </div>
          </div>
        )}
      </div>

      {/* 하단: 게임 시작 버튼 */}
      <div className="w-full max-w-sm mb-4">
        <button
          onClick={onStart}
          className="w-full h-16 rounded-3xl bg-gradient-to-b from-amber-400 to-amber-500 border-4 border-white shadow-[0_10px_25px_rgba(245,158,11,0.5)] active:translate-y-1 active:shadow-md transition-all flex items-center justify-center gap-3 text-white font-black text-2xl tracking-wide select-none"
        >
          <Play size={26} className="fill-white" />
          <span>게임 시작!</span>
        </button>
      </div>
    </div>
  );
};
