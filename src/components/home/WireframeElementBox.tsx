import React from 'react';
import {
  Flame,
  Gift,
  Grid2x2,
  Play,
  Settings,
  Sparkles,
  Square,
  Trophy,
} from 'lucide-react';
import { HomeLayoutElement, ResizeHandleDir } from '../../types/homeLayout';

interface WireframeElementBoxProps {
  element: HomeLayoutElement;
  isSelected: boolean;
  editable: boolean;
  onSelectMouseDown: (e: React.PointerEvent, elementId: string) => void;
  onResizeHandleDown: (e: React.PointerEvent, elementId: string, handle: ResizeHandleDir) => void;
  onTriggerPlay?: () => void;
}

const RESIZE_HANDLES: Array<{ dir: ResizeHandleDir; style: string; cursor: string }> = [
  { dir: 'nw', style: '-top-1.5 -left-1.5', cursor: 'nwse-resize' },
  { dir: 'n', style: '-top-1.5 left-1/2 -translate-x-1/2', cursor: 'ns-resize' },
  { dir: 'ne', style: '-top-1.5 -right-1.5', cursor: 'nesw-resize' },
  { dir: 'e', style: 'top-1/2 -right-1.5 -translate-y-1/2', cursor: 'ew-resize' },
  { dir: 'se', style: '-bottom-1.5 -right-1.5', cursor: 'nwse-resize' },
  { dir: 's', style: '-bottom-1.5 left-1/2 -translate-x-1/2', cursor: 'ns-resize' },
  { dir: 'sw', style: '-bottom-1.5 -left-1.5', cursor: 'nesw-resize' },
  { dir: 'w', style: 'top-1/2 -left-1.5 -translate-y-1/2', cursor: 'ew-resize' },
];

function renderInnerWireframe(el: HomeLayoutElement) {
  const isCompact = el.h < 44 || el.w < 120;

  switch (el.kind) {
    case 'play-button':
      return (
        <div className="w-full h-full flex items-center justify-center gap-2 px-3">
          <Play size={18} className="stroke-[2.5] shrink-0 text-slate-900" />
          <span className="text-sm font-black tracking-tight text-slate-900 truncate">
            {el.name}
          </span>
        </div>
      );

    case 'button':
      return (
        <div className="w-full h-full flex items-center justify-center gap-1.5 px-2">
          {el.name.includes('설정') ? (
            <Settings size={14} className="shrink-0 text-slate-800" />
          ) : (
            <Sparkles size={13} className="shrink-0 text-slate-800" />
          )}
          <span className="text-xs font-extrabold text-slate-900 truncate">{el.name}</span>
        </div>
      );

    case 'badge':
      return (
        <div className="w-full h-full flex flex-col items-center justify-center px-2">
          <span className="text-sm font-black tracking-wide text-slate-900 truncate">
            {el.name}
          </span>
          {!isCompact && (
            <span className="text-[10px] font-mono text-slate-500 truncate max-w-full">
              {el.description || 'TITLE / BADGE'}
            </span>
          )}
        </div>
      );

    case 'avatar':
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-2 overflow-hidden">
          <svg
            viewBox="0 0 100 116"
            className="max-h-[68%] w-auto shrink"
            fill="none"
          >
            <path
              d="M 50 10 C 74 10, 92 38, 92 65 C 92 90, 75 106, 50 106 C 25 106, 8 90, 8 65 C 8 38, 26 10, 50 10 Z"
              stroke="#0f172a"
              strokeWidth="2.5"
            />
            <line
              x1="50"
              y1="12"
              x2="50"
              y2="104"
              stroke="#cbd5e1"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
            <line
              x1="10"
              y1="62"
              x2="90"
              y2="62"
              stroke="#cbd5e1"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
            <circle cx="38" cy="62" r="3" stroke="#0f172a" strokeWidth="1.8" />
            <circle cx="64" cy="62" r="3" stroke="#0f172a" strokeWidth="1.8" />
            <path d="M 44 71 Q 51 77 58 71" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-[11px] font-mono font-bold text-slate-600 truncate max-w-full">
            [{el.name}]
          </span>
        </div>
      );

    case 'segmented':
      return (
        <div className="w-full h-full flex items-center gap-1 p-1">
          <div className="flex-1 h-full rounded-md border border-slate-900 bg-slate-900/5 flex items-center justify-center text-[11px] font-bold text-slate-900 truncate px-1">
            옵션 A
          </div>
          <div className="flex-1 h-full rounded-md border border-slate-300 flex items-center justify-center text-[11px] font-medium text-slate-500 truncate px-1">
            옵션 B
          </div>
        </div>
      );

    case 'progress':
      return (
        <div className="w-full h-full flex flex-col justify-center gap-1.5 px-3 py-1.5 overflow-hidden">
          <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-slate-800">
            <span className="truncate">{el.name}</span>
            <span className="font-mono text-[10px] text-slate-500 shrink-0">65%</span>
          </div>
          <div className="w-full h-2.5 rounded-full border border-slate-800 p-0.5">
            <div className="h-full w-[65%] rounded-full border border-slate-800 bg-slate-900/15" />
          </div>
          {el.h >= 62 && el.description && (
            <span className="text-[10px] font-mono text-slate-400 truncate">
              {el.description}
            </span>
          )}
        </div>
      );

    case 'slot-grid':
      return (
        <div className="w-full h-full flex flex-col gap-1.5 p-2.5 overflow-hidden">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 shrink-0">
            <span className="flex items-center gap-1 font-bold text-slate-700 truncate">
              <Grid2x2 size={12} /> {el.name}
            </span>
            <span>4 x 2</span>
          </div>
          <div className="flex-1 grid grid-cols-4 grid-rows-2 gap-1.5 min-h-0">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className={`rounded-lg border flex flex-col items-center justify-center gap-0.5 text-[9px] font-mono ${
                  idx === 0
                    ? 'border-2 border-slate-900 text-slate-900 font-bold'
                    : idx < 4
                      ? 'border-slate-500 text-slate-600'
                      : 'border-dashed border-slate-300 text-slate-400'
                }`}
              >
                <Square size={12} />
                <span>#{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'list-row':
      return (
        <div className="w-full h-full flex items-center gap-2.5 px-3 py-2 overflow-hidden">
          <div className="w-9 h-9 rounded-lg border border-slate-700 shrink-0 flex items-center justify-center text-slate-700">
            <Trophy size={16} />
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
            <span className="text-xs font-black text-slate-900 truncate">{el.name}</span>
            <span className="text-[10px] font-mono text-slate-500 truncate">
              {el.description || '리스트 항목 요약'}
            </span>
            <div className="w-full max-w-[150px] h-1.5 rounded-full border border-slate-400">
              <div className="h-full w-1/2 bg-slate-400/50 rounded-full" />
            </div>
          </div>
        </div>
      );

    case 'banner':
      return (
        <div className="w-full h-full flex flex-col justify-start gap-2.5 p-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2 shrink-0">
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-500 text-slate-600">
              <Flame size={11} /> EVENT / FEATURED
            </span>
            <span className="text-[10px] font-mono text-slate-400">BANNER</span>
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-black text-slate-900 truncate">{el.name}</span>
            <span className="text-[11px] font-mono text-slate-500 line-clamp-2">
              {el.description || '배너 안내 문구 및 핵심 보상'}
            </span>
          </div>
        </div>
      );

    case 'text':
      return (
        <div className="w-full h-full flex flex-col justify-center px-2.5 py-1 overflow-hidden">
          <span className="text-xs font-extrabold text-slate-900 truncate">{el.name}</span>
          {el.h >= 38 && (
            <span className="text-[10px] font-mono text-slate-500 truncate">
              {el.description || '텍스트 설명'}
            </span>
          )}
        </div>
      );

    case 'card':
    default:
      return (
        <div className="w-full h-full flex flex-col justify-center gap-1 px-3 py-2 overflow-hidden">
          <div className="flex items-center gap-1.5 min-w-0">
            <Gift size={13} className="shrink-0 text-slate-600" />
            <span className="text-xs font-black text-slate-900 truncate">{el.name}</span>
          </div>
          {el.h >= 48 && (
            <span className="text-[10px] font-mono text-slate-500 line-clamp-2">
              {el.description || '패널 / 카드 컨텐츠 영역'}
            </span>
          )}
        </div>
      );
  }
}

