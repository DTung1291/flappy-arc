// ─── Battle mode canvas renderer ─────────────────────────────────────────────
//
// Renders both panels on a single canvas.
// P1: cyan/blue theme. P2: violet/magenta theme.

import type { BattlePlayer } from './battleLoop';
import type { Obstacle, Particle } from './types';

let arcImg: HTMLImageElement | null = null;
export function setBattleArcImg(img: HTMLImageElement) { arcImg = img; }

// ─── Layout ───────────────────────────────────────────────────────────────────

export interface BattleLayout {
  landscape: boolean;
  p1Rect: { x: number; y: number; w: number; h: number };
  p2Rect: { x: number; y: number; w: number; h: number };
  dividerX?: number;
  dividerY?: number;
}

export function computeLayout(totalW: number, totalH: number): BattleLayout {
  const landscape = totalW > totalH;
  if (landscape) {
    const half = Math.floor(totalW / 2);
    return {
      landscape: true,
      p1Rect: { x: 0, y: 0, w: half, h: totalH },
      p2Rect: { x: half, y: 0, w: totalW - half, h: totalH },
      dividerX: half,
    };
  } else {
    const half = Math.floor(totalH / 2);
    return {
      landscape: false,
      p1Rect: { x: 0, y: 0, w: totalW, h: half },
      p2Rect: { x: 0, y: half, w: totalW, h: totalH - half },
      dividerY: half,
    };
  }
}

// ─── Per-panel background state ───────────────────────────────────────────────

interface PanelBGState {
  nodes: { x: number; y: number; r: number; py: number; phy: number }[];
  orbs: { x: number; y: number; r: number; speed: number; phase: number }[];
  tick: number;
}

const bgStates: Map<string, PanelBGState> = new Map();

function getPanelBG(key: string, w: number, h: number): PanelBGState {
  if (!bgStates.has(key)) {
    bgStates.set(key, {
      nodes: Array.from({ length: 16 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1 + Math.random() * 2.5,
        py: Math.random() * h,
        phy: Math.random() * Math.PI * 2,
      })),
      orbs: Array.from({ length: 3 }, () => ({
        x: Math.random() * w,
        y: 40 + Math.random() * (h - 80),
        r: 30 + Math.random() * 50,
        speed: 0.05 + Math.random() * 0.07,
        phase: Math.random() * Math.PI * 2,
      })),
      tick: 0,
    });
  }
  return bgStates.get(key)!;
}

