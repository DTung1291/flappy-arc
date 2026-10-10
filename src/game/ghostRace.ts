// ─── Ghost Race Manager ───────────────────────────────────────────────────────
//
// Records the player's personal-best run as a sequence of Y-position samples.
// Playback interpolates between samples for smooth ghost movement.
// Ghost is display-only: no collision, no scoring.

const GHOST_KEY = 'flappyarc_ghost_v1';
const SAMPLE_EVERY = 3;  // record every N frames (≈20 fps samples at 60 fps)

export interface GhostFrame {
  score: number;   // score at this sample
  y: number;       // player Y
}

export interface GhostRecording {
  bestScore: number;
  frames: GhostFrame[];
}

export interface GhostState {
  // Recording current run
  recording: boolean;
  recordBuffer: GhostFrame[];
  recordTick: number;

  // Playback
  ghost: GhostRecording | null;
  ghostEnabled: boolean;
  ghostFrame: number;       // current playback frame index
  ghostY: number;           // interpolated Y
  ghostScore: number;       // ghost's current score
  ghostAlpha: number;       // 0–1 render alpha (fades in)
}

const GHOST_ENABLED_KEY = 'flappyarc_ghost_enabled';

function loadGhost(): GhostRecording | null {
  try {
    const raw = localStorage.getItem(GHOST_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GhostRecording;
  } catch { return null; }
}

function saveGhost(r: GhostRecording): void {
  try {
    localStorage.setItem(GHOST_KEY, JSON.stringify(r));
  } catch { /* storage full */ }
}

function loadGhostEnabled(): boolean {
  return localStorage.getItem(GHOST_ENABLED_KEY) !== 'false';
}

export function saveGhostEnabled(v: boolean): void {
  localStorage.setItem(GHOST_ENABLED_KEY, String(v));
}

export function createGhostState(): GhostState {
  return {
    recording: false,
    recordBuffer: [],
    recordTick: 0,
    ghost: loadGhost(),
    ghostEnabled: loadGhostEnabled(),
    ghostFrame: 0,
    ghostY: 0,
    ghostScore: 0,
    ghostAlpha: 0,
  };
}

// Call at the start of a new game run
export function startGhostRun(s: GhostState): GhostState {
  return {
    ...s,
    recording: true,
    recordBuffer: [],
    recordTick: 0,
    ghostFrame: 0,
    ghostY: s.ghost ? s.ghost.frames[0]?.y ?? 0 : 0,
    ghostScore: 0,
    ghostAlpha: 0,
  };
}

// Call each frame during PLAYING
export function tickGhost(
  s: GhostState,
  playerY: number,
  playerScore: number,
): GhostState {
  let { recording, recordBuffer, recordTick, ghostFrame, ghostY, ghostAlpha, ghostScore } = s;

  // ── Record ──
  recordTick++;
  if (recording && recordTick % SAMPLE_EVERY === 0) {
    recordBuffer = [...recordBuffer, { score: playerScore, y: playerY }];
    // Cap at 6000 samples (~5 min of gameplay at 20 fps)
    if (recordBuffer.length > 6000) {
      recording = false; // stop recording if too long
    }
  }

  // ── Playback ──
  if (s.ghost && s.ghostEnabled && s.ghost.frames.length > 0) {
    // Advance ghost frame every SAMPLE_EVERY real frames
    if (recordTick % SAMPLE_EVERY === 0 && ghostFrame < s.ghost.frames.length - 1) {
      ghostFrame++;
    }

    // Interpolate Y between adjacent frames
    const a = s.ghost.frames[ghostFrame];
    const b = s.ghost.frames[Math.min(ghostFrame + 1, s.ghost.frames.length - 1)];
    const t = (recordTick % SAMPLE_EVERY) / SAMPLE_EVERY;
    ghostY = a.y + (b.y - a.y) * t;
    ghostScore = a.score;

    // Fade in
    ghostAlpha = Math.min(1, ghostAlpha + 0.02);
  }

  return {
    ...s,
    recording,
    recordBuffer,
    recordTick,
    ghostFrame,
    ghostY,
    ghostScore,
    ghostAlpha,
  };
}

// Call on GAME_OVER. Returns updated state with new ghost if it was a new best.
export function finaliseGhostRun(
  s: GhostState,
  finalScore: number,
  isNewBest: boolean,
): GhostState {
  if (!isNewBest) return { ...s, recording: false };

  const newGhost: GhostRecording = {
    bestScore: finalScore,
    frames: s.recordBuffer,
  };
  saveGhost(newGhost);

  return {
    ...s,
    recording: false,
    ghost: newGhost,
  };
}
