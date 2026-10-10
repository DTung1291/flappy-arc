// ─── Shared game types ────────────────────────────────────────────────────────

export type GameState = 'MENU' | 'READY' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Player {
  x: number;
  y: number;
  vy: number;
  angle: number;        // rotation in radians
  trail: Vec2[];        // recent positions
  size: number;
}

export interface Obstacle {
  id: number;
  x: number;
  topH: number;        // height of top bar
  botY: number;        // y start of bottom bar
  gap: number;
  width: number;
  scored: boolean;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;        // 0–1
  size: number;
  color: string;
  type: 'spark' | 'ring' | 'trail';
}

export interface GameConfig {
  width: number;
  height: number;
  gravity: number;
  jumpForce: number;
  maxFallSpeed: number;
  baseSpeed: number;
  obstacleSpacing: number;
  obstacleWidth: number;
  gapMin: number;
  gapMax: number;
  playerX: number;
}

export interface GameSnapshot {
  state: GameState;
  score: number;
  best: number;
  player: Player;
  obstacles: Obstacle[];
  particles: Particle[];
  speed: number;
  isNewBest: boolean;
  milestoneFlash: number;  // 0–1 fade
  scoreFlash: number;      // 0–1 fade
  shakeX: number;
  shakeY: number;
  comboLabel: string;      // e.g. 'NICE!', 'GREAT!', 'ARC FLOW!'
  comboFade: number;       // 0–1
  perfectFade: number;     // 0–1
  perfectLabel: string;    // 'PERFECT!' or 'ARC PERFECT!'
  perfectCount: number;    // consecutive perfect streak
  envFlash: number;        // 0–1 background color-wave on milestone
  // ARC Energy / ARC MODE
  energyFraction: number;  // 0–1 display value for meter
  arcMode: boolean;
  arcModeActivationFade: number; // 0–1 for "ARC MODE!" flash
  // Ghost race
  ghostY: number;
  ghostAlpha: number;      // 0–1
  ghostScore: number;
  ghostEnabled: boolean;
  ghostExists: boolean;
  // Challenge target (active during a challenge run)
  challengeTarget: number; // 0 = no active challenge
  challengeCleared: boolean;
}
