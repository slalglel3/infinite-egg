import React, { useState } from 'react';
import { UserProgress } from '../../types/game';
import { Trophy, Coins, Sparkles, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { sound } from '../../audio/sound';
import { resetAllProgress } from '../../utils/storage';

interface HomeHeaderProps {
  progress: UserProgress;
  isMuted: boolean;
  onToggleMute: () => void;
  onUpdateProgress: (updated: UserProgress) => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  progress,
  isMuted,
  onToggleMute,
  onUpdateProgress,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetData = () => {
    sound.playImpact(8);
    const fresh = resetAllProgress();
    onUpdateProgress(fresh);
    setShowResetConfirm(false);
    alert('모든 게임 진행 상태가 성공적으로 초기화되었습니다!');
  };

  return (
    <header className="w-full flex items-center justify-between p-4 pt-safe z-20">
      {/* 1. 레벨 & 경험치 카드 */}
      <div className="flex items-center gap-2.5 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-md border-2 border-amber-200">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white font-black text-sm shadow-sm">
          {progress.level}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="font-extrabold text-xs text-gray-800">레벨 {progress.level}</span>
            <Sparkles size={11} className="text-amber-500" />
          </div>
          <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all"
              style={{
                width: `${Math.min(100, (progress.exp / (progress.exp + progress.nextLevelExp)) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. 보유 골드 & 최고 기록 & 사운드 & 초기화 버튼 */}
      <div className="flex items-center gap-2">
        {/* 보유 골드 */}
        <div className="flex items-center gap-1.5 bg-amber-500/90 text-white backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-md border border-amber-300">
          <Coins size={16} className="text-yellow-200" />
          <span className="font-black text-xs tracking-wide">
            {progress.gold.toLocaleString()}
          </span>
        </div>

        {/* 최고 기록 */}
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-md border border-amber-200 text-amber-700">
          <Trophy size={14} className="text-amber-600" />
          <span className="font-black text-xs">
            {progress.bestDistanceMeters.toLocaleString()}m
          </span>
        </div>

        {/* 음소거 버튼 */}
        <button
          type="button"
          onClick={onToggleMute}
          className="w-9 h-9 rounded-2xl bg-white/90 backdrop-blur-md border border-amber-200 flex items-center justify-center text-amber-700 shadow-md active:scale-90 transition-transform cursor-pointer"
          title={isMuted ? '음소거 해제' : '음소거'}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        {/* [피드백 10 반영] 게임 상태 초기화 버튼 */}
        <button
          type="button"
          onClick={() => setShowResetConfirm(true)}
          className="w-9 h-9 rounded-2xl bg-rose-50 border border-rose-300 flex items-center justify-center text-rose-600 shadow-md active:scale-90 transition-transform cursor-pointer"
          title="게임 데이터 리셋"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      {/* 데이터 리셋 확인 모달 */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-2xl border-2 border-rose-300 flex flex-col gap-3 text-center animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <RotateCcw size={24} />
            </div>
            <h3 className="text-base font-black text-gray-800">게임 데이터 초기화</h3>
            <p className="text-xs text-gray-600 font-semibold leading-relaxed">
              모든 레벨, 획득한 계란 스킨, 의상, 최고 기록 및 보유 골드가 완전히 초기화됩니다.<br />
              <strong className="text-rose-600">이 작업은 되돌릴 수 없습니다.</strong>
            </p>

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-gray-200 text-gray-700 font-black text-xs cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleResetData}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white font-black text-xs cursor-pointer shadow-md hover:bg-rose-700"
              >
                초기화 확인
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
