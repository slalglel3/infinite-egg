import {
  clampElementRect,
  cloneDefaultAllLayouts,
  HOME_TAB_META,
  normalizeTabZOrder,
} from '../data/defaultHomeLayouts';
import { HomeTabType } from '../types/game';
import {
  HomeLayoutElement,
  HomeTabsLayoutMap,
  WireframeElementKind,
} from '../types/homeLayout';

export const LAYOUT_SYNC_FENCE = 'infinite-egg-layout-v1';

const ALL_TABS: HomeTabType[] = ['EGGS', 'EVENTS', 'MAIN', 'ACHIEVEMENTS', 'SHOP'];

const VALID_KINDS = new Set<WireframeElementKind>([
  'card',
  'button',
  'play-button',
  'avatar',
  'progress',
  'segmented',
  'slot-grid',
  'list-row',
  'banner',
  'badge',
  'text',
]);

export interface LayoutElementChange {
  tab: HomeTabType;
  type: 'ADDED' | 'MODIFIED' | 'REMOVED';
  id: string;
  name: string;
  summary: string;
}

export interface LayoutDiffSummary {
  totalChanges: number;
  addedCount: number;
  modifiedCount: number;
  removedCount: number;
  changes: LayoutElementChange[];
}

export interface LayoutSyncEnvelope {
  version: 1;
  app: 'infinite-egg';
  exportedAt: string;
  layouts: HomeTabsLayoutMap;
}

export function computeLayoutChanges(
  current: HomeTabsLayoutMap,
  baseline: HomeTabsLayoutMap = cloneDefaultAllLayouts()
): LayoutDiffSummary {
  const changes: LayoutElementChange[] = [];
  let addedCount = 0;
  let modifiedCount = 0;
  let removedCount = 0;

  for (const tab of ALL_TABS) {
    const baseList = baseline[tab] ?? [];
    const curList = current[tab] ?? [];
    const baseById = new Map(baseList.map((el) => [el.id, el]));
    const curById = new Map(curList.map((el) => [el.id, el]));

    for (const cur of curList) {
      const base = baseById.get(cur.id);
      if (!base) {
        addedCount += 1;
        changes.push({
          tab,
          type: 'ADDED',
          id: cur.id,
          name: cur.name,
          summary: `신규 (${cur.kind}, x:${Math.round(cur.x)}, y:${Math.round(cur.y)}, ${Math.round(cur.w)}×${Math.round(cur.h)}, z:${cur.zIndex})`,
        });
        continue;
      }

      const diffs: string[] = [];
      if (base.name !== cur.name) {
        diffs.push(`이름 "${base.name}"→"${cur.name}"`);
      }
      if (base.description !== cur.description) {
        diffs.push(`설명 "${cur.description}"`);
      }
      if (base.kind !== cur.kind) {
        diffs.push(`형태 ${base.kind}→${cur.kind}`);
      }
      if (Math.round(base.x) !== Math.round(cur.x) || Math.round(base.y) !== Math.round(cur.y)) {
        diffs.push(
          `위치 (${Math.round(base.x)},${Math.round(base.y)})→(${Math.round(cur.x)},${Math.round(cur.y)})`
        );
      }
      if (Math.round(base.w) !== Math.round(cur.w) || Math.round(base.h) !== Math.round(cur.h)) {
        diffs.push(
          `크기 ${Math.round(base.w)}×${Math.round(base.h)}→${Math.round(cur.w)}×${Math.round(cur.h)}`
        );
      }
      if (base.zIndex !== cur.zIndex) {
        diffs.push(`순서 z:${base.zIndex}→z:${cur.zIndex}`);
      }

      if (diffs.length > 0) {
        modifiedCount += 1;
        changes.push({
          tab,
          type: 'MODIFIED',
          id: cur.id,
          name: cur.name,
          summary: diffs.join(', '),
        });
      }
    }

    for (const base of baseList) {
      if (!curById.has(base.id)) {
        removedCount += 1;
        changes.push({
          tab,
          type: 'REMOVED',
          id: base.id,
          name: base.name,
          summary: '요소 삭제됨',
        });
      }
    }
  }

  return {
    totalChanges: changes.length,
    addedCount,
    modifiedCount,
    removedCount,
    changes,
  };
}

