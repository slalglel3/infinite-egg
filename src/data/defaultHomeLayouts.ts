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
const LAYOUT_STORAGE_KEY = 'infinite_egg_home_layout_v2';

export const WIREFRAME_KIND_OPTIONS: Array<{ value: WireframeElementKind; label: string }> = [
  { value: 'card', label: '패널 / 카드' },
  { value: 'button', label: '일반 버튼' },
  { value: 'play-button', label: '플레이 CTA 버튼' },
  { value: 'avatar', label: '캐릭터 / 쇼케이스' },
  { value: 'asset-slot', label: '개별 그래픽 에셋' },
  { value: 'resource-chip', label: '개별 재화 / 수치 칩' },
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
  MISSIONS: { num: 4, label: '미션', eng: 'MISSIONS' },
  SHOP: { num: 5, label: '상점', eng: 'SHOP' },
};

// BEGIN_DEFAULT_HOME_LAYOUTS_RAW
const DEFAULT_HOME_LAYOUTS_RAW: HomeTabsLayoutMap = {
  EGGS: [
    {
      id: 'eggs-char-name',
      name: '선택 계란 이름',
      description: '미리보기 중인 계란 또는 코스튬의 명칭 배지',
      kind: 'badge',
      x: 16,
      y: 10,
      w: 230,
      h: 36,
      zIndex: 2,
    },
    {
      id: 'eggs-grade-tag',
      name: '등급 · 보유 상태',
      description: '선택 항목의 등급(일반/희귀/전설) 및 보유 상태 칩',
      kind: 'resource-chip',
      x: 254,
      y: 10,
      w: 120,
      h: 36,
      zIndex: 2,
    },
    {
      id: 'eggs-showcase-avatar',
      name: '계란 캐릭터 에셋',
      description: '계란 스킨과 4부위 코스튬 조합이 렌더링되는 캐릭터 영역',
      kind: 'avatar',
      x: 74,
      y: 54,
      w: 242,
      h: 148,
      zIndex: 1,
    },
    {
      id: 'eggs-prev-btn',
      name: '이전 (<)',
      description: '이전 계란/코스튬으로 전환하는 좌측 화살표 버튼',
      kind: 'button',
      x: 16,
      y: 104,
      w: 48,
      h: 48,
      zIndex: 3,
    },
    {
      id: 'eggs-next-btn',
      name: '다음 (>)',
      description: '다음 계란/코스튬으로 전환하는 우측 화살표 버튼',
      kind: 'button',
      x: 326,
      y: 104,
      w: 48,
      h: 48,
      zIndex: 3,
    },
    {
      id: 'eggs-equip-btn',
      name: '대표 장착 버튼',
      description: '미리보기 중인 계란 스킨 또는 코스튬을 장착/해제하는 버튼',
      kind: 'button',
      x: 254,
      y: 164,
      w: 120,
      h: 36,
      zIndex: 4,
    },
    {
      id: 'eggs-category-switch',
      name: '도감 분류 (스킨 / 코스튬)',
      description: '계란 본체 스킨과 장착 코스튬 목록을 전환하는 탭',
      kind: 'segmented',
      x: 16,
      y: 212,
      w: 358,
      h: 36,
      zIndex: 2,
    },
    {
      id: 'eggs-part-filter',
      name: '부위 필터 (전체 / 모자 / 상의 / 하의 / 손)',
      description: '코스튬 부위별 필터링 전환 바',
      kind: 'segmented',
      x: 16,
      y: 254,
      w: 358,
      h: 34,
      zIndex: 2,
    },
    {
      id: 'eggs-slot-grid',
      name: '도감 4열 슬롯 그리드',
      description: '개별 계란·코스튬 슬롯이 4열로 배치되는 목록 영역',
      kind: 'slot-grid',
      x: 16,
      y: 296,
      w: 358,
      h: 210,
      zIndex: 1,
    },
    {
      id: 'eggs-unlock-condition',
      name: '해금 조건 텍스트',
      description: '선택한 항목의 획득 경로 및 해금 조건 안내',
      kind: 'text',
      x: 16,
      y: 514,
      w: 174,
      h: 56,
      zIndex: 2,
    },
    {
      id: 'eggs-passive-effect',
      name: '고유 효과 카드',
      description: '선택 스킨·코스튬 장착 시 적용되는 고유 패시브 효과 설명',
      kind: 'card',
      x: 200,
      y: 514,
      w: 174,
      h: 56,
      zIndex: 2,
    },
  ],
  EVENTS: [
    {
      id: 'events-banner-bg',
      name: '챌린지 테마 배경 에셋',
      description: '주간 이벤트 코스 전용 배경 일러스트 에셋 영역',
      kind: 'asset-slot',
      x: 16,
      y: 12,
      w: 358,
      h: 152,
      zIndex: 1,
    },
    {
      id: 'events-rule-tag',
      name: '특수 룰 태그',
      description: '적용 중인 이벤트 기믹 태그 (예: 강풍 / 저중력)',
      kind: 'badge',
      x: 28,
      y: 22,
      w: 132,
      h: 30,
      zIndex: 3,
    },
    {
      id: 'events-timer-text',
      name: '잔여 시간 타이머',
      description: '이벤트 종료까지 남은 일/시간 카운트다운 칩',
      kind: 'resource-chip',
      x: 246,
      y: 22,
      w: 116,
      h: 30,
      zIndex: 3,
    },
    {
      id: 'events-title-text',
      name: '챌린지 코스 타이틀',
      description: '금주의 이벤트 코스 명칭 및 핵심 규칙 안내 문구',
      kind: 'text',
      x: 28,
      y: 60,
      w: 334,
      h: 52,
      zIndex: 3,
    },
    {
      id: 'events-enter-btn',
      name: '챌린지 입장 버튼',
      description: '이벤트 전용 트랙 플레이를 즉시 시작하는 실행 버튼',
      kind: 'button',
      x: 236,
      y: 120,
      w: 126,
      h: 36,
      zIndex: 4,
    },
    {
      id: 'events-reward-header',
      name: '목표 보상 안내 헤더',
      description: '목표 거리 달성 시 지급되는 한정 보상 구간 타이틀',
      kind: 'text',
      x: 16,
      y: 172,
      w: 358,
      h: 32,
      zIndex: 1,
    },
    {
      id: 'events-reward-slot-1',
      name: '1단계 보상 에셋',
      description: '1차 목표 거리 달성 보상 아이콘·수량 슬롯',
      kind: 'asset-slot',
      x: 16,
      y: 210,
      w: 114,
      h: 82,
      zIndex: 1,
    },
    {
      id: 'events-reward-slot-2',
      name: '2단계 보상 에셋',
      description: '2차 목표 거리 달성 보상 아이콘·수량 슬롯',
      kind: 'asset-slot',
      x: 138,
      y: 210,
      w: 114,
      h: 82,
      zIndex: 1,
    },
    {
      id: 'events-reward-slot-3',
      name: '최종 보상 에셋',
      description: '최종 목표 달성 한정 스킨·코스튬 에셋 슬롯',
      kind: 'asset-slot',
      x: 260,
      y: 210,
      w: 114,
      h: 82,
      zIndex: 1,
    },
    {
      id: 'events-daily-left',
      name: '특수 룰 슬롯 A',
      description: '일일 챌린지 #1 (강풍 다리 / 무중력 점프) 카드',
      kind: 'card',
      x: 16,
      y: 302,
      w: 174,
      h: 116,
      zIndex: 1,
    },
    {
      id: 'events-daily-right',
      name: '특수 룰 슬롯 B',
      description: '일일 챌린지 #2 (연속 낭떠러지 타임어택) 카드',
      kind: 'card',
      x: 200,
      y: 302,
      w: 174,
      h: 116,
      zIndex: 1,
    },
    {
      id: 'events-point-gauge',
      name: '주간 포인트 게이지',
      description: '이벤트 누적 포인트 및 마일스톤 진행 바',
      kind: 'progress',
      x: 16,
      y: 428,
      w: 254,
      h: 70,
      zIndex: 1,
    },
    {
      id: 'events-point-claim',
      name: '보상 수령 버튼',
      description: '이벤트 마일스톤 달성 보상을 수령하는 CTA 버튼',
      kind: 'button',
      x: 278,
      y: 428,
      w: 96,
      h: 70,
      zIndex: 2,
    },
  ],
  MAIN: [
    {
      id: 'main-title-logo',
      name: '타이틀 로고 에셋',
      description: '무한의 계란 메인 로고 그래픽 에셋 영역',
      kind: 'asset-slot',
      x: 16,
      y: 10,
      w: 254,
      h: 48,
      zIndex: 2,
    },
    {
      id: 'main-season-badge',
      name: '시즌 / 버전 배지',
      description: '현재 시즌 및 빌드 버전 표기 배지',
      kind: 'badge',
      x: 278,
      y: 10,
      w: 96,
      h: 48,
      zIndex: 2,
    },
    {
      id: 'main-best-record',
      name: '최고 기록 (m)',
      description: '유저 최고 도달 거리 전용 기록 칩',
      kind: 'resource-chip',
      x: 16,
      y: 66,
      w: 114,
      h: 46,
      zIndex: 2,
    },
    {
      id: 'main-gold-chip',
      name: '보유 골드',
      description: '골드 아이콘 에셋 + 현재 보유 골드 수량 칩',
      kind: 'resource-chip',
      x: 138,
      y: 66,
      w: 114,
      h: 46,
      zIndex: 2,
    },
    {
      id: 'main-shell-chip',
      name: '보유 알 껍데기',
      description: '중복 알 껍데기 아이콘 에셋 + 보유 수량 칩',
      kind: 'resource-chip',
      x: 260,
      y: 66,
      w: 114,
      h: 46,
      zIndex: 2,
    },
    {
      id: 'main-level-bar',
      name: '유저 레벨 · EXP 게이지',
      description: '누적 하강 거리 기반 레벨 및 경험치 진행 바',
      kind: 'progress',
      x: 16,
      y: 118,
      w: 358,
      h: 40,
      zIndex: 2,
    },
    {
      id: 'main-nest-asset',
      name: '둥지 배경 에셋',
      description: '대표 계란 아래에 배치되는 둥지·바닥 소품 그래픽 에셋',
      kind: 'asset-slot',
      x: 42,
      y: 294,
      w: 306,
      h: 72,
      zIndex: 1,
    },
    {
      id: 'main-egg-avatar',
      name: '대표 계란 에셋',
      description: '장착한 스킨과 코스튬이 표시되는 대표 계란 캐릭터',
      kind: 'avatar',
      x: 104,
      y: 164,
      w: 182,
      h: 146,
      zIndex: 2,
    },
    {
      id: 'main-speech-bubble',
      name: '계란 말풍선',
      description: '계란 터치 시 반응하는 대사/상태 말풍선 영역',
      kind: 'text',
      x: 228,
      y: 166,
      w: 146,
      h: 46,
      zIndex: 3,
    },
    {
      id: 'main-mode-switch',
      name: '모드 선택 (일반 / 하드코어)',
      description: '일반 무한 주행과 하드코어 모드를 전환하는 스위치',
      kind: 'segmented',
      x: 65,
      y: 374,
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
      y: 418,
      w: 342,
      h: 64,
      zIndex: 3,
    },
    {
      id: 'main-run-count',
      name: '총 주행 횟수',
      description: '누적 플레이 횟수 통계 칩',
      kind: 'resource-chip',
      x: 24,
      y: 490,
      w: 106,
      h: 48,
      zIndex: 2,
    },
    {
      id: 'main-recent-record',
      name: '최근 기록',
      description: '직전 판 도달 거리 요약 칩',
      kind: 'resource-chip',
      x: 138,
      y: 490,
      w: 106,
      h: 48,
      zIndex: 2,
    },
    {
      id: 'main-guide-btn',
      name: '조작법',
      description: '튜토리얼 / 게임 규칙 가이드 팝업 버튼',
      kind: 'button',
      x: 252,
      y: 490,
      w: 54,
      h: 48,
      zIndex: 2,
    },
    {
      id: 'main-settings-btn',
      name: '설정',
      description: '사운드·진동·데이터 설정 팝업 버튼',
      kind: 'button',
      x: 312,
      y: 490,
      w: 54,
      h: 48,
      zIndex: 2,
    },
  ],
  MISSIONS: [
    {
      id: 'missions-period-tabs',
      name: '미션 구분 (일일 / 주간 / 월간 / 누적)',
      description: '일일·주간·월간·누적 4종 미션 카테고리를 전환하는 상단 탭',
      kind: 'segmented',
      x: 16,
      y: 12,
      w: 358,
      h: 40,
      zIndex: 3,
    },
    {
      id: 'missions-reset-timer',
      name: '미션 갱신 타이머',
      description: '일일(자정)·주간(월요일)·월간(1일) 초기화 잔여 시간 / 누적 진행 요약',
      kind: 'text',
      x: 16,
      y: 60,
      w: 236,
      h: 38,
      zIndex: 2,
    },
    {
      id: 'missions-claim-all-btn',
      name: '모두 받기',
      description: '완료된 미션 보상을 한 번에 모두 수령하는 일괄 수령 버튼',
      kind: 'button',
      x: 260,
      y: 60,
      w: 114,
      h: 38,
      zIndex: 3,
    },
    {
      id: 'missions-milestone-bar',
      name: '미션 포인트 게이지',
      description: '선택한 미션(일일/주간/월간/누적) 포인트 누적 달성 바',
      kind: 'progress',
      x: 16,
      y: 106,
      w: 274,
      h: 64,
      zIndex: 1,
    },
    {
      id: 'missions-bonus-chest',
      name: '보너스 상자 에셋',
      description: '미션 포인트 목표 달성 시 열 수 있는 올클리어 보상 상자',
      kind: 'asset-slot',
      x: 298,
      y: 106,
      w: 76,
      h: 64,
      zIndex: 2,
    },
    {
      id: 'missions-row-1-card',
      name: '[일일] 1회 200m 돌파',
      description: '일일 미션: 오늘 한 판에 200m 이상 주행하기 (200 / 200)',
      kind: 'list-row',
      x: 16,
      y: 180,
      w: 204,
      h: 74,
      zIndex: 1,
    },
    {
      id: 'missions-row-1-reward',
      name: '골드 +50',
      description: '일일 미션 #1 보상 아이콘 에셋 및 수량',
      kind: 'resource-chip',
      x: 226,
      y: 180,
      w: 72,
      h: 74,
      zIndex: 2,
    },
    {
      id: 'missions-row-1-claim',
      name: '보상 받기',
      description: '완료된 일일 미션 #1 보상 수령 CTA 버튼',
      kind: 'button',
      x: 304,
      y: 180,
      w: 70,
      h: 74,
      zIndex: 3,
    },
    {
      id: 'missions-row-2-card',
      name: '[주간] GAP 점프 30회',
      description: '주간 미션: 이번 주 끊어진 길 점프 30회 성공 (18 / 30)',
      kind: 'list-row',
      x: 16,
      y: 262,
      w: 204,
      h: 74,
      zIndex: 1,
    },
    {
      id: 'missions-row-2-reward',
      name: '껍데기 +15',
      description: '주간 미션 #2 보상 아이콘 에셋 및 수량',
      kind: 'resource-chip',
      x: 226,
      y: 262,
      w: 72,
      h: 74,
      zIndex: 2,
    },
    {
      id: 'missions-row-2-status',
      name: '진행 중',
      description: '주간 미션 #2 상태 표시 또는 바로가기 버튼',
      kind: 'button',
      x: 304,
      y: 262,
      w: 70,
      h: 74,
      zIndex: 2,
    },
    {
      id: 'missions-row-3-card',
      name: '[월간] 월간 누적 5,000m',
      description: '월간 미션: 이번 달 누적 주행 거리 5,000m 달성 (2,450 / 5,000)',
      kind: 'list-row',
      x: 16,
      y: 344,
      w: 204,
      h: 74,
      zIndex: 1,
    },
    {
      id: 'missions-row-3-reward',
      name: '티켓 +1',
      description: '월간 미션 #3 한정 뽑기 티켓 보상 에셋',
      kind: 'resource-chip',
      x: 226,
      y: 344,
      w: 72,
      h: 74,
      zIndex: 2,
    },
    {
      id: 'missions-row-3-status',
      name: '진행 중',
      description: '월간 미션 #3 진행 상태 버튼',
      kind: 'button',
      x: 304,
      y: 344,
      w: 70,
      h: 74,
      zIndex: 2,
    },
    {
      id: 'missions-row-4-card',
      name: '[누적] 통산 1,000m 마스터',
      description: '누적 미션: 최고 기록 1,000m 돌파 달성하기',
      kind: 'list-row',
      x: 16,
      y: 426,
      w: 204,
      h: 74,
      zIndex: 1,
    },
    {
      id: 'missions-row-4-reward',
      name: '황금 스킨',
      description: '누적 미션 #4 전용 칭호·스킨 보상 에셋',
      kind: 'resource-chip',
      x: 226,
      y: 426,
      w: 72,
      h: 74,
      zIndex: 2,
    },
    {
      id: 'missions-row-4-status',
      name: '도전하기',
      description: '누적 미션 #4 도전/상태 버튼',
      kind: 'button',
      x: 304,
      y: 426,
      w: 70,
      h: 74,
      zIndex: 2,
    },
  ],
  SHOP: [
    {
      id: 'shop-gold-balance',
      name: '상점 보유 골드',
      description: '골드 아이콘 에셋 및 현재 보유 골드 수량 칩',
      kind: 'resource-chip',
      x: 16,
      y: 12,
      w: 174,
      h: 44,
      zIndex: 2,
    },
    {
      id: 'shop-shell-balance',
      name: '상점 보유 알 껍데기',
      description: '알 껍데기 아이콘 에셋 및 현재 보유 수량 칩',
      kind: 'resource-chip',
      x: 200,
      y: 12,
      w: 174,
      h: 44,
      zIndex: 2,
    },
    {
      id: 'shop-gacha-stage',
      name: '황금 둥지 부화기 에셋',
      description: '신규 계란 스킨·코스튬을 부화시키는 가챠 연출 그래픽 영역',
      kind: 'asset-slot',
      x: 16,
      y: 64,
      w: 358,
      h: 124,
      zIndex: 1,
    },
    {
      id: 'shop-gacha-prob-btn',
      name: '확률 안내',
      description: '등급별 스킨·코스튬 부화 확률표 팝업 버튼',
      kind: 'button',
      x: 282,
      y: 74,
      w: 82,
      h: 28,
      zIndex: 3,
    },
    {
      id: 'shop-hatch-1',
      name: '1회 부화 (100G)',
      description: '100 골드를 사용해 1회 부화를 실행하는 CTA 버튼',
      kind: 'button',
      x: 16,
      y: 196,
      w: 174,
      h: 42,
      zIndex: 3,
    },
    {
      id: 'shop-hatch-5',
      name: '5회 부화 (450G)',
      description: '450 골드를 사용해 5회 연속 부화를 실행하는 CTA 버튼',
      kind: 'button',
      x: 200,
      y: 196,
      w: 174,
      h: 42,
      zIndex: 3,
    },
    {
      id: 'shop-free-gift-icon',
      name: '일일 무료 선물 에셋',
      description: '매일 1회 무료 골드·껍데기를 제공하는 선물 상자 에셋',
      kind: 'asset-slot',
      x: 16,
      y: 248,
      w: 114,
      h: 86,
      zIndex: 1,
    },
    {
      id: 'shop-free-gift-btn',
      name: '무료 받기',
      description: '일일 무료 선물을 수령하는 버튼',
      kind: 'button',
      x: 16,
      y: 338,
      w: 114,
      h: 34,
      zIndex: 2,
    },
    {
      id: 'shop-bandage-card',
      name: '반창고 팩 에셋',
      description: '플레이 중 HP 회복 반창고 소모품 아이콘·설명 카드',
      kind: 'card',
      x: 138,
      y: 248,
      w: 114,
      h: 86,
      zIndex: 1,
    },
    {
      id: 'shop-bandage-buy',
      name: '반창고 구매',
      description: '골드로 반창고 시작 아이템을 구매하는 버튼',
      kind: 'button',
      x: 138,
      y: 338,
      w: 114,
      h: 34,
      zIndex: 2,
    },
    {
      id: 'shop-shield-card',
      name: '보호막 팩 에셋',
      description: '충돌 1회 방어 보호막 소모품 아이콘·설명 카드',
      kind: 'card',
      x: 260,
      y: 248,
      w: 114,
      h: 86,
      zIndex: 1,
    },
    {
      id: 'shop-shield-buy',
      name: '보호막 구매',
      description: '골드로 보호막 시작 아이템을 구매하는 버튼',
      kind: 'button',
      x: 260,
      y: 338,
      w: 114,
      h: 34,
      zIndex: 2,
    },
    {
      id: 'shop-exchange-header',
      name: '껍데기 확정 교환소 헤더',
      description: '중복 알 껍데기로 원하는 스킨을 교환하는 섹션 제목',
      kind: 'text',
      x: 16,
      y: 382,
      w: 358,
      h: 30,
      zIndex: 1,
    },
    {
      id: 'shop-exchange-item',
      name: '확정 교환 상품 슬롯',
      description: '교환 가능한 스킨·코스튬 아이콘 및 필요 껍데기 수량',
      kind: 'list-row',
      x: 16,
      y: 418,
      w: 254,
      h: 72,
      zIndex: 1,
    },
    {
      id: 'shop-exchange-btn',
      name: '교환하기',
      description: '알 껍데기를 소모해 해당 스킨을 확정 해금하는 버튼',
      kind: 'button',
      x: 278,
      y: 418,
      w: 96,
      h: 72,
      zIndex: 2,
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
    MISSIONS: cloneDefaultTabLayout('MISSIONS'),
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
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const tabs: HomeTabType[] = ['EGGS', 'EVENTS', 'MAIN', 'MISSIONS', 'SHOP'];
    for (const t of tabs) {
      const candidate = t === 'MISSIONS' ? parsed.MISSIONS ?? parsed.ACHIEVEMENTS : parsed[t];
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
