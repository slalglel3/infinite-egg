import React from 'react';
import {
  Award,
  Coins,
  Flame,
  Gift,
  Grid2x2,
  Image as ImageIcon,
  Lock,
  Play,
  Settings,
  Sparkles,
  Square,
  Target,
  Wheat,
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

const RESIZE_HANDLES: Array<{ dir: ResizeHandleDir; style: string; cursor: string; corner: boolean }> = [
  { dir: 'nw', style: '-top-1.5 -left-1.5', cursor: 'nwse-resize', corner: true },
  { dir: 'n', style: '-top-1.5 left-1/2 -translate-x-1/2', cursor: 'ns-resize', corner: false },
  { dir: 'ne', style: '-top-1.5 -right-1.5', cursor: 'nesw-resize', corner: true },
  { dir: 'e', style: 'top-1/2 -right-1.5 -translate-y-1/2', cursor: 'ew-resize', corner: false },
  { dir: 'se', style: '-bottom-1.5 -right-1.5', cursor: 'nwse-resize', corner: true },
  { dir: 's', style: '-bottom-1.5 left-1/2 -translate-x-1/2', cursor: 'ns-resize', corner: false },
  { dir: 'sw', style: '-bottom-1.5 -left-1.5', cursor: 'nesw-resize', corner: true },
  { dir: 'w', style: 'top-1/2 -left-1.5 -translate-y-1/2', cursor: 'ew-resize', corner: false },
];

function extractSegmentLabels(name: string): string[] {
  const parenMatch = name.match(/\(([^)]+)\)/);
  if (parenMatch?.[1]) {
    const parts = parenMatch[1]
      .split(/[\/|·,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length >= 2 && parts.length <= 5) {
      return parts;
    }
  }
  return ['옵션 A', '옵션 B'];
}

function isPrimaryCtaButton(el: HomeLayoutElement): boolean {
  return (
    el.id.includes('active') ||
    el.id.includes('daily') ||
    el.id.includes('claim') ||
    el.id.includes('enter') ||
    el.id.includes('equip') ||
    el.id.includes('hatch') ||
    el.id.includes('slot1-btn') ||
    el.id.includes('slot3-btn') ||
    el.id.includes('start-btn')
  );
}

function isBackgroundContainerAsset(el: HomeLayoutElement): boolean {
  return (
    el.id.includes('-bg-') ||
    el.id.endsWith('-bg') ||
    el.id.includes('-board') ||
    el.id.includes('-frame') ||
    el.id.includes('-plate') ||
    el.id.includes('-ropes') ||
    el.id.includes('-particles') ||
    (el.w >= 200 && el.h >= 84)
  );
}

function isContainerCardOrButton(el: HomeLayoutElement): boolean {
  return (
    (el.kind === 'card' && el.id.endsWith('-card')) ||
    el.id === 'shop-hatch1-btn' ||
    el.id === 'shop-hatch10-btn' ||
    el.id.endsWith('-hud-settings-btn')
  );
}

function renderInnerWireframe(el: HomeLayoutElement) {
  const isTiny = el.h <= 26 || el.w <= 42;
  const isCompact = el.h < 42 || el.w < 110;
  const isVeryNarrow = el.w < 84;

  switch (el.kind) {
    case 'active-backing':
      return <div className="w-full h-full pointer-events-none" />;

    case 'play-button':
      return (
        <div className="w-full h-full flex items-center justify-center gap-2 px-3">
          <Play size={18} className="stroke-[2.5] shrink-0 text-slate-900" />
          <span className="text-base font-black tracking-tight text-slate-900 truncate">
            {el.name}
          </span>
        </div>
      );

    case 'button':
      if (isContainerCardOrButton(el)) {
        return <div className="w-full h-full pointer-events-none" />;
      }
      if (isTiny) {
        return (
          <div className="w-full h-full flex items-center justify-center px-1">
            {el.name.includes('설정') || el.id.includes('settings') ? (
              <Settings size={13} className="text-slate-800 shrink-0" />
            ) : (
              <span className="text-[10px] font-black text-slate-900 truncate leading-none">
                {el.name}
              </span>
            )}
          </div>
        );
      }
      return (
        <div
          className={`w-full h-full flex items-center justify-center px-1.5 ${
            isVeryNarrow && el.h >= 54 ? 'flex-col gap-1 text-center' : 'gap-1'
          }`}
        >
          {el.name.includes('설정') || el.id.includes('settings') ? (
            <Settings size={14} className="shrink-0 text-slate-800" />
          ) : el.name.includes('잠금') ? (
            <Lock size={12} className="shrink-0 text-slate-500" />
          ) : !isVeryNarrow || el.h >= 54 ? (
            <Sparkles size={11} className="shrink-0 text-slate-700" />
          ) : null}
          <span
            className={`${
              isVeryNarrow ? 'text-[10px]' : 'text-xs'
            } font-extrabold text-slate-900 leading-tight truncate max-w-full`}
          >
            {el.name}
          </span>
        </div>
      );

    case 'badge':
      return (
        <div className="w-full h-full flex flex-col items-center justify-center px-1.5 text-center overflow-hidden">
          <span
            className={`${
              isTiny ? 'text-[10px]' : isCompact ? 'text-xs' : 'text-sm'
            } font-black tracking-wide text-slate-900 truncate max-w-full`}
          >
            {el.name}
          </span>
          {!isCompact && el.h >= 46 && (
            <span className="text-[9px] font-mono text-slate-500 truncate max-w-full">
              {el.description || 'BADGE'}
            </span>
          )}
        </div>
      );

    case 'resource-chip': {
      const sampleValue = el.id.includes('stamina-value')
        ? '24/50'
        : el.id.includes('feather-value')
          ? '1,245'
          : el.id.includes('stamina-cost')
            ? '활동력 5'
            : el.id.includes('hatch1-cost')
              ? '100'
              : el.id.includes('hatch10-cost')
                ? '900'
                : el.id.includes('reward-val')
                  ? el.name.match(/\d+/)?.[0] ?? '10'
                  : el.id.includes('best-record')
                    ? 'BEST 0m'
                    : el.name;

      if (isTiny) {
        return (
          <div className="w-full h-full flex items-center justify-center px-1 overflow-hidden">
            <span className="text-[10px] font-mono font-black text-slate-900 truncate">
              {sampleValue}
            </span>
          </div>
        );
      }

      return (
        <div className="w-full h-full flex items-center justify-between gap-1 px-2 py-0.5 overflow-hidden">
          <div className="flex items-center gap-1 min-w-0">
            {el.name.includes('기록') ? (
              <Award size={11} className="shrink-0 text-slate-700" />
            ) : el.name.includes('활동력') || el.name.includes('곡식') ? (
              <Wheat size={11} className="shrink-0 text-amber-700" />
            ) : (
              <Coins size={11} className="shrink-0 text-amber-600" />
            )}
            <span className="text-[10px] font-bold text-slate-700 truncate">{el.name}</span>
          </div>
          <span className="text-[10px] font-mono font-black text-slate-900 shrink-0">
            {sampleValue}
          </span>
        </div>
      );
    }

    case 'asset-slot': {
      const isBgContainer = isBackgroundContainerAsset(el);
      if (isBgContainer) {
        const isSmallPlate = el.id.includes('-plate') || el.id.includes('-ropes') || el.h < 50;
        if (isSmallPlate) {
          return <div className="w-full h-full pointer-events-none" />;
        }
        return (
          <div className="w-full h-full relative overflow-hidden p-1 pointer-events-none">
            <span className="inline-block px-1 py-0.5 text-[8px] font-mono text-slate-400 leading-none truncate max-w-full">
              [{el.name}]
            </span>
          </div>
        );
      }

      if (isTiny) {
        return (
          <div className="w-full h-full flex items-center justify-center overflow-hidden">
            {el.name.includes('자물쇠') || el.name.includes('잠금') ? (
              <Lock size={12} className="text-slate-600 shrink-0" />
            ) : el.name.includes('곡식') || el.name.includes('활동력') ? (
              <Wheat size={12} className="text-amber-700 shrink-0" />
            ) : el.name.includes('설정') ? (
              <Settings size={13} className="text-slate-700 shrink-0" />
            ) : (
              <ImageIcon size={12} className="text-slate-600 shrink-0" />
            )}
          </div>
        );
      }

      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-0.5 p-1 overflow-hidden text-center">
          {el.name.includes('자물쇠') || el.name.includes('잠금') ? (
            <Lock size={14} className="text-slate-600 shrink-0" />
          ) : (
            <ImageIcon size={el.h >= 70 ? 18 : 13} className="text-slate-600 shrink-0" />
          )}
          <span className="text-[9px] font-mono font-bold text-slate-700 truncate max-w-full leading-tight">
            [{el.name}]
          </span>
        </div>
      );
    }

    case 'avatar':
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-1.5 overflow-hidden">
          <svg viewBox="0 0 100 116" className="max-h-[72%] w-auto shrink" fill="none">
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
          <span className="text-[10px] font-mono font-bold text-slate-600 truncate max-w-full">
            [{el.name}]
          </span>
        </div>
      );

    case 'segmented': {
      const labels = extractSegmentLabels(el.name);
      return (
        <div className="w-full h-full flex items-center gap-1 p-1">
          {labels.map((label, idx) => (
            <div
              key={`${label}-${idx}`}
              className={`flex-1 h-full rounded-md flex items-center justify-center text-[10px] truncate px-1 ${
                idx === 0
                  ? 'border border-slate-900 bg-amber-100/70 font-black text-slate-900'
                  : 'border border-slate-300 font-medium text-slate-500'
              }`}
            >
              {label}
            </div>
          ))}
        </div>
      );
    }

    case 'progress':
      return (
        <div className="w-full h-full flex flex-col justify-center gap-0.5 px-2 py-0.5 overflow-hidden">
          <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-slate-800">
            <span className="truncate">{el.name}</span>
            <span className="font-mono text-[9px] text-slate-600 shrink-0">
              {el.id.includes('row2') ? '124/500' : el.id.includes('row1') ? '3/3' : '50/50'}
            </span>
          </div>
          <div className="w-full h-2 rounded-full border border-slate-800 p-0.5 bg-white">
            <div
              className={`h-full rounded-full ${
                el.id.includes('row2')
                  ? 'w-[28%] bg-amber-500'
                  : 'w-full bg-amber-400'
              }`}
            />
          </div>
        </div>
      );

    case 'slot-grid':
      return (
        <div className="w-full h-full flex flex-col gap-1 p-2 overflow-hidden">
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 shrink-0">
            <span className="flex items-center gap-1 font-bold text-slate-700 truncate">
              <Grid2x2 size={11} /> {el.name}
            </span>
            <span>스크롤 영역</span>
          </div>
          <div className="flex-1 grid grid-cols-4 gap-1.5 min-h-0">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-dashed border-slate-400 flex flex-col items-center justify-center gap-0.5 text-[9px] font-mono text-slate-500"
              >
                <Square size={11} />
                <span>#{idx + 5}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'list-row':
      return (
        <div className="w-full h-full flex items-center gap-2 px-2 py-1 overflow-hidden">
          <div className="w-7 h-7 rounded-lg border border-slate-700 shrink-0 flex items-center justify-center text-slate-700">
            <Target size={13} />
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
            <span className="text-[11px] font-black text-slate-900 truncate">{el.name}</span>
            <span className="text-[9px] font-mono text-slate-500 truncate">
              {el.description || '항목 요약'}
            </span>
          </div>
        </div>
      );

    case 'banner':
      return (
        <div className="w-full h-full flex flex-col justify-start gap-1.5 p-2.5 overflow-hidden">
          <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-500 text-slate-600 self-start">
            <Flame size={10} /> BANNER
          </span>
          <span className="text-xs font-black text-slate-900 truncate">{el.name}</span>
        </div>
      );

    case 'text': {
      const isCenteredText =
        el.id.includes('header-text') ||
        el.id.includes('stat-text') ||
        el.id.includes('reward-label') ||
        el.id.includes('locked-label') ||
        el.id.includes('hatch1-label') ||
        el.id.includes('hatch10-label');
      return (
        <div
          className={`w-full h-full flex flex-col justify-center overflow-hidden ${
            isTiny ? 'px-1 py-0' : 'px-1.5 py-0.5'
          } ${isCenteredText ? 'items-center text-center' : ''}`}
        >
          <span
            className={`${
              isTiny
                ? 'text-[10px] truncate'
                : el.h >= 42
                  ? 'text-[11px] line-clamp-2 whitespace-normal'
                  : 'text-[11px] truncate'
            } font-extrabold text-slate-900 leading-tight max-w-full`}
          >
            {el.name}
          </span>
        </div>
      );
    }

    case 'card':
    default:
      if (isContainerCardOrButton(el)) {
        return <div className="w-full h-full pointer-events-none" />;
      }
      return (
        <div className="w-full h-full flex flex-col justify-start gap-0.5 px-2 py-1.5 overflow-hidden">
          <div className="flex items-center gap-1 min-w-0">
            <Gift size={11} className="shrink-0 text-slate-600" />
            <span className="text-[10px] font-black text-slate-900 truncate">{el.name}</span>
          </div>
          {el.h >= 54 && (
            <span className="text-[8px] font-mono text-slate-400 truncate">
              {el.description}
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
  const isPrimaryBtn = isPrimaryCtaButton(element);
  const isBgContainer = element.kind === 'asset-slot' && isBackgroundContainerAsset(element);
  const isFullscreenBackdrop =
    element.id.endsWith('-bg-barn') || element.id.endsWith('-bg-particles');
  const smallBox = element.w < 44 || element.h < 44;

  const borderClass =
    element.kind === 'active-backing'
      ? 'border-2 border-amber-500 rounded-xl bg-amber-100/80 shadow-[0_0_0_2px_rgba(245,158,11,0.2)]'
      : element.kind === 'play-button'
        ? 'border-2 border-slate-900 rounded-xl bg-amber-200/85'
        : element.kind === 'button'
          ? isPrimaryBtn
            ? 'border-2 border-slate-900 rounded-xl bg-amber-100/90'
            : 'border-[1.5px] border-slate-800 rounded-xl bg-white'
          : element.kind === 'badge'
            ? 'border-2 border-slate-800 rounded-xl bg-white'
            : element.kind === 'avatar'
              ? 'border-[1.5px] border-dashed border-slate-600 rounded-2xl bg-white/75'
              : element.kind === 'asset-slot'
                ? isBgContainer
                  ? 'border border-dashed border-slate-400 rounded-2xl bg-slate-50/70'
                  : 'border-[1.5px] border-dashed border-slate-500 rounded-xl bg-white/95'
                : element.kind === 'banner'
                  ? 'border-[1.5px] border-dashed border-slate-500 rounded-2xl bg-white/95'
                  : element.kind === 'text'
                    ? 'border border-dashed border-slate-400 rounded-md bg-white/85'
                    : element.kind === 'resource-chip'
                      ? 'border border-slate-700 rounded-lg bg-white/95'
                      : 'border-[1.5px] border-slate-700 rounded-xl bg-white/95';

  const interactivePreviewClick = !editable && isPlayButton && onTriggerPlay;
  const visibleHandles = smallBox
    ? RESIZE_HANDLES.filter((h) => h.corner)
    : RESIZE_HANDLES;

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
        isFullscreenBackdrop
          ? 'pointer-events-none'
          : editable
            ? isSelected
              ? 'ring-2 ring-blue-600 ring-offset-1 cursor-move shadow-sm touch-none'
              : 'hover:ring-1 hover:ring-blue-400 cursor-grab touch-none'
            : isPlayButton
              ? 'cursor-pointer active:bg-amber-300/90'
              : ''
      } ${isFullscreenBackdrop && editable && isSelected ? 'ring-2 ring-blue-600' : ''}`}
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

      {/* 에디터 모드: 선택 시 레이어 순서 배지 & 크기 조절 핸들 */}
      {editable && isSelected && (
        <>
          <div
            className={`absolute ${
              element.y < 22 ? 'top-full mt-0.5 left-0' : '-top-5 left-0'
            } px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-mono font-bold whitespace-nowrap pointer-events-none flex items-center gap-1 shadow z-50`}
          >
            <span>z:{element.zIndex}</span>
            <span>·</span>
            <span className="max-w-[140px] truncate">{element.name}</span>
          </div>

          {visibleHandles.map((h) => (
            <div
              key={h.dir}
              onPointerDown={(e) => onResizeHandleDown(e, element.id, h.dir)}
              style={{ cursor: h.cursor }}
              className={`absolute ${
                smallBox ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'
              } rounded-[3px] bg-white border-2 border-blue-600 z-50 touch-none after:content-[''] after:absolute after:-inset-2 ${h.style}`}
              title="드래그하여 크기 조절"
            />
          ))}
        </>
      )}
    </div>
  );
};
