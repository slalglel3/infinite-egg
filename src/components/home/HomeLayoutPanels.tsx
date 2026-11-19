import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpToLine,
  Check,
  Copy,
  Eye,
  FileCode2,
  Grid,
  Layers,
  Minus,
  Pencil,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import { HomeTabType } from '../../types/game';
import {
  HomeLayoutElement,
  HomeTabsLayoutMap,
  LayerAction,
  WireframeElementKind,
} from '../../types/homeLayout';
import { HOME_TAB_META, WIREFRAME_KIND_OPTIONS } from '../../data/defaultHomeLayouts';
import { computeLayoutChanges, copyTextWithFallback } from '../../utils/layoutSync';

interface LayerControlsCommonProps {
  activeTab: HomeTabType;
  elements: HomeLayoutElement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateElement: (kind: WireframeElementKind) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onLayerAction: (id: string, action: LayerAction) => void;
  onResetTab: () => void;
}

const LayerManagerContent: React.FC<
  LayerControlsCommonProps & { onAfterSelect?: () => void }
> = ({
  activeTab,
  elements,
  selectedId,
  onSelect,
  onCreateElement,
  onDeleteElement,
  onDuplicateElement,
  onLayerAction,
  onResetTab,
  onAfterSelect,
}) => {
  const [newKind, setNewKind] = useState<WireframeElementKind>('card');
  const sortedFrontFirst = [...elements].sort((a, b) => b.zIndex - a.zIndex);
  const tabInfo = HOME_TAB_META[activeTab];

  return (
    <>
      {/* 신규 요소 생성 컨트롤 */}
      <div className="flex flex-col gap-1.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70">
        <span className="text-[11px] font-bold text-slate-700">
          [{tabInfo.num}. {tabInfo.label}] 새 요소 생성
        </span>
        <div className="flex items-center gap-1.5">
          <select
            value={newKind}
            onChange={(e) => setNewKind(e.target.value as WireframeElementKind)}
            className="flex-1 h-8 px-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 font-medium"
          >
            {WIREFRAME_KIND_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onCreateElement(newKind)}
            className="h-8 px-2.5 rounded-lg border-2 border-slate-900 bg-white text-slate-900 text-xs font-black flex items-center gap-1 hover:bg-slate-900 hover:text-white transition-colors shrink-0"
          >
            <Plus size={14} /> 추가
          </button>
        </div>
      </div>

      {/* 레이어 계층 목록 (앞 -> 뒤) */}
      <div className="flex-1 flex flex-col gap-1.5 min-h-0">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>앞 ↔ 뒤 순서 ({sortedFrontFirst.length}개)</span>
          <button
            type="button"
            onClick={onResetTab}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-900"
          >
            <RotateCcw size={11} /> 이 탭 초기화
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-1 overflow-y-auto pr-0.5">
          {sortedFrontFirst.map((el, idx) => {
            const selected = el.id === selectedId;
            return (
              <div
                key={el.id}
                onClick={() => {
                  onSelect(el.id);
                  onAfterSelect?.();
                }}
                className={`p-2 rounded-lg border flex flex-col gap-1 cursor-pointer transition-colors ${
                  selected
                    ? 'border-blue-600 bg-blue-50/70'
                    : 'border-slate-200 bg-white hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="px-1 py-0.5 rounded bg-slate-100 border border-slate-300 text-[9px] font-mono font-bold text-slate-700 shrink-0">
                      z{el.zIndex}
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate">{el.name}</span>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onLayerAction(el.id, 'UP');
                      }}
                      className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 text-slate-700"
                      title="앞으로 이동"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === sortedFrontFirst.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        onLayerAction(el.id, 'DOWN');
                      }}
                      className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 text-slate-700"
                      title="뒤로 이동"
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateElement(el.id);
                      }}
                      className="p-1.5 rounded hover:bg-slate-200 text-slate-600"
                      title="요소 복제"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteElement(el.id);
                      }}
                      className="p-1.5 rounded hover:bg-rose-100 text-rose-600"
                      title="요소 삭제"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {el.description && (
                  <p className="text-[10px] text-slate-500 truncate pl-0.5">{el.description}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

interface ElementInspectorFormProps {
  selectedElement: HomeLayoutElement;
  onUpdateElement: (id: string, patch: Partial<HomeLayoutElement>) => void;
  onLayerAction: (id: string, action: LayerAction) => void;
  onDuplicateElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
  compactStepControls?: boolean;
}

const RECT_FIELDS: Array<{ field: 'x' | 'y' | 'w' | 'h'; label: string }> = [
  { field: 'x', label: 'X (좌표)' },
  { field: 'y', label: 'Y (좌표)' },
  { field: 'w', label: 'W (너비)' },
  { field: 'h', label: 'H (높이)' },
];

const ElementInspectorForm: React.FC<ElementInspectorFormProps> = ({
  selectedElement,
  onUpdateElement,
  onLayerAction,
  onDuplicateElement,
  onDeleteElement,
  compactStepControls = false,
}) => {
  const nudgeStep = compactStepControls ? 4 : 2;

  return (
    <div className="flex flex-col gap-3">
      {/* 요소 이름 */}
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-bold text-slate-700">요소 이름</span>
        <input
          type="text"
          value={selectedElement.name}
          onChange={(e) => onUpdateElement(selectedElement.id, { name: e.target.value })}
          placeholder="요소 이름 입력"
          className="h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
        />
      </label>

      {/* 요소 설명/메모 */}
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-bold text-slate-700">설명 / 기능 메모</span>
        <textarea
          rows={3}
          value={selectedElement.description}
          onChange={(e) => onUpdateElement(selectedElement.id, { description: e.target.value })}
          placeholder="이 요소의 역할이나 원하는 디자인 설명을 적어주세요"
          className="p-2 rounded-lg border border-slate-300 text-xs text-slate-800 resize-y focus:outline-none focus:border-blue-600"
        />
      </label>

      {/* 와이어프레임 유형 */}
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-bold text-slate-700">와이어프레임 형태</span>
        <select
          value={selectedElement.kind}
          onChange={(e) =>
            onUpdateElement(selectedElement.id, {
              kind: e.target.value as WireframeElementKind,
            })
          }
          className="h-9 px-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 font-medium"
        >
          {WIREFRAME_KIND_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      {/* 좌표 및 크기 수치 + 미세 조정 버튼 */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold text-slate-700">위치 · 크기 (390px 기준)</span>
        <div className="grid grid-cols-2 gap-1.5">
          {RECT_FIELDS.map(({ field, label }) => (
            <div
              key={field}
              className="flex flex-col gap-1 px-2 py-1.5 rounded-lg border border-slate-300 bg-slate-50/60"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono text-slate-500">{label}</span>
                <input
                  type="number"
                  value={Math.round(selectedElement[field])}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (Number.isFinite(val)) {
                      onUpdateElement(selectedElement.id, { [field]: val });
                    }
                  }}
                  className="w-14 text-right bg-transparent text-xs font-mono font-bold text-slate-900 focus:outline-none"
                />
              </div>
              {compactStepControls && (
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateElement(selectedElement.id, {
                        [field]: selectedElement[field] - nudgeStep,
                      })
                    }
                    className="h-6 rounded border border-slate-300 bg-white text-slate-700 flex items-center justify-center active:bg-slate-200"
                    aria-label={`${label} 감소`}
                  >
                    <Minus size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateElement(selectedElement.id, {
                        [field]: selectedElement[field] + nudgeStep,
                      })
                    }
                    className="h-6 rounded border border-slate-300 bg-white text-slate-700 flex items-center justify-center active:bg-slate-200"
                    aria-label={`${label} 증가`}
                  >
                    <Plus size={11} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 앞/뒤 레이어 순서 */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-700">앞뒤 배치 순서</span>
          <span className="text-[11px] font-mono font-bold text-blue-700">
            현재 z:{selectedElement.zIndex}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          <button
            type="button"
            onClick={() => onLayerAction(selectedElement.id, 'BOTTOM')}
            className="py-1.5 rounded-lg border border-slate-300 text-[10px] font-bold text-slate-700 hover:bg-slate-100 flex flex-col items-center gap-0.5"
          >
            <ArrowDownToLine size={12} /> 맨 뒤
          </button>
          <button
            type="button"
            onClick={() => onLayerAction(selectedElement.id, 'DOWN')}
            className="py-1.5 rounded-lg border border-slate-300 text-[10px] font-bold text-slate-700 hover:bg-slate-100 flex flex-col items-center gap-0.5"
          >
            <ArrowDown size={12} /> 뒤로
          </button>
          <button
            type="button"
            onClick={() => onLayerAction(selectedElement.id, 'UP')}
            className="py-1.5 rounded-lg border border-slate-300 text-[10px] font-bold text-slate-700 hover:bg-slate-100 flex flex-col items-center gap-0.5"
          >
            <ArrowUp size={12} /> 앞으로
          </button>
          <button
            type="button"
            onClick={() => onLayerAction(selectedElement.id, 'TOP')}
            className="py-1.5 rounded-lg border border-slate-300 text-[10px] font-bold text-slate-700 hover:bg-slate-100 flex flex-col items-center gap-0.5"
          >
            <ArrowUpToLine size={12} /> 맨 앞
          </button>
        </div>
      </div>

      {/* 복제 / 삭제 */}
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        <button
          type="button"
          onClick={() => onDuplicateElement(selectedElement.id)}
          className="h-9 rounded-lg border border-slate-400 text-xs font-bold text-slate-800 hover:bg-slate-100 flex items-center justify-center gap-1"
        >
          <Copy size={12} /> 복제
        </button>
        <button
          type="button"
          onClick={() => onDeleteElement(selectedElement.id)}
          className="h-9 rounded-lg border border-rose-400 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-1"
        >
          <Trash2 size={12} /> 삭제
        </button>
      </div>
    </div>
  );
};

interface LeftLayerPanelProps extends LayerControlsCommonProps {
  onTabChange: (tab: HomeTabType) => void;
  isPreviewMode: boolean;
  onTogglePreview: () => void;
  snapGrid: boolean;
  onToggleSnap: () => void;
  onStartGame: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
  onUndo: () => void;
  onRedo: () => void;
}

export const LeftLayerPanel: React.FC<LeftLayerPanelProps> = ({
  activeTab,
  onTabChange,
  elements,
  selectedId,
  onSelect,
  onCreateElement,
  onDeleteElement,
  onDuplicateElement,
  onLayerAction,
  onResetTab,
  isPreviewMode,
  onTogglePreview,
  snapGrid,
  onToggleSnap,
  onStartGame,
  canUndo,
  canRedo,
  undoCount,
  redoCount,
  onUndo,
  onRedo,
}) => {
  return (
    <aside className="flex flex-col h-full w-full max-w-[330px] bg-white border-r border-slate-200 p-3 gap-3 overflow-y-auto select-none">
      {/* 상단 에디터 상태 & 플레이 테스트 버튼 */}
      <div className="flex flex-col gap-2 pb-2.5 border-b border-slate-200">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
            <Layers size={14} /> UI 레이어 & 요소
          </span>
          <button
            type="button"
            onClick={onStartGame}
            className="px-2.5 py-1 rounded-lg border-2 border-slate-900 text-[11px] font-black text-slate-900 hover:bg-slate-900/5 flex items-center gap-1"
            title="플레이 화면 테스트 실행"
          >
            <Play size={11} className="stroke-[2.5]" />
            <span>플레이 시작</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={onTogglePreview}
            className={`h-8 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1 ${
              !isPreviewMode
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {isPreviewMode ? <Eye size={13} /> : <Pencil size={13} />}
            <span>{isPreviewMode ? '미리보기 중' : '편집 모드'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleSnap}
            className={`h-8 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1 ${
              snapGrid
                ? 'border-slate-800 bg-slate-900/5 text-slate-900'
                : 'border-slate-300 text-slate-500'
            }`}
          >
            <Grid size={12} />
            <span>{snapGrid ? '스냅 4px' : '자유 이동'}</span>
          </button>
        </div>

        {/* Undo / Redo 히스토리 컨트롤 */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            title="실행 취소 (Ctrl+Z)"
            aria-label="실행 취소"
            className="h-8 rounded-lg border border-slate-300 bg-white text-[11px] font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-1"
          >
            <Undo2 size={13} />
            <span>실행취소{undoCount > 0 ? ` (${undoCount})` : ''}</span>
          </button>

          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            title="다시 실행 (Ctrl+Y / Ctrl+Shift+Z)"
            aria-label="다시 실행"
            className="h-8 rounded-lg border border-slate-300 bg-white text-[11px] font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-1"
          >
            <Redo2 size={13} />
            <span>다시실행{redoCount > 0 ? ` (${redoCount})` : ''}</span>
          </button>
        </div>

        {/* 5대 탭 빠른 전환 */}
        <div className="grid grid-cols-5 gap-1">
          {(['EGGS', 'EVENTS', 'MAIN', 'MISSIONS', 'SHOP'] as HomeTabType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTabChange(t)}
              className={`py-1 rounded text-[10px] font-bold border ${
                activeTab === t
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 text-slate-600 hover:border-slate-500'
              }`}
            >
              {HOME_TAB_META[t].num}.{HOME_TAB_META[t].label}
            </button>
          ))}
        </div>
      </div>

      <LayerManagerContent
        activeTab={activeTab}
        elements={elements}
        selectedId={selectedId}
        onSelect={onSelect}
        onCreateElement={onCreateElement}
        onDeleteElement={onDeleteElement}
        onDuplicateElement={onDuplicateElement}
        onLayerAction={onLayerAction}
        onResetTab={onResetTab}
      />
    </aside>
  );
};

interface RightInspectorPanelProps {
  activeTab: HomeTabType;
  selectedElement: HomeLayoutElement | null;
  allLayouts: HomeTabsLayoutMap;
  onUpdateElement: (id: string, patch: Partial<HomeLayoutElement>) => void;
  onLayerAction: (id: string, action: LayerAction) => void;
  onDuplicateElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
  onResetAll: () => void;
  onOpenSyncModal: (mode: 'EXPORT' | 'IMPORT') => void;
}

export const RightInspectorPanel: React.FC<RightInspectorPanelProps> = ({
  activeTab,
  selectedElement,
  allLayouts,
  onUpdateElement,
  onLayerAction,
  onDuplicateElement,
  onDeleteElement,
  onResetAll,
  onOpenSyncModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const exportPayload = useMemo(() => JSON.stringify(allLayouts, null, 2), [allLayouts]);
  const diff = useMemo(() => computeLayoutChanges(allLayouts), [allLayouts]);

  const handleCopySpec = async () => {
    const res = await copyTextWithFallback(exportPayload);
    if (res === 'manual') {
      setShowJson(true);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <aside className="flex flex-col h-full w-full max-w-[330px] bg-white border-l border-slate-200 p-3 gap-3 overflow-y-auto">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <span className="text-xs font-black text-slate-900">요소 속성 편집</span>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-300 text-slate-500">
          {HOME_TAB_META[activeTab].eng}
        </span>
      </div>

      {selectedElement ? (
        <ElementInspectorForm
          selectedElement={selectedElement}
          onUpdateElement={onUpdateElement}
          onLayerAction={onLayerAction}
          onDuplicateElement={onDuplicateElement}
          onDeleteElement={onDeleteElement}
        />
      ) : (
        <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
          가운데 모바일 화면에서 요소를 클릭하거나 좌측 목록에서 선택해 수정하세요.
        </div>
      )}

      {/* 하단 저장/AGY 반영/내보내기 */}
      <div className="mt-auto pt-3 border-t border-slate-200 flex flex-col gap-1.5">
        <span className="text-[10px] font-mono text-slate-400">
          수정 사항은 브라우저에 자동 저장됩니다.
        </span>

        <button
          type="button"
          onClick={() => onOpenSyncModal('EXPORT')}
          className="h-9 rounded-lg border-2 border-blue-600 bg-blue-50 text-blue-800 text-xs font-black hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
        >
          <FileCode2 size={14} />
          <span>
            AGY 반영 · 파일 내보내기/불러오기
            {diff.totalChanges > 0 ? ` (${diff.totalChanges}건)` : ''}
          </span>
        </button>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={handleCopySpec}
            className="h-8 rounded-lg border-2 border-slate-900 text-xs font-black text-slate-900 hover:bg-slate-900 hover:text-white transition-colors flex items-center justify-center gap-1"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? '복사됨!' : '스펙 JSON 복사'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowJson((v) => !v)}
            className="h-8 rounded-lg border border-slate-400 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            {showJson ? 'JSON 닫기' : 'JSON 보기'}
          </button>
        </div>

        {showJson && (
          <textarea
            readOnly
            rows={7}
            value={exportPayload}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full p-2 rounded-lg border border-slate-300 bg-slate-50 font-mono text-[10px] text-slate-700"
          />
        )}

        <button
          type="button"
          onClick={onResetAll}
          className="h-7 rounded-lg border border-slate-300 text-[11px] font-bold text-slate-500 hover:text-rose-600 hover:border-rose-300 flex items-center justify-center gap-1"
        >
          <RotateCcw size={11} /> 5개 탭 모두 기본값 복원
        </button>
      </div>
    </aside>
  );
};

/* ============================================================================
   모바일/좁은 화면 전용 바텀시트 (데스크톱 test의 aside 카운트 0 유지를 위해 div 사용)
   ============================================================================ */

interface MobileLayerSheetProps extends LayerControlsCommonProps {
  onClose: () => void;
}

export const MobileLayerSheet: React.FC<MobileLayerSheetProps> = ({
  activeTab,
  elements,
  selectedId,
  onSelect,
  onCreateElement,
  onDeleteElement,
  onDuplicateElement,
  onLayerAction,
  onResetTab,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/45 flex items-end justify-center select-none"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="모바일 레이어 및 요소 추가"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[460px] max-h-[82dvh] bg-white border-t-2 border-slate-900 rounded-t-2xl p-3.5 flex flex-col gap-3 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 shrink-0">
          <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
            <Layers size={14} /> [{HOME_TAB_META[activeTab].label}] 레이어 & 요소 추가
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center text-slate-600"
            aria-label="레이어 닫기"
          >
            <X size={15} />
          </button>
        </div>

        <LayerManagerContent
          activeTab={activeTab}
          elements={elements}
          selectedId={selectedId}
          onSelect={onSelect}
          onCreateElement={onCreateElement}
          onDeleteElement={onDeleteElement}
          onDuplicateElement={onDuplicateElement}
          onLayerAction={onLayerAction}
          onResetTab={onResetTab}
          onAfterSelect={onClose}
        />
      </div>
    </div>
  );
};

interface MobileInspectorSheetProps {
  activeTab: HomeTabType;
  selectedElement: HomeLayoutElement;
  onUpdateElement: (id: string, patch: Partial<HomeLayoutElement>) => void;
  onLayerAction: (id: string, action: LayerAction) => void;
  onDuplicateElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
  onClose: () => void;
}

export const MobileInspectorSheet: React.FC<MobileInspectorSheetProps> = ({
  activeTab,
  selectedElement,
  onUpdateElement,
  onLayerAction,
  onDuplicateElement,
  onDeleteElement,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/45 flex items-end justify-center select-none"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="모바일 요소 속성 편집"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[460px] max-h-[85dvh] bg-white border-t-2 border-slate-900 rounded-t-2xl p-3.5 flex flex-col gap-3 shadow-2xl overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-black text-slate-900 truncate">
              속성 편집 · {selectedElement.name}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-300 text-slate-500 shrink-0">
              {HOME_TAB_META[activeTab].eng}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center text-slate-600 shrink-0"
            aria-label="속성 편집 닫기"
          >
            <X size={15} />
          </button>
        </div>

        <ElementInspectorForm
          selectedElement={selectedElement}
          onUpdateElement={onUpdateElement}
          onLayerAction={onLayerAction}
          onDuplicateElement={onDuplicateElement}
          onDeleteElement={(id) => {
            onDeleteElement(id);
            onClose();
          }}
          compactStepControls
        />
      </div>
    </div>
  );
};
