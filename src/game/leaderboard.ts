// ─── Leaderboard client service ───────────────────────────────────────────────
// All API calls degrade gracefully when the server is unavailable (static deploy).
// Offline mode: player ID/name stored in localStorage; scores tracked locally.

export interface LBEntry {
  id: string;
  name: string;
  score: number;
  weeklyScore: number;
  battleWins: number;
  battleGames: number;
  winRate: number;
  rank: number;
  weeklyRank: number;
}

export interface LBResult {
  tab: string;
  list: LBEntry[];
  total: number;
}

export interface SubmitResult {
  id: string;
  name: string;
  score: number;
  rank: number;
  weeklyRank: number;
  prevRank: number;
  prevScore: number;
  pointsToNext: number;
  aboveName: string | null;
  isNewBest: boolean;
  rankImproved: boolean;
}

export interface BattleSubmitResult {
  id: string;
  battleWins: number;
  battleRank: number;
  prevWins: number;
  wonThisRound: boolean;
}

// ─── localStorage keys ───────────────────────────────────────────────────────

const PLAYER_ID_KEY   = 'flappyArc_playerId';
const PLAYER_NAME_KEY = 'flappyArc_playerName';
const BEST_SCORE_KEY  = 'flappyArc_bestScore';
const BATTLE_WINS_KEY = 'flappyArc_battleWins';

export function getStoredPlayerId(): string | null {
  return localStorage.getItem(PLAYER_ID_KEY);
}

export function getStoredPlayerName(): string | null {
  return localStorage.getItem(PLAYER_NAME_KEY);
}

export function storePlayer(id: string, name: string): void {
  localStorage.setItem(PLAYER_ID_KEY, id);
  localStorage.setItem(PLAYER_NAME_KEY, name);
}

// ─── Server reachability ─────────────────────────────────────────────────────

let _serverReachable: boolean | null = null; // null = untested

async function isServerReachable(): Promise<boolean> {
  if (_serverReachable !== null) return _serverReachable;
  try {
    const res = await fetch('/api/health', { method: 'GET', signal: AbortSignal.timeout(2000) });
    _serverReachable = res.ok;
  } catch {
    _serverReachable = false;
  }
  return _serverReachable;
}

// ─── Offline fallback helpers ─────────────────────────────────────────────────

function makeLocalId(): string {
  return 'local-' + Math.random().toString(36).slice(2, 10);
}

function offlineRegisterResult(name: string): LBEntry & { created: boolean } {
  const existing = getStoredPlayerId();
  const id = existing ?? makeLocalId();
  if (!existing) storePlayer(id, name);
  return {
    id,
    name,
    score: Number(localStorage.getItem(BEST_SCORE_KEY) ?? 0),
    weeklyScore: 0,
    battleWins: Number(localStorage.getItem(BATTLE_WINS_KEY) ?? 0),
    battleGames: 0,
    winRate: 0,
    rank: -1,
    weeklyRank: -1,
    created: !existing,
  };
}

function offlineSubmitSolo(id: string, score: number): SubmitResult {
  const prev = Number(localStorage.getItem(BEST_SCORE_KEY) ?? 0);
  const isNewBest = score > prev;
  if (isNewBest) localStorage.setItem(BEST_SCORE_KEY, String(score));
  return {
    id,
    name: getStoredPlayerName() ?? 'You',
    score,
    rank: -1,
    weeklyRank: -1,
    prevRank: -1,
    prevScore: prev,
    pointsToNext: 0,
    aboveName: null,
    isNewBest,
    rankImproved: false,
  };
}

function offlineSubmitBattle(id: string, won: boolean): BattleSubmitResult {
  const prev = Number(localStorage.getItem(BATTLE_WINS_KEY) ?? 0);
  const next = won ? prev + 1 : prev;
  if (won) localStorage.setItem(BATTLE_WINS_KEY, String(next));
  return { id, battleWins: next, battleRank: -1, prevWins: prev, wonThisRound: won };
}

function offlineLBResult(tab: string): LBResult {
  return { tab, list: [], total: 0 };
}

// ─── API layer (server → offline fallback) ───────────────────────────────────

const BASE = '/api';

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchLeaderboard(
  tab: 'global' | 'weekly' | 'battle' = 'global',
  limit = 50,
): Promise<LBResult> {
  if (!(await isServerReachable())) return offlineLBResult(tab);
  try {
    return await apiFetch<LBResult>(`/leaderboard?tab=${tab}&limit=${limit}`);
  } catch {
    return offlineLBResult(tab);
  }
}

export async function fetchPlayer(id: string): Promise<LBEntry> {
  if (!(await isServerReachable())) {
    return offlineRegisterResult(getStoredPlayerName() ?? 'You');
  }
  try {
    return await apiFetch<LBEntry>(`/player/${encodeURIComponent(id)}`);
  } catch {
    return offlineRegisterResult(getStoredPlayerName() ?? 'You');
  }
}

export async function registerPlayer(name: string): Promise<LBEntry & { created: boolean }> {
  if (!(await isServerReachable())) return offlineRegisterResult(name);
  try {
    return await apiFetch<LBEntry & { created: boolean }>('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
  } catch {
    return offlineRegisterResult(name);
  }
}

export async function submitSoloScore(id: string, score: number): Promise<SubmitResult> {
  if (!(await isServerReachable())) return offlineSubmitSolo(id, score);
  try {
    return await apiFetch<SubmitResult>('/submit-solo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, score }),
    });
  } catch {
    return offlineSubmitSolo(id, score);
  }
}

export async function submitBattleResult(id: string, won: boolean): Promise<BattleSubmitResult> {
  if (!(await isServerReachable())) return offlineSubmitBattle(id, won);
  try {
    return await apiFetch<BattleSubmitResult>('/submit-battle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, won }),
    });
  } catch {
    return offlineSubmitBattle(id, won);
  }
}