export function createLayoutEnvelope(layouts: HomeTabsLayoutMap): LayoutSyncEnvelope {
  const normalized: HomeTabsLayoutMap = {
    EGGS: normalizeTabZOrder((layouts.EGGS ?? []).map((el) => ({ ...el, ...clampElementRect(el) }))),
    EVENTS: normalizeTabZOrder((layouts.EVENTS ?? []).map((el) => ({ ...el, ...clampElementRect(el) }))),
    MAIN: normalizeTabZOrder((layouts.MAIN ?? []).map((el) => ({ ...el, ...clampElementRect(el) }))),
    ACHIEVEMENTS: normalizeTabZOrder(
      (layouts.ACHIEVEMENTS ?? []).map((el) => ({ ...el, ...clampElementRect(el) }))
    ),
    SHOP: normalizeTabZOrder((layouts.SHOP ?? []).map((el) => ({ ...el, ...clampElementRect(el) }))),
  };

  return {
    version: 1,
    app: 'infinite-egg',
    exportedAt: new Date().toISOString(),
    layouts: normalized,
  };
}

export function formatAgySyncPrompt(
  layouts: HomeTabsLayoutMap,
  baseline: HomeTabsLayoutMap = cloneDefaultAllLayouts()
): string {
  const diff = computeLayoutChanges(layouts, baseline);
  const envelope = createLayoutEnvelope(layouts);
  const compactJson = JSON.stringify(envelope);

  const lines: string[] = [
    '[무한의 계란 UI 레이아웃 수정 반영 요청]',
    '아래 변경 내역과 레이아웃 스펙을 `src/data/defaultHomeLayouts.ts`에 반영하고 빌드/배포해 주세요.',
    '(적용 명령: `npm run apply-layout -- --stdin`)',
    '',
  ];

  if (diff.totalChanges === 0) {
    lines.push('### 변경 요약: 기본 레이아웃과 동일 (0건)');
  } else {
    lines.push(
      `### 변경 요약 (총 ${diff.totalChanges}건: 추가 ${diff.addedCount}, 수정 ${diff.modifiedCount}, 삭제 ${diff.removedCount})`
    );
    for (const item of diff.changes) {
      const tabLabel = `${HOME_TAB_META[item.tab].label}(${item.tab})`;
      const prefix = item.type === 'ADDED' ? '+' : item.type === 'REMOVED' ? '-' : '~';
      lines.push(`- ${prefix} [${tabLabel}] "${item.name}" (id: ${item.id}): ${item.summary}`);
    }
  }

  lines.push('', `\`\`\`${LAYOUT_SYNC_FENCE}`, compactJson, '```');
  return lines.join('\n');
}

function sanitizeElement(raw: unknown, idx: number, tab: HomeTabType): HomeLayoutElement | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (
    typeof o.x !== 'number' ||
    !Number.isFinite(o.x) ||
    typeof o.y !== 'number' ||
    !Number.isFinite(o.y) ||
    typeof o.w !== 'number' ||
    !Number.isFinite(o.w) ||
    typeof o.h !== 'number' ||
    !Number.isFinite(o.h)
  ) {
    return null;
  }

  const kind: WireframeElementKind =
    typeof o.kind === 'string' && VALID_KINDS.has(o.kind as WireframeElementKind)
      ? (o.kind as WireframeElementKind)
      : 'card';
  const id =
    typeof o.id === 'string' && o.id.trim()
      ? o.id.trim()
      : `${tab.toLowerCase()}-imported-${idx + 1}`;
  const name = typeof o.name === 'string' && o.name.trim() ? o.name : `요소 ${idx + 1}`;
  const description = typeof o.description === 'string' ? o.description : '';
  const zIndex = typeof o.zIndex === 'number' && Number.isFinite(o.zIndex) ? o.zIndex : idx + 1;

  const rect = clampElementRect({ x: o.x, y: o.y, w: o.w, h: o.h });
  return {
    id,
    name,
    description,
    kind,
    ...rect,
    zIndex,
  };
}

