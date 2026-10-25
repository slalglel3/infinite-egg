import React from 'react';
import { EVENT_MAPS } from '../../../data/eventMaps';
import { EventMapItem } from '../../../types/game';
import { Flame, Play, Clock, Sparkles, Trophy } from 'lucide-react';
import { sound } from '../../../audio/sound';

interface EventsTabProps {
  onStartEventGame: (eventMap: EventMapItem) => void;
}

export const EventsTab: React.FC<EventsTabProps> = ({ onStartEventGame }) => {
  const handlePlayEvent = (eventMap: EventMapItem) => {
    if (!eventMap.isOpen) return;
    sound.playJump();
    onStartEventGame(eventMap);
  };

  return (
    <div className="flex-1 flex flex-col px-4 py-2 safe-container overflow-hidden">
      {/* 상단 안내 배너 */}
      <div className="flex items-center justify-between pb-2 px-1">
        <div>
          <h2 className="text-base font-black text-gray-800 flex items-center gap-1.5">
            <Flame size={18} className="text-red-500 fill-red-500" />
            이벤트 챌린지 맵
          </h2>
          <p className="text-[11px] text-gray-500 font-bold">
            특별한 규칙과 추가 보상이 주어지는 한정판 모드!
          </p>
        </div>
        <span className="text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
          시즌 1 라이브
        </span>
      </div>

      {/* 이벤트 맵 목록 스크롤 뷰 */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-4 pr-1">
        {EVENT_MAPS.map((map) => (
          <div
            key={map.id}
            className={`relative rounded-3xl p-4 text-white shadow-lg border-2 border-white/40 overflow-hidden bg-gradient-to-r ${map.bgGradient} transition-transform ${
              map.isOpen ? 'hover:scale-[1.01] active:scale-[0.99]' : 'opacity-85'
            }`}
          >
            {/* 배경 미세 파티클 장식 */}
            <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />

            {/* 카드 헤더: 태그 & 오픈 상태 */}
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${map.badgeColor} shadow-sm`}>
                {map.tag}
              </span>
              {map.isOpen ? (
                <span className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-200 bg-black/25 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  입장 가능
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-gray-200 bg-black/40 px-2 py-0.5 rounded-full">
                  <Clock size={12} />
                  {map.dDayText}
                </span>
              )}
            </div>

            {/* 타이틀 및 설명 */}
            <h3 className="text-lg font-black tracking-tight drop-shadow-sm">
              {map.title}
            </h3>
            <p className="text-xs text-white/90 font-medium mt-1 leading-snug drop-shadow-sm">
              {map.desc}
            </p>

            {/* 보상 정보 & 입장 버튼 */}
            <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-200">
                <Sparkles size={14} />
                <span>{map.rewardText}</span>
              </div>

              {map.isOpen ? (
                <button
                  type="button"
                  onClick={() => handlePlayEvent(map)}
                  className="bg-white text-gray-900 font-black text-xs px-4 py-2 rounded-xl shadow-md hover:bg-yellow-100 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Play size={14} className="fill-gray-900" />
                  <span>도전하기</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="bg-black/30 text-white/60 font-bold text-xs px-3.5 py-2 rounded-xl cursor-not-allowed"
                >
                  준비중
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