function drawPanelBG(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  speed: number,
  panelKey: string,
  gradTop: string,
  gradBot: string,
  nodeColor: string,
  lineColor: string,
  glowColor: string,
) {
  const bg = getPanelBG(panelKey, w, h);
  bg.tick++;

  // Gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, gradTop);
  grad.addColorStop(1, gradBot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Orbs
  for (const orb of bg.orbs) {
    orb.x -= orb.speed * (speed / 3.5);
    orb.phase += 0.014;
    if (orb.x + orb.r < 0) { orb.x = w + orb.r; orb.y = 40 + Math.random() * (h - 80); }
    const oy = orb.y + Math.sin(orb.phase) * 14;
    const og = ctx.createRadialGradient(orb.x, oy, 0, orb.x, oy, orb.r);
    og.addColorStop(0, `${glowColor}22`);
    og.addColorStop(1, 'transparent');
    ctx.fillStyle = og;
    ctx.fillRect(orb.x - orb.r, oy - orb.r, orb.r * 2, orb.r * 2);
  }

  // Grid
  const gs = 52;
  const ox = (bg.tick * speed * 0.42) % gs;
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 0.5;
  for (let x = -ox; x < w + gs; x += gs) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += gs) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Nodes
  const scale = speed / 3.5;
  for (const node of bg.nodes) {
    node.x -= 0.28 * scale;
    node.phy += 0.009;
    node.y = node.py + Math.sin(node.phy) * (h * 0.04);
    if (node.x < -10) { node.x = w + 10; node.py = Math.random() * h; node.phy = Math.random() * Math.PI * 2; }
  }
  for (let i = 0; i < bg.nodes.length; i++) {
    const a = bg.nodes[i];
    for (let j = i + 1; j < bg.nodes.length; j++) {
      const b = bg.nodes[j];
      const dx = a.x - b.x; const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 130) {
        ctx.globalAlpha = (1 - dist / 130) * 0.25;
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    const pulse = 0.6 + 0.4 * Math.sin(bg.tick * 0.04 + a.x * 0.02);
    ctx.globalAlpha = 0.55 * pulse;
    ctx.fillStyle = nodeColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;
}

// ─── Obstacle ─────────────────────────────────────────────────────────────────

function drawObstacle(
  ctx: CanvasRenderingContext2D,
  obs: Obstacle,
  panelH: number,
  bodyFill: string,
  capColor: string,
  glowColor: string,
  tick: number,
) {
  const x = obs.x;
  const width = obs.width;
  const capH = 18;
  const pulse = 0.7 + 0.3 * Math.sin(tick * 0.05 + obs.id * 0.9);

  function rr(rx: number, ry: number, rw: number, rh: number, tlr: number, trr: number, brr: number, blr: number) {
    ctx.beginPath();
    ctx.moveTo(rx + tlr, ry); ctx.lineTo(rx + rw - trr, ry);
    ctx.arcTo(rx + rw, ry, rx + rw, ry + trr, trr);
    ctx.lineTo(rx + rw, ry + rh - brr);
    ctx.arcTo(rx + rw, ry + rh, rx + rw - brr, ry + rh, brr);
    ctx.lineTo(rx + blr, ry + rh);
    ctx.arcTo(rx, ry + rh, rx, ry + rh - blr, blr);
    ctx.lineTo(rx, ry + tlr);
    ctx.arcTo(rx, ry, rx + tlr, ry, tlr);
    ctx.closePath();
  }

  // Top body
  const tg = ctx.createLinearGradient(x, 0, x + width, 0);
  tg.addColorStop(0, bodyFill); tg.addColorStop(0.5, `rgba(255,255,255,${0.18 * pulse})`); tg.addColorStop(1, bodyFill);
  ctx.fillStyle = tg;
  rr(x, 0, width, Math.max(0, obs.topH - capH), 0, 0, 6, 6); ctx.fill();

  // Top cap
  const tcg = ctx.createLinearGradient(0, obs.topH - capH, 0, obs.topH);
  tcg.addColorStop(0, 'rgba(255,255,255,0.10)'); tcg.addColorStop(1, capColor);
  ctx.fillStyle = tcg;
  rr(x, obs.topH - capH, width, capH, 0, 0, 8, 8); ctx.fill();

  ctx.shadowColor = glowColor; ctx.shadowBlur = 14;
  ctx.strokeStyle = capColor; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x + 4, obs.topH - 1); ctx.lineTo(x + width - 4, obs.topH - 1); ctx.stroke();
  ctx.shadowBlur = 0;

  // Bottom body
  const botH = panelH - obs.botY;
  const bg2 = ctx.createLinearGradient(x, 0, x + width, 0);
  bg2.addColorStop(0, bodyFill); bg2.addColorStop(0.5, `rgba(255,255,255,${0.18 * pulse})`); bg2.addColorStop(1, bodyFill);
  ctx.fillStyle = bg2;
  rr(x, obs.botY + capH, width, Math.max(0, botH - capH), 6, 6, 0, 0); ctx.fill();

  // Bottom cap
  const bcg = ctx.createLinearGradient(0, obs.botY, 0, obs.botY + capH);
  bcg.addColorStop(0, capColor); bcg.addColorStop(1, 'rgba(255,255,255,0.10)');
  ctx.fillStyle = bcg;
  rr(x, obs.botY, width, capH, 8, 8, 0, 0); ctx.fill();

  ctx.shadowColor = glowColor; ctx.shadowBlur = 14;
  ctx.strokeStyle = capColor; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x + 4, obs.botY + 1); ctx.lineTo(x + width - 4, obs.botY + 1); ctx.stroke();
  ctx.shadowBlur = 0;

  // Floating particle on caps
  const fp = ((tick * 0.8 + obs.id * 28) % width);
  ctx.globalAlpha = 0.5 * pulse;
  ctx.fillStyle = glowColor;
  ctx.shadowColor = glowColor; ctx.shadowBlur = 6;
  ctx.beginPath(); ctx.arc(x + fp, obs.topH - 2, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + (fp + width / 2) % width, obs.botY + 2, 2, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0; ctx.globalAlpha = 1;
}

// ─── Particles ────────────────────────────────────────────────────────────────

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    ctx.globalAlpha = p.life * 0.92;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 7;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.5, p.size * p.life), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

// ─── Player ───────────────────────────────────────────────────────────────────

