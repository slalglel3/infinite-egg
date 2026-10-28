import React, { useState } from 'react';
import { EVENT_MAPS } from '../../../data/eventMaps';
import { EventMapItem } from '../../../types/game';
import { Flame, Play, Clock, Sparkles, Zap, Trophy } from 'lucide-react';
import { sound } from '../../../audio/sound';
import { isTutorialSeen, markTutorialSeen } from '../../../utils/storage';

interface EventsTabProps {
  onStartEventGame: (eventMap: EventMapItem) => void;
}

export const EventsTab: React.FC<EventsTabProps> = ({ onStartEventGame }) => {
  const [showTutorial, setShowTutorial] = useState(!isTutorialSeen('EVENTS'));

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

      {/* [피드백 6 & 7 & 8] 큼직하고 화려한 전체 클릭 가능 영웅 카드 리스트 */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 pb-4 pr-1">
        {EVENT_MAPS.map((map) => {
          // [피드백 5 완벽 해결] 황금빛 맵 등 밝은 배경에서도 선명한 고대비 컬러
          const isGoldenMap = map.id === 'golden_bonanza';

          return (
            <div
              key={map.id}
              onClick={() => handlePlayEvent(map)}
              className={`relative rounded-3xl p-5 shadow-xl border-3 border-white/60 overflow-hidden bg-gradient-to-r ${map.bgGradient} transition-all select-none ${
                map.isOpen
                  ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98] ring-2 ring-white/40 shadow-2xl'
                  : 'opacity-75 cursor-not-allowed filter grayscale-[30%]'
              }`}
            >
              {/* 장식용 화려한 광채 블러 오버레이 */}
              <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-white/20 rounded-full blur-2xl pointer-events-none" />

              {/* 헤더 행: 엠블럼 배지 & 입장 상태 */}
              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className={`text-xs font-black px-3 py-1 rounded-full ${map.badgeColor} shadow-md`}>
                  {map.tag}
                </span>

                {map.isOpen ? (
                  <span className="flex items-center gap-1.5 text-xs font-black text-emerald-100 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md border border-white/20 shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    터치하여 바로 시작 ▶
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-gray-200 bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">
                    <Clock size={13} />
                    {map.dDayText}
                  </span>
                )}
              </div>

              {/* 큼직한 타이틀 & 화려한 이모지 */}
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <h3 className={`text-2xl font-black tracking-tight ${
                    isGoldenMap ? 'text-amber-950 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]' : 'text-white drop-shadow-md'
                  }`}>
                    {map.title}
                  </h3>
                  {/* 세세한 긴 글 대신 핵심 한 줄 강조 */}
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

              {/* 하단 보상 배너 바 */}
              <div className={`mt-4 pt-3 border-t flex items-center justify-between relative z-10 ${
                isGoldenMap ? 'border-amber-950/20 text-amber-950 font-black' : 'border-white/25 text-yellow-200 font-black'
              }`}>
                <div className="flex items-center gap-1.5 text-xs">
                  <Sparkles size={16} />
                  <span>특별 보상: {map.rewardText}</span>
                </div>

                {map.isOpen && (
                  <span className={`text-xs font-black underline flex items-center gap-0.5 ${
                    isGoldenMap ? 'text-amber-950' : 'text-white'
                  }`}>
                    입장하기 ➔
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* [피드백 7 구현] 이벤트 맵 최초 진입 튜토리얼 모달 */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl border-4 border-amber-300 flex flex-col items-center gap-3.5 text-center">
            <div className="w-16 h-16 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center shadow-inner">
              <Flame size={36} className="fill-red-500 text-red-500 animate-pulse" />
            </div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">이벤트 챌린지 맵</h3>
            <p className="text-xs text-gray-600 font-semibold leading-relaxed">
              기본 모드와 다른 특별한 룰과 짜릿한 보상이 주어지는 한정판 맵입니다!<br /><br />
              🔥 <strong>원하는 이벤트 카드를 터치</strong>하면 바로 게임이 시작됩니다. 골드 2배 맵과 초고속 맵에 도전해보세요!
            </p>
            <button
              type="button"
              onClick={() => {
                sound.playTurn();
                markTutorialSeen('EVENTS');
                setShowTutorial(false);
              }}
              className="w-full py-3 bg-gradient-to-r from-red-500 to-amber-500 text-white font-black text-sm rounded-2xl shadow-lg hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            >
              도전하러 가기!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
