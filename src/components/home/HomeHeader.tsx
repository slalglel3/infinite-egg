import React, { useState } from 'react';
import { UserProgress } from '../../types/game';
import { Settings } from 'lucide-react';
import { sound } from '../../audio/sound';
import { resetAllProgress } from '../../utils/storage';

interface HomeHeaderProps {
  progress: UserProgress;
  isMuted: boolean;
  onToggleMute: () => void;
  onUpdateProgress: (updated: UserProgress) => void;
  isShellShopOpen?: boolean;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  progress,
  isMuted,
  onToggleMute,
  onUpdateProgress,
  isShellShopOpen = false,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetData = () => {
    sound.playImpact(8);
    const fresh = resetAllProgress();
    onUpdateProgress(fresh);
    setShowResetConfirm(false);
    setShowSettings(false);
    alert('모든 게임 진행 상태가 성공적으로 초기화되었습니다!');
  };

  return (
    <header className="w-full h-[9%] relative z-30 select-none">
      {/* 1. 좌측: 프로필 텍스트 오버레이 [LV.X 계란이] */}
      <div className="absolute top-[20%] left-[10.5%] w-[16.5%] h-[56%] flex flex-col justify-center items-center text-center bg-[#361a07] border-2 border-[#200d02] rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] pointer-events-none select-none z-10">
        <span className="text-[9px] sm:text-[10px] text-[#fde047] font-black drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)] leading-none">
          LV.{progress.level || 1}
        </span>
        <span className="text-[10px] sm:text-[11px] font-black text-amber-50 drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)] leading-tight truncate px-1">
          계란이
        </span>
      </div>

      {/* 2. 중앙-좌측: 활동력 곡식 라이브 수량 오버레이 */}
      <div className="absolute top-[24%] left-[49.5%] w-[14.5%] h-[48%] flex items-center justify-center text-center bg-[#361a07] border-2 border-[#200d02] rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] pointer-events-none select-none z-10">
        <span
          style={{ fontFamily: "'Fredoka', 'Jua', sans-serif" }}
          className="text-xs sm:text-sm font-black text-amber-100 drop-shadow-[0_1px_1px_#1e0c03]"
        >
          {progress.wheat ?? 24}/{progress.maxWheat ?? 50}
        </span>
      </div>

      {/* 3. 중앙-우측: 황금 깃털 라이브 수량 오버레이 */}
      <div className="absolute top-[24%] left-[72.5%] w-[14.5%] h-[48%] flex items-center justify-center text-center bg-[#361a07] border-2 border-[#200d02] rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] pointer-events-none select-none z-10">
        <span
          style={{ fontFamily: "'Fredoka', 'Jua', sans-serif" }}
          className="text-xs sm:text-sm font-black text-[#fde047] drop-shadow-[0_1px_1px_#1e0c03]"
        >
          {(progress.feathers ?? progress.gold).toLocaleString()}
        </span>
      </div>

      {/* 4. 우상단: 설정 톱니바퀴 터치 영역 (X: 88% ~ 98%) */}
      <button
        type="button"
        onClick={() => {
          sound.playTurn();
          setShowSettings(true);
        }}
        className="absolute top-[18%] right-[2.5%] w-[10%] aspect-square cursor-pointer active:scale-90 transition-transform flex items-center justify-center rounded-2xl group"
        title="게임 설정"
      >
        <div className="w-full h-full rounded-2xl group-active:bg-amber-400/20 transition-colors" />
      </button>

      {/* 설정 팝업 모달 */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#4a2811] border-4 border-[#241005] shadow-[0_8px_0_#241005] p-5 max-w-xs w-full rounded-3xl flex flex-col gap-3 text-center text-amber-100">
            <h3 className="text-lg font-black text-amber-200 flex items-center justify-center gap-2">
              <Settings size={20} />
              <span>게임 설정</span>
            </h3>

            {/* 사운드 토글 */}
            <div className="flex items-center justify-between bg-[#2d1506] p-3 rounded-2xl border-2 border-[#1c0c03]">
              <span className="text-xs font-black">사운드 효과음</span>
              <button
                type="button"
                onClick={onToggleMute}
                className="px-3 py-1.5 rounded-xl bg-[#5c371e] text-white font-black text-xs border border-white/20 cursor-pointer"
              >
                {isMuted ? '음소거 (OFF)' : '켜짐 (ON)'}
              </button>
            </div>

            {/* UI 비주얼 배치 툴 열기 */}
            <div className="flex flex-col gap-1.5 bg-[#2d1506] p-3 rounded-2xl border-2 border-[#1c0c03] text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300">🎨 UI 비주얼 편집기</span>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      window.open('./ui-editor.html', '_blank');
                    } catch (e) {
                      alert('ui-editor.html을 열 수 없습니다.\ninfinite-egg.html과 동일한 폴더에 ui-editor.html 파일이 있는지 확인해주세요.\n\nGitHub Releases에서 ui-editor.html을 다운로드할 수 있습니다.');
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs border border-amber-300 shadow cursor-pointer"
                >
                  편집기 열기
                </button>
              </div>
              <p className="text-[10px] text-amber-200/60 leading-tight">
                ※ infinite-egg.html과 같은 폴더에 ui-editor.html이 있어야 열립니다. (
                <a
                  href="https://github.com/slalglel3/infinite-egg/releases/latest"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 underline font-bold"
                >
                  GitHub에서 받기
                </a>
                )
              </p>
            </div>

            {/* 데이터 리셋 */}
            <div className="flex items-center justify-between bg-[#2d1506] p-3 rounded-2xl border-2 border-[#1c0c03]">
              <span className="text-xs font-black text-rose-300">데이터 초기화</span>
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-800 text-white font-black text-xs border border-rose-400 cursor-pointer"
              >
                초기화
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="w-full mt-2 py-2.5 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-600 text-[#2b1306] font-black text-sm shadow-[0_4px_0_#854d0e] active:translate-y-1 active:shadow-none cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 리셋 확인 팝업 */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#4a2811] border-4 border-[#241005] shadow-[0_8px_0_#241005] p-5 max-w-xs w-full rounded-3xl flex flex-col gap-3 text-center text-amber-100">
            <h3 className="text-base font-black text-rose-400">정말 초기화하시겠습니까?</h3>
            <p className="text-xs text-amber-200/80">모든 스킨, 깃털, 곡식 및 기록이 영구 삭제됩니다.</p>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-[#5c371e] text-white font-black text-xs cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleResetData}
                className="flex-1 py-2 rounded-xl bg-rose-700 text-white font-black text-xs cursor-pointer shadow-md"
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
