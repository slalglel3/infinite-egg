import React, { useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileCode2,
  FolderOpen,
  RotateCcw,
  Share2,
  Upload,
  X,
} from 'lucide-react';
import { HOME_TAB_META } from '../../data/defaultHomeLayouts';
import { HomeTabsLayoutMap } from '../../types/homeLayout';
import {
  computeLayoutChanges,
  copyTextWithFallback,
  downloadLayoutJsonFile,
  formatAgySyncPrompt,
  parseLayoutImportText,
  shareLayoutSpec,
} from '../../utils/layoutSync';

interface LayoutSyncModalProps {
  allLayouts: HomeTabsLayoutMap;
  initialMode?: 'EXPORT' | 'IMPORT';
  onImportLayouts: (next: HomeTabsLayoutMap) => void;
  onResetAll: () => void;
  onClose: () => void;
}

export const LayoutSyncModal: React.FC<LayoutSyncModalProps> = ({
  allLayouts,
  initialMode = 'EXPORT',
  onImportLayouts,
  onResetAll,
  onClose,
}) => {
  const [mode, setMode] = useState<'EXPORT' | 'IMPORT'>(initialMode);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState(false);
  const [importText, setImportText] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const rawTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const diff = useMemo(() => computeLayoutChanges(allLayouts), [allLayouts]);
  const agyPromptText = useMemo(() => formatAgySyncPrompt(allLayouts), [allLayouts]);
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const showTempStatus = (msg: string) => {
    setErrorMsg(null);
    setStatusMsg(msg);
    setTimeout(() => {
      setStatusMsg((cur) => (cur === msg ? null : cur));
    }, 2800);
  };

  const handleCopyPrompt = async () => {
    const result = await copyTextWithFallback(agyPromptText);
    if (result === 'manual') {
      setShowRawText(true);
      setTimeout(() => {
        rawTextareaRef.current?.focus();
        rawTextareaRef.current?.select();
      }, 40);
      showTempStatus('자동 복사가 차단되었습니다. 아래 영역을 길게 눌러 복사해 주세요.');
      return;
    }
    showTempStatus('AI(AGY) 반영 요청이 복사되었습니다! 채팅창에 그대로 붙여넣어 주세요.');
  };

  const handleShare = async () => {
    const res = await shareLayoutSpec(allLayouts);
    if (res === 'shared') {
      showTempStatus('공유 완료! 전달된 텍스트나 파일을 AGY에 전달하면 바로 반영됩니다.');
    } else if (res === 'unsupported') {
      await handleCopyPrompt();
    }
  };

  const handleDownloadJson = () => {
    const filename = downloadLayoutJsonFile(allLayouts);
    showTempStatus(`${filename} 파일이 저장되었습니다.`);
  };

  const handleApplyImport = (raw: string) => {
    try {
      const parsed = parseLayoutImportText(raw, allLayouts);
      onImportLayouts(parsed.layouts);
      setErrorMsg(null);
      showTempStatus(
        `${parsed.updatedTabs.length}개 탭(${parsed.totalElements}개 요소) 레이아웃을 불러왔습니다!`
      );
      setTimeout(() => {
        onClose();
      }, 650);
    } catch (err) {
      setStatusMsg(null);
      setErrorMsg(err instanceof Error ? err.message : '레이아웃 불러오기에 실패했습니다.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      setImportText(content);
      handleApplyImport(content);
    };
    reader.onerror = () => {
      setErrorMsg('파일을 읽는 중 오류가 발생했습니다.');
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[1px] flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="수정사항 반영 및 백업"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[520px] max-h-[90dvh] bg-white border-t-2 sm:border-2 border-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* 헤더 */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileCode2 size={17} className="text-slate-900 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-black text-slate-900 truncate">
                수정사항 AGY 반영 · 백업
              </h3>
              <p className="text-[10px] font-mono text-slate-500 truncate">
                기본값 대비 변경 {diff.totalChanges}건 (추가 {diff.addedCount} · 수정{' '}
                {diff.modifiedCount} · 삭제 {diff.removedCount})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 shrink-0"
            aria-label="닫기"
          >
            <X size={16} />
          </button>
        </div>

        {/* 모드 전환 탭 */}
        <div className="px-4 pt-2.5 pb-2 border-b border-slate-200 grid grid-cols-2 gap-2 shrink-0 bg-slate-50/70">
          <button
            type="button"
            onClick={() => {
              setMode('EXPORT');
              setErrorMsg(null);
            }}
            className={`h-9 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 ${
              mode === 'EXPORT'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-300 bg-white text-slate-600'
            }`}
          >
            <Upload size={13} />
            <span>내보내기 / AGY 반영</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('IMPORT');
              setErrorMsg(null);
            }}
            className={`h-9 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 ${
              mode === 'IMPORT'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-300 bg-white text-slate-600'
            }`}
          >
            <FolderOpen size={13} />
            <span>불러오기 (이어 편집)</span>
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {statusMsg && (
            <div className="px-3 py-2 rounded-xl border border-emerald-600 bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
              <Check size={14} className="shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="px-3 py-2 rounded-xl border border-rose-500 bg-rose-50 text-rose-700 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {mode === 'EXPORT' ? (
            <>
              {/* 반영 방법 3단계 요약 */}
              <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/60 flex flex-col gap-1">
                <span className="text-[11px] font-black text-blue-900">
                  모바일/PC 수정본을 코드에 반영하는 방법
                </span>
                <ol className="text-[11px] text-blue-900/90 leading-relaxed list-decimal pl-4 space-y-0.5">
                  <li>
                    아래 <strong>[AI 반영 요청 복사]</strong> 또는{' '}
                    <strong>[공유하기 / JSON 저장]</strong>을 누릅니다.
                  </li>
                  <li>AGY 대화창에 복사한 내용이나 `.json` 파일을 그대로 전달합니다.</li>
                  <li>
                    AGY가 <code>apply-layout</code>으로 원본 코드에 반영 후 새 릴리즈를 배포합니다.
                  </li>
                </ol>
              </div>

              {/* 변경점 Diff 목록 */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-slate-700">
                  감지된 변경 내역 ({diff.totalChanges}건)
                </span>
                {diff.totalChanges === 0 ? (
                  <div className="p-3 rounded-xl border border-dashed border-slate-300 text-[11px] text-slate-500 text-center">
                    현재 기본 레이아웃과 동일합니다. 요소를 드래그하거나 이름/크기를 바꾸면 변경
                    내역이 자동 요약됩니다.
                  </div>
                ) : (
                  <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/60 p-2 flex flex-col gap-1">
                    {diff.changes.map((c) => (
                      <div
                        key={`${c.tab}-${c.type}-${c.id}`}
                        className="text-[11px] leading-snug px-2 py-1 rounded-lg bg-white border border-slate-200 flex items-start gap-1.5"
                      >
                        <span
                          className={`px-1 py-0.2 rounded text-[9px] font-mono font-black shrink-0 mt-0.5 ${
                            c.type === 'ADDED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.type === 'REMOVED'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {c.type === 'ADDED' ? '추가' : c.type === 'REMOVED' ? '삭제' : '수정'}
                        </span>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900">
                            [{HOME_TAB_META[c.tab].label}] {c.name}
                          </span>
                          <p className="text-[10px] font-mono text-slate-500 break-words">
                            {c.summary}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 전달 버튼 그룹 */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="h-11 rounded-xl border-2 border-slate-900 bg-slate-900 text-white text-xs font-black flex items-center justify-center gap-1.5 active:opacity-90"
                >
                  <Copy size={15} />
                  <span>AI 반영 요청 복사 (변경요약 + JSON)</span>
                </button>

                <div className={`grid gap-2 ${canNativeShare ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {canNativeShare && (
                    <button
                      type="button"
                      onClick={handleShare}
                      className="h-10 rounded-xl border-2 border-blue-600 bg-blue-50 text-blue-700 text-xs font-black flex items-center justify-center gap-1.5 active:bg-blue-100"
                    >
                      <Share2 size={14} />
                      <span>모바일 공유하기</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="h-10 rounded-xl border border-slate-400 bg-white text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50 active:bg-slate-100"
                  >
                    <Download size={14} />
                    <span>JSON 파일 저장</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRawText((v) => !v)}
                  className="h-8 rounded-lg border border-slate-300 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
                >
                  {showRawText ? '반영 텍스트 숨기기' : '반영 텍스트 직접 보기 / 수동 복사'}
                </button>

                {showRawText && (
                  <textarea
                    ref={rawTextareaRef}
                    readOnly
                    rows={6}
                    value={agyPromptText}
                    onFocus={(e) => e.currentTarget.select()}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-mono text-[10px] text-slate-800"
                  />
                )}
              </div>

              {/* 전체 초기화 */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="w-full h-9 rounded-xl border border-slate-300 text-[11px] font-bold text-slate-500 hover:text-rose-600 hover:border-rose-300 flex items-center justify-center gap-1"
                  >
                    <RotateCcw size={12} /> 5개 탭 모두 기본값 복원
                  </button>
                ) : (
                  <div className="w-full flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onResetAll();
                        setConfirmReset(false);
                        showTempStatus('5개 탭을 모두 기본값으로 복원했습니다.');
                      }}
                      className="flex-1 h-9 rounded-xl border-2 border-rose-600 bg-rose-600 text-white text-xs font-black"
                    >
                      정말 초기화하기
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="h-9 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
                    >
                      취소
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                저장해 둔 <code>.json</code> 파일을 선택하거나, 복사해 둔{' '}
                <strong>AI 반영 요청 텍스트 / JSON</strong>을 아래에 붙여넣어 이어서 편집할 수
                있습니다.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.txt,application/json,text/plain"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-10 rounded-xl border-2 border-dashed border-slate-500 bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-100"
              >
                <FolderOpen size={15} />
                <span>.json / .txt 파일 열기</span>
              </button>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-slate-700">
                  또는 스펙 텍스트 / JSON 붙여넣기
                </span>
                <textarea
                  rows={7}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={'{"MAIN": [...]} 또는 복사한 [무한의 계란 UI 레이아웃 수정 반영 요청] 전체 붙여넣기'}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono text-[11px] text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </label>

              <button
                type="button"
                onClick={() => handleApplyImport(importText)}
                className="h-11 rounded-xl border-2 border-slate-900 bg-slate-900 text-white text-xs font-black flex items-center justify-center gap-1.5"
              >
                <Check size={15} />
                <span>붙여넣은 레이아웃 적용하기</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
