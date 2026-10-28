import { CostumeItem, CostumeSlot } from '../types/game';

export const COSTUME_ITEMS: CostumeItem[] = [
  // 1. 👮 경찰관 세트 (Police) - [피드백 2] '정의의 경찰란' 획득 시 지급되는 고유 의상
  {
    id: 'police_hat',
    name: '정의의 경찰모',
    slot: 'hat',
    setTheme: 'police',
    rarity: 'RARE',
    requiredEggSkinId: 'police_egg',
    desc: '황금 배지가 빛나는 늠름한 경찰관 모자입니다.',
    iconText: '👮',
  },
  {
    id: 'police_top',
    name: '경찰 정복 셔츠',
    slot: 'top',
    setTheme: 'police',
    rarity: 'RARE',
    requiredEggSkinId: 'police_egg',
    desc: '단정한 넥타이와 견장이 돋보이는 경찰 유니폼입니다.',
    iconText: '👔',
  },
  {
    id: 'police_bottom',
    name: '경찰 장비 벨트',
    slot: 'bottom',
    setTheme: 'police',
    rarity: 'COMMON',
    requiredEggSkinId: 'police_egg',
    desc: '홀스터와 황금 버클이 달린 순찰용 벨트입니다.',
    iconText: '👖',
  },
  {
    id: 'police_hand',
    name: '수호의 경찰봉',
    slot: 'hand',
    setTheme: 'police',
    rarity: 'COMMON',
    requiredEggSkinId: 'police_egg',
    desc: '위험할 때 든든하게 지켜주는 경찰봉입니다.',
    iconText: '🪄',
  },

  // 2. 🤠 카우보이 세트 (Cowboy) - [피드백 2] '황야의 서부란' 획득 시 지급되는 고유 의상
  {
    id: 'cowboy_hat',
    name: '와일드 페도라',
    slot: 'hat',
    setTheme: 'cowboy',
    rarity: 'RARE',
    requiredEggSkinId: 'cowboy_egg',
    desc: '서부의 낭만이 가득한 챙 넓은 브라운 가죽 모자입니다.',
    iconText: '🤠',
  },
  {
    id: 'cowboy_top',
    name: '가죽 조끼 & 반다나',
    slot: 'top',
    setTheme: 'cowboy',
    rarity: 'RARE',
    requiredEggSkinId: 'cowboy_egg',
    desc: '강렬한 붉은 스카프와 스웨이드 가죽 조끼입니다.',
    iconText: '🧣',
  },
  {
    id: 'cowboy_bottom',
    name: '웨스턴 데님 팬츠',
    slot: 'bottom',
    setTheme: 'cowboy',
    rarity: 'COMMON',
    requiredEggSkinId: 'cowboy_egg',
    desc: '말을 타기에 안성맞춤인 질긴 청바지입니다.',
    iconText: '👖',
  },
  {
    id: 'cowboy_hand',
    name: '로데오 올가미',
    slot: 'hand',
    setTheme: 'cowboy',
    rarity: 'COMMON',
    requiredEggSkinId: 'cowboy_egg',
    desc: '원하는 것은 무엇이든 낚아채는 황금 밧줄입니다.',
    iconText: '🪢',
  },

  // 3. 🧜‍♀️ 인어공주 세트 (Mermaid) - [피드백 2] '신비한 인어란' 획득 시 지급되는 고유 의상
  {
    id: 'mermaid_hat',
    name: '진주 불가사리 티아라',
    slot: 'hat',
    setTheme: 'mermaid',
    rarity: 'EPIC',
    requiredEggSkinId: 'mermaid_egg',
    desc: '심해의 진주와 핑크빛 불가사리로 엮은 영롱한 티아라입니다.',
    iconText: '🧜‍♀️',
  },
  {
    id: 'mermaid_top',
    name: '보랏빛 조개 탑',
    slot: 'top',
    setTheme: 'mermaid',
    rarity: 'EPIC',
    requiredEggSkinId: 'mermaid_egg',
    desc: '달콤한 바다 내음이 풍기는 반짝이는 천연 조개 상의입니다.',
    iconText: '🐚',
  },
  {
    id: 'mermaid_bottom',
    name: '에메랄드 인어 꼬리',
    slot: 'bottom',
    setTheme: 'mermaid',
    rarity: 'EPIC',
    requiredEggSkinId: 'mermaid_egg',
    desc: '반짝이는 비늘과 하늘하늘한 지느러미가 매력적인 꼬리입니다.',
    iconText: '🐠',
  },
  {
    id: 'mermaid_hand',
    name: '심해의 삼지창',
    slot: 'hand',
    setTheme: 'mermaid',
    rarity: 'EPIC',
    requiredEggSkinId: 'mermaid_egg',
    desc: '파도를 다스리는 신비한 바다 마법의 트라이던트입니다.',
    iconText: '🔱',
  },

  // 4. 👑 로열 킹 세트 (Royal King) - [피드백 2] '로열 공주란' 획득 시 지급되는 고유 의상
  {
    id: 'king_hat',
    name: '찬란한 황금 왕관',
    slot: 'hat',
    setTheme: 'king',
    rarity: 'LEGENDARY',
    requiredEggSkinId: 'princess_egg',
    desc: '루비와 에메랄드가 박힌 제왕의 황금빛 왕관입니다.',
    iconText: '👑',
  },
  {
    id: 'king_top',
    name: '붉은 벨벳 왕실 망토',
    slot: 'top',
    setTheme: 'king',
    rarity: 'LEGENDARY',
    requiredEggSkinId: 'princess_egg',
    desc: '고귀한 흰 깃털 털장식이 달린 벨벳 망토입니다.',
    iconText: '🧣',
  },
  {
    id: 'king_bottom',
    name: '황금 보석 허리띠',
    slot: 'bottom',
    setTheme: 'king',
    rarity: 'LEGENDARY',
    requiredEggSkinId: 'princess_egg',
    desc: '순금으로 벼려낸 묵직하고 당당한 허리 장식입니다.',
    iconText: '✨',
  },
  {
    id: 'king_hand',
    name: '루비 영롱 왕홀',
    slot: 'hand',
    setTheme: 'king',
    rarity: 'LEGENDARY',
    requiredEggSkinId: 'princess_egg',
    desc: '왕국의 번영과 권위를 상징하는 왕실 보석 지팡이입니다.',
    iconText: '🪄',
  },
];

