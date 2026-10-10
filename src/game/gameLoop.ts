// ─── Core game loop & state machine ───────────────────────────────────────────

import type { GameState, GameSnapshot, Player, Obstacle, Particle, GameConfig } from './types';
import { applyGravity, jump, isOutOfBounds } from './physics';
import { spawnIfNeeded, moveObstacles, filterObstacles } from './obstacles';
import { collidesWithObstacle, checkScore } from './collision';
import { updateParticles, spawnImpact, spawnScore, spawnMilestone, spawnPerfect } from './particles';
import { audio } from './audio';
import { updateBackground } from './background';
import {
  createPerfectState, onGatePassed, tickPerfectState,
  type PerfectState,
} from './perfectCombo';
import {
  createArcEnergyState, addEnergy, tickArcEnergy,
  getEnergyFraction, type ArcEnergyState,
} from './arcEnergy';
import {
  createGhostState, startGhostRun, tickGhost, finaliseGhostRun,
  saveGhostEnabled, type GhostState,
} from './ghostRace';

const BEST_KEY = 'flappyarc_best';

function loadBest(): number {
  return parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
}
function saveBest(v: number) {
  localStorage.setItem(BEST_KEY, String(v));
}

// Speed per score bracket
function calcSpeed(score: number, base: number): number {
  if (score < 10) return base;
  if (score < 20) return base * 1.08;
  if (score < 30) return base * 1.16;
  if (score < 40) return base * 1.25;
  if (score < 50) return base * 1.35;
  return base * (1.35 + Math.min((score - 50) * 0.004, 0.25));
}

function gapForScore(score: number, cfg: GameConfig): number {
  const reduction = Math.min(score * 0.4, 40);
  return Math.max(cfg.gapMin, cfg.gapMax - reduction);
}

interface GameLoopState {
  state: GameState;
  score: number;
  best: number;
  player: Player;
  obstacles: Obstacle[];
  particles: Particle[];
  speed: number;
  isNewBest: boolean;
  milestoneFlash: number;
  scoreFlash: number;
  shakeFrames: number;
  shakeX: number;
  shakeY: number;
  cfg: GameConfig;
  // Legacy combo (score-based milestones, kept for non-perfect combos)
  comboLabel: string;
  comboFade: number;
  envFlash: number;
  // New feature states
  perfect: PerfectState;
  energy: ArcEnergyState;
  ghost: GhostState;
  // Challenge
  challengeTarget: number;
  challengeCleared: boolean;
}

export function createInitialState(cfg: GameConfig): GameLoopState {
  return {
    state: 'MENU',
    score: 0,
    best: loadBest(),
    player: {
      x: cfg.playerX,
      y: cfg.height / 2,
      vy: 0,
      angle: 0,
      trail: [],
      size: cfg.width < 400 ? 38 : 44,
    },
    obstacles: [],
    particles: [],
    speed: cfg.baseSpeed,
    isNewBest: false,
    milestoneFlash: 0,
    scoreFlash: 0,
    shakeFrames: 0,
    shakeX: 0,
    shakeY: 0,
    cfg,
    comboLabel: '',
    comboFade: 0,
    envFlash: 0,
    perfect: createPerfectState(),
    energy: createArcEnergyState(),
    ghost: createGhostState(),
    challengeTarget: 0,
    challengeCleared: false,
  };
}

export function startGame(s: GameLoopState, challengeTarget = 0): GameLoopState {
  const player: Player = {
    x: s.cfg.playerX,
    y: s.cfg.height / 2,
    vy: 0,
    angle: 0,
    trail: [],
    size: s.player.size,
  };
  return {
    ...s,
    state: 'READY',
    score: 0,
    player,
    obstacles: spawnIfNeeded([], s.cfg),
    particles: [],
    speed: s.cfg.baseSpeed,
    isNewBest: false,
    milestoneFlash: 0,
    scoreFlash: 0,
    shakeFrames: 0,
    shakeX: 0,
    shakeY: 0,
    comboLabel: '',
    comboFade: 0,
    envFlash: 0,
    perfect: createPerfectState(),
    energy: createArcEnergyState(),
    ghost: startGhostRun(s.ghost),
    challengeTarget,
    challengeCleared: false,
  };
}

