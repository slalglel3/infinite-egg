import React from 'react';
import { EVENT_MAPS } from '../../../data/eventMaps';
import { EventMapItem } from '../../../types/game';
import { sound } from '../../../audio/sound';

interface EventsTabProps {
  onStartEventGame: (eventMap: EventMapItem) => void;
}

export const EventsTab: React.FC<EventsTabProps> = ({ onStartEventGame }) => {
  const handlePlayEvent = (map: EventMapItem) => {
    sound.playJump();
    onStartEventGame(map);
  };

  const cardAreas = [
    {
      map: EVENT_MAPS[0], // 스피드 러너 챌린지
      btnTop: '34.0%',
      btnLeft: '72.5%',
      cardTop: '28.5%',
    },
    {
      map: EVENT_MAPS[1], // 황금알 채굴 대작전
      btnTop: '52.5%',
      btnLeft: '72.5%',
      cardTop: '46.5%',
    },
    {
      map: EVENT_MAPS[2], // 지옥의 1스텝 칼턴
      btnTop: '69.5%',
      btnLeft: '72.5%',
      cardTop: '64.5%',
    },
  ];

  return (
    <div className="w-full h-full relative select-none">
      {cardAreas.map((item, idx) => {
        const map = item.map;
        if (!map) return null;

        return (
          <React.Fragment key={map.id || idx}>
            {/* 카드 본체 전체 터치 영역 */}
            <div
              onClick={() => handlePlayEvent(map)}
              style={{
                top: item.cardTop,
                left: '8.0%',
                width: '84.0%',
                height: '14.5%',
              }}
              className="pointer-events-auto absolute rounded-3xl cursor-pointer active:scale-[0.98] transition-transform group"
              title={`${map.title} 시작하기`}
            >
              <div className="w-full h-full rounded-3xl group-active:bg-amber-400/10 transition-colors" />
            </div>

            {/* 카드 우측 [입장] 버튼 터치 피드백 영역 */}
            <button
              type="button"
              onClick={() => handlePlayEvent(map)}
              style={{
                top: item.btnTop,
                left: item.btnLeft,
                width: '17.0%',
                height: '6.0%',
              }}
              className="pointer-events-auto absolute rounded-2xl cursor-pointer active:scale-95 transition-transform flex items-center justify-center group"
              title={`${map.title} 입장`}
            >
              <div className="w-full h-full rounded-2xl group-active:bg-amber-400/25 transition-colors" />
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};
