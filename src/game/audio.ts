// ─── Lightweight Web Audio synthesiser ────────────────────────────────────────

let ctx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  type: OscillatorType,
  duration: number,
  gainPeak: number,
  freqEnd?: number,
) {
  if (muted) return;
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (freqEnd !== undefined) {
      osc.frequency.linearRampToValueAtTime(freqEnd, ac.currentTime + duration);
    }
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(gainPeak, ac.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration + 0.01);
  } catch {
    // audio not available
  }
}

export const audio = {
  jump() {
    tone(320, 'sine', 0.08, 0.18, 520);
  },
  score() {
    tone(660, 'triangle', 0.06, 0.15, 880);
    setTimeout(() => tone(880, 'triangle', 0.06, 0.1), 60);
  },
  collision() {
    tone(160, 'sawtooth', 0.18, 0.22, 60);
    setTimeout(() => tone(80, 'square', 0.25, 0.15, 40), 80);
  },
  newBest() {
    [0, 80, 160].forEach((delay, i) => {
      setTimeout(() => tone(440 + i * 220, 'triangle', 0.1, 0.14), delay);
    });
  },
  perfect() {
    // Bright two-note chime
    tone(880, 'sine', 0.07, 0.14, 1100);
    setTimeout(() => tone(1320, 'sine', 0.06, 0.10), 55);
  },
  comboMilestone() {
    // Rising arpeggio
    [0, 55, 110].forEach((delay, i) => {
      setTimeout(() => tone(660 + i * 330, 'triangle', 0.07, 0.12), delay);
    });
  },
  arcModeActivate() {
    // Powerful ascending sweep
    tone(220, 'sawtooth', 0.06, 0.10, 440);
    setTimeout(() => tone(440, 'square', 0.05, 0.12, 880), 60);
    setTimeout(() => tone(880, 'triangle', 0.10, 0.18, 1320), 120);
  },
  challengeCleared() {
    // Victory fanfare
    [0, 80, 160, 260].forEach((delay, i) => {
      setTimeout(() => tone(330 + i * 165, 'triangle', 0.12, 0.16), delay);
    });
  },
  setMuted(v: boolean) {
    muted = v;
  },
  isMuted() {
    return muted;
  },
};

// Persist preference
const MUTE_KEY = 'flappyarc_muted';
export function loadAudioPref(): boolean {
  return localStorage.getItem(MUTE_KEY) === 'true';
}
export function saveAudioPref(v: boolean) {
  localStorage.setItem(MUTE_KEY, String(v));
}