export function handleTap(s: GameLoopState): GameLoopState {
  if (s.state === 'MENU') return s;
  if (s.state === 'GAME_OVER') return s;

  const newState: GameState = s.state === 'READY' ? 'PLAYING' : s.state;
  const player = jump(s.player, s.cfg);
  audio.jump();
  return { ...s, state: newState, player };
}

export function setGhostEnabled(s: GameLoopState, enabled: boolean): GameLoopState {
  saveGhostEnabled(enabled);
  return { ...s, ghost: { ...s.ghost, ghostEnabled: enabled } };
}

export function tickFrame(s: GameLoopState): GameLoopState {
  if (s.state === 'MENU' || s.state === 'GAME_OVER' || s.state === 'PAUSED') {
    const perfect = tickPerfectState(s.perfect);
    const { next: energy } = tickArcEnergy(s.energy);
    return {
      ...s,
      perfect,
      energy,
      milestoneFlash: Math.max(0, s.milestoneFlash - 0.03),
      scoreFlash: Math.max(0, s.scoreFlash - 0.05),
      comboFade: Math.max(0, s.comboFade - 0.025),
      envFlash: Math.max(0, s.envFlash - 0.03),
      particles: updateParticles(s.particles),
    };
  }

  let player = applyGravity(s.player, s.cfg);
  let obstacles = s.obstacles;
  let particles = updateParticles(s.particles);
  let score = s.score;
  let milestoneFlash = Math.max(0, s.milestoneFlash - 0.025);
  let scoreFlash = Math.max(0, s.scoreFlash - 0.05);
  let comboFade = Math.max(0, s.comboFade - 0.022);
  let comboLabel = s.comboLabel;
  let envFlash = Math.max(0, s.envFlash - 0.025);
  let shakeFrames = Math.max(0, s.shakeFrames - 1);
  let shakeX = shakeFrames > 0 ? (Math.random() - 0.5) * 8 * (shakeFrames / 12) : 0;
  let shakeY = shakeFrames > 0 ? (Math.random() - 0.5) * 6 * (shakeFrames / 12) : 0;
  let speed = s.speed;
  let perfect = tickPerfectState(s.perfect);
  let { next: energy, justActivated } = tickArcEnergy(s.energy);
  let challengeCleared = s.challengeCleared;

  if (justActivated) {
    audio.arcModeActivate();
  }

  if (s.state !== 'READY') {
    // Move obstacles
    obstacles = moveObstacles(obstacles, speed);
    obstacles = filterObstacles(obstacles, -s.cfg.obstacleWidth - 10);

    const updatedCfg: GameConfig = {
      ...s.cfg,
      gapMax: gapForScore(score, s.cfg),
      gapMin: gapForScore(score, s.cfg) - 30,
    };
    obstacles = spawnIfNeeded(obstacles, updatedCfg);

    // Check scoring
    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      if (checkScore(player, obs)) {
        obstacles[i] = { ...obs, scored: true };
        score += 1;
        audio.score();
        particles = [...particles, ...spawnScore(player.x, player.y)];
        scoreFlash = 1;
        speed = calcSpeed(score, s.cfg.baseSpeed);

        // Challenge cleared check
        if (s.challengeTarget > 0 && !challengeCleared && score > s.challengeTarget) {
          challengeCleared = true;
          audio.challengeCleared();
        }

        // Score-based milestone label (every 5/10/20)
        if (score % 20 === 0) { comboLabel = 'ARC FLOW!'; comboFade = 1; }
        else if (score % 10 === 0) { comboLabel = 'GREAT!'; comboFade = 1; }
        else if (score % 5  === 0) { comboLabel = 'NICE!'; comboFade = 1; }

        if (score % 10 === 0) {
          milestoneFlash = 1;
          envFlash = 1;
          particles = [...particles, ...spawnMilestone(player.x, player.y)];
        }

        // Perfect / combo check
        const { next: nextPerfect, wasPerfect, energyGain } = onGatePassed(
          perfect, player, obs, energy.arcMode,
        );
        perfect = nextPerfect;

        if (wasPerfect) {
          audio.perfect();
          particles = [...particles, ...spawnPerfect(player.x, player.y)];
          energy = addEnergy(energy, energyGain);

          // Fire combo sound at milestones
          if (perfect.perfectCount === 3 || perfect.perfectCount === 5 ||
              perfect.perfectCount === 10 || perfect.perfectCount === 15) {
            audio.comboMilestone();
          }

          // Override combo label with perfect combo label if stronger
          if (perfect.comboLabel) {
            comboLabel = perfect.comboLabel;
            comboFade = 1;
          }
        }
      }
    }

    // Collision with obstacles
    for (const obs of obstacles) {
      if (collidesWithObstacle(player, obs)) {
        return handleCollision({ ...s, player, obstacles, particles, score, speed, perfect, energy, challengeCleared });
      }
    }

    // Out of bounds
    if (isOutOfBounds(player, s.cfg.height)) {
      return handleCollision({ ...s, player, obstacles, particles, score, speed, perfect, energy, challengeCleared });
    }

    updateBackground(speed, score);
  }

  // Tick ghost
  const ghost = tickGhost(s.ghost, player.y, score);

  return {
    ...s,
    player,
    obstacles,
    particles,
    score,
    speed,
    milestoneFlash,
    scoreFlash,
    comboLabel,
    comboFade,
    envFlash,
    shakeFrames,
    shakeX,
    shakeY,
    perfect,
    energy,
    ghost,
    challengeCleared,
  };
}

