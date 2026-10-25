import { UserProgress, GameStats } from '../types/game';
import { GAME_CONSTANTS } from '../game/constants';
import { EGG_SKINS } from '../data/eggSkins';
import { ACHIEVEMENTS } from '../data/achievements';

const STORAGE_KEY = 'infinite_egg_progress_v2';

export function getRequiredExpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(400 * Math.pow(level, 2.3));
}

export function calculateLevelFromExp(totalExp: number): { level: number; expInLevel: number; neededForNext: number } {
  let level = 1;
  while (level < 100 && totalExp >= getRequiredExpForLevel(level + 1)) {
    level++;
  }
  const currentLevelBase = getRequiredExpForLevel(level);
  const nextLevelBase = getRequiredExpForLevel(level + 1);
  const expInLevel = totalExp - currentLevelBase;
  const neededForNext = nextLevelBase - currentLevelBase;

  return { level, expInLevel, neededForNext };
}

export function loadUserProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('infinite_egg_progress_v1');
    if (raw) {
      const data = JSON.parse(raw);
      const { level, neededForNext } = calculateLevelFromExp(data.exp || 0);
      
      const unlockedEggIds: string[] = Array.isArray(data.unlockedEggIds) && data.unlockedEggIds.length > 0
        ? data.unlockedEggIds
        : ['classic'];

      // 기존 기록 기반으로 달성 가능한 계란 자동 해금 검사
      const bestDist = data.bestDistanceMeters || 0;
      const games = data.totalGamesPlayed || 0;
      for (const skin of EGG_SKINS) {
        if (!unlockedEggIds.includes(skin.id) && skin.unlockReq) {
          if (skin.unlockReq.type === 'DISTANCE' && bestDist >= skin.unlockReq.value) {
            unlockedEggIds.push(skin.id);
          } else if (skin.unlockReq.type === 'GAMES' && games >= skin.unlockReq.value) {
            unlockedEggIds.push(skin.id);
          } else if (skin.unlockReq.type === 'LEVEL' && level >= skin.unlockReq.value) {
            unlockedEggIds.push(skin.id);
          }
        }
      }

      return {
        level,
        exp: data.exp || 0,
        nextLevelExp: neededForNext,
        bestDistanceMeters: bestDist,
        totalDistanceMeters: data.totalDistanceMeters || 0,
        totalGamesPlayed: games,
        gold: typeof data.gold === 'number' ? data.gold : 300, // 기본 웰컴 골드
        selectedEggId: data.selectedEggId || 'classic',
        unlockedEggIds,
        achievementProgress: data.achievementProgress || {},
        claimedAchievementIds: data.claimedAchievementIds || [],
      };
    }
  } catch (e) {
    console.error('Failed to load user progress:', e);
  }

  return {
    level: 1,
    exp: 0,
    nextLevelExp: getRequiredExpForLevel(2),
    bestDistanceMeters: 0,
    totalDistanceMeters: 0,
    totalGamesPlayed: 0,
    gold: 300,
    selectedEggId: 'classic',
    unlockedEggIds: ['classic'],
    achievementProgress: {},
    claimedAchievementIds: [],
  };
}

export function saveUserProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save user progress:', e);
  }
}

