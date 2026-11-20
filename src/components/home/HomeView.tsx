import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  FileCode2,
  Grid,
  Layers,
  Pencil,
  Play,
  Redo2,
  SlidersHorizontal,
  Trash2,
  Undo2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { HomeTabType, UserProgress } from '../../types/game';
import {
  HomeLayoutElement,
  HomeTabsLayoutMap,
  LayerAction,
  ResizeHandleDir,
  WireframeElementKind,
} from '../../types/homeLayout';
import {
  clampElementRect,
  cloneDefaultAllLayouts,
  cloneDefaultTabLayout,
  ELEMENT_MIN_HEIGHT,
  ELEMENT_MIN_WIDTH,
  HOME_TAB_META,
  loadHomeLayouts,
  MOBILE_STAGE_WIDTH,
  moveElementLayer,
  normalizeTabZOrder,
  saveHomeLayouts,
} from '../../data/defaultHomeLayouts';
import { computeLayoutChanges, decodeLayoutsFromUrlHash } from '../../utils/layoutSync';
import { BottomTabBar } from './BottomTabBar';
import { WireframeElementBox } from './WireframeElementBox';
import {
  LeftLayerPanel,
  MobileInspectorSheet,
  MobileLayerSheet,
  RightInspectorPanel,
} from './HomeLayoutPanels';
import { LayoutSyncModal } from './LayoutSyncModal';

interface HomeViewProps {
  progress: UserProgress;
  isMuted: boolean;
  onToggleMute: () => void;
  onStartGame: () => void;
}

type DragInteraction =
  | {
      mode: 'MOVE';
      elementId: string;
      startClientX: number;
      startClientY: number;
      origX: number;
      origY: number;
      origW: number;
      origH: number;
      startLayouts: HomeTabsLayoutMap;
    }
  | {
      mode: 'RESIZE';
      elementId: string;
      handle: ResizeHandleDir;
      startClientX: number;
      startClientY: number;
      origX: number;
      origY: number;
      origW: number;
      origH: number;
      startLayouts: HomeTabsLayoutMap;
    };

const MAX_HISTORY_STEPS = 60;
const EDIT_GROUP_WINDOW_MS = 700;

interface EditGroupMeta {
  elementId: string;
  groupKey: string;
  at: number;
}

interface EditorHistoryState {
  present: HomeTabsLayoutMap;
  past: HomeTabsLayoutMap[];
  future: HomeTabsLayoutMap[];
  lastGroup: EditGroupMeta | null;
}

type EditorHistoryAction =
  | { type: 'COMMIT'; updater: (prev: HomeTabsLayoutMap) => HomeTabsLayoutMap }
  | {
      type: 'GROUPED_UPDATE';
      elementId: string;
      groupKey: string;
      now: number;
      updater: (prev: HomeTabsLayoutMap) => HomeTabsLayoutMap;
    }
  | { type: 'SET_TRANSIENT'; updater: (prev: HomeTabsLayoutMap) => HomeTabsLayoutMap }
  | { type: 'COMMIT_DRAG'; startLayouts: HomeTabsLayoutMap }
  | { type: 'UNDO' }
  | { type: 'REDO' };

function cloneLayoutMap(map: HomeTabsLayoutMap): HomeTabsLayoutMap {
  return {
    SHOP: map.SHOP.map((el) => ({ ...el })),
    SKINS: map.SKINS.map((el) => ({ ...el })),
    MAIN: map.MAIN.map((el) => ({ ...el })),
    MISSIONS: map.MISSIONS.map((el) => ({ ...el })),
    CHALLENGE: map.CHALLENGE.map((el) => ({ ...el })),
  };
}

