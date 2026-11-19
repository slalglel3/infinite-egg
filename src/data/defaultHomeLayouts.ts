import { HomeTabType } from '../types/game';
import {
  HomeLayoutElement,
  HomeTabsLayoutMap,
  LayerAction,
  WireframeElementKind,
} from '../types/homeLayout';

export const MOBILE_STAGE_WIDTH = 390;
export const ELEMENT_MIN_WIDTH = 32;
export const ELEMENT_MIN_HEIGHT = 24;
const LAYOUT_STORAGE_KEY = 'infinite_egg_home_layout_v1';

export const WIREFRAME_KIND_OPTIONS: Array<{ value: WireframeElementKind; label: string }> = [
  { value: 'card', label: '패널 / 카드' },
  { value: 'button', label: '일반 버튼' },
  { value: 'play-button', label: '플레이 CTA 버튼' },
  { value: 'avatar', label: '캐릭터 / 쇼케이스' },
  { value: 'banner', label: '대형 배너' },
  { value: 'progress', label: '진행도 게이지' },
  { value: 'segmented', label: '세그먼트 전환 바' },
  { value: 'slot-grid', label: '격자 슬롯 (4열)' },
  { value: 'list-row', label: '리스트 항목 행' },
  { value: 'badge', label: '타이틀 / 배지' },
  { value: 'text', label: '텍스트 / 요약 박스' },
];

export const HOME_TAB_META: Record<HomeTabType, { num: number; label: string; eng: string }> = {
  EGGS: { num: 1, label: '도감', eng: 'EGGS' },
  EVENTS: { num: 2, label: '이벤트', eng: 'EVENTS' },
  MAIN: { num: 3, label: '홈', eng: 'MAIN' },
  ACHIEVEMENTS: { num: 4, label: '도전과제', eng: 'ACHIEVEMENTS' },
  SHOP: { num: 5, label: '상점', eng: 'SHOP' },
};

