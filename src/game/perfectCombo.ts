// ─── Perfect Gate & Combo Manager ────────────────────────────────────────────
//
// Detects how close the player is to the vertical centre of a passed gap.
// Tracks consecutive perfect count and emits combo labels.

import type { Player, Obstacle } from './types';

export interface PerfectState {
  perfectCount: number;    // consecutive perfect streak
  perfectFade: number;     // 0–1 fade for "PERFECT!" text
  perfectLabel: string;    // e.g. 'PERFECT!', 'ARC PERFECT!'
  comboCount: number;      // consecutive perfect count (same as perfectCount)
  comboFade: number;       // 0–1 fade for combo text
  comboLabel: string;      // e.g. 'NICE!', 'GREAT!', 'ARC FLOW!'
}

// Threshold: fraction of half-gap to be considered "perfect"
// 0.25 means within the middle 50% of the gap
const PERFECT_THRESHOLD = 0.28;

export function createPerfectState(): PerfectState {
  return {
    perfectCount: 0,
    perfectFade: 0,
    perfectLabel: '',
    comboCount: 0,
    comboFade: 0,
    comboLabel: '',
  };
}

export function checkPerfect(player: Player, obs: Obstacle): boolean {
  const gapCenterY = obs.topH + obs.gap / 2;
  const halfGap = obs.gap / 2;
  const dist = Math.abs(player.y - gapCenterY);
  return dist < halfGap * PERFECT_THRESHOLD;
}

export function onGatePassed(
  s: PerfectState,
  player: Player,
  obs: Obstacle,
  arcModeActive: boolean,
): { next: PerfectState; wasPerfect: boolean; energyGain: number } {
  const wasPerfect = checkPerfect(player, obs);

  if (!wasPerfect) {
    // Break the streak
    return {
      next: {
        ...s,
        perfectCount: 0,
        perfectFade: Math.max(s.perfectFade - 0.2, 0),
        perfectLabel: '',
        comboCount: 0,
        comboFade: Math.max(s.comboFade - 0.2, 0),
        comboLabel: '',
      },
      wasPerfect: false,
      energyGain: 0,
    };
  }

  const newCount = s.perfectCount + 1;

  // Combo label
  let comboLabel = '';
  let comboFade = s.comboFade;
  if (newCount >= 15) { comboLabel = 'UNSTOPPABLE!'; comboFade = 1; }
  else if (newCount >= 10) { comboLabel = arcModeActive ? 'ARC FLOW!' : 'ARC FLOW!'; comboFade = 1; }
  else if (newCount >= 5) { comboLabel = 'GREAT!'; comboFade = 1; }
  else if (newCount >= 3) { comboLabel = 'NICE!'; comboFade = 1; }

  // Perfect label
  const perfectLabel = arcModeActive ? 'ARC PERFECT!' : 'PERFECT!';

  // Energy gain
  let energyGain = 10;
  if (newCount >= 5) energyGain = 15;
  else if (newCount >= 3) energyGain = 12;

  return {
    next: {
      perfectCount: newCount,
      perfectFade: 1,
      perfectLabel,
      comboCount: newCount,
      comboFade,
      comboLabel,
    },
    wasPerfect: true,
    energyGain,
  };
}

export function tickPerfectState(s: PerfectState): PerfectState {
  return {
    ...s,
    perfectFade: Math.max(0, s.perfectFade - 0.032),
    comboFade: Math.max(0, s.comboFade - 0.022),
  };
}
