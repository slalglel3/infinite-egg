import { UserProgress } from '../types/game';
import { GAME_CONSTANTS } from '../game/constants';

const STORAGE_KEY = 'infinite_egg_progress_v1';

// 레벨 N에 도달하기 위해 필요한 누적 경험치
// 100레벨 도달 시 엄청난 시간(약 1000시간)이 소요되도록 지수적 곡선 설계
export function getRequiredExpForLevel(level: number): number {
  if (level <= 1) return 0;
  // 레벨 2: 500m, 레벨 10: 약 15,000m, 레벨 100: 수천만m
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
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const { level, neededForNext } = calculateLevelFromExp(data.exp || 0);
      return {
        level,
        exp: data.exp || 0,
        nextLevelExp: neededForNext,
        bestDistanceMeters: data.bestDistanceMeters || 0,
        totalDistanceMeters: data.totalDistanceMeters || 0,
        totalGamesPlayed: data.totalGamesPlayed || 0,
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
  };
}

export function saveUserProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save user progress:', e);
  }
}

export function addGameResult(meters: number): { progress: UserProgress; leveledUp: boolean; isNewRecord: boolean } {
  const current = loadUserProgress();
  const oldLevel = current.level;

  const gainedExp = Math.floor(meters * GAME_CONSTANTS.BASE_EXP_PER_METER);
  const newExp = current.exp + gainedExp;
  const { level, neededForNext } = calculateLevelFromExp(newExp);

  const isNewRecord = meters > current.bestDistanceMeters;
  const bestDistanceMeters = isNewRecord ? meters : current.bestDistanceMeters;

  const updated: UserProgress = {
    level,
    exp: newExp,
    nextLevelExp: neededForNext,
    bestDistanceMeters,
    totalDistanceMeters: current.totalDistanceMeters + meters,
    totalGamesPlayed: current.totalGamesPlayed + 1,
  };

  saveUserProgress(updated);

  return {
    progress: updated,
    leveledUp: level > oldLevel,
    isNewRecord,
  };
}