// BEGIN_DEFAULT_HOME_LAYOUTS_RAW
const DEFAULT_HOME_LAYOUTS_RAW: HomeTabsLayoutMap = {
  EGGS: [
    {
      id: 'eggs-showcase',
      name: '계란 쇼케이스',
      description: '선택된 계란 캐릭터 와이어프레임과 이름·등급·좌우 전환 화살표 영역',
      kind: 'avatar',
      x: 16,
      y: 12,
      w: 358,
      h: 170,
      zIndex: 1,
    },
    {
      id: 'eggs-equip-btn',
      name: '장착 상태 버튼',
      description: '미리보기 계란 스킨/코스튬을 대표 캐릭터로 장착하는 액션 버튼',
      kind: 'button',
      x: 248,
      y: 134,
      w: 112,
      h: 34,
      zIndex: 3,
    },
    {
      id: 'eggs-subtab',
      name: '스킨/코스튬 전환',
      description: '계란 도감과 4부위(모자·상의·하의·손) 코스튬 목록 전환 바',
      kind: 'segmented',
      x: 16,
      y: 192,
      w: 358,
      h: 38,
      zIndex: 2,
    },
    {
      id: 'eggs-grid',
      name: '도감 4열 슬롯 그리드',
      description: '보유·미보유 계란 또는 코스튬을 4열 격자로 표시하는 슬롯 영역',
      kind: 'slot-grid',
      x: 16,
      y: 240,
      w: 358,
      h: 238,
      zIndex: 1,
    },
    {
      id: 'eggs-detail-bar',
      name: '선택 스킨 정보 카드',
      description: '선택한 항목의 해금 조건 및 고유 효과 설명 영역',
      kind: 'card',
      x: 16,
      y: 488,
      w: 358,
      h: 72,
      zIndex: 2,
    },
  ],
  EVENTS: [
    {
      id: 'events-weekly-banner',
      name: '금주의 챌린지 배너',
      description: '기간 한정 이벤트 코스 명칭, 특수 룰 태그, 잔여 시간 카운트다운',
      kind: 'banner',
      x: 16,
      y: 12,
      w: 358,
      h: 148,
      zIndex: 1,
    },
    {
      id: 'events-enter-btn',
      name: '챌린지 입장 버튼',
      description: '이벤트 전용 트랙으로 즉시 입장하는 실행 버튼',
      kind: 'button',
      x: 238,
      y: 112,
      w: 120,
      h: 34,
      zIndex: 3,
    },
    {
      id: 'events-reward-preview',
      name: '목표 보상 프리뷰',
      description: '목표 거리 달성 시 지급되는 한정 보상 3칸 미리보기 카드',
      kind: 'card',
      x: 16,
      y: 172,
      w: 358,
      h: 82,
      zIndex: 1,
    },
    {
      id: 'events-daily-left',
      name: '특수 룰 슬롯 A',
      description: '일일 챌린지 #1 (예: 강풍 다리 / 무중력 점프) 카드',
      kind: 'card',
      x: 16,
      y: 266,
      w: 173,
      h: 146,
      zIndex: 1,
    },
    {
      id: 'events-daily-right',
      name: '특수 룰 슬롯 B',
      description: '일일 챌린지 #2 (예: 연속 낭떠러지 타임어택) 카드',
      kind: 'card',
      x: 201,
      y: 266,
      w: 173,
      h: 146,
      zIndex: 1,
    },
    {
      id: 'events-point-gauge',
      name: '주간 포인트 게이지',
      description: '이벤트 누적 포인트 및 마일스톤 보상 달성 게이지',
      kind: 'progress',
      x: 16,
      y: 424,
      w: 358,
      h: 78,
      zIndex: 1,
    },
  ],
  MAIN: [
    {
      id: 'main-title-badge',
      name: '타이틀 로고 박스',
      description: '무한의 계란 메인 타이틀과 현재 시즌/버전 표기',
      kind: 'badge',
      x: 55,
      y: 12,
      w: 280,
      h: 50,
      zIndex: 2,
    },
    {
      id: 'main-currency-bar',
      name: '보유 재화 / 기록 바',
      description: '최고 거리, 골드, 알 껍데기 보유량 요약 캡슐',
      kind: 'card',
      x: 16,
      y: 72,
      w: 358,
      h: 50,
      zIndex: 2,
    },
    {
      id: 'main-egg-stage',
      name: '계란 & 둥지 스테이지',
      description: '대표 장착 계란과 둥지 상호작용(말풍선/탭 반응) 메인 구역',
      kind: 'avatar',
      x: 24,
      y: 132,
      w: 342,
      h: 228,
      zIndex: 1,
    },
    {
      id: 'main-mode-switch',
      name: '난이도/모드 선택',
      description: '일반 무한 주행 / 하드코어 등 플레이 모드 전환 스위치',
      kind: 'segmented',
      x: 65,
      y: 372,
      w: 260,
      h: 36,
      zIndex: 2,
    },
    {
      id: 'main-play-cta',
      name: '플레이 시작 버튼',
      description: '눌렀을 때 인게임 트랙 주행을 즉시 시작하는 핵심 CTA 버튼',
      kind: 'play-button',
      x: 24,
      y: 420,
      w: 342,
      h: 66,
      zIndex: 3,
    },
    {
      id: 'main-summary-box',
      name: '누적 플레이 요약',
      description: '총 주행 횟수 및 최근 최고 도달 기록 요약 텍스트',
      kind: 'text',
      x: 24,
      y: 498,
      w: 165,
      h: 48,
      zIndex: 2,
    },
    {
      id: 'main-quick-menu',
      name: '조작법 / 설정 버튼',
      description: '튜토리얼 가이드 또는 사운드/진동 설정 퀵 버튼',
      kind: 'button',
      x: 201,
      y: 498,
      w: 165,
      h: 48,
      zIndex: 2,
    },
  ],
  ACHIEVEMENTS: [
    {
      id: 'ach-overall-progress',
      name: '전체 도전과제 달성률',
      description: '완료한 전체 도전과제 수량 및 마일스톤 진행 바',
      kind: 'progress',
      x: 16,
      y: 12,
      w: 358,
      h: 72,
      zIndex: 1,
    },
    {
      id: 'ach-filter',
      name: '정렬 필터 바',
      description: '전체 / 수령 가능 / 진행 중 상태별 도전과제 필터',
      kind: 'segmented',
      x: 16,
      y: 94,
      w: 358,
      h: 36,
      zIndex: 2,
    },
    {
      id: 'ach-row-1',
      name: '도전과제 카드 #1',
      description: '예: 첫 100m 돌파 — 목표 수치 달성 완료 상태',
      kind: 'list-row',
      x: 16,
      y: 140,
      w: 358,
      h: 84,
      zIndex: 1,
    },
    {
      id: 'ach-claim-btn-1',
      name: '보상 받기 버튼',
      description: '달성 완료된 도전과제 #1 위에서 보상을 수령하는 강조 버튼',
      kind: 'button',
      x: 266,
      y: 164,
      w: 96,
      h: 36,
      zIndex: 3,
    },
    {
      id: 'ach-row-2',
      name: '도전과제 카드 #2',
      description: '예: 연속 10회 점프 성공 (7 / 10 진행 중)',
      kind: 'list-row',
      x: 16,
      y: 234,
      w: 358,
      h: 84,
      zIndex: 1,
    },
    {
      id: 'ach-row-3',
      name: '도전과제 카드 #3',
      description: '예: 반창고 20개 수집 (12 / 20 진행 중)',
      kind: 'list-row',
      x: 16,
      y: 328,
      w: 358,
      h: 84,
      zIndex: 1,
    },
    {
      id: 'ach-row-4',
      name: '도전과제 카드 #4',
      description: '예: 1,000m 마스터 (잠금 / 장기 목표)',
      kind: 'list-row',
      x: 16,
      y: 422,
      w: 358,
      h: 84,
      zIndex: 1,
    },
  ],
  SHOP: [
    {
      id: 'shop-balance-bar',
      name: '상점 보유 재화 바',
      description: '현재 보유 골드 및 중복 알 껍데기 수량 표시',
      kind: 'card',
      x: 16,
      y: 12,
      w: 358,
      h: 48,
      zIndex: 2,
    },
    {
      id: 'shop-gacha-banner',
      name: '황금 둥지 부화기',
      description: '신규 계란 스킨 및 코스튬을 부화시키는 메인 가챠 카드',
      kind: 'banner',
      x: 16,
      y: 70,
      w: 358,
      h: 160,
      zIndex: 1,
    },
    {
      id: 'shop-hatch-1',
      name: '1회 부화 버튼',
      description: '100 골드로 1회 부화를 실행하는 CTA 버튼',
      kind: 'button',
      x: 28,
      y: 182,
      w: 160,
      h: 36,
      zIndex: 3,
    },
    {
      id: 'shop-hatch-5',
      name: '5회 연속 부화 버튼',
      description: '450 골드로 5회 연속 부화를 실행하는 CTA 버튼',
      kind: 'button',
      x: 202,
      y: 182,
      w: 160,
      h: 36,
      zIndex: 3,
    },
    {
      id: 'shop-free-gift',
      name: '일일 무료 선물',
      description: '매일 1회 무료 골드/껍데기를 획득하는 카드 슬롯',
      kind: 'card',
      x: 16,
      y: 242,
      w: 173,
      h: 126,
      zIndex: 1,
    },
    {
      id: 'shop-starter-pack',
      name: '반창고 / 보호막 팩',
      description: '게임 시작 시 체력 보강·실드 소모품 구매 슬롯',
      kind: 'card',
      x: 201,
      y: 242,
      w: 173,
      h: 126,
      zIndex: 1,
    },
    {
      id: 'shop-exchange-list',
      name: '껍데기 확정 교환소',
      description: '중복 알 껍데기로 원하는 스킨을 직접 교환하는 리스트',
      kind: 'list-row',
      x: 16,
      y: 380,
      w: 358,
      h: 112,
      zIndex: 1,
    },
  ],
};
// END_DEFAULT_HOME_LAYOUTS_RAW

