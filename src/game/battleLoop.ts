// ─── 2-Player Battle game loop ─────────────────────────────────────────────────
//
// Architecture:
//  - One shared obstacle *template* is generated with canonical positions.
//  - Each player gets their own copy of those obstacles with `scored: false`.
//  - Both players share speed / difficulty progression (keyed to the higher score).
//  - All other state (player position, vy, particles, score) is fully independent.

import type { Obstacle, Particle, GameConfig } from './types';
import { applyGravity, jump, isOutOfBounds } from './physics';
import { collidesWithObstacle, checkScore } from './collision';
import { updateParticles, spawnImpact, spawnScore, spawnMilestone } from './particles';
import { audio } from './audio';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BattleState =
  | 'BATTLE_COUNTDOWN'
  | 'BATTLE_PLAYING'
  | 'BATTLE_RESULT'
  | 'BATTLE_DYING'; // brief window after one player dies before showing result

export interface BattlePlayer {
  x: number;
  y: number;
  vy: number;
  angle: number;
  trail: { x: number; y: number }[];
  size: number;
  alive: boolean;
  score: number;
  scoreFlash: number;
  milestoneFlash: number;
  particles: Particle[];
  obstacles: Obstacle[];    // player's own copy (shares x/topH/botY/gap with template)
  shakeFrames: number;
  shakeX: number;
  shakeY: number;
  dimAlpha: number;         // dims to 0.45 when dead
}

export interface BattleLoopState {
  state: BattleState;
  countdown: number;        // 3 → 2 → 1 → 0 (GO!)
  countdownFrac: number;    // 0-1 within current second for animation
  p1: BattlePlayer;
  p2: BattlePlayer;
  speed: number;
  winner: 0 | 1 | 2;       // 0 = not determined, 1 = P1, 2 = P2
  dyingFrames: number;      // frames left in BATTLE_DYING window
  cfg: GameConfig;
  // Shared obstacle template (positions only — IDs and flags not shared)
  obstacleTemplate: ObstacleTemplate[];
  nextTemplateIdx: number;
  nextSpawnX: number;
}

interface ObstacleTemplate {
  templateX: number;   // canonical x when created
  topH: number;
  gap: number;
}

// ─── Shared constants ─────────────────────────────────────────────────────────

const DYING_FRAMES = 90;    // ~1.5 s at 60 fps
const COUNTDOWN_FRAMES = 60; // 1 s per digit

// ─── Speed / gap helpers (same as solo) ──────────────────────────────────────

function calcSpeed(score: number, base: number): number {
  if (score < 10) return base;
  if (score < 20) return base * 1.08;
  if (score < 30) return base * 1.16;
  if (score < 40) return base * 1.25;
  if (score < 50) return base * 1.35;
  return base * (1.35 + Math.min((score - 50) * 0.004, 0.25));
}

function gapForScore(score: number, cfg: GameConfig): number {
  const gapMax = cfg.gapMax;
  const gapMin = cfg.gapMin;
  const reduction = Math.min(score * 0.4, 40);
  return Math.max(gapMin, gapMax - reduction);
}

// ─── Obstacle template generation ────────────────────────────────────────────

let _idCounter = 8000;

function generateTemplate(cfg: GameConfig, score: number): ObstacleTemplate {
  const gap = gapForScore(score, cfg);
  const margin = 60;
  const maxTopH = cfg.height - gap - margin;
  const topH = margin + Math.random() * (maxTopH - margin);
  return { templateX: 0, topH, gap };
}

// ─── Initial player ───────────────────────────────────────────────────────────

