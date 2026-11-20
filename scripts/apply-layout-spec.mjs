#!/usr/bin/env node
/**
 * Apply exported Home UI layout JSON (or AGY sync prompt text) into
 * `src/data/defaultHomeLayouts.ts`.
 *
 * Usage:
 *   node scripts/apply-layout-spec.mjs path/to/layout.json
 *   node scripts/apply-layout-spec.mjs --stdin < pasted-message.txt
 *   node scripts/apply-layout-spec.mjs path/to/layout.json --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const TARGET_FILE = path.join(REPO_ROOT, 'src/data/defaultHomeLayouts.ts');

const ALL_TABS = ['SHOP', 'SKINS', 'MAIN', 'MISSIONS', 'CHALLENGE'];
const VALID_KINDS = new Set([
  'card',
  'button',
  'play-button',
  'active-backing',
  'avatar',
  'asset-slot',
  'resource-chip',
  'progress',
  'segmented',
  'slot-grid',
  'list-row',
  'banner',
  'badge',
  'text',
]);

const MOBILE_STAGE_WIDTH = 390;
const ELEMENT_MIN_WIDTH = 16;
const ELEMENT_MIN_HEIGHT = 14;

function clampRect(rect) {
  const w = Math.max(ELEMENT_MIN_WIDTH, Math.min(MOBILE_STAGE_WIDTH, Math.round(rect.w)));
  const h = Math.max(ELEMENT_MIN_HEIGHT, Math.min(900, Math.round(rect.h)));
  const x = Math.max(0, Math.min(MOBILE_STAGE_WIDTH - w, Math.round(rect.x)));
  const y = Math.max(0, Math.min(1200 - h, Math.round(rect.y)));
  return { x, y, w, h };
}

function normalizeTabZOrder(elements) {
  return [...elements]
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((el, idx) => ({ ...el, zIndex: idx + 1 }));
}

function extractJsonText(rawText) {
  const trimmed = rawText.trim();
  const fenceMatch = trimmed.match(/```(?:infinite-egg-layout-v1|json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim();
  }
  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first !== -1 && last > first) {
    return trimmed.slice(first, last + 1);
  }
  return trimmed;
}

function sanitizeElement(raw, idx, tab) {
  if (!raw || typeof raw !== 'object') return null;
  for (const key of ['x', 'y', 'w', 'h']) {
    if (typeof raw[key] !== 'number' || !Number.isFinite(raw[key])) {
      throw new Error(`[${tab}] element #${idx} has invalid numeric field "${key}"`);
    }
  }
  const kind = typeof raw.kind === 'string' && VALID_KINDS.has(raw.kind) ? raw.kind : 'card';
  const id =
    typeof raw.id === 'string' && raw.id.trim()
      ? raw.id.trim()
      : `${tab.toLowerCase()}-imported-${idx + 1}`;
  const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name : `요소 ${idx + 1}`;
  const description = typeof raw.description === 'string' ? raw.description : '';
  const zIndex =
    typeof raw.zIndex === 'number' && Number.isFinite(raw.zIndex) ? raw.zIndex : idx + 1;

  return {
    id,
    name,
    description,
    kind,
    ...clampRect(raw),
    zIndex,
  };
}

function tsStringLiteral(value) {
  return `'${String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')}'`;
}

function formatLayoutsBlock(layouts) {
  const lines = ['const DEFAULT_HOME_LAYOUTS_RAW: HomeTabsLayoutMap = {'];
  for (const tab of ALL_TABS) {
    lines.push(`  ${tab}: [`);
    for (const el of layouts[tab]) {
      lines.push('    {');
      lines.push(`      id: ${tsStringLiteral(el.id)},`);
      lines.push(`      name: ${tsStringLiteral(el.name)},`);
      lines.push(`      description: ${tsStringLiteral(el.description)},`);
      lines.push(`      kind: ${tsStringLiteral(el.kind)},`);
      lines.push(`      x: ${el.x},`);
      lines.push(`      y: ${el.y},`);
      lines.push(`      w: ${el.w},`);
      lines.push(`      h: ${el.h},`);
      lines.push(`      zIndex: ${el.zIndex},`);
      lines.push('    },');
    }
    lines.push('  ],');
  }
  lines.push('};');
  return lines.join('\n');
}

function evaluateCurrentLayouts(targetSrc, rawBlock) {
  const helperStartMarker = '// BEGIN_LAYOUT_HELPERS';
  const helperEndMarker = '// END_LAYOUT_HELPERS';
  const hStart = targetSrc.indexOf(helperStartMarker);
  const hEnd = targetSrc.indexOf(helperEndMarker);
  let helpersJs = '';
  if (hStart !== -1 && hEnd !== -1 && hEnd > hStart) {
    helpersJs = targetSrc
      .slice(hStart + helperStartMarker.length, hEnd)
      .replace(/\(prefix:\s*string\):\s*HomeLayoutElement\[\]/g, '(prefix)');
  }

  const objStart = rawBlock.indexOf('{');
  const objEnd = rawBlock.lastIndexOf('}');
  const objLiteral = rawBlock.slice(objStart, objEnd + 1);
  return new Function(`${helpersJs}\nreturn (${objLiteral});`)();
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const useStdin = args.includes('--stdin');
  const fileArg = args.find((a) => !a.startsWith('-'));

  if (!useStdin && !fileArg) {
    console.error(
      'Usage: node scripts/apply-layout-spec.mjs <spec-file|--stdin> [--dry-run]'
    );
    process.exit(1);
  }

  const rawInput = useStdin
    ? fs.readFileSync(0, 'utf8')
    : fs.readFileSync(path.resolve(process.cwd(), fileArg), 'utf8');

  const jsonCandidate = extractJsonText(rawInput);
  const parsed = JSON.parse(jsonCandidate);
  const sourceMap = parsed && typeof parsed.layouts === 'object' ? parsed.layouts : parsed;

  if (!sourceMap || typeof sourceMap !== 'object') {
    throw new Error('Could not find layout map object in input.');
  }

  const targetSrc = fs.readFileSync(TARGET_FILE, 'utf8');
  const startMarker = '// BEGIN_DEFAULT_HOME_LAYOUTS_RAW';
  const endMarker = '// END_DEFAULT_HOME_LAYOUTS_RAW';
  const startIdx = targetSrc.indexOf(startMarker);
  const endIdx = targetSrc.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    throw new Error(`Could not locate ${startMarker}..${endMarker} in ${TARGET_FILE}`);
  }

  const existingCode = targetSrc.slice(startIdx + startMarker.length, endIdx).trim();
  const currentLayouts = evaluateCurrentLayouts(targetSrc, existingCode);

  const nextLayouts = {};
  const summaryLines = [];

  for (const tab of ALL_TABS) {
    const prevNormalized = normalizeTabZOrder(currentLayouts[tab] || []);
    const rawIncoming =
      tab === 'SKINS'
        ? sourceMap.SKINS ?? sourceMap.EGGS
        : tab === 'MISSIONS'
          ? sourceMap.MISSIONS ?? sourceMap.ACHIEVEMENTS
          : tab === 'CHALLENGE'
            ? sourceMap.CHALLENGE ?? sourceMap.EVENTS
            : sourceMap[tab];
    const incoming = Array.isArray(rawIncoming) ? rawIncoming : prevNormalized;
    nextLayouts[tab] = normalizeTabZOrder(
      incoming.map((item, idx) => sanitizeElement(item, idx, tab))
    );

    const prevMap = new Map(prevNormalized.map((e) => [e.id, e]));
    const nextMap = new Map(nextLayouts[tab].map((e) => [e.id, e]));
    let added = 0;
    let modified = 0;
    let removed = 0;

    for (const [id, el] of nextMap) {
      const prev = prevMap.get(id);
      if (!prev) added += 1;
      else if (JSON.stringify(prev) !== JSON.stringify(el)) modified += 1;
    }
    for (const id of prevMap.keys()) {
      if (!nextMap.has(id)) removed += 1;
    }
    summaryLines.push(
      `  - ${tab}: ${nextLayouts[tab].length} elements (+${added} added, ~${modified} modified, -${removed} removed)`
    );
  }

  const replacement = `${startMarker}\n${formatLayoutsBlock(nextLayouts)}\n${endMarker}`;
  const updatedSrc =
    targetSrc.slice(0, startIdx) + replacement + targetSrc.slice(endIdx + endMarker.length);

  if (!dryRun) {
    fs.writeFileSync(TARGET_FILE, updatedSrc, 'utf8');
  }

  console.log(
    `${dryRun ? '[DRY-RUN] Verified' : 'Applied'} layout spec to src/data/defaultHomeLayouts.ts:`
  );
  for (const line of summaryLines) console.log(line);
}

main();
