import { GameStats, UserProgress } from '../types/game';

const STORAGE_KEY = 'infinite_egg_wireframe_v1';

export function getInitialProgress(): UserProgress {
  return {
    bestDistanceMeters: 0,
    totalGamesPlayed: 0,
  };
}

export function loadUserProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        bestDistanceMeters: typeof data.bestDistanceMeters === 'number' ? data.bestDistanceMeters : 0,
        totalGamesPlayed: typeof data.totalGamesPlayed === 'number' ? data.totalGamesPlayed : 0,
      };
    }
  } catch (e) {
    console.error('Failed to load user progress:', e);
  }
  return getInitialProgress();
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
  isNewRecord: boolean;
} {
  const current = loadUserProgress();
  const isNewRecord = stats.distanceMeters > current.bestDistanceMeters;
  const updated: UserProgress = {
    bestDistanceMeters: isNewRecord ? stats.distanceMeters : current.bestDistanceMeters,
    totalGamesPlayed: current.totalGamesPlayed + 1,
  };
  saveUserProgress(updated);
  return { progress: updated, isNewRecord };
}
