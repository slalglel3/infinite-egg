import React from 'react';
import { UserProgress, EggSkin } from '../../../types/game';
import { NestIllustration } from '../NestIllustration';
import { Play, Trophy, Footprints, Shirt, Sparkles } from 'lucide-react';
import { sound } from '../../../audio/sound';

interface MainTabProps {
  progress: UserProgress;
  currentSkin: EggSkin;
  onStartGame: () => void;
  onGoToEggsTab: () => void;
}

export const MainTab: React.FC<MainTabProps> = ({
  progress,
  currentSkin,
  onStartGame,
  onGoToEggsTab,
}) => {
  const handleStart = () => {
    sound.playJump();
    onStartGame();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-between px-4 py-1.5 safe-container overflow-hidden select-none">
      {/* 1. 상단: 장인의 달걀 공방 타이틀 & 장착 스킨 명판 */}
      <div className="flex flex-col items-center z-20 mt-1 gap-1">
        <h1
          style={{
            fontFamily: "'Fredoka', 'Jua', 'Black Han Sans', sans-serif",
            textShadow: '-2px -2px 0 #2b1306, 2px -2px 0 #2b1306, -2px 2px 0 #2b1306, 2px 2px 0 #2b1306, 0 4px 0 #170902',
          }}
          className="text-2xl sm:text-3xl font-black text-amber-300 tracking-wider drop-shadow"
        >
          무한의 계란
        </h1>

        {/* 장착 중인 캐릭터 명판 (원목 조각 뱃지) */}
        <div className="wood-badge px-3.5 py-0.5 text-xs font-black shadow-md flex items-center gap-1.5 border-2 border-[#2b1306]">
          <Sparkles size={12} className="text-amber-300" />
          <span className="text-white drop-shadow tracking-wide">{currentSkin.name}</span>
          {currentSkin.hpBonus > 0 && (
            <span className="bg-emerald-600/90 text-white text-[9px] px-1.5 py-0.2 rounded-full border border-emerald-400">
              +{currentSkin.hpBonus} HP
            </span>
          )}
        </div>
      </div>

      {/* 2. 중앙: 장인의 따뜻한 지푸라기 둥지 쇼케이스 & 의상실 이동 버튼 */}
      <div className="my-auto py-1 flex flex-col items-center relative z-10">
        <NestIllustration
          skin={currentSkin}
          equippedCostumes={progress.equippedCostumes}
          onEggClick={onGoToEggsTab}
        />

        {/* 의상실 바로가기 원목 캡슐 버튼 */}
        <button
          type="button"
          onClick={onGoToEggsTab}
          className="wood-badge mt-2 px-3.5 py-1 rounded-full flex items-center gap-1.5 text-xs font-black cursor-pointer active:scale-95 transition-transform"
        >
          <Shirt size={13} className="text-amber-300" />
          <span className="text-amber-100">의상 코디실 ↷</span>
        </button>
      </div>

      {/* 3. 하단: 원목 기록 전광판 & 초대형 3D [ 굴러가기! PLAY ▶ ] 버튼 */}
      <div className="w-full max-w-sm flex flex-col items-center gap-2 mb-2 z-20">
        {/* 실제 게임 누적 통계 바 (최고 기록 & 누적 주행) */}
        <div className="w-full grid grid-cols-2 gap-2">
          <div className="wood-badge py-1.5 px-2.5 justify-center rounded-xl text-center">
            <Trophy size={13} className="text-amber-300 shrink-0" />
            <span className="text-xs font-black text-amber-100">{progress.bestDistanceMeters.toLocaleString()}m 최고</span>
          </div>
          <div className="wood-badge py-1.5 px-2.5 justify-center rounded-xl text-center">
            <Footprints size={13} className="text-sky-300 shrink-0" />
            <span className="text-xs font-black text-amber-100">{progress.totalGamesPlayed}판 질주</span>
          </div>
        </div>

        {/* 초대형 쫀득한 골든 앰버 마스터 버튼 */}
        <button
          type="button"
          onClick={handleStart}
          className="btn-play-sunshine w-full h-16 rounded-3xl flex items-center justify-center gap-3 cursor-pointer group active:scale-95 transition-transform"
        >
          <div className="w-10 h-10 rounded-2xl bg-black/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <Play size={22} className="fill-white stroke-none ml-0.5" />
          </div>
          <div className="flex flex-col text-left leading-none">
            <span
              style={{
                fontFamily: "'Fredoka', 'Jua', 'Black Han Sans', sans-serif",
                WebkitTextStroke: '1px #2b1306',
              }}
              className="text-2xl sm:text-3xl font-black text-white tracking-wider"
            >
              굴러가기!
            </span>
            <span className="text-[10px] font-black text-yellow-100 tracking-widest mt-0.5 opacity-90">
              PLAY GAME ▶
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