export function addGameResult(stats: GameStats): {
  progress: UserProgress;
  leveledUp: boolean;
  isNewRecord: boolean;
  earnedGold: number;
  newlyUnlockedEggIds: string[];
} {
  const current = loadUserProgress();
  const oldLevel = current.level;

  const meters = stats.distanceMeters;
  const gainedExp = Math.floor(meters * GAME_CONSTANTS.BASE_EXP_PER_METER);
  const newExp = current.exp + gainedExp;
  const { level, neededForNext } = calculateLevelFromExp(newExp);

  const isNewRecord = meters > current.bestDistanceMeters;
  const bestDistanceMeters = isNewRecord ? meters : current.bestDistanceMeters;
  const totalGamesPlayed = current.totalGamesPlayed + 1;
  const totalDistanceMeters = current.totalDistanceMeters + meters;

  // 골드 보상 공식: 이동 거리 보너스 + 아이템(반창고) 획득 + 퍼펙트 착지
  const earnedGold = Math.max(
    10,
    Math.floor(meters * 0.4) + stats.itemsCollected * 15 + stats.perfectLandings * 5
  );
  const newGold = current.gold + earnedGold;

  // 도전과제 진척도 업데이트
  const achProgress = { ...current.achievementProgress };
  achProgress['bandage_10'] = (achProgress['bandage_10'] || 0) + stats.itemsCollected;
  achProgress['perfect_20'] = (achProgress['perfect_20'] || 0) + stats.perfectLandings;

  // 계란 스킨 해금 체크
  const newlyUnlockedEggIds: string[] = [];
  const unlockedEggIds = [...current.unlockedEggIds];

  for (const skin of EGG_SKINS) {
    if (!unlockedEggIds.includes(skin.id) && skin.unlockReq) {
      let canUnlock = false;
      if (skin.unlockReq.type === 'DISTANCE' && bestDistanceMeters >= skin.unlockReq.value) {
        canUnlock = true;
      } else if (skin.unlockReq.type === 'GAMES' && totalGamesPlayed >= skin.unlockReq.value) {
        canUnlock = true;
      } else if (skin.unlockReq.type === 'LEVEL' && level >= skin.unlockReq.value) {
        canUnlock = true;
      }

      if (canUnlock) {
        unlockedEggIds.push(skin.id);
        newlyUnlockedEggIds.push(skin.id);
      }
    }
  }

  const updated: UserProgress = {
    level,
    exp: newExp,
    nextLevelExp: neededForNext,
    bestDistanceMeters,
    totalDistanceMeters,
    totalGamesPlayed,
    gold: newGold,
    selectedEggId: current.selectedEggId,
    unlockedEggIds,
    achievementProgress: achProgress,
    claimedAchievementIds: current.claimedAchievementIds,
  };

  saveUserProgress(updated);

  return {
    progress: updated,
    leveledUp: level > oldLevel,
    isNewRecord,
    earnedGold,
    newlyUnlockedEggIds,
  };
}

// 계란 장착
export function selectEggSkin(skinId: string): UserProgress {
  const current = loadUserProgress();
  if (current.unlockedEggIds.includes(skinId)) {
    const updated = { ...current, selectedEggId: skinId };
    saveUserProgress(updated);
    return updated;
  }
  return current;
}

// 골드로 계란 구매/해금
export function buyEggSkinWithGold(skinId: string, price: number): { success: boolean; progress: UserProgress; message?: string } {
  const current = loadUserProgress();
  if (current.unlockedEggIds.includes(skinId)) {
    return { success: false, progress: current, message: '이미 보유 중인 계란입니다.' };
  }
  if (current.gold < price) {
    return { success: false, progress: current, message: '골드가 부족합니다.' };
  }

  const updated: UserProgress = {
    ...current,
    gold: current.gold - price,
    unlockedEggIds: [...current.unlockedEggIds, skinId],
    selectedEggId: skinId, // 구매 즉시 자동 장착
  };

  saveUserProgress(updated);
  return { success: true, progress: updated };
}

// 도전 과제 보상 수령
export function claimAchievementReward(achievementId: string): { success: boolean; progress: UserProgress } {
  const current = loadUserProgress();
  if (current.claimedAchievementIds.includes(achievementId)) {
    return { success: false, progress: current };
  }

  const item = ACHIEVEMENTS.find((a) => a.id === achievementId);
  if (!item) return { success: false, progress: current };

  const newGold = current.gold + item.rewardGold;
  const newExp = current.exp + item.rewardExp;
  const { level, neededForNext } = calculateLevelFromExp(newExp);

  const updated: UserProgress = {
    ...current,
    level,
    exp: newExp,
    nextLevelExp: neededForNext,
    gold: newGold,
    claimedAchievementIds: [...current.claimedAchievementIds, achievementId],
  };

  saveUserProgress(updated);
  return { success: true, progress: updated };
}