function drawBattlePlayer(
  ctx: CanvasRenderingContext2D,
  p: BattlePlayer,
  glowColor: string,
  tick: number,
) {
  const { x, y, angle, size, trail } = p;

  trail.forEach((pt, i) => {
    const t = 1 - i / trail.length;
    ctx.globalAlpha = t * t * 0.40 * p.dimAlpha;
    ctx.fillStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 7 * t;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, size * 0.36 * t, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = p.dimAlpha;
  ctx.shadowBlur = 0;

  // Outer glow
  const glowR = size * 0.7 + (p.milestoneFlash > 0 ? p.milestoneFlash * 10 : 0);
  const gg = ctx.createRadialGradient(x, y, size * 0.25, x, y, glowR);
  gg.addColorStop(0, `${glowColor}55`);
  gg.addColorStop(1, 'transparent');
  ctx.globalAlpha = p.dimAlpha;
  ctx.fillStyle = gg;
  ctx.beginPath();
  ctx.arc(x, y, glowR, 0, Math.PI * 2);
  ctx.fill();

  const scaleX = 1 + Math.min(0, p.vy) * 0.012;
  const scaleY = 1 - Math.min(0, p.vy) * 0.010;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scaleX, scaleY);
  ctx.globalAlpha = p.dimAlpha;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = p.milestoneFlash > 0
    ? 30 + p.milestoneFlash * 18
    : 8 + 5 * Math.sin(tick * 0.13);

  if (arcImg) {
    ctx.drawImage(arcImg, -size / 2, -size / 2, size, size);
  } else {
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

// ─── Panel render ─────────────────────────────────────────────────────────────

export let battleTick = 0;

export function renderPanel(
  ctx: CanvasRenderingContext2D,
  p: BattlePlayer,
  rect: { x: number; y: number; w: number; h: number },
  panelKey: string,
  theme: { gradTop: string; gradBot: string; nodeColor: string; lineColor: string; bodyFill: string; capColor: string; glowColor: string },
  speed: number,
) {
  battleTick++;

  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.translate(rect.x, rect.y);

  drawPanelBG(ctx, rect.w, rect.h, speed, panelKey,
    theme.gradTop, theme.gradBot, theme.nodeColor, theme.lineColor, theme.glowColor);

  for (const obs of p.obstacles) {
    if (obs.x + obs.width < 0 || obs.x > rect.w) continue;
    drawObstacle(ctx, obs, rect.h, theme.bodyFill, theme.capColor, theme.glowColor, battleTick);
  }

  drawParticles(ctx, p.particles);
  drawBattlePlayer(ctx, p, theme.glowColor, battleTick);

  // Death dim overlay
  if (!p.alive) {
    const dimAmt = 0.55 * (1 - p.dimAlpha + 0.42);
    ctx.fillStyle = `rgba(5,13,26,${Math.min(0.55, dimAmt)})`;
    ctx.fillRect(0, 0, rect.w, rect.h);
  }

  ctx.restore();
}

// Panel themes
export const P1_THEME = {
  gradTop: '#1a6fc4',
  gradBot: '#1db4e8',
  nodeColor: 'rgba(125,211,252,0.60)',
  lineColor: 'rgba(125,211,252,0.20)',
  bodyFill:  'rgba(14,165,233,0.30)',
  capColor:  'rgba(186,230,253,0.92)',
  glowColor: '#38bdf8',
};

export const P2_THEME = {
  gradTop: '#5b21b6',
  gradBot: '#c026d3',
  nodeColor: 'rgba(240,170,255,0.58)',
  lineColor: 'rgba(200,130,255,0.22)',
  bodyFill:  'rgba(168,85,247,0.30)',
  capColor:  'rgba(240,170,255,0.92)',
  glowColor: '#e879f9',
};

// ─── Divider ──────────────────────────────────────────────────────────────────

export function renderDivider(
  ctx: CanvasRenderingContext2D,
  layout: BattleLayout,
  totalW: number,
  totalH: number,
) {
  ctx.save();
  if (layout.dividerX !== undefined) {
    const x = layout.dividerX;
    const grd = ctx.createLinearGradient(0, 0, 0, totalH);
    grd.addColorStop(0,   'rgba(56,189,248,0.05)');
    grd.addColorStop(0.35,'rgba(56,189,248,0.40)');
    grd.addColorStop(0.5, 'rgba(232,121,249,0.40)');
    grd.addColorStop(0.65,'rgba(232,121,249,0.40)');
    grd.addColorStop(1,   'rgba(56,189,248,0.05)');
    ctx.strokeStyle = grd;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(167,139,250,0.5)';
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, totalH); ctx.stroke();
    ctx.shadowBlur = 0;
  }
  if (layout.dividerY !== undefined) {
    const y = layout.dividerY;
    const grd = ctx.createLinearGradient(0, 0, totalW, 0);
    grd.addColorStop(0,   'rgba(56,189,248,0.05)');
    grd.addColorStop(0.35,'rgba(56,189,248,0.40)');
    grd.addColorStop(0.5, 'rgba(232,121,249,0.40)');
    grd.addColorStop(0.65,'rgba(232,121,249,0.40)');
    grd.addColorStop(1,   'rgba(56,189,248,0.05)');
    ctx.strokeStyle = grd;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(167,139,250,0.5)';
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(totalW, y); ctx.stroke();
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}
