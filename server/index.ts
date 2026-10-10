// ─── Flappy ARC Leaderboard Server ────────────────────────────────────────────
// Bun-native HTTP server (no Express dependency needed)
// Stores data in memory + JSON file for persistence across restarts

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

// ─── Static file serving (production) ────────────────────────────────────────

const IS_PROD = process.env.NODE_ENV === 'production';
const DIST_DIR = join(import.meta.dir, '..', 'dist');

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.mjs':  'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.webp': 'image/webp',
};

function serveStatic(urlPath: string): Response | null {
  if (!IS_PROD) return null;
  // Normalise: strip query string
  const clean = urlPath.split('?')[0];
  const candidates = clean === '/' || !extname(clean)
    ? [join(DIST_DIR, 'index.html')]
    : [join(DIST_DIR, clean)];
  for (const filePath of candidates) {
    if (existsSync(filePath)) {
      const ext = extname(filePath);
      const mime = MIME[ext] ?? 'application/octet-stream';
      return new Response(readFileSync(filePath), {
        headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=3600' },
      });
    }
  }
  // SPA fallback
  const index = join(DIST_DIR, 'index.html');
  if (existsSync(index)) {
    return new Response(readFileSync(index), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
  return null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Entry {
  id: string;
  name: string;
  score: number;         // solo best
  battleWins: number;
  battleGames: number;
  weeklyScore: number;
  weekKey: string;       // "YYYY-Www" for weekly reset
  createdAt: number;
  updatedAt: number;
}

interface DB {
  entries: Entry[];
  version: number;
}

// ─── Persistence ──────────────────────────────────────────────────────────────

const DATA_DIR = join(import.meta.dir, '..', '.leaderboard-data');
const DATA_FILE = join(DATA_DIR, 'db.json');

function currentWeekKey(): string {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function loadDB(): DB {
  if (!existsSync(DATA_FILE)) return { entries: [], version: 1 };
  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf-8')) as DB;
  } catch {
    return { entries: [], version: 1 };
  }
}

function saveDB(db: DB): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('Failed to save DB', e);
  }
}

// ─── Seed with demo data ──────────────────────────────────────────────────────

function seedIfEmpty(db: DB): void {
  if (db.entries.length > 0) return;
  const wk = currentWeekKey();
  const names = ['ArcMaster', 'NeonFlyer', 'CryptoHawk', 'BlockPilot', 'VelociDAI',
                 'SkyForge', 'NodeRunner', 'ChainBird', 'FluxRider', 'PixelArc',
                 'ZeroFee', 'GasLord', 'MintFly', 'BridgeBot', 'LedgerAce',
                 'QuickSign', 'WalletWing', 'StableFlap', 'CircleKing', 'ArcAngel'];
  const scores = [312, 278, 251, 229, 204, 188, 171, 155, 143, 130,
                  118, 107, 98, 88, 79, 71, 64, 57, 49, 42];
  const wins   = [38, 31, 27, 24, 21, 18, 16, 14, 12, 10,
                   9,  8,  7,  6,  5,  4,  3,  3,  2,  1];
  names.forEach((name, i) => {
    db.entries.push({
      id: `seed-${i}`,
      name,
      score: scores[i],
      battleWins: wins[i],
      battleGames: wins[i] + Math.floor(wins[i] * 0.4),
      weeklyScore: Math.floor(scores[i] * 0.6),
      weekKey: wk,
      createdAt: Date.now() - (20 - i) * 86400000,
      updatedAt: Date.now() - i * 3600000,
    });
  });
  saveDB(db);
}

// ─── Challenge storage ────────────────────────────────────────────────────────

interface ChallengeRecord {
  id: string;
  challengerName: string;
  challengerScore: number;
  createdAt: number;
}

const challenges = new Map<string, ChallengeRecord>();

// ─── Init ─────────────────────────────────────────────────────────────────────

const db = loadDB();
seedIfEmpty(db);

// ─── Rate limiting (per-IP, simple in-memory) ─────────────────────────────────

const submitCooldown = new Map<string, number>(); // ip -> last submit ms
const SUBMIT_COOLDOWN_MS = 5000; // 5 s between submissions per IP

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRankedSolo(): Entry[] {
  return [...db.entries].sort((a, b) => b.score - a.score);
}

function getRankedWeekly(): Entry[] {
  const wk = currentWeekKey();
  return [...db.entries]
    .map(e => ({ ...e, weeklyScore: e.weekKey === wk ? e.weeklyScore : 0 }))
    .sort((a, b) => b.weeklyScore - a.weeklyScore)
    .filter(e => e.weeklyScore > 0);
}

function getRankedBattle(): Entry[] {
  return [...db.entries].sort((a, b) => b.battleWins - a.battleWins);
}

function rankOf(id: string, list: Entry[]): number {
  const idx = list.findIndex(e => e.id === id);
  return idx === -1 ? -1 : idx + 1;
}

function toPublic(e: Entry, rank: number, weeklyRank: number) {
  return {
    id: e.id,
    name: e.name,
    score: e.score,
    weeklyScore: e.weeklyScore,
    battleWins: e.battleWins,
    battleGames: e.battleGames,
    winRate: e.battleGames > 0 ? Math.round((e.battleWins / e.battleGames) * 100) : 0,
    rank,
    weeklyRank,
  };
}

function cors(res: Headers) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
}

