import React, { useState } from 'react';
import { EVENT_MAPS } from '../../../data/eventMaps';
import { EventMapItem } from '../../../types/game';
import { Flame, Clock, Sparkles, Play, Trophy } from 'lucide-react';
import { sound } from '../../../audio/sound';

interface EventsTabProps {
  onStartEventGame: (eventMap: EventMapItem) => void;
}

export const EventsTab: React.FC<EventsTabProps> = ({ onStartEventGame }) => {
  const [selectedMapId, setSelectedMapId] = useState<string>(EVENT_MAPS[0].id);

  const currentMap = EVENT_MAPS.find((m) => m.id === selectedMapId) || EVENT_MAPS[0];

  const handleSelectMap = (map: EventMapItem) => {
    sound.playTurn();
    setSelectedMapId(map.id);
  };

  const handlePlayCurrentEvent = () => {
    if (!currentMap.isOpen) {
      sound.playTurn();
      alert(`[${currentMap.title}]은 아직 오픈되지 않은 모드입니다!`);
      return;
    }
    sound.playJump();
    onStartEventGame(currentMap);
  };

  return (
    <div className="flex-1 flex flex-col px-3 py-1.5 safe-container overflow-hidden select-none">
      {/* 상단 타이틀 */}
      <div className="flex items-center justify-between pb-1.5 px-0.5">
        <h2 className="text-base font-black text-[#1e1b18] flex items-center gap-1.5">
          <Flame size={18} className="text-rose-500 fill-rose-500 animate-pulse" />
          <span>이벤트 챌린지</span>
        </h2>
        <span className="text-xs font-black text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300 shadow-xs">
          시즌 1 LIVE
        </span>
      </div>

      {/* 1. 상단 55%: 운빨존많겜식 웅장한 선택 맵 테마 쇼케이스 & [입장] 버튼 */}
      <div
        className={`panel-arcade p-4 flex flex-col justify-between relative shadow-xl overflow-hidden shrink-0 min-h-[220px] bg-gradient-to-br ${currentMap.bgGradient} text-white border-3 border-[#1e1b18]`}
      >
        {/* 장식용 은은한 블러 원 */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/20 rounded-full blur-2xl pointer-events-none" />

        {/* 상단 태그 및 오픈 상태 */}
        <div className="flex items-center justify-between z-10">
          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${currentMap.badgeColor} shadow-md tracking-wider border border-black/20`}>
            {currentMap.tag}
          </span>

          {!currentMap.isOpen && (
            <span className="flex items-center gap-1 text-[11px] font-black text-white bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-md border border-white/20">
              <Clock size={12} />
              <span>{currentMap.dDayText}</span>
            </span>
          )}
        </div>

        {/* 중앙: 대형 이모지 & 타이틀 */}
        <div className="flex items-center justify-between my-auto z-10 py-1">
          <div>
            <h3
              style={{
                fontFamily: "'Fredoka', 'Jua', 'Black Han Sans', sans-serif",
                textShadow: '-1.5px -1.5px 0 #18181b, 1.5px -1.5px 0 #18181b, -1.5px 1.5px 0 #18181b, 1.5px 1.5px 0 #18181b, 0 3px 0 #09090b',
              }}
              className="text-2xl sm:text-3xl font-black text-yellow-300 tracking-tight"
            >
              {currentMap.title}
            </h3>
            <p className="text-xs font-black text-white/95 mt-1 drop-shadow-md">
              {currentMap.desc}
            </p>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-white/25 backdrop-blur-md border-2 border-white/50 flex items-center justify-center text-3xl shadow-inner shrink-0 ml-2 animate-bounce">
            {currentMap.id === 'speed_rush' && '⚡'}
            {currentMap.id === 'golden_bonanza' && '💰'}
            {currentMap.id === 'sudden_death' && '💀'}
            {currentMap.id === 'galaxy_night' && '🌌'}
          </div>
        </div>

        {/* 보상 정보 & 메가 [입장] 버튼 */}
        <div className="z-10 mt-1 pt-2 border-t border-white/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs font-black text-yellow-200 drop-shadow">
            <Sparkles size={14} />
            <span className="truncate">{currentMap.rewardText}</span>
          </div>

          <button
            type="button"
            onClick={handlePlayCurrentEvent}
            className={`py-2 px-5 rounded-2xl font-black text-xs cursor-pointer shadow-lg flex items-center gap-1.5 shrink-0 ${
              currentMap.isOpen ? 'btn-3d-amber' : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-80'
            }`}
          >
            <Play size={13} className="fill-white stroke-none" />
            <span>{currentMap.isOpen ? '도전하기 (PLAY)' : '오픈 대기중'}</span>
          </button>
        </div>
      </div>

      {/* 2. 하단 45%: 가로 모드 카드 슬롯 선택기 */}
      <div className="flex-1 flex flex-col min-h-0 mt-2">
        <div className="text-xs font-black text-[#1e1b18] pb-1 px-1 flex items-center gap-1">
          <Trophy size={13} className="text-amber-500" />
          <span>챌린지 모드 선택</span>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 pb-4 pr-0.5">
          {EVENT_MAPS.map((map) => {
            const isSelected = map.id === currentMap.id;

            return (
              <div
                key={map.id}
                onClick={() => handleSelectMap(map)}
                className={`p-2.5 rounded-2xl border-2 flex flex-col justify-between transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'border-[#f59e0b] bg-amber-50 ring-2 ring-[#f59e0b] shadow-md scale-101'
                    : 'border-[#1e1b18] bg-white shadow-xs hover:border-amber-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-black px-2 py-0.2 rounded-full ${map.badgeColor} text-white`}>
                    {map.tag}
                  </span>
                  <span className="text-xl">
                    {map.id === 'speed_rush' && '⚡'}
                    {map.id === 'golden_bonanza' && '💰'}
                    {map.id === 'sudden_death' && '💀'}
                    {map.id === 'galaxy_night' && '🌌'}
                  </span>
                </div>

                <h4 className="text-xs font-black text-[#1e1b18] mt-1.5 truncate">
                  {map.title}
                </h4>

                <div className="mt-1 pt-1 border-t border-gray-100 flex items-center justify-between text-[10px] font-extrabold text-gray-500">
                  <span className={isSelected ? 'text-amber-600 font-black' : ''}>
                    {isSelected ? '✓ 선택됨' : '터치하여 선택'}
                  </span>
                  <span className="text-emerald-600">속도 x{map.speedMultiplier}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