function cloneElements(list: HomeLayoutElement[]): HomeLayoutElement[] {
  return list.map((el) => ({ ...el }));
}

export function normalizeTabZOrder(elements: HomeLayoutElement[]): HomeLayoutElement[] {
  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  return sorted.map((el, idx) => ({ ...el, zIndex: idx + 1 }));
}

export function cloneDefaultTabLayout(tab: HomeTabType): HomeLayoutElement[] {
  return normalizeTabZOrder(cloneElements(DEFAULT_HOME_LAYOUTS_RAW[tab]));
}

export function cloneDefaultAllLayouts(): HomeTabsLayoutMap {
  return {
    EGGS: cloneDefaultTabLayout('EGGS'),
    EVENTS: cloneDefaultTabLayout('EVENTS'),
    MAIN: cloneDefaultTabLayout('MAIN'),
    ACHIEVEMENTS: cloneDefaultTabLayout('ACHIEVEMENTS'),
    SHOP: cloneDefaultTabLayout('SHOP'),
  };
}

export function moveElementLayer(
  elements: HomeLayoutElement[],
  targetId: string,
  action: LayerAction
): HomeLayoutElement[] {
  const asc = normalizeTabZOrder(elements);
  const idx = asc.findIndex((el) => el.id === targetId);
  if (idx === -1) return asc;

  const copy = [...asc];
  const [item] = copy.splice(idx, 1);

  if (action === 'TOP') {
    copy.push(item);
  } else if (action === 'BOTTOM') {
    copy.unshift(item);
  } else if (action === 'UP') {
    copy.splice(Math.min(copy.length, idx + 1), 0, item);
  } else {
    copy.splice(Math.max(0, idx - 1), 0, item);
  }

  return copy.map((el, i) => ({ ...el, zIndex: i + 1 }));
}