export const WireframeElementBox: React.FC<WireframeElementBoxProps> = ({
  element,
  isSelected,
  editable,
  onSelectMouseDown,
  onResizeHandleDown,
  onTriggerPlay,
}) => {
  const isPlayButton = element.kind === 'play-button';
  const borderClass =
    element.kind === 'play-button' || element.kind === 'button' || element.kind === 'badge'
      ? 'border-2 border-slate-900 rounded-xl bg-white'
      : element.kind === 'avatar' || element.kind === 'banner'
        ? 'border-[1.5px] border-dashed border-slate-500 rounded-2xl bg-white'
        : element.kind === 'text'
          ? 'border border-dashed border-slate-400 rounded-lg bg-white'
          : 'border-[1.5px] border-slate-700 rounded-xl bg-white';

  const interactivePreviewClick = !editable && isPlayButton && onTriggerPlay;

  return (
    <div
      style={{
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${element.w}px`,
        height: `${element.h}px`,
        zIndex: element.zIndex,
      }}
      onPointerDown={(e) => {
        if (!editable) return;
        onSelectMouseDown(e, element.id);
      }}
      onClick={() => {
        if (interactivePreviewClick) {
          onTriggerPlay();
        }
      }}
      className={`absolute select-none transition-shadow ${borderClass} ${
        editable
          ? isSelected
            ? 'ring-2 ring-blue-600 ring-offset-1 cursor-move shadow-sm touch-none'
            : 'hover:ring-1 hover:ring-blue-400 cursor-grab touch-none'
          : isPlayButton
            ? 'cursor-pointer active:bg-slate-900/10'
            : ''
      }`}
    >
      {interactivePreviewClick ? (
        <button
          type="button"
          className="w-full h-full bg-transparent text-slate-900 cursor-pointer"
        >
          {renderInnerWireframe(element)}
        </button>
      ) : (
        renderInnerWireframe(element)
      )}

      {/* 에디터 모드: 선택 시 레이어 순서 배지 & 8방향 크기 조절 핸들 */}
      {editable && isSelected && (
        <>
          <div
            className={`absolute ${
              element.y < 22 ? 'top-1 left-1' : '-top-5 left-0'
            } px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-mono font-bold whitespace-nowrap pointer-events-none flex items-center gap-1 shadow z-40`}
          >
            <span>z:{element.zIndex}</span>
            <span>·</span>
            <span className="max-w-[140px] truncate">{element.name}</span>
          </div>

          {RESIZE_HANDLES.map((h) => (
            <div
              key={h.dir}
              onPointerDown={(e) => onResizeHandleDown(e, element.id, h.dir)}
              style={{ cursor: h.cursor }}
              className={`absolute w-3.5 h-3.5 rounded-[3px] bg-white border-2 border-blue-600 z-50 touch-none after:content-[''] after:absolute after:-inset-2 ${h.style}`}
              title="드래그하여 크기 조절"
            />
          ))}
        </>
      )}
    </div>
  );
};