function layoutsEqual(a: HomeTabsLayoutMap, b: HomeTabsLayoutMap): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function editorHistoryReducer(
  state: EditorHistoryState,
  action: EditorHistoryAction
): EditorHistoryState {
  switch (action.type) {
    case 'COMMIT': {
      const next = action.updater(state.present);
      if (layoutsEqual(state.present, next)) {
        return state.lastGroup ? { ...state, lastGroup: null } : state;
      }
      return {
        present: next,
        past: [...state.past, cloneLayoutMap(state.present)].slice(-MAX_HISTORY_STEPS),
        future: [],
        lastGroup: null,
      };
    }

    case 'GROUPED_UPDATE': {
      const next = action.updater(state.present);
      if (layoutsEqual(state.present, next)) return state;
      const canMerge =
        state.lastGroup !== null &&
        state.lastGroup.elementId === action.elementId &&
        state.lastGroup.groupKey === action.groupKey &&
        action.now - state.lastGroup.at <= EDIT_GROUP_WINDOW_MS &&
        state.past.length > 0;

      if (canMerge) {
        return {
          ...state,
          present: next,
          future: [],
          lastGroup: {
            elementId: action.elementId,
            groupKey: action.groupKey,
            at: action.now,
          },
        };
      }

      return {
        present: next,
        past: [...state.past, cloneLayoutMap(state.present)].slice(-MAX_HISTORY_STEPS),
        future: [],
        lastGroup: {
          elementId: action.elementId,
          groupKey: action.groupKey,
          at: action.now,
        },
      };
    }

    case 'SET_TRANSIENT': {
      const next = action.updater(state.present);
      if (layoutsEqual(state.present, next)) return state;
      return {
        ...state,
        present: next,
        lastGroup: null,
      };
    }

    case 'COMMIT_DRAG': {
      if (layoutsEqual(action.startLayouts, state.present)) {
        return state;
      }
      return {
        ...state,
        past: [...state.past, cloneLayoutMap(action.startLayouts)].slice(-MAX_HISTORY_STEPS),
        future: [],
        lastGroup: null,
      };
    }

    case 'UNDO': {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        present: cloneLayoutMap(previous),
        past: state.past.slice(0, -1),
        future: [cloneLayoutMap(state.present), ...state.future].slice(0, MAX_HISTORY_STEPS),
        lastGroup: null,
      };
    }

    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        present: cloneLayoutMap(next),
        past: [...state.past, cloneLayoutMap(state.present)].slice(-MAX_HISTORY_STEPS),
        future: state.future.slice(1),
        lastGroup: null,
      };
    }
  }
}

function getInitialLayouts(): HomeTabsLayoutMap {
  if (typeof window !== 'undefined' && window.location.hash.startsWith('#layout=')) {
    const fromHash = decodeLayoutsFromUrlHash(window.location.hash);
    if (fromHash) return fromHash;
  }
  return loadHomeLayouts();
}