function json(data: unknown, status = 200) {
  const h = new Headers({ 'Content-Type': 'application/json' });
  cors(h);
  return new Response(JSON.stringify(data), { status, headers: h });
}

// ─── Score validation ─────────────────────────────────────────────────────────

const MAX_PLAUSIBLE_SCORE = 9999;

function validateScore(score: unknown): number | null {
  if (typeof score !== 'number') return null;
  if (!Number.isInteger(score)) return null;
  if (score < 0 || score > MAX_PLAUSIBLE_SCORE) return null;
  return score;
}

function validateName(name: unknown): string | null {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (trimmed.length < 2 || trimmed.length > 16) return null;
  if (!/^[a-zA-Z0-9 _\-]+$/.test(trimmed)) return null;
  return trimmed;
}

// ─── Request router ───────────────────────────────────────────────────────────

const PORT = IS_PROD ? 7860 : 3001;

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    // Strip /api prefix so both proxy (dev) and direct (prod) calls work
    const path = url.pathname.replace(/^\/api/, '') || '/';
    const method = req.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      const h = new Headers();
      cors(h);
      return new Response(null, { status: 204, headers: h });
    }

    // GET /health
    if (method === 'GET' && path === '/health') {
      return json({ ok: true });
    }

    // Static files (production only — in dev, Vite handles this)
    // Use the original pathname (before /api stripping) to avoid false matches
    const originalPath = url.pathname;
    if (IS_PROD && !originalPath.startsWith('/api/')) {
      const staticResp = serveStatic(originalPath);
      if (staticResp) return staticResp;
    }

    // GET /leaderboard?tab=global|weekly|battle&limit=50
    if (method === 'GET' && path === '/leaderboard') {
      const tab = url.searchParams.get('tab') || 'global';
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);

      const soloList = getRankedSolo();
      const weeklyList = getRankedWeekly();
      const battleList = getRankedBattle();

      let list: ReturnType<typeof toPublic>[];
      if (tab === 'weekly') {
        list = weeklyList.slice(0, limit).map((e, i) => toPublic(e, rankOf(e.id, soloList), i + 1));
      } else if (tab === 'battle') {
        list = battleList.slice(0, limit).map(e => toPublic(e, rankOf(e.id, soloList), rankOf(e.id, weeklyList)));
      } else {
        // global
        list = soloList.slice(0, limit).map((e, i) => toPublic(e, i + 1, rankOf(e.id, weeklyList)));
      }
      return json({ tab, list, total: db.entries.length });
    }

    // GET /player/:id
    if (method === 'GET' && path.startsWith('/player/')) {
      const id = decodeURIComponent(path.slice('/player/'.length));
      const entry = db.entries.find(e => e.id === id);
      if (!entry) return json({ error: 'not found' }, 404);
      const solo = getRankedSolo();
      const weekly = getRankedWeekly();
      return json(toPublic(entry, rankOf(id, solo), rankOf(id, weekly)));
    }

    // POST /register — create a new player
    if (method === 'POST' && path === '/register') {
      let body: unknown;
      try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
      const name = validateName((body as Record<string, unknown>).name);
      if (!name) return json({ error: 'invalid name (2–16 alphanumeric chars)' }, 400);
      // check duplicate name (case-insensitive)
      const exists = db.entries.find(e => e.name.toLowerCase() === name.toLowerCase());
      if (exists) {
        // Return the existing player so they can reclaim their ID
        const solo = getRankedSolo();
        const weekly = getRankedWeekly();
        return json({ ...toPublic(exists, rankOf(exists.id, solo), rankOf(exists.id, weekly)), created: false });
      }
      const id = `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const wk = currentWeekKey();
      const entry: Entry = { id, name, score: 0, battleWins: 0, battleGames: 0, weeklyScore: 0, weekKey: wk, createdAt: Date.now(), updatedAt: Date.now() };
      db.entries.push(entry);
      saveDB(db);
      return json({ ...toPublic(entry, db.entries.length, -1), created: true });
    }

    // POST /submit-solo — submit a solo score
    if (method === 'POST' && path === '/submit-solo') {
      let body: unknown;
      try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
      const { id, score: rawScore } = body as Record<string, unknown>;
      if (typeof id !== 'string') return json({ error: 'missing id' }, 400);
      const score = validateScore(rawScore);
      if (score === null) return json({ error: 'invalid score' }, 400);

      // Rate limit
      const ip = req.headers.get('x-forwarded-for') || 'local';
      const lastSubmit = submitCooldown.get(ip) ?? 0;
      if (Date.now() - lastSubmit < SUBMIT_COOLDOWN_MS) {
        return json({ error: 'rate limited — wait a moment' }, 429);
      }
      submitCooldown.set(ip, Date.now());

      const entry = db.entries.find(e => e.id === id);
      if (!entry) return json({ error: 'player not found' }, 404);

      const prevRankSolo = rankOf(id, getRankedSolo());
      const prevScore = entry.score;

      const wk = currentWeekKey();
      if (entry.weekKey !== wk) { entry.weeklyScore = 0; entry.weekKey = wk; }

      let updated = false;
      if (score > entry.score) { entry.score = score; updated = true; }
      if (score > entry.weeklyScore) { entry.weeklyScore = score; updated = true; }
      if (updated) { entry.updatedAt = Date.now(); saveDB(db); }

      const soloList = getRankedSolo();
      const weeklyList = getRankedWeekly();
      const newRank = rankOf(id, soloList);
      const weeklyRank = rankOf(id, weeklyList);

      // Find the entry just above for "X points away"
      const above = soloList[newRank - 2]; // rank is 1-based; above = index newRank-2
      const pointsToNext = above ? above.score - entry.score + 1 : 0;

      return json({
        ...toPublic(entry, newRank, weeklyRank),
        prevRank: prevRankSolo,
        prevScore,
        pointsToNext: pointsToNext > 0 ? pointsToNext : 0,
        aboveName: above?.name ?? null,
        isNewBest: score > prevScore,
        rankImproved: newRank < prevRankSolo && prevRankSolo !== -1,
      });
    }

    // POST /submit-battle — submit a battle result
    if (method === 'POST' && path === '/submit-battle') {
      let body: unknown;
      try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
      const { id, won } = body as Record<string, unknown>;
      if (typeof id !== 'string') return json({ error: 'missing id' }, 400);
      if (typeof won !== 'boolean') return json({ error: 'missing won' }, 400);

      const ip = req.headers.get('x-forwarded-for') || 'local';
      const lastSubmit = submitCooldown.get(`battle-${ip}`) ?? 0;
      if (Date.now() - lastSubmit < SUBMIT_COOLDOWN_MS) return json({ error: 'rate limited' }, 429);
      submitCooldown.set(`battle-${ip}`, Date.now());

      const entry = db.entries.find(e => e.id === id);
      if (!entry) return json({ error: 'player not found' }, 404);
      const prevWins = entry.battleWins;
      entry.battleGames += 1;
      if (won) entry.battleWins += 1;
      entry.updatedAt = Date.now();
      saveDB(db);

      const battleList = getRankedBattle();
      return json({
        ...toPublic(entry, rankOf(id, getRankedSolo()), rankOf(id, getRankedWeekly())),
        battleRank: rankOf(id, battleList),
        prevWins,
        wonThisRound: won,
      });
    }

    // POST /challenge — create a new challenge
    if (method === 'POST' && path === '/challenge') {
      let body: unknown;
      try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
      const { challengerName, score: rawScore } = body as Record<string, unknown>;
      const name = validateName(challengerName);
      if (!name) return json({ error: 'invalid name' }, 400);
      const score = validateScore(rawScore);
      if (score === null) return json({ error: 'invalid score' }, 400);

      const id = `ch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const record: ChallengeRecord = { id, challengerName: name, challengerScore: score, createdAt: Date.now() };
      challenges.set(id, record);
      // Expire old challenges (keep last 1000)
      if (challenges.size > 1000) {
        const oldest = [...challenges.keys()][0];
        challenges.delete(oldest);
      }
      return json({ id, challengerName: name, challengerScore: score });
    }

    // GET /challenge/:id
    if (method === 'GET' && path.startsWith('/challenge/')) {
      const id = decodeURIComponent(path.slice('/challenge/'.length));
      const record = challenges.get(id);
      if (!record) return json({ error: 'not found' }, 404);
      return json(record);
    }

    return json({ error: 'not found' }, 404);
  },
});

console.log(`Leaderboard server running on http://localhost:${PORT}${IS_PROD ? ' (production — serving static + API)' : ''}`);
