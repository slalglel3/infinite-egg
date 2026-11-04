import React, { useState } from 'react';
import { UserProgress } from '../../types/game';
import { Settings, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { sound } from '../../audio/sound';
import { resetAllProgress } from '../../utils/storage';
import { getUIAsset } from '../../assets/assetRegistry';

interface HomeHeaderProps {
  progress: UserProgress;
  isMuted: boolean;
  onToggleMute: () => void;
  onUpdateProgress: (updated: UserProgress) => void;
  isShellShopOpen?: boolean; // 계란 껍데기 상점 진입 시 상단에 껍데기 노출
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

  const cogImg = getUIAsset('btn_settings_cog');

  return (
    <header className="w-full flex items-center justify-between p-3 pt-safe z-30 select-none">
      {/* 1. 좌측: 밧줄 목판 프로필 [닭 아바타 + LV.3 계란이] */}
      <div className="flex items-center gap-2">
        <div className="relative group cursor-pointer">
          <div className="bg-[#5c371e] text-[#f7e6c4] border-3 border-[#2b160a] shadow-[0_4px_0_#2b160a] px-3 py-1.5 rounded-2xl flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#fde047] border-2 border-[#5c371e] flex items-center justify-center text-lg shadow-inner shrink-0">
              🐔
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[10px] text-amber-300 font-black">LV.{progress.level}</span>
              <span className="text-xs font-black text-amber-50">계란이</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 중앙 & 우측: 밧줄 목판 재화 시스템 (곡식 🌾, 황금 깃털 🪶, [옵션] 껍데기 🥚, 설정 ⚙️) */}
      <div className="flex items-center gap-2">
        {/* 활동력 곡식 목판 (24/50) */}
        <div
          className="bg-[#5c371e] text-[#f7e6c4] border-3 border-[#2b160a] shadow-[0_4px_0_#2b160a] px-3 py-1.5 rounded-2xl flex items-center gap-1.5"
          title="활동력 (출발 시 🌾 5 소모)"
        >
          <span className="text-sm">🌾</span>
          <span className="text-xs font-black text-amber-100">
            {progress.wheat ?? 24}/{progress.maxWheat ?? 50}
          </span>
        </div>

        {/* 황금 깃털 목판 (1,245) */}
        <div
          className="bg-[#5c371e] text-[#f7e6c4] border-3 border-[#2b160a] shadow-[0_4px_0_#2b160a] px-3 py-1.5 rounded-2xl flex items-center gap-1.5"
          title="황금 깃털 (메인 재화)"
        >
          <span className="text-sm text-yellow-400">🪶</span>
          <span className="text-xs font-black text-amber-100">
            {(progress.feathers ?? progress.gold).toLocaleString()}
          </span>
        </div>

        {/* 계란 껍데기 상점 진입 시에만 나타나는 계란 껍데기 재화 목판 */}
        {isShellShopOpen && (
          <div
            className="bg-[#5c371e] text-[#f7e6c4] border-3 border-[#2b160a] shadow-[0_4px_0_#2b160a] px-3 py-1.5 rounded-2xl flex items-center gap-1.5 animate-bounce"
            title="계란 껍데기 재화"
          >
            <span className="text-sm">🥚</span>
            <span className="text-xs font-black text-amber-100">
              {progress.eggShells || 0}
            </span>
          </div>
        )}

        {/* 설정 목판 버튼 (톱니바퀴 - 슬라이싱 PNG 적용) */}
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="w-9 h-9 rounded-2xl flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          title="게임 설정"
        >
          {cogImg ? (
            <img src={cogImg} alt="설정" className="w-full h-full object-contain drop-shadow-md" />
          ) : (
            <div className="w-full h-full bg-[#5c371e] text-[#f7e6c4] border-3 border-[#2b160a] shadow-[0_4px_0_#2b160a] rounded-2xl flex items-center justify-center">
              <Settings size={18} className="text-amber-200 stroke-[2.5]" />
            </div>
          )}
        </button>
      </div>

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