export const HomeView: React.FC<HomeViewProps> = ({
  progress,
  isMuted,
  onToggleMute,
  onStartGame,
}) => {
  const [activeTab, setActiveTab] = useState<HomeTabType>('MAIN');
  const [historyState, dispatchHistory] = useReducer(editorHistoryReducer, undefined, () => ({
    present: getInitialLayouts(),
    past: [],
    future: [],
    lastGroup: null,
  }));
  const layouts = historyState.present;
  const canUndo = historyState.past.length > 0;
  const canRedo = historyState.future.length > 0;

  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const initial = historyState.present.MAIN;
    return initial[initial.length - 1]?.id ?? null;
  });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isMobileEditMode, setIsMobileEditMode] = useState(false);
  const [snapGrid, setSnapGrid] = useState(true);
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 390
  );

  // 모바일 시트 & 공용 AGY 반영 모달 상태
  const [mobileLayerOpen, setMobileLayerOpen] = useState(false);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [syncModalMode, setSyncModalMode] = useState<'EXPORT' | 'IMPORT' | null>(null);

  const dragRef = useRef<DragInteraction | null>(null);
  const activeTabRef = useRef<HomeTabType>(activeTab);
  const snapPx = snapGrid ? 4 : 0;
  activeTabRef.current = activeTab;

  const isDesktopViewport = viewportWidth >= 840;
  const mobileFrameWidth = isDesktopViewport ? MOBILE_STAGE_WIDTH : Math.min(viewportWidth, 430);
  const stageScale = isDesktopViewport ? 1 : mobileFrameWidth / MOBILE_STAGE_WIDTH;
  const stageScaleRef = useRef<number>(stageScale);
  stageScaleRef.current = stageScale;

  // PC에서는 기본 편집 모드(미리보기 토글 가능), 모바일에서는 기본 미리보기([UI 편집] 탭 시 즉시 편집)
  const stageEditable = isDesktopViewport ? !isPreviewMode : isMobileEditMode;

  useEffect(() => {
    const onResize = () => {
      setViewportWidth(window.innerWidth);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    saveHomeLayouts(layouts);
  }, [layouts]);

  // Undo/Redo 등으로 현재 선택된 ID가 사라진 경우 해당 탭 최상단 요소로 안전 보정
  useEffect(() => {
    if (selectedId && !layouts[activeTab].some((el) => el.id === selectedId)) {
      const topEl = [...layouts[activeTab]].sort((a, b) => b.zIndex - a.zIndex)[0] ?? null;
      setSelectedId(topEl?.id ?? null);
    }
  }, [layouts, activeTab, selectedId]);

  const handleUndo = useCallback(() => {
    dispatchHistory({ type: 'UNDO' });
  }, []);

  const handleRedo = useCallback(() => {
    dispatchHistory({ type: 'REDO' });
  }, []);

  // 편집 모드 키보드 단축키 (Ctrl+Z Undo, Ctrl+Y/Ctrl+Shift+Z Redo, 화살표 이동, Delete 삭제)
  useEffect(() => {
    if (!stageEditable) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        const lower = e.key.toLowerCase();
        if (lower === 'z' && !e.shiftKey) {
          e.preventDefault();
          dispatchHistory({ type: 'UNDO' });
          return;
        }
        if ((lower === 'z' && e.shiftKey) || lower === 'y') {
          e.preventDefault();
          dispatchHistory({ type: 'REDO' });
          return;
        }
      }

      if (!selectedId) return;
      const step = snapGrid ? 4 : 1;
      const tab = activeTabRef.current;
      const cur = layouts[tab].find((el) => el.id === selectedId);
      if (!cur) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        dispatchHistory({
          type: 'GROUPED_UPDATE',
          elementId: selectedId,
          groupKey: 'nudge',
          now: Date.now(),
          updater: (prev) => ({
            ...prev,
            [tab]: prev[tab].map((el) =>
              el.id === selectedId ? { ...el, ...clampElementRect({ ...el, x: el.x - step }) } : el
            ),
          }),
        });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        dispatchHistory({
          type: 'GROUPED_UPDATE',
          elementId: selectedId,
          groupKey: 'nudge',
          now: Date.now(),
          updater: (prev) => ({
            ...prev,
            [tab]: prev[tab].map((el) =>
              el.id === selectedId ? { ...el, ...clampElementRect({ ...el, x: el.x + step }) } : el
            ),
          }),
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        dispatchHistory({
          type: 'GROUPED_UPDATE',
          elementId: selectedId,
          groupKey: 'nudge',
          now: Date.now(),
          updater: (prev) => ({
            ...prev,
            [tab]: prev[tab].map((el) =>
              el.id === selectedId ? { ...el, ...clampElementRect({ ...el, y: el.y - step }) } : el
            ),
          }),
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        dispatchHistory({
          type: 'GROUPED_UPDATE',
          elementId: selectedId,
          groupKey: 'nudge',
          now: Date.now(),
          updater: (prev) => ({
            ...prev,
            [tab]: prev[tab].map((el) =>
              el.id === selectedId ? { ...el, ...clampElementRect({ ...el, y: el.y + step }) } : el
            ),
          }),
        });
      } else if (e.key === 'Delete') {
        e.preventDefault();
        const remaining = normalizeTabZOrder(layouts[tab].filter((el) => el.id !== selectedId));
        dispatchHistory({
          type: 'COMMIT',
          updater: (prev) => ({ ...prev, [tab]: remaining }),
        });
        setSelectedId([...remaining].sort((a, b) => b.zIndex - a.zIndex)[0]?.id ?? null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [stageEditable, selectedId, snapGrid, layouts]);

  const currentElements = layouts[activeTab];
  const selectedElement = useMemo(
    () => currentElements.find((el) => el.id === selectedId) ?? null,
    [currentElements, selectedId]
  );
  const diffSummary = useMemo(() => computeLayoutChanges(layouts), [layouts]);

  const handleTabChange = useCallback(
    (nextTab: HomeTabType) => {
      setActiveTab(nextTab);
      const nextList = layouts[nextTab];
      const topEl = [...nextList].sort((a, b) => b.zIndex - a.zIndex)[0] ?? null;
      setSelectedId(topEl?.id ?? null);
    },
    [layouts]
  );

  const handleUpdateElement = useCallback((id: string, patch: Partial<HomeLayoutElement>) => {
    const tab = activeTabRef.current;
    const applyPatch = (prev: HomeTabsLayoutMap): HomeTabsLayoutMap => ({
      ...prev,
      [tab]: prev[tab].map((el) => {
        if (el.id !== id) return el;
        const merged = { ...el, ...patch };
        if (
          patch.x !== undefined ||
          patch.y !== undefined ||
          patch.w !== undefined ||
          patch.h !== undefined
        ) {
          return { ...merged, ...clampElementRect(merged, 0) };
        }
        return merged;
      }),
    });

    if (patch.kind !== undefined) {
      dispatchHistory({ type: 'COMMIT', updater: applyPatch });
      return;
    }

    const groupKey =
      patch.name !== undefined || patch.description !== undefined ? 'text' : 'rect';
    dispatchHistory({
      type: 'GROUPED_UPDATE',
      elementId: id,
      groupKey,
      now: Date.now(),
      updater: applyPatch,
    });
  }, []);

  const handleLayerAction = useCallback((id: string, action: LayerAction) => {
    const tab = activeTabRef.current;
    dispatchHistory({
      type: 'COMMIT',
      updater: (prev) => ({
        ...prev,
        [tab]: moveElementLayer(prev[tab], id, action),
      }),
    });
  }, []);

  const handleCreateElement = useCallback(
    (kind: WireframeElementKind) => {
      const tab = activeTabRef.current;
      const newId = `${tab.toLowerCase()}-custom-${Date.now().toString(36)}`;
      const maxZ = layouts[tab].reduce((m, el) => Math.max(m, el.zIndex), 0);
      const defaultH =
        kind === 'slot-grid' || kind === 'avatar'
          ? 160
          : kind === 'banner' || kind === 'asset-slot'
            ? 100
            : kind === 'button' ||
                kind === 'segmented' ||
                kind === 'badge' ||
                kind === 'resource-chip' ||
                kind === 'active-backing'
              ? 42
              : 74;

      const created: HomeLayoutElement = {
        id: newId,
        name: `새 요소 ${layouts[tab].length + 1}`,
        description: '신규 추가된 UI 요소 설명',
        kind,
        x: 55,
        y: 160,
        w: 280,
        h: defaultH,
        zIndex: maxZ + 1,
      };
      dispatchHistory({
        type: 'COMMIT',
        updater: (prev) => ({
          ...prev,
          [tab]: normalizeTabZOrder([...prev[tab], created]),
        }),
      });
      setSelectedId(newId);
    },
    [layouts]
  );

  const handleDuplicateElement = useCallback(
    (id: string) => {
      const tab = activeTabRef.current;
      const src = layouts[tab].find((el) => el.id === id);
      if (!src) return;
      const dupId = `${tab.toLowerCase()}-dup-${Date.now().toString(36)}`;
      const maxZ = layouts[tab].reduce((m, el) => Math.max(m, el.zIndex), 0);
      const rect = clampElementRect({ x: src.x + 12, y: src.y + 12, w: src.w, h: src.h });
      const duplicated: HomeLayoutElement = {
        ...src,
        ...rect,
        id: dupId,
        name: `${src.name} 사본`,
        zIndex: maxZ + 1,
      };
      dispatchHistory({
        type: 'COMMIT',
        updater: (prev) => ({
          ...prev,
          [tab]: normalizeTabZOrder([...prev[tab], duplicated]),
        }),
      });
      setSelectedId(dupId);
    },
    [layouts]
  );

  const handleDeleteElement = useCallback(
    (id: string) => {
      const tab = activeTabRef.current;
      const remaining = normalizeTabZOrder(layouts[tab].filter((el) => el.id !== id));
      dispatchHistory({
        type: 'COMMIT',
        updater: (prev) => ({
          ...prev,
          [tab]: remaining,
        }),
      });
      if (selectedId === id) {
        const nextTop = [...remaining].sort((a, b) => b.zIndex - a.zIndex)[0] ?? null;
        setSelectedId(nextTop?.id ?? null);
      }
    },
    [layouts, selectedId]
  );

  const handleResetTab = useCallback(() => {
    const tab = activeTabRef.current;
    const resetList = cloneDefaultTabLayout(tab);
    dispatchHistory({
      type: 'COMMIT',
      updater: (prev) => ({
        ...prev,
        [tab]: resetList,
      }),
    });
    setSelectedId(resetList[resetList.length - 1]?.id ?? null);
  }, []);

  const handleResetAll = useCallback(() => {
    const fresh = cloneDefaultAllLayouts();
    dispatchHistory({
      type: 'COMMIT',
      updater: () => fresh,
    });
    const list = fresh[activeTabRef.current];
    setSelectedId(list[list.length - 1]?.id ?? null);
  }, []);

  const handleImportLayouts = useCallback((imported: HomeTabsLayoutMap) => {
    dispatchHistory({
      type: 'COMMIT',
      updater: () => cloneLayoutMap(imported),
    });
    const list = imported[activeTabRef.current];
    const topEl = [...list].sort((a, b) => b.zIndex - a.zIndex)[0] ?? null;
    setSelectedId(topEl?.id ?? null);
  }, []);

  // 전역 포인터 드래그/리사이즈 핸들러 (모바일 스케일 보정 + 드래그 종료 시 단일 Undo 스텝 커밋)
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const scale = stageScaleRef.current || 1;
      const dx = (e.clientX - drag.startClientX) / scale;
      const dy = (e.clientY - drag.startClientY) / scale;
      const tab = activeTabRef.current;

      if (drag.mode === 'MOVE') {
        const next = clampElementRect(
          {
            x: drag.origX + dx,
            y: drag.origY + dy,
            w: drag.origW,
            h: drag.origH,
          },
          snapPx
        );
        dispatchHistory({
          type: 'SET_TRANSIENT',
          updater: (prev) => ({
            ...prev,
            [tab]: prev[tab].map((el) => (el.id === drag.elementId ? { ...el, ...next } : el)),
          }),
        });
        return;
      }

      // 8방향 리사이즈 계산
      let nx = drag.origX;
      let ny = drag.origY;
      let nw = drag.origW;
      let nh = drag.origH;

      if (drag.handle.includes('e')) {
        nw = drag.origW + dx;
      }
      if (drag.handle.includes('s')) {
        nh = drag.origH + dy;
      }
      if (drag.handle.includes('w')) {
        const clampedDx = Math.min(drag.origW - ELEMENT_MIN_WIDTH, Math.max(-drag.origX, dx));
        nx = drag.origX + clampedDx;
        nw = drag.origW - clampedDx;
      }
      if (drag.handle.includes('n')) {
        const clampedDy = Math.min(drag.origH - ELEMENT_MIN_HEIGHT, Math.max(-drag.origY, dy));
        ny = drag.origY + clampedDy;
        nh = drag.origH - clampedDy;
      }

      const snap = (v: number) => (snapPx > 1 ? Math.round(v / snapPx) * snapPx : Math.round(v));
      nw = Math.max(ELEMENT_MIN_WIDTH, Math.min(MOBILE_STAGE_WIDTH - nx, snap(nw)));
      nh = Math.max(ELEMENT_MIN_HEIGHT, Math.min(900, snap(nh)));
      nx = Math.max(0, Math.min(MOBILE_STAGE_WIDTH - ELEMENT_MIN_WIDTH, snap(nx)));
      ny = Math.max(0, Math.min(1150, snap(ny)));

      dispatchHistory({
        type: 'SET_TRANSIENT',
        updater: (prev) => ({
          ...prev,
          [tab]: prev[tab].map((el) =>
            el.id === drag.elementId ? { ...el, x: nx, y: ny, w: nw, h: nh } : el
          ),
        }),
      });
    };

    const handlePointerUp = () => {
      const drag = dragRef.current;
      dragRef.current = null;
      if (drag) {
        dispatchHistory({ type: 'COMMIT_DRAG', startLayouts: drag.startLayouts });
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [snapPx]);

  const handleSelectMouseDown = useCallback(
    (e: React.PointerEvent, elementId: string) => {
      e.stopPropagation();
      const target = currentElements.find((el) => el.id === elementId);
      if (!target) return;
      setSelectedId(elementId);
      try {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      } catch {
        // 합성 마우스 이벤트 등 무시
      }
      dragRef.current = {
        mode: 'MOVE',
        elementId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        origX: target.x,
        origY: target.y,
        origW: target.w,
        origH: target.h,
        startLayouts: cloneLayoutMap(layouts),
      };
    },
    [currentElements, layouts]
  );

  const handleResizeHandleDown = useCallback(
    (e: React.PointerEvent, elementId: string, handle: ResizeHandleDir) => {
      e.stopPropagation();
      const target = currentElements.find((el) => el.id === elementId);
      if (!target) return;
      setSelectedId(elementId);
      try {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      } catch {
        // 합성 마우스 이벤트 등 무시
      }
      dragRef.current = {
        mode: 'RESIZE',
        elementId,
        handle,
        startClientX: e.clientX,
        startClientY: e.clientY,
        origX: target.x,
        origY: target.y,
        origW: target.w,
        origH: target.h,
        startLayouts: cloneLayoutMap(layouts),
      };
    },
    [currentElements, layouts]
  );

  const sortedForRender = useMemo(
    () => [...currentElements].sort((a, b) => a.zIndex - b.zIndex),
    [currentElements]
  );

  const stageHeightPx = useMemo(() => {
    const maxBottom = currentElements.reduce((m, el) => Math.max(m, el.y + el.h + 24), 580);
    return Math.max(580, maxBottom);
  }, [currentElements]);

  const tabMeta = HOME_TAB_META[activeTab];

  return (
    <div className="absolute inset-0 bg-slate-100 flex items-center justify-center select-none z-20 overflow-hidden">
      {/* 1. 좌측 여백: UI 레이어/요소 목록 & 생성 & Undo/Redo 패널 (데스크톱 >= 840px) */}
      {isDesktopViewport && (
        <div className="flex-1 h-full flex justify-end overflow-hidden">
          <LeftLayerPanel
            activeTab={activeTab}
            onTabChange={handleTabChange}
            elements={currentElements}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onCreateElement={handleCreateElement}
            onDeleteElement={handleDeleteElement}
            onDuplicateElement={handleDuplicateElement}
            onLayerAction={handleLayerAction}
            onResetTab={handleResetTab}
            isPreviewMode={isPreviewMode}
            onTogglePreview={() => setIsPreviewMode((v) => !v)}
            snapGrid={snapGrid}
            onToggleSnap={() => setSnapGrid((v) => !v)}
            onStartGame={onStartGame}
            canUndo={canUndo}
            canRedo={canRedo}
            undoCount={historyState.past.length}
            redoCount={historyState.future.length}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />
        </div>
      )}

      {/* 2. 중앙: 실제 모바일 화면 프레임 (PC 390px 고정 / 모바일 가용 폭 반응형) */}
      <div
        style={!isDesktopViewport ? { width: `${mobileFrameWidth}px` } : undefined}
        className={`relative bg-white flex flex-col justify-between overflow-hidden shrink-0 ${
          isDesktopViewport
            ? 'w-[390px] h-full max-h-[860px] border-x-2 border-slate-300 shadow-xl'
            : 'h-full'
        }`}
      >
        {/* 2.1 상단 공통 와이어프레임 헤더 */}
        <header className="w-full flex items-center justify-between px-3.5 py-2 pt-safe border-b border-slate-300 z-30 shrink-0 bg-white">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-base font-black tracking-tight text-slate-900 shrink-0">
              무한의 계란
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-slate-400 text-slate-500 truncate">
              TAB {tabMeta.num}/5 · {tabMeta.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg border border-slate-400 text-slate-700">
              BEST {progress.bestDistanceMeters.toLocaleString()}m
            </span>

            <button
              type="button"
              onClick={onToggleMute}
              className="w-8 h-8 rounded-lg border border-slate-900 bg-transparent text-slate-900 flex items-center justify-center active:bg-slate-900/10"
              aria-label="음소거 토글"
            >
              {isMuted ? <VolumeX size={15} className="text-rose-600" /> : <Volume2 size={15} />}
            </button>
          </div>
        </header>

        {/* 2.1b 모바일 전용 컴팩트 에디터 / Undo·Redo / 반영 툴바 (< 840px) */}
        {!isDesktopViewport && (
          <div
            role="toolbar"
            aria-label="모바일 UI 편집 툴바"
            className="w-full px-2 py-1.5 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between gap-1 shrink-0 z-30"
          >
            {!isMobileEditMode ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileEditMode(true);
                    if (!selectedId) {
                      const topEl = [...currentElements].sort((a, b) => b.zIndex - a.zIndex)[0];
                      setSelectedId(topEl?.id ?? null);
                    }
                  }}
                  className="h-8 px-2.5 rounded-lg border border-blue-600 bg-blue-50 text-blue-700 text-[11px] font-black flex items-center gap-1 active:bg-blue-100"
                >
                  <Pencil size={12} />
                  <span>UI 편집</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSyncModalMode('EXPORT')}
                    className={`h-8 px-2.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 ${
                      diffSummary.totalChanges > 0
                        ? 'border-blue-600 bg-white text-blue-700'
                        : 'border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <FileCode2 size={12} />
                    <span>
                      {diffSummary.totalChanges > 0
                        ? `AGY 반영 (${diffSummary.totalChanges})`
                        : '내보내기/불러오기'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={onStartGame}
                    className="h-8 px-2.5 rounded-lg border-2 border-slate-900 bg-white text-slate-900 text-[11px] font-black flex items-center gap-1 active:bg-slate-900/10"
                  >
                    <Play size={11} className="stroke-[2.5]" />
                    <span>플레이</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => setIsMobileEditMode(false)}
                  className="h-8 px-2 rounded-lg border-2 border-slate-900 bg-slate-900 text-white text-[11px] font-black flex items-center gap-0.5 shrink-0"
                >
                  <Check size={12} />
                  <span>완료</span>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={!canUndo}
                    onClick={handleUndo}
                    aria-label="실행 취소"
                    title="실행 취소"
                    className="w-7 h-8 rounded-lg border border-slate-300 bg-white text-slate-800 disabled:opacity-30 flex items-center justify-center active:bg-slate-100"
                  >
                    <Undo2 size={13} />
                  </button>
                  <button
                    type="button"
                    disabled={!canRedo}
                    onClick={handleRedo}
                    aria-label="다시 실행"
                    title="다시 실행"
                    className="w-7 h-8 rounded-lg border border-slate-300 bg-white text-slate-800 disabled:opacity-30 flex items-center justify-center active:bg-slate-100"
                  >
                    <Redo2 size={13} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileLayerOpen(true)}
                  className="h-8 px-1.5 rounded-lg border border-slate-400 bg-white text-slate-800 text-[11px] font-bold flex items-center gap-1 shrink-0"
                >
                  <Layers size={12} />
                  <span>레이어+</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSnapGrid((v) => !v)}
                  className={`h-8 px-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-0.5 shrink-0 ${
                    snapGrid
                      ? 'border-slate-800 bg-slate-200/70 text-slate-900'
                      : 'border-slate-300 bg-white text-slate-500'
                  }`}
                >
                  <Grid size={12} />
                  <span>{snapGrid ? '스냅' : '자유'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSyncModalMode('EXPORT')}
                  className="h-8 px-1.5 rounded-lg border border-blue-600 bg-blue-50 text-blue-700 text-[11px] font-black flex items-center gap-0.5 shrink-0"
                >
                  <FileCode2 size={12} />
                  <span>
                    반영{diffSummary.totalChanges > 0 ? `(${diffSummary.totalChanges})` : ''}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2.2 중앙 탭 캔버스 (개별 와이어프레임 UI 요소 배치 영역) */}
        <main
          onPointerDown={() => {
            if (stageEditable) setSelectedId(null);
          }}
          className="flex-1 w-full overflow-y-auto overflow-x-hidden relative bg-white"
        >
          <div
            style={{
              width: `${MOBILE_STAGE_WIDTH * stageScale}px`,
              height: `${stageHeightPx * stageScale}px`,
            }}
            className="relative mx-auto"
          >
            <div
              style={{
                width: `${MOBILE_STAGE_WIDTH}px`,
                minHeight: `${stageHeightPx}px`,
                transform: stageScale === 1 ? undefined : `scale(${stageScale})`,
                transformOrigin: 'top left',
              }}
              className={`relative ${
                stageEditable
                  ? 'bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]'
                  : 'bg-white'
              }`}
            >
              {sortedForRender.map((el) => (
                <WireframeElementBox
                  key={el.id}
                  element={el}
                  isSelected={stageEditable && el.id === selectedId}
                  editable={stageEditable}
                  onSelectMouseDown={handleSelectMouseDown}
                  onResizeHandleDown={handleResizeHandleDown}
                  onTriggerPlay={onStartGame}
                />
              ))}
            </div>
          </div>
        </main>

        {/* 2.2b 모바일 편집 모드: 선택 요소 플로팅 퀵 액션 바 */}
        {!isDesktopViewport && isMobileEditMode && selectedElement && (
          <div className="w-full px-2.5 py-1.5 border-t border-blue-200 bg-blue-50/95 flex items-center justify-between gap-1.5 shrink-0 z-30">
            <button
              type="button"
              onClick={() => setMobileInspectorOpen(true)}
              className="flex-1 min-w-0 flex items-center gap-1.5 text-left px-2 py-1 rounded-lg bg-white border border-blue-400 active:bg-blue-100/50"
            >
              <span className="px-1 py-0.5 rounded bg-blue-600 text-white text-[9px] font-mono font-bold shrink-0">
                z{selectedElement.zIndex}
              </span>
              <span className="text-[11px] font-black text-slate-900 truncate">
                {selectedElement.name}
              </span>
              <span className="ml-auto inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-700 shrink-0">
                <SlidersHorizontal size={11} />
                <span>속성</span>
              </span>
            </button>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleLayerAction(selectedElement.id, 'UP')}
                className="w-8 h-8 rounded-lg border border-slate-300 bg-white text-slate-800 flex items-center justify-center active:bg-slate-100"
                aria-label="선택 요소 앞으로"
                title="앞으로"
              >
                <ArrowUp size={13} />
              </button>
              <button
                type="button"
                onClick={() => handleLayerAction(selectedElement.id, 'DOWN')}
                className="w-8 h-8 rounded-lg border border-slate-300 bg-white text-slate-800 flex items-center justify-center active:bg-slate-100"
                aria-label="선택 요소 뒤로"
                title="뒤로"
              >
                <ArrowDown size={13} />
              </button>
              <button
                type="button"
                onClick={() => handleDuplicateElement(selectedElement.id)}
                className="w-8 h-8 rounded-lg border border-slate-300 bg-white text-slate-700 flex items-center justify-center active:bg-slate-100"
                aria-label="선택 요소 복제"
                title="복제"
              >
                <Copy size={12} />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteElement(selectedElement.id)}
                className="w-8 h-8 rounded-lg border border-rose-300 bg-white text-rose-600 flex items-center justify-center active:bg-rose-50"
                aria-label="선택 요소 삭제"
                title="삭제"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        )}

        {/* 2.3 하단 5대 탭 네비게이션 */}
        <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {/* 3. 우측 여백: 선택 요소 이름/설명/크기/순서/내보내기 인스펙터 (데스크톱 >= 840px) */}
      {isDesktopViewport && (
        <div className="flex-1 h-full flex justify-start overflow-hidden">
          <RightInspectorPanel
            activeTab={activeTab}
            selectedElement={selectedElement}
            allLayouts={layouts}
            onUpdateElement={handleUpdateElement}
            onLayerAction={handleLayerAction}
            onDuplicateElement={handleDuplicateElement}
            onDeleteElement={handleDeleteElement}
            onResetAll={handleResetAll}
            onOpenSyncModal={(mode) => setSyncModalMode(mode)}
          />
        </div>
      )}

      {/* 4. 모바일 레이어 & 요소 추가 시트 */}
      {!isDesktopViewport && mobileLayerOpen && (
        <MobileLayerSheet
          activeTab={activeTab}
          elements={currentElements}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onCreateElement={handleCreateElement}
          onDeleteElement={handleDeleteElement}
          onDuplicateElement={handleDuplicateElement}
          onLayerAction={handleLayerAction}
          onResetTab={handleResetTab}
          onClose={() => setMobileLayerOpen(false)}
        />
      )}

      {/* 5. 모바일 요소 속성 편집 시트 */}
      {!isDesktopViewport && mobileInspectorOpen && selectedElement && (
        <MobileInspectorSheet
          activeTab={activeTab}
          selectedElement={selectedElement}
          onUpdateElement={handleUpdateElement}
          onLayerAction={handleLayerAction}
          onDuplicateElement={handleDuplicateElement}
          onDeleteElement={handleDeleteElement}
          onClose={() => setMobileInspectorOpen(false)}
        />
      )}

      {/* 6. PC / 모바일 공용 AGY 반영 · 백업 · 불러오기 모달 */}
      {syncModalMode && (
        <LayoutSyncModal
          allLayouts={layouts}
          initialMode={syncModalMode}
          onImportLayouts={handleImportLayouts}
          onResetAll={handleResetAll}
          onClose={() => setSyncModalMode(null)}
        />
      )}
    </div>
  );
};