function extractJsonCandidate(rawText: string): string {
  const trimmed = rawText.trim();
  const fenceRegex = new RegExp(
    `\`\`\`(?:${LAYOUT_SYNC_FENCE}|json)?\\s*([\\s\\S]*?)\\s*\`\`\``,
    'i'
  );
  const fenceMatch = trimmed.match(fenceRegex);
  if (fenceMatch && fenceMatch[1]) {
    return fenceMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

export function parseLayoutImportText(
  rawText: string,
  fallbackBase: HomeTabsLayoutMap = cloneDefaultAllLayouts()
): { layouts: HomeTabsLayoutMap; updatedTabs: HomeTabType[]; totalElements: number } {
  if (!rawText || !rawText.trim()) {
    throw new Error('불러올 JSON 또는 반영 요청 텍스트가 비어 있습니다.');
  }

  const candidateText = extractJsonCandidate(rawText);
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidateText);
  } catch {
    throw new Error('유효한 JSON 형식이 아닙니다. 복사한 스펙 전체 또는 JSON을 확인해 주세요.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('레이아웃 객체 형식이 아닙니다.');
  }

  const root = parsed as Record<string, unknown>;
  const sourceMap =
    root.layouts && typeof root.layouts === 'object'
      ? (root.layouts as Record<string, unknown>)
      : root;

  const result: HomeTabsLayoutMap = {
    EGGS: normalizeTabZOrder(fallbackBase.EGGS.map((el) => ({ ...el }))),
    EVENTS: normalizeTabZOrder(fallbackBase.EVENTS.map((el) => ({ ...el }))),
    MAIN: normalizeTabZOrder(fallbackBase.MAIN.map((el) => ({ ...el }))),
    ACHIEVEMENTS: normalizeTabZOrder(fallbackBase.ACHIEVEMENTS.map((el) => ({ ...el }))),
    SHOP: normalizeTabZOrder(fallbackBase.SHOP.map((el) => ({ ...el }))),
  };

  const updatedTabs: HomeTabType[] = [];
  let totalElements = 0;

  for (const tab of ALL_TABS) {
    const rawList = sourceMap[tab];
    if (!Array.isArray(rawList)) continue;

    const sanitized: HomeLayoutElement[] = [];
    for (let i = 0; i < rawList.length; i += 1) {
      const item = sanitizeElement(rawList[i], i, tab);
      if (item) sanitized.push(item);
    }

    result[tab] = normalizeTabZOrder(sanitized);
    updatedTabs.push(tab);
    totalElements += result[tab].length;
  }

  if (updatedTabs.length === 0) {
    throw new Error('EGGS, EVENTS, MAIN, ACHIEVEMENTS, SHOP 탭 데이터를 찾을 수 없습니다.');
  }

  return { layouts: result, updatedTabs, totalElements };
}

export async function copyTextWithFallback(
  text: string
): Promise<'clipboard' | 'execCommand' | 'manual'> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return 'clipboard';
    } catch {
      // file:// 비보안 컨텍스트 등에서는 fallback 시도
    }
  }

  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (ok) return 'execCommand';
    } catch {
      // manual copy 모드로 전환
    }
  }

  return 'manual';
}

export function downloadLayoutJsonFile(layouts: HomeTabsLayoutMap): string {
  const envelope = createLayoutEnvelope(layouts);
  const json = JSON.stringify(envelope, null, 2);
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '-',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
  ].join('');
  const filename = `infinite-egg-layout-${stamp}.json`;

  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  return filename;
}

export async function shareLayoutSpec(
  layouts: HomeTabsLayoutMap
): Promise<'shared' | 'unsupported' | 'cancelled'> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return 'unsupported';
  }

  const promptText = formatAgySyncPrompt(layouts);
  const envelope = createLayoutEnvelope(layouts);
  const json = JSON.stringify(envelope, null, 2);

  try {
    if (typeof File !== 'undefined' && typeof navigator.canShare === 'function') {
      const file = new File([json], 'infinite-egg-layout.json', {
        type: 'application/json',
      });
      if (navigator.canShare({ files: [file], text: promptText })) {
        await navigator.share({
          title: '무한의 계란 UI 레이아웃 수정본',
          text: promptText,
          files: [file],
        });
        return 'shared';
      }
    }

    await navigator.share({
      title: '무한의 계란 UI 레이아웃 수정본',
      text: promptText,
    });
    return 'shared';
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return 'cancelled';
    }
    try {
      await navigator.share({
        title: '무한의 계란 UI 레이아웃 수정본',
        text: promptText,
      });
      return 'shared';
    } catch (innerErr) {
      if (innerErr instanceof Error && innerErr.name === 'AbortError') {
        return 'cancelled';
      }
      return 'unsupported';
    }
  }
}

export function encodeLayoutsToUrlHash(layouts: HomeTabsLayoutMap): string | null {
  try {
    const json = JSON.stringify(createLayoutEnvelope(layouts));
    const bytes = new TextEncoder().encode(json);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64url = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    return `#layout=${base64url}`;
  } catch {
    return null;
  }
}

export function decodeLayoutsFromUrlHash(hash: string): HomeTabsLayoutMap | null {
  try {
    if (!hash || !hash.startsWith('#layout=')) return null;
    const raw = hash.slice('#layout='.length).trim();
    if (!raw) return null;
    const padded = raw.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((raw.length + 3) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    const text = new TextDecoder().decode(bytes);
    return parseLayoutImportText(text).layouts;
  } catch {
    return null;
  }
}
