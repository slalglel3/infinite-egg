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
      {/* 1. 좌측: 운빨존많겜 스타일 레벨 엠블럼 (글자 겹침 원천 방지 레이아웃) */}
      <div className="flex items-center gap-2">
        <div className="relative flex flex-col items-center">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 border-2 border-[#1e1b18] shadow-[0_3px_0_#92400e] flex flex-col items-center justify-center text-white drop-shadow leading-none py-1">
            <span className="text-[9px] text-amber-100 font-black tracking-tight">LV</span>
            <span className="text-sm font-black text-white leading-none mt-0.5">{progress.level}</span>
          </div>
          {/* 미니 경험치 게이지 */}
          <div className="w-11 h-1.5 bg-[#1e1b18] rounded-full overflow-hidden mt-1 p-0.2 border border-white/40 shadow-sm">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
              style={{ width: `${expPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. 중앙/우측: 운빨존많겜 스타일 독립 알약형 캡슐 HUD (골드, 계란 껍데기, 최고 기록) */}
      <div className="flex items-center gap-1.5 flex-wrap justify-end">
        {/* 골드 캡슐 */}
        <div className="hud-capsule">
          <Coins size={14} className="text-amber-500 fill-amber-400 shrink-0" />
          <span className="text-xs font-black tracking-tight">{progress.gold.toLocaleString()}</span>
          <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shadow-xs ml-0.5 border border-[#064e3b]">
            <Plus size={10} className="stroke-[3]" />
          </div>
        </div>

        {/* 계란 껍데기 캡슐 */}
        <div className="hud-capsule" title="계란 껍데기 재화">
          <span className="text-xs shrink-0">🥚</span>
          <span className="text-xs font-black tracking-tight text-rose-700">{progress.eggShells || 0}</span>
        </div>

        {/* 최고 기록 캡슐 */}
        <div className="hud-capsule bg-amber-50">
          <Trophy size={13} className="text-amber-600 shrink-0" />
          <span className="text-xs font-black tracking-tight text-amber-900">{progress.bestDistanceMeters.toLocaleString()}m</span>
        </div>

        {/* 음소거 버튼 */}
        <button
          type="button"
          onClick={onToggleMute}
          className="btn-3d-square w-8 h-8 rounded-xl flex items-center justify-center shrink-0 cursor-pointer"
          title={isMuted ? '음소거 해제' : '음소거'}
        >
          {isMuted ? <VolumeX size={15} className="text-rose-600" /> : <Volume2 size={15} className="text-emerald-600" />}
        </button>

        {/* 리셋 버튼 */}
        <button
          type="button"
          onClick={() => setShowResetConfirm(true)}
          className="btn-3d-square w-8 h-8 rounded-xl flex items-center justify-center shrink-0 cursor-pointer hover:bg-rose-50"
          title="게임 데이터 리셋"
        >
          <RotateCcw size={14} className="text-gray-600" />
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