function makePlayer(cfg: GameConfig): BattlePlayer {
  return {
    x: cfg.playerX,
    y: cfg.height / 2,
    vy: 0,
    angle: 0,
    trail: [],
    size: cfg.width < 400 ? 34 : 40,
    alive: true,
    score: 0,
    scoreFlash: 0,
    milestoneFlash: 0,
    particles: [],
    obstacles: [],
    shakeFrames: 0,
    shakeX: 0,
    shakeY: 0,
    dimAlpha: 1,
  };
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────

export function createBattleState(cfg: GameConfig): BattleLoopState {
  const p1 = makePlayer(cfg);
  const p2 = makePlayer(cfg);

  // Pre-generate a few templates and spawn initial obstacles
  const templates: ObstacleTemplate[] = [];
  const state: BattleLoopState = {
    state: 'BATTLE_COUNTDOWN',
    countdown: 3,
    countdownFrac: 0,
    p1,
    p2,
    speed: cfg.baseSpeed,
    winner: 0,
    dyingFrames: 0,
    cfg,
    obstacleTemplate: templates,
    nextTemplateIdx: 0,
    nextSpawnX: cfg.width + cfg.obstacleSpacing,
  };
  return syncObstacles(state);
}

// Makes sure both players have the same obstacle layout synced from templates
function syncObstacles(s: BattleLoopState): BattleLoopState {
  const cfg = s.cfg;
  // Ensure we have enough template entries
  const templates = [...s.obstacleTemplate];
  let nextSpawnX = s.nextSpawnX;

  // Spawn templates while next spawn is within view + buffer
  while (nextSpawnX < cfg.width + cfg.obstacleSpacing * 2) {
    templates.push(generateTemplate(cfg, Math.max(s.p1.score, s.p2.score)));
    nextSpawnX += cfg.obstacleSpacing;
  }

  // Build obstacle lists for each player from the templates they haven't seen yet
  function spawnFor(p: BattlePlayer): Obstacle[] {
    const obs = [...p.obstacles];
    // Add any template-derived obstacles that are now within spawn range
    // We key by "how many templates have been spawned" compared to existing obstacles
    const currentCount = obs.length;
    const totalTemplates = templates.length;
    for (let i = currentCount; i < totalTemplates; i++) {
      const t = templates[i];
      // x = spawnX for template i
      const spawnX = cfg.width + cfg.obstacleSpacing + i * cfg.obstacleSpacing;
      obs.push({
        id: _idCounter++,
        x: spawnX,
        topH: t.topH,
        botY: t.topH + t.gap,
        gap: t.gap,
        width: cfg.obstacleWidth,
        scored: false,
      });
    }
    return obs;
  }

  return {
    ...s,
    obstacleTemplate: templates,
    nextSpawnX,
    p1: { ...s.p1, obstacles: spawnFor(s.p1) },
    p2: { ...s.p2, obstacles: spawnFor(s.p2) },
  };
}

// ─── Per-player tick (obstacle movement, scoring, collision) ──────────────────

function tickPlayer(
  p: BattlePlayer,
  speed: number,
  cfg: GameConfig,
): { p: BattlePlayer; died: boolean } {
  if (!p.alive) {
    const dimAlpha = Math.max(0.42, p.dimAlpha - 0.008);
    return {
      p: {
        ...p,
        dimAlpha,
        particles: updateParticles(p.particles),
        shakeFrames: Math.max(0, p.shakeFrames - 1),
        shakeX: 0,
        shakeY: 0,
        scoreFlash: Math.max(0, p.scoreFlash - 0.05),
        milestoneFlash: Math.max(0, p.milestoneFlash - 0.03),
      },
      died: false,
    };
  }

  // Physics
  let player = applyGravity(p, cfg);

  // Move & filter obstacles
  let obstacles = p.obstacles
    .map(o => ({ ...o, x: o.x - speed }))
    .filter(o => o.x + o.width > -cfg.obstacleWidth - 10);

  // Scoring
  let score = p.score;
  let scoreFlash = Math.max(0, p.scoreFlash - 0.05);
  let milestoneFlash = Math.max(0, p.milestoneFlash - 0.025);
  let particles = updateParticles(p.particles);

  for (let i = 0; i < obstacles.length; i++) {
    const obs = obstacles[i];
    if (checkScore(player, obs)) {
      obstacles[i] = { ...obs, scored: true };
      score += 1;
      audio.score();
      particles = [...particles, ...spawnScore(player.x, player.y)];
      scoreFlash = 1;
      if (score % 10 === 0) {
        milestoneFlash = 1;
        particles = [...particles, ...spawnMilestone(player.x, player.y)];
      }
    }
  }

  // Collision
  let died = false;
  for (const obs of obstacles) {
    if (collidesWithObstacle(player, obs)) { died = true; break; }
  }
  if (!died && isOutOfBounds(player, cfg.height)) died = true;

  if (died) {
    audio.collision();
    const impactP = spawnImpact(player.x, player.y);
    return {
      p: {
        ...p,
        ...player,
        obstacles,
        score,
        scoreFlash,
        milestoneFlash,
        particles: [...particles, ...impactP],
        alive: false,
        shakeFrames: 12,
        shakeX: 0,
        shakeY: 0,
        dimAlpha: 1,
      },
      died: true,
    };
  }

  const shakeFrames = Math.max(0, p.shakeFrames - 1);

  return {
    p: {
      ...p,
      ...player,
      obstacles,
      score,
      scoreFlash,
      milestoneFlash,
      particles,
      shakeFrames,
      shakeX: shakeFrames > 0 ? (Math.random() - 0.5) * 8 * (shakeFrames / 12) : 0,
      shakeY: shakeFrames > 0 ? (Math.random() - 0.5) * 6 * (shakeFrames / 12) : 0,
      dimAlpha: 1,
    },
    died: false,
  };
}

// ─── Countdown tick ───────────────────────────────────────────────────────────

let countdownFrameCount = 0;

export function tickBattle(s: BattleLoopState): BattleLoopState {
  if (s.state === 'BATTLE_RESULT') return s;

  // ── Countdown ──
  if (s.state === 'BATTLE_COUNTDOWN') {
    countdownFrameCount++;
    const frac = (countdownFrameCount % COUNTDOWN_FRAMES) / COUNTDOWN_FRAMES;
    const digit = 3 - Math.floor(countdownFrameCount / COUNTDOWN_FRAMES);
    if (digit < 0) {
      // GO! frame — transition to playing
      countdownFrameCount = 0;
      return {
        ...s,
        state: 'BATTLE_PLAYING',
        countdown: 0,
        countdownFrac: 1,
      };
    }
    return { ...s, countdown: digit, countdownFrac: frac };
  }

  // ── Dying window ──
  if (s.state === 'BATTLE_DYING') {
    const dyingFrames = s.dyingFrames - 1;
    const r1 = tickPlayer(s.p1, s.speed, s.cfg);
    const r2 = tickPlayer(s.p2, s.speed, s.cfg);

    if (dyingFrames <= 0) {
      return {
        ...s,
        state: 'BATTLE_RESULT',
        p1: r1.p,
        p2: r2.p,
        dyingFrames: 0,
      };
    }
    return { ...s, p1: r1.p, p2: r2.p, dyingFrames };
  }

  // ── Playing ──
  const r1 = tickPlayer(s.p1, s.speed, s.cfg);
  const r2 = tickPlayer(s.p2, s.speed, s.cfg);

  // Sync new obstacle templates
  let next = syncObstacles({ ...s, p1: r1.p, p2: r2.p });

  // Speed driven by highest score
  const topScore = Math.max(r1.p.score, r2.p.score);
  const speed = calcSpeed(topScore, s.cfg.baseSpeed);

  // Winner detection
  const p1Died = r1.died;
  const p2Died = r2.died;

  if (p1Died || p2Died) {
    let winner: 0 | 1 | 2 = 0;
    if (p1Died && p2Died) {
      // Same frame — compare scores
      winner = r1.p.score > r2.p.score ? 1 : r2.p.score > r1.p.score ? 2 : 0;
    } else if (p1Died) {
      winner = 2;
    } else {
      winner = 1;
    }

    if (winner === 0) {
      // True draw
      audio.collision();
    } else {
      setTimeout(() => audio.newBest(), 300);
    }

    return {
      ...next,
      p1: r1.p,
      p2: r2.p,
      speed,
      winner,
      state: 'BATTLE_DYING',
      dyingFrames: DYING_FRAMES,
    };
  }

  return { ...next, speed };
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function battleJump(s: BattleLoopState, player: 1 | 2): BattleLoopState {
  if (s.state !== 'BATTLE_PLAYING') return s;
  if (player === 1 && s.p1.alive) {
    audio.jump();
    return { ...s, p1: { ...s.p1, ...jump(s.p1, s.cfg) } };
  }
  if (player === 2 && s.p2.alive) {
    audio.jump();
    return { ...s, p2: { ...s.p2, ...jump(s.p2, s.cfg) } };
  }
  return s;
}

// ─── Reset ────────────────────────────────────────────────────────────────────

export function resetBattle(s: BattleLoopState): BattleLoopState {
  countdownFrameCount = 0;
  const cfg = s.cfg;
  return {
    ...createBattleState(cfg),
    cfg,
  };
}
