import { UserProgress, GameStats, CostumeSlot } from '../types/game';
import { GAME_CONSTANTS } from '../game/constants';
import { EGG_SKINS } from '../data/eggSkins';
import { ACHIEVEMENTS } from '../data/achievements';
import { COSTUME_ITEMS } from '../data/eggCostumes';

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

export function getInitialProgress(): UserProgress {
  return {
    level: 1,
    exp: 0,
    nextLevelExp: getRequiredExpForLevel(2),
    bestDistanceMeters: 0,
    totalDistanceMeters: 0,
    totalGamesPlayed: 0,
    gold: 300,
    eggShells: 0,
    selectedEggId: 'classic',
    unlockedEggIds: ['classic'],
    equippedCostumes: {},
    unlockedCostumeIds: [],
    lastFreeGoldDate: undefined,
    achievementProgress: {},
    claimedAchievementIds: [],
  };
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
        eggShells: typeof data.eggShells === 'number' ? data.eggShells : 0,
        selectedEggId: data.selectedEggId || 'classic',
        unlockedEggIds,
        equippedCostumes: data.equippedCostumes || {},
        unlockedCostumeIds: Array.isArray(data.unlockedCostumeIds) ? data.unlockedCostumeIds : [],
        lastFreeGoldDate: data.lastFreeGoldDate,
        achievementProgress: data.achievementProgress || {},
        claimedAchievementIds: data.claimedAchievementIds || [],
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
    ...current,
    level,
    exp: newExp,
    nextLevelExp: neededForNext,
    bestDistanceMeters,
    totalDistanceMeters,
    totalGamesPlayed,
    gold: newGold,
    unlockedEggIds,
    achievementProgress: achProgress,
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

// 골드로 계란 구매/해금 (의상 계란인 경우 의상 세트 동시 지급!)
export function buyEggSkinWithGold(skinId: string, price: number): { success: boolean; progress: UserProgress; message?: string } {
  const current = loadUserProgress();
  if (current.unlockedEggIds.includes(skinId)) {
    return { success: false, progress: current, message: '이미 보유 중인 계란입니다.' };
  }
  if (current.gold < price) {
    return { success: false, progress: current, message: '골드가 부족합니다.' };
  }

  const skin = EGG_SKINS.find((s) => s.id === skinId);
  const newUnlockedCostumes = [...current.unlockedCostumeIds];
  if (skin?.bundledCostumes) {
    Object.values(skin.bundledCostumes).forEach((cId) => {
      if (cId && !newUnlockedCostumes.includes(cId)) {
        newUnlockedCostumes.push(cId);
      }
    });
  }

  const updated: UserProgress = {
    ...current,
    gold: current.gold - price,
    unlockedEggIds: [...current.unlockedEggIds, skinId],
    unlockedCostumeIds: newUnlockedCostumes,
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

// [피드백 3 해결] 일일 무료 선물 수령 (1일 1회 검증)
export function claimDailyFreeGold(): { success: boolean; progress: UserProgress; message?: string } {
  const current = loadUserProgress();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  if (current.lastFreeGoldDate === today) {
    return {
      success: false,
      progress: current,
      message: '오늘의 무료 선물은 이미 수령하셨습니다! 내일 다시 방문해주세요.',
    };
  }

  const updated: UserProgress = {
    ...current,
    gold: current.gold + 100,
    lastFreeGoldDate: today,
  };

  saveUserProgress(updated);
  return { success: true, progress: updated };
}

// [피드백 8 & 9 구현] 부위별 의상 장착/해제
export function equipCostume(
  slot: CostumeSlot,
  costumeId?: string
): { success: boolean; progress: UserProgress } {
  const current = loadUserProgress();
  const newEquipped = { ...current.equippedCostumes };

  if (!costumeId) {
    // 벗기
    delete newEquipped[slot];
  } else {
    // 착용 (해금 여부 검사)
    if (!current.unlockedCostumeIds.includes(costumeId)) {
      return { success: false, progress: current };
    }
    newEquipped[slot] = costumeId;
  }

  const updated: UserProgress = {
    ...current,
    equippedCostumes: newEquipped,
  };

  saveUserProgress(updated);
  return { success: true, progress: updated };
}

// [피드백 4 반영] 모든 의상 일괄 해제
export function clearAllCostumes(): { success: boolean; progress: UserProgress } {
  const current = loadUserProgress();
  const updated: UserProgress = {
    ...current,
    equippedCostumes: {},
  };
  saveUserProgress(updated);
  return { success: true, progress: updated };
}

// 의상 세트 일괄 장착
export function equipCostumeSet(
  itemIds: string[]
): { success: boolean; progress: UserProgress } {
  const current = loadUserProgress();
  const newEquipped = { ...current.equippedCostumes };

  for (const id of itemIds) {
    const item = COSTUME_ITEMS.find((c) => c.id === id);
    if (item && current.unlockedCostumeIds.includes(id)) {
      newEquipped[item.slot] = id;
    }
  }

  const updated: UserProgress = {
    ...current,
    equippedCostumes: newEquipped,
  };

  saveUserProgress(updated);
  return { success: true, progress: updated };
}

// 의상 구매 (골드 또는 계란 껍데기)
export function buyCostume(
  costumeId: string,
  currency: 'GOLD' | 'SHELLS'
): { success: boolean; progress: UserProgress; message?: string } {
  const current = loadUserProgress();
  const item = COSTUME_ITEMS.find((c) => c.id === costumeId);
  if (!item) {
    return { success: false, progress: current, message: '존재하지 않는 의상입니다.' };
  }
  if (current.unlockedCostumeIds.includes(costumeId)) {
    return { success: false, progress: current, message: '이미 보유 중인 의상입니다.' };
  }

  if (currency === 'GOLD') {
    const price = item.priceGold || 999999;
    if (current.gold < price) {
      return { success: false, progress: current, message: '골드가 부족합니다.' };
    }
    const updated: UserProgress = {
      ...current,
      gold: current.gold - price,
      unlockedCostumeIds: [...current.unlockedCostumeIds, costumeId],
      equippedCostumes: { ...current.equippedCostumes, [item.slot]: costumeId },
    };
    saveUserProgress(updated);
    return { success: true, progress: updated };
  } else {
    const price = item.priceShells || 999999;
    if (current.eggShells < price) {
      return { success: false, progress: current, message: '계란 껍데기가 부족합니다.' };
    }
    const updated: UserProgress = {
      ...current,
      eggShells: current.eggShells - price,
      unlockedCostumeIds: [...current.unlockedCostumeIds, costumeId],
      equippedCostumes: { ...current.equippedCostumes, [item.slot]: costumeId },
    };
    saveUserProgress(updated);
    return { success: true, progress: updated };
  }
}

// 계란 껍데기 추가
export function addEggShells(amount: number): UserProgress {
  const current = loadUserProgress();
  const updated: UserProgress = {
    ...current,
    eggShells: current.eggShells + amount,
  };
  saveUserProgress(updated);
  return updated;
}

// [피드백 10 구현] 게임 진행 상태 완전 초기화
export function resetAllProgress(): UserProgress {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('infinite_egg_progress_v1');
  const fresh = getInitialProgress();
  saveUserProgress(fresh);
  return fresh;
}