function handleCollision(s: GameLoopState): GameLoopState {
  audio.collision();
  const impactParticles = spawnImpact(s.player.x, s.player.y);
  const particles = [...s.particles, ...impactParticles];

  let best = s.best;
  let isNewBest = false;
  if (s.score > best) {
    best = s.score;
    saveBest(best);
    isNewBest = true;
    setTimeout(() => audio.newBest(), 300);
  }

  const ghost = finaliseGhostRun(s.ghost, s.score, isNewBest);

  return {
    ...s,
    state: 'GAME_OVER',
    best,
    isNewBest,
    particles,
    shakeFrames: 12,
    ghost,
  };
}

export function toSnapshot(s: GameLoopState): GameSnapshot {
  return {
    state: s.state,
    score: s.score,
    best: s.best,
    player: s.player,
    obstacles: s.obstacles,
    particles: s.particles,
    speed: s.speed,
    isNewBest: s.isNewBest,
    milestoneFlash: s.milestoneFlash,
    scoreFlash: s.scoreFlash,
    shakeX: s.shakeX,
    shakeY: s.shakeY,
    comboLabel: s.perfect.comboLabel || s.comboLabel,
    comboFade: Math.max(s.perfect.comboFade, s.comboFade),
    perfectFade: s.perfect.perfectFade,
    perfectLabel: s.perfect.perfectLabel,
    perfectCount: s.perfect.perfectCount,
    envFlash: s.envFlash,
    // Energy
    energyFraction: getEnergyFraction(s.energy),
    arcMode: s.energy.arcMode,
    arcModeActivationFade: s.energy.activationFade,
    // Ghost
    ghostY: s.ghost.ghostY,
    ghostAlpha: s.ghost.ghostAlpha,
    ghostScore: s.ghost.ghostScore,
    ghostEnabled: s.ghost.ghostEnabled,
    ghostExists: s.ghost.ghost !== null,
    // Challenge
    challengeTarget: s.challengeTarget,
    challengeCleared: s.challengeCleared,
  };
}

export type { GameLoopState };
