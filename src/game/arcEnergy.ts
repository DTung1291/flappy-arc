// ─── ARC Energy Meter & ARC MODE ─────────────────────────────────────────────
//
// Energy range 0–100.
// Fills on perfect gates, drains during ARC MODE.

export interface ArcEnergyState {
  energy: number;          // 0–100
  arcMode: boolean;        // whether ARC MODE is active
  arcModeTimer: number;    // frames remaining (5 s at 60 fps = 300)
  activationFade: number;  // 0–1, for "ARC MODE!" flash text
  displayEnergy: number;   // smoothed display value (animated)
}

const ARC_MODE_DURATION = 300;  // frames at 60 fps
const DRAIN_PER_FRAME = 100 / ARC_MODE_DURATION; // ~0.333/frame
const ENERGY_MAX = 100;

export function createArcEnergyState(): ArcEnergyState {
  return {
    energy: 0,
    arcMode: false,
    arcModeTimer: 0,
    activationFade: 0,
    displayEnergy: 0,
  };
}

export function addEnergy(s: ArcEnergyState, amount: number): ArcEnergyState {
  if (s.arcMode) return s;  // don't stack while active
  const next = Math.min(ENERGY_MAX, s.energy + amount);
  return { ...s, energy: next };
}

export function tickArcEnergy(s: ArcEnergyState): { next: ArcEnergyState; justActivated: boolean } {
  let { energy, arcMode, arcModeTimer, activationFade, displayEnergy } = s;

  let justActivated = false;

  if (!arcMode && energy >= ENERGY_MAX) {
    // Activate ARC MODE
    arcMode = true;
    arcModeTimer = ARC_MODE_DURATION;
    activationFade = 1;
    justActivated = true;
  }

  if (arcMode) {
    arcModeTimer = Math.max(0, arcModeTimer - 1);
    energy = Math.max(0, energy - DRAIN_PER_FRAME);
    if (arcModeTimer === 0) {
      arcMode = false;
      energy = 0;
    }
  }

  activationFade = Math.max(0, activationFade - 0.025);

  // Smooth display energy towards actual
  displayEnergy += (energy - displayEnergy) * 0.12;

  return {
    next: { energy, arcMode, arcModeTimer, activationFade, displayEnergy },
    justActivated,
  };
}

export function getEnergyFraction(s: ArcEnergyState): number {
  return s.displayEnergy / ENERGY_MAX;
}