export function clampElementRect(
  rect: { x: number; y: number; w: number; h: number },
  snapPx: number = 0
): { x: number; y: number; w: number; h: number } {
  const snap = (v: number) => (snapPx > 1 ? Math.round(v / snapPx) * snapPx : Math.round(v));
  const w = Math.max(ELEMENT_MIN_WIDTH, Math.min(MOBILE_STAGE_WIDTH, snap(rect.w)));
  const h = Math.max(ELEMENT_MIN_HEIGHT, Math.min(900, snap(rect.h)));
  const x = Math.max(0, Math.min(MOBILE_STAGE_WIDTH - w, snap(rect.x)));
  const y = Math.max(0, Math.min(1200 - h, snap(rect.y)));
  return { x, y, w, h };
}

function isValidElement(raw: unknown): raw is HomeLayoutElement {
  if (!raw || typeof raw !== 'object') return false;
  const o = raw as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.description === 'string' &&
    typeof o.kind === 'string' &&
    typeof o.x === 'number' &&
    Number.isFinite(o.x) &&
    typeof o.y === 'number' &&
    Number.isFinite(o.y) &&
    typeof o.w === 'number' &&
    Number.isFinite(o.w) &&
    typeof o.h === 'number' &&
    Number.isFinite(o.h) &&
    typeof o.zIndex === 'number' &&
    Number.isFinite(o.zIndex)
  );
}

export function loadHomeLayouts(): HomeTabsLayoutMap {
  const defaults = cloneDefaultAllLayouts();
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<Record<HomeTabType, unknown>>;
    const tabs: HomeTabType[] = ['EGGS', 'EVENTS', 'MAIN', 'ACHIEVEMENTS', 'SHOP'];
    for (const t of tabs) {
      const candidate = parsed[t];
      if (Array.isArray(candidate) && candidate.every(isValidElement)) {
        defaults[t] = normalizeTabZOrder(
          candidate.map((item) => ({
            ...item,
            ...clampElementRect(item),
          }))
        );
      }
    }
    return defaults;
  } catch {
    return defaults;
  }
}

export function saveHomeLayouts(layouts: HomeTabsLayoutMap): void {
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layouts));
  } catch {
    // 저장 용량 제한 무시
  }
}
