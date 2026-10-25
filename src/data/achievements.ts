import { AchievementItem, UserProgress, GameStats } from '../types/game';

export const ACHIEVEMENTS: AchievementItem[] = [
  {
    id: 'first_roll',
    title: '첫 걸음',
    desc: '내리막길을 100m 이상 질주하기',
    category: 'DISTANCE',
    target: 100,
    rewardGold: 100,
    rewardExp: 50,
  },
  {
    id: 'reach_300',
    title: '고산 지대 돌파',
    desc: '설산을 지나 300m 이상 하강하기',
    category: 'DISTANCE',
    target: 300,
    rewardGold: 200,
    rewardExp: 100,
  },
  {
    id: 'reach_800',
    title: '동굴 심층 탐험',
    desc: '초원을 지나 지하 동굴(800m)에 도달하기',
    category: 'DISTANCE',
    target: 800,
    rewardGold: 400,
    rewardExp: 200,
  },
  {
    id: 'reach_1500',
    title: '지각 층 돌파',
    desc: '지하 지각 암반대(1,500m)에 도달하기',
    category: 'DISTANCE',
    target: 1500,
    rewardGold: 700,
    rewardExp: 400,
  },
  {
    id: 'reach_2000',
    title: '지구 맨틀 정복',
    desc: '작열하는 지구 핵과 맨틀(2,000m)에 도달하기',
    category: 'DISTANCE',
    target: 2000,
    rewardGold: 1200,
    rewardExp: 800,
  },
  {
    id: 'play_5',
    title: '초보 굴림이',
    desc: '총 5회 이상 게임 플레이하기',
    category: 'PLAY',
    target: 5,
    rewardGold: 150,
    rewardExp: 80,
  },
  {
    id: 'play_20',
    title: '데굴데굴 장인',
    desc: '총 20회 이상 게임 플레이하기',
    category: 'PLAY',
    target: 20,
    rewardGold: 500,
    rewardExp: 300,
  },
  {
    id: 'bandage_10',
    title: '생존 본능',
    desc: '누적 반창고 10개 획득하기',
    category: 'SKILL',
    target: 10,
    rewardGold: 250,
    rewardExp: 150,
  },
  {
    id: 'perfect_20',
    title: '타이밍의 달인',
    desc: '퍼펙트 점프 또는 턴 누적 20회 달성하기',
    category: 'SKILL',
    target: 20,
    rewardGold: 350,
    rewardExp: 200,
  },
];

export function getAchievementProgress(
  id: string,
  progress: UserProgress
): number {
  switch (id) {
    case 'first_roll':
    case 'reach_300':
    case 'reach_800':
    case 'reach_1500':
    case 'reach_2000':
      return progress.bestDistanceMeters;
    case 'play_5':
    case 'play_20':
      return progress.totalGamesPlayed;
    default:
      return progress.achievementProgress?.[id] || 0;
  }
}
