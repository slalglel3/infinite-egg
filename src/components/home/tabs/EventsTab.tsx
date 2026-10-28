import React from 'react';
import { EVENT_MAPS } from '../../../data/eventMaps';
import { EventMapItem } from '../../../types/game';
import { Flame, Clock, Sparkles } from 'lucide-react';
import { sound } from '../../../audio/sound';

interface EventsTabProps {
  onStartEventGame: (eventMap: EventMapItem) => void;
}

export const EventsTab: React.FC<EventsTabProps> = ({ onStartEventGame }) => {
  const handlePlayEvent = (eventMap: EventMapItem) => {
    if (!eventMap.isOpen) {
      sound.playTurn();
      alert(`[${eventMap.title}]은 아직 오픈되지 않은 모드입니다!`);
      return;
    }
    sound.playJump();
    onStartEventGame(eventMap);
  };

  return (
    <div className="flex-1 flex flex-col px-4 py-2 safe-container overflow-hidden">
      {/* 상단 타이틀 바 */}
      <div className="flex items-center justify-between pb-2 px-1">
        <h2 className="text-lg font-black text-gray-800 flex items-center gap-1.5">
          <Flame size={20} className="text-red-500 fill-red-500 animate-pulse" />
          이벤트 챌린지
        </h2>
        <span className="text-xs font-black text-rose-600 bg-rose-100 px-3 py-1 rounded-full border border-rose-300 shadow-sm">
          시즌 1 LIVE
        </span>
      </div>

      {/* 큼직하고 화려한 전체 클릭 가능 영웅 카드 리스트 */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-4 pr-1">
        {EVENT_MAPS.map((map) => {
          const isGoldenMap = map.id === 'golden_bonanza';

          return (
            <div
              key={map.id}
              onClick={() => handlePlayEvent(map)}
              className={`relative rounded-3xl p-5 shadow-xl border-3 border-white/60 overflow-hidden bg-gradient-to-r ${map.bgGradient} transition-all select-none ${
                map.isOpen
                  ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.98] ring-2 ring-white/40 shadow-2xl'
                  : 'opacity-75 cursor-not-allowed filter grayscale-[30%]'
              }`}
            >
              {/* 장식용 화려한 광채 블러 오버레이 */}
              <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-white/20 rounded-full blur-2xl pointer-events-none" />

              {/* 헤더 행: 곡률 잘림 방지 안전 여백 + 태그 배지 */}
              <div className="flex items-center justify-between mb-2 relative z-10 pt-0.5 px-0.5">
                <span className={`text-[11px] font-black px-3 py-1 rounded-full ${map.badgeColor} shadow-md tracking-wide`}>
                  {map.tag}
                </span>

                {!map.isOpen && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-gray-200 bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">
                    <Clock size={13} />
                    {map.dDayText}
                  </span>
                )}
              </div>

              {/* 큼직한 타이틀 & 화려한 이모지 */}
              <div className="flex items-center justify-between relative z-10 px-0.5">
                <div>
                  <h3 className={`text-2xl font-black tracking-tight ${
                    isGoldenMap ? 'text-amber-950 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]' : 'text-white drop-shadow-md'
                  }`}>
                    {map.title}
                  </h3>
                  {/* 핵심 한 줄 강조 */}
                  <p className={`text-xs font-extrabold mt-1 ${
                    isGoldenMap ? 'text-amber-900/90' : 'text-white/95 drop-shadow'
                  }`}>
                    {map.id === 'speed_rush' && '⚡ 기본 속도 1.4배의 초고속 극한 질주!'}
                    {map.id === 'golden_bonanza' && '💰 도로 곳곳에 황금 코인 & 황금알이 쏟아집니다!'}
                    {map.id === 'sudden_death' && '💀 모든 코너가 1스텝 지그재그! 단 0.1초의 칼턴!'}
                    {map.id === 'galaxy_night' && '✨ 신비로운 오로라 밤하늘과 별빛 도로를 질주!'}
                  </p>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-3xl shadow-inner shrink-0 ml-2">
                  {map.id === 'speed_rush' && '⚡'}
                  {map.id === 'golden_bonanza' && '💎'}
                  {map.id === 'sudden_death' && '🔥'}
                  {map.id === 'galaxy_night' && '🌌'}
                </div>
              </div>

              {/* 하단 보상 배너 바 (잉여 입장 버튼 제거) */}
              <div className={`mt-3.5 pt-2.5 border-t flex items-center justify-between relative z-10 px-0.5 ${
                isGoldenMap ? 'border-amber-950/20 text-amber-950 font-black' : 'border-white/25 text-yellow-200 font-black'
              }`}>
                <div className="flex items-center gap-1.5 text-xs">
                  <Sparkles size={16} />
                  <span>특별 보상: {map.rewardText}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
