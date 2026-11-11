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
    <header className="w-full h-full absolute inset-0 pointer-events-none select-none z-30">
      {/* 1. 좌측 목판: 프로필 라이브 텍스트 [LV.X / 계란이] (원목 슬롯 위에 자연스럽게 렌더링) */}
      <div className="absolute top-[3.2%] left-[15.8%] w-[11.5%] h-[4.2%] flex flex-col justify-center items-center text-center pointer-events-none select-none">
        <span 
          style={{ fontFamily: "'NanumSquareRound', 'Jua', 'Fredoka', sans-serif" }}
          className="text-[10px] sm:text-[11px] text-[#fef08a] font-black drop-shadow-[0_1.5px_1px_rgba(40,15,5,0.95)] leading-tight tracking-wider"
        >
          LV.{progress.level || 1}
        </span>
        <span 
          style={{ fontFamily: "'NanumSquareRound', 'Jua', 'Fredoka', sans-serif" }}
          className="text-[11px] sm:text-[12px] font-black text-white drop-shadow-[0_1.5px_1px_rgba(40,15,5,0.95)] leading-tight truncate px-0.5"
        >
          계란이
        </span>
      </div>

      {/* 2. 중앙-좌측 목판: 활동력 곡식 라이브 수량 오버레이 (recessed slot 내부 중앙 정렬) */}
      <div className="absolute top-[4.0%] left-[51.0%] w-[12.0%] h-[3.1%] flex items-center justify-center text-center pointer-events-none select-none">
        <span
          style={{ fontFamily: "'Fredoka', 'NanumSquareRound', sans-serif" }}
          className="text-xs sm:text-sm font-black text-[#fffbeb] drop-shadow-[0_1.5px_1px_rgba(40,15,5,0.95)] tracking-wide"
        >
          {progress.wheat ?? 24}/{progress.maxWheat ?? 50}
        </span>
      </div>

      {/* 3. 중앙-우측 목판: 황금 깃털 라이브 수량 오버레이 (recessed slot 내부 중앙 정렬) */}
      <div className="absolute top-[4.0%] left-[74.0%] w-[12.0%] h-[3.1%] flex items-center justify-center text-center pointer-events-none select-none">
        <span
          style={{ fontFamily: "'Fredoka', 'NanumSquareRound', sans-serif" }}
          className="text-xs sm:text-sm font-black text-[#fde047] drop-shadow-[0_1.5px_1px_rgba(40,15,5,0.95)] tracking-wide"
        >
          {(progress.feathers ?? progress.gold).toLocaleString()}
        </span>
      </div>

      {/* 4. 우상단 목판: 설정 톱니바퀴 터치 영역 (X: 82.0% ~ 90.3%, Y: 2.8% ~ 7.5%) */}
      <button
        type="button"
        onClick={() => {
          sound.playTurn();
          setShowSettings(true);
        }}
        className="pointer-events-auto absolute top-[3.0%] right-[9.5%] w-[8.5%] aspect-square cursor-pointer active:scale-90 transition-transform flex items-center justify-center rounded-2xl group"
        title="게임 설정"
      >
        <div className="w-full h-full rounded-2xl group-active:bg-amber-400/20 transition-colors" />
      </button>

      {/* 설정 팝업 모달 */}
      {showSettings && (
        <div className="pointer-events-auto fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
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
                className="px-3 py-1.5 rounded-xl bg-[#5c371e] text-white font-black text-xs border border-white/20 cursor-pointer active:scale-95 transition-transform"
              >
                {isMuted ? '음소거 (OFF)' : '켜짐 (ON)'}
              </button>
            </div>

            {/* 초기화 버튼 */}
            {!showResetConfirm ? (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-2.5 rounded-2xl bg-rose-900/40 text-rose-300 font-bold text-xs border border-rose-500/30 hover:bg-rose-900/60 transition-colors"
              >
                데이터 초기화
              </button>
            ) : (
              <div className="flex flex-col gap-2 p-2 bg-rose-950/60 rounded-2xl border border-rose-500/40">
                <p className="text-[11px] text-rose-200 font-bold">정말 모든 진행 기록을 초기화할까요?</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleResetData}
                    className="flex-1 py-1.5 rounded-xl bg-rose-600 text-white font-black text-xs active:scale-95 transition-transform"
                  >
                    초기화 확인
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-1.5 rounded-xl bg-gray-700 text-gray-200 font-black text-xs active:scale-95 transition-transform"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

            {/* 닫기 버튼 */}
            <button
              type="button"
              onClick={() => {
                sound.playTurn();
                setShowSettings(false);
              }}
              className="mt-2 w-full py-2.5 rounded-2xl bg-[#f59e0b] hover:bg-[#d97706] text-[#451a03] font-black text-sm shadow-[0_4px_0_#92400e] active:translate-y-0.5 active:shadow-[0_2px_0_#92400e] transition-all cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
