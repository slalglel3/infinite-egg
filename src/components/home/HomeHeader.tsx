import React, { useState } from 'react';
import { UserProgress } from '../../types/game';
import { Trophy, Coins, Volume2, VolumeX, RotateCcw, Plus, Shield } from 'lucide-react';
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

  const expPercent = Math.min(
    100,
    (progress.exp / (progress.exp + progress.nextLevelExp)) * 100
  );

  return (
    <header className="w-full flex items-center justify-between p-3 pt-safe z-30 select-none">
      {/* 1. 좌측: 콘셉트 이미지 1:1 반영 조각 나무 프로필 명판 (LV.3 계란이) */}
      <div className="wood-badge py-1 px-2.5 rounded-2xl flex items-center gap-2 shadow-lg">
        {/* 귀여운 아기 닭/계란 아바타 원형 인장 */}
        <div className="w-8 h-8 rounded-full bg-[#fef3c7] border-2 border-[#2b1306] flex items-center justify-center text-base shadow-inner shrink-0">
          🐔
        </div>
        <div className="flex flex-col text-left leading-tight pr-1">
          <span className="text-[10px] text-amber-300 font-black tracking-tight">LV.{progress.level}</span>
          <span className="text-xs font-black text-white drop-shadow">계란이</span>
        </div>
      </div>

      {/* 2. 우측: 조각 나무 자원 명판 (곡식/골드, 깃털/껍데기, 설정 버튼) */}
      <div className="flex items-center gap-1.5 flex-wrap justify-end">
        {/* 골드 명판 (🌾 1,245) */}
        <div className="wood-badge py-1.5 px-2.5">
          <span className="text-sm">🌾</span>
          <span className="text-xs font-black tracking-tight text-amber-200">
            {progress.gold.toLocaleString()}
          </span>
        </div>

        {/* 계란 껍데기 명판 (🪶 85) */}
        <div className="wood-badge py-1.5 px-2.5">
          <span className="text-sm">🪶</span>
          <span className="text-xs font-black tracking-tight text-amber-100">
            {progress.eggShells || 0}
          </span>
        </div>

        {/* 음소거 / 설정 조각 나무 사각 버튼 (⚙️) */}
        <button
          type="button"
          onClick={onToggleMute}
          className="wood-badge w-8 h-8 p-0 justify-center rounded-xl cursor-pointer active:scale-95 transition-transform"
          title={isMuted ? '음소거 해제' : '음소거'}
        >
          {isMuted ? <VolumeX size={15} className="text-rose-400" /> : <Volume2 size={15} className="text-emerald-400" />}
        </button>

        {/* 데이터 리셋 버튼 */}
        <button
          type="button"
          onClick={() => setShowResetConfirm(true)}
          className="wood-badge w-8 h-8 p-0 justify-center rounded-xl cursor-pointer active:scale-95 transition-transform opacity-70 hover:opacity-100"
          title="게임 데이터 리셋"
        >
          <RotateCcw size={13} className="text-amber-200" />
        </button>
      </div>

      {/* 데이터 리셋 확인 모달 */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="panel-arcade p-5 max-w-xs w-full shadow-2xl flex flex-col gap-3 text-center animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 border-2 border-rose-400 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
              <RotateCcw size={24} />
            </div>
            <h3 className="text-lg font-black text-[#1e1b18]">게임 데이터 초기화</h3>
            <p className="text-xs text-gray-700 font-bold leading-relaxed">
              모든 계란 스킨, 의상, 최고 기록 및 골드가 완전히 초기화됩니다.<br />
              <strong className="text-rose-600">이 작업은 되돌릴 수 없습니다.</strong>
            </p>

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="btn-3d-square flex-1 py-2 rounded-xl text-xs font-black cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleResetData}
                className="btn-3d-rose flex-1 py-2 rounded-xl text-xs font-black cursor-pointer shadow-md"
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