export const COSTUME_SETS = [
  {
    id: 'police',
    name: '정의의 경찰관 세트',
    icon: '👮',
    desc: '도로의 평화를 수호하는 듬직한 경찰 계란!',
    itemIds: ['police_hat', 'police_top', 'police_bottom', 'police_hand'],
  },
  {
    id: 'cowboy',
    name: '황야의 카우보이 세트',
    icon: '🤠',
    desc: '거친 슬로프를 질주하는 자유로운 방랑자 계란!',
    itemIds: ['cowboy_hat', 'cowboy_top', 'cowboy_bottom', 'cowboy_hand'],
  },
  {
    id: 'mermaid',
    name: '신비한 인어공주 세트',
    icon: '🧜‍♀️',
    desc: '푸른 바다의 신비를 머금은 우아한 인어 계란!',
    itemIds: ['mermaid_hat', 'mermaid_top', 'mermaid_bottom', 'mermaid_hand'],
  },
  {
    id: 'king',
    name: '위대한 로열 킹 세트',
    icon: '👑',
    desc: '만인의 우러름을 받는 찬란한 황금빛 군주 계란!',
    itemIds: ['king_hat', 'king_top', 'king_bottom', 'king_hand'],
  },
];

export function getCostumeById(id?: string): CostumeItem | undefined {
  if (!id) return undefined;
  return COSTUME_ITEMS.find((c) => c.id === id);
}

export function getCostumesBySlot(slot: CostumeSlot): CostumeItem[] {
  return COSTUME_ITEMS.filter((c) => c.slot === slot);
}
