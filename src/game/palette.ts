// ─── Arc Arcade palette + score-zone environment system ───────────────────────
//
// Score zones determine the background gradient + accent colours used
// throughout the renderer and UI.

export interface Zone {
  name: string;
  gradTop: string;
  gradMid: string;
  gradBot: string;
  nodeColor: string;
  lineColor: string;
  obstacleA: string;   // RGBA body fill
  obstacleB: string;   // RGBA cap/edge
  glowColor: string;
  playerGlow: string;
  particleColors: string[];
}

export const ZONES: Zone[] = [
  // 0–9  : bright sky blue
  {
    name: 'Sky',
    gradTop: '#1a6fc4',
    gradMid: '#2a9fd8',
    gradBot: '#1db4e8',
    nodeColor: 'rgba(255,255,255,0.55)',
    lineColor: 'rgba(255,255,255,0.18)',
    obstacleA: 'rgba(255,255,255,0.30)',
    obstacleB: 'rgba(255,255,255,0.92)',
    glowColor: '#7dd4f8',
    playerGlow: '#38bdf8',
    particleColors: ['#7dd4f8', '#38bdf8', '#bae6fd', '#ffffff', '#93c5fd'],
  },
  // 10–19 : aqua / cyan
  {
    name: 'Aqua',
    gradTop: '#0c7e80',
    gradMid: '#0ea5a8',
    gradBot: '#22d3d8',
    nodeColor: 'rgba(110,255,245,0.50)',
    lineColor: 'rgba(110,255,245,0.16)',
    obstacleA: 'rgba(0,230,220,0.28)',
    obstacleB: 'rgba(0,230,220,0.90)',
    glowColor: '#00e6dc',
    playerGlow: '#5eead4',
    particleColors: ['#5eead4', '#2dd4bf', '#a7f3d0', '#67e8f9', '#ffffff'],
  },
  // 20–29 : purple sunset
  {
    name: 'Sunset',
    gradTop: '#5b21b6',
    gradMid: '#7c3aed',
    gradBot: '#c026d3',
    nodeColor: 'rgba(240,170,255,0.50)',
    lineColor: 'rgba(200,130,255,0.18)',
    obstacleA: 'rgba(168,85,247,0.30)',
    obstacleB: 'rgba(240,170,255,0.90)',
    glowColor: '#e879f9',
    playerGlow: '#c084fc',
    particleColors: ['#e879f9', '#c084fc', '#f0abfc', '#fda4af', '#ffffff'],
  },
  // 30–39 : electric city
  {
    name: 'City',
    gradTop: '#0f172a',
    gradMid: '#1e3a5f',
    gradBot: '#0f2a4a',
    nodeColor: 'rgba(0,200,255,0.70)',
    lineColor: 'rgba(0,200,255,0.22)',
    obstacleA: 'rgba(0,195,255,0.32)',
    obstacleB: 'rgba(0,224,255,0.92)',
    glowColor: '#00d4ff',
    playerGlow: '#38bdf8',
    particleColors: ['#00d4ff', '#0ea5e9', '#38bdf8', '#f472b6', '#fde68a'],
  },
  // 40+  : Arc energy
  {
    name: 'ArcEnergy',
    gradTop: '#0d1117',
    gradMid: '#1a0533',
    gradBot: '#0a0f1e',
    nodeColor: 'rgba(167,139,250,0.72)',
    lineColor: 'rgba(167,139,250,0.24)',
    obstacleA: 'rgba(139,92,246,0.32)',
    obstacleB: 'rgba(200,160,255,0.92)',
    glowColor: '#a78bfa',
    playerGlow: '#818cf8',
    particleColors: ['#a78bfa', '#818cf8', '#f472b6', '#34d399', '#fde68a'],
  },
];

export function getZone(score: number): Zone {
  if (score < 10) return ZONES[0];
  if (score < 20) return ZONES[1];
  if (score < 30) return ZONES[2];
  if (score < 40) return ZONES[3];
  return ZONES[4];
}

// Smoothly interpolate between zone a and zone b (t: 0→1)
function lerpColor(a: string, b: string, t: number): string {
  // Parse hex or rgba – we only need this for gradients so we use simple
  // CSS trick: let the browser blend via a 2-stop gradient instead.
  // For particle arrays, we just pick the current zone.
  void b; void t; return a; // placeholder – actual blending done in drawBackground
}
void lerpColor; // suppress unused warning

// The score-zone transition "blend factor" (0 = fully in current zone, 1 = next zone)
export function zoneFrac(score: number): { zone: Zone; next: Zone; t: number } {
  const thresholds = [10, 20, 30, 40];
  for (let i = 0; i < thresholds.length; i++) {

    const hi = thresholds[i];
    if (score < hi) {
      const t = Math.max(0, (score - (hi - 3)) / 3); // blend in last 3 pts
      return { zone: ZONES[i], next: ZONES[Math.min(i + 1, ZONES.length - 1)], t: Math.max(0, t) };
    }
  }
  return { zone: ZONES[4], next: ZONES[4], t: 0 };
}
