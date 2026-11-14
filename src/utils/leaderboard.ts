import { LeaderboardEntry } from '../types/game';

const LEADERBOARD_KEY = 'kawaii_cake_stack_leaderboard_v1';
const NICKNAME_KEY = 'kawaii_cake_stack_nickname_v1';
const MAX_ENTRIES = 10;

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is LeaderboardEntry =>
          typeof item?.id === 'string' &&
          typeof item?.nickname === 'string' &&
          typeof item?.score === 'number' &&
          typeof item?.floors === 'number'
      )
      .sort((a, b) => b.score - a.score || b.floors - a.floors)
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

export function getBestScore(): number {
  const list = getLeaderboard();
  return list.length > 0 ? list[0].score : 0;
}

export function saveLeaderboardEntry(
  entry: Omit<LeaderboardEntry, 'id' | 'createdAt'>
): LeaderboardEntry[] {
  const existing = getLeaderboard();
  const cleanNickname = entry.nickname.trim() || '甜點小廚師';
  const nextEntry: LeaderboardEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nickname: cleanNickname.slice(0, 16),
    score: entry.score,
    floors: entry.floors,
    maxCombo: entry.maxCombo,
    createdAt: new Date().toISOString(),
  };

  const updated = [...existing, nextEntry]
    .sort((a, b) => b.score - a.score || b.floors - a.floors)
    .slice(0, MAX_ENTRIES);

  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated));
    localStorage.setItem(NICKNAME_KEY, cleanNickname);
  } catch {
    // Ignore storage quota errors cleanly
  }

  return updated;
}

export function clearLeaderboard(): LeaderboardEntry[] {
  try {
    localStorage.removeItem(LEADERBOARD_KEY);
  } catch {
    // Ignore storage errors
  }
  return [];
}

export function getSavedNickname(): string {
  try {
    return localStorage.getItem(NICKNAME_KEY) || '';
  } catch {
    return '';
  }
}
