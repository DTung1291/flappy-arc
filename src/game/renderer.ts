// ─── Canvas renderer ─────────────────────────────────────────────────────────
//
// Bright futuristic Arc Arcade aesthetic.
// Score-zone colours drive obstacles, player glow, particles.

import type { GameSnapshot, Particle, Obstacle, Player } from './types';
import { drawBackground } from './background';
import { getZone } from './palette';

let arcImg: HTMLImageElement | null = null;

export function loadArcIcon(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { arcImg = img; resolve(img); };
    img.onerror = reject;
    img.src = src;
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  tlr: number, trr: number, brr: number, blr: number,
) {
  ctx.moveTo(x + tlr, y);
  ctx.lineTo(x + w - trr, y);
  ctx.arcTo(x + w, y,      x + w, y + trr,  trr);
  ctx.lineTo(x + w, y + h - brr);
  ctx.arcTo(x + w, y + h,  x + w - brr, y + h, brr);
  ctx.lineTo(x + blr, y + h);
  ctx.arcTo(x,     y + h,  x, y + h - blr,  blr);
  ctx.lineTo(x, y + tlr);
  ctx.arcTo(x,     y,      x + tlr, y,       tlr);
  ctx.closePath();
}

// ─── Obstacle ────────────────────────────────────────────────────────────────

function drawObstacle(
  ctx: CanvasRenderingContext2D,
  obs: Obstacle,
  w: number,
  h: number,
  score: number,
  frameTick: number,
) {
  const zone = getZone(score);
  const x = obs.x;
  const width = obs.width;
  const capH = 20;

  // Animated light pulse along body (moves down)
  const pulse = 0.7 + 0.3 * Math.sin(frameTick * 0.05 + obs.id * 0.8);

  // ── Top bar body ──
  const topGrad = ctx.createLinearGradient(x, 0, x + width, 0);
  topGrad.addColorStop(0,   `${zone.obstacleA}`);
  topGrad.addColorStop(0.5, `rgba(255,255,255,${0.22 * pulse})`);
  topGrad.addColorStop(1,   `${zone.obstacleA}`);
  ctx.fillStyle = topGrad;
  ctx.beginPath();
  roundRectPath(ctx, x, 0, width, Math.max(0, obs.topH - capH), 0, 0, 6, 6);
  ctx.fill();

  // Vertical light streak on body
  ctx.fillStyle = `rgba(255,255,255,${0.07 * pulse})`;
  ctx.fillRect(x + width * 0.35, 0, width * 0.12, obs.topH - capH);

  // ── Top cap ──
  const topCapGrad = ctx.createLinearGradient(0, obs.topH - capH, 0, obs.topH);
  topCapGrad.addColorStop(0, 'rgba(255,255,255,0.12)');
  topCapGrad.addColorStop(1, zone.obstacleB);
  ctx.fillStyle = topCapGrad;
  ctx.beginPath();
  roundRectPath(ctx, x, obs.topH - capH, width, capH, 0, 0, 8, 8);
  ctx.fill();

  // Cap glow
  ctx.shadowColor = zone.glowColor;
  ctx.shadowBlur = 14;
  ctx.strokeStyle = zone.obstacleB;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 5, obs.topH - 1);
  ctx.lineTo(x + width - 5, obs.topH - 1);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // ── Bottom bar body ──
  const botH = h - obs.botY;
  const botGrad = ctx.createLinearGradient(x, 0, x + width, 0);
  botGrad.addColorStop(0,   zone.obstacleA);
  botGrad.addColorStop(0.5, `rgba(255,255,255,${0.22 * pulse})`);
  botGrad.addColorStop(1,   zone.obstacleA);
  ctx.fillStyle = botGrad;
  ctx.beginPath();
  roundRectPath(ctx, x, obs.botY + capH, width, Math.max(0, botH - capH), 6, 6, 0, 0);
  ctx.fill();

  ctx.fillStyle = `rgba(255,255,255,${0.07 * pulse})`;
  ctx.fillRect(x + width * 0.35, obs.botY + capH, width * 0.12, botH - capH);

  // ── Bottom cap ──
  const botCapGrad = ctx.createLinearGradient(0, obs.botY, 0, obs.botY + capH);
  botCapGrad.addColorStop(0, zone.obstacleB);
  botCapGrad.addColorStop(1, 'rgba(255,255,255,0.12)');
  ctx.fillStyle = botCapGrad;
  ctx.beginPath();
  roundRectPath(ctx, x, obs.botY, width, capH, 8, 8, 0, 0);
  ctx.fill();

  ctx.shadowColor = zone.glowColor;
  ctx.shadowBlur = 14;
  ctx.strokeStyle = zone.obstacleB;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 5, obs.botY + 1);
  ctx.lineTo(x + width - 5, obs.botY + 1);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // ── Floating particles on cap edges ──
  const floatOffset = (frameTick * 0.8 + obs.id * 30) % width;
  ctx.globalAlpha = 0.55 * pulse;
  ctx.fillStyle = zone.glowColor;
  ctx.shadowColor = zone.glowColor;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(x + floatOffset, obs.topH - 2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + (floatOffset + width / 2) % width, obs.botY + 2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

// ─── Ghost player ────────────────────────────────────────────────────────────

function drawGhost(
  ctx: CanvasRenderingContext2D,
  playerX: number,
  ghostY: number,
  alpha: number,
  size: number,
) {
  if (alpha <= 0 || !arcImg) return;
  ctx.save();
  ctx.globalAlpha = alpha * 0.38;
  ctx.shadowColor = '#a78bfa';
  ctx.shadowBlur = 12;
  // Desaturate using a filter overlay
  ctx.filter = 'grayscale(60%) brightness(1.4)';
  ctx.drawImage(arcImg, playerX - size / 2, ghostY - size / 2, size, size);
  ctx.filter = 'none';
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // Ghost trail ring
  ctx.save();
  ctx.globalAlpha = alpha * 0.18;
  ctx.strokeStyle = '#c4b5fd';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(playerX, ghostY, size * 0.55, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = 1;
}

// ─── Player ──────────────────────────────────────────────────────────────────

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  milestoneFlash: number,
  scoreFlash: number,
  score: number,
  frameTick: number,
  arcMode: boolean,
  perfectFade: number,
) {
  const { x, y, angle, size, trail } = player;
  const zone = getZone(score);

  // ARC MODE extra boost to glow
  const arcBoost = arcMode ? 1 + 0.6 * Math.sin(frameTick * 0.18) : 0;
  const trailAlphaMultiplier = arcMode ? 1.6 : 1;
  const trailColor = arcMode ? '#f0abfc' : zone.playerGlow;

  // ── Trail ──
  trail.forEach((pt, i) => {
    const t = 1 - i / trail.length;
    ctx.globalAlpha = t * t * 0.45 * trailAlphaMultiplier;
    ctx.fillStyle = trailColor;
    ctx.shadowColor = trailColor;
    ctx.shadowBlur = (arcMode ? 14 : 8) * t;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, size * 0.38 * t, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // ── Perfect pulse ring ──
  if (perfectFade > 0) {
    const pr = size * (0.8 + (1 - perfectFade) * 1.2);
    ctx.globalAlpha = perfectFade * 0.7;
    ctx.strokeStyle = '#67e8f9';
    ctx.shadowColor = '#67e8f9';
    ctx.shadowBlur = 14;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, pr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  // ── Outer glow ring ──
  const glowBase = arcMode ? size * 1.1 : size * 0.72;
  const glowR = glowBase + (milestoneFlash > 0 ? milestoneFlash * 10 : 0) + scoreFlash * 5 + arcBoost * 8;
  const glowColor = arcMode ? '#e879f9' : zone.playerGlow;
  const glowGrad = ctx.createRadialGradient(x, y, size * 0.3, x, y, glowR);
  glowGrad.addColorStop(0, `${glowColor}66`);
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(x, y, glowR, 0, Math.PI * 2);
  ctx.fill();

  const scaleX = 1 + Math.min(0, player.vy) * 0.012;
  const scaleY = 1 - Math.min(0, player.vy) * 0.010;

  // ── Icon ──
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scaleX, scaleY);

  const blurBase = arcMode
    ? 22 + arcBoost * 12
    : milestoneFlash > 0
      ? 30 + milestoneFlash * 20
      : 8 + scoreFlash * 12 + 6 * Math.sin(frameTick * 0.12);

  ctx.shadowColor = arcMode ? '#f0abfc' : zone.playerGlow;
  ctx.shadowBlur = blurBase;

  if (arcImg) {
    ctx.drawImage(arcImg, -size / 2, -size / 2, size, size);
  } else {
    ctx.fillStyle = arcMode ? '#f0abfc' : zone.playerGlow;
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size * 0.5}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('A', 0, 0);
  }

  ctx.restore();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
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

// ─── Main render ─────────────────────────────────────────────────────────────

let frameTick = 0;

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  snap: GameSnapshot,
  w: number,
  h: number,
) {
  frameTick++;

  ctx.save();
  if (snap.shakeX !== 0 || snap.shakeY !== 0) {
    ctx.translate(snap.shakeX, snap.shakeY);
  }

  // ARC MODE background pulse overlay
  if (snap.arcMode) {
    const t = frameTick * 0.04;
    const alpha = 0.07 + 0.05 * Math.sin(t);
    const arcGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.8);
    arcGrad.addColorStop(0, `rgba(192,38,211,${alpha})`);
    arcGrad.addColorStop(0.5, `rgba(99,102,241,${alpha * 0.5})`);
    arcGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = arcGrad;
    ctx.fillRect(0, 0, w, h);
  }

  drawBackground(ctx, snap.score);

  // Obstacles — brighter caps during ARC MODE
  for (const obs of snap.obstacles) {
    drawObstacle(ctx, obs, w, h, snap.score, frameTick);
    if (snap.arcMode) {
      // Extra bright cap glow
      const t = frameTick * 0.06 + obs.id;
      ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t);
      ctx.strokeStyle = '#f0abfc';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#f0abfc';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.moveTo(obs.x + 4, obs.topH - 1);
      ctx.lineTo(obs.x + obs.width - 4, obs.topH - 1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(obs.x + 4, obs.botY + 1);
      ctx.lineTo(obs.x + obs.width - 4, obs.botY + 1);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  }

  // Particles (behind player)
  drawParticles(ctx, snap.particles.filter(p => p.type !== 'ring'));

  // Ghost (behind real player, in front of obstacles)
  if (snap.state !== 'MENU' && snap.ghostEnabled && snap.ghostExists && snap.ghostAlpha > 0) {
    drawGhost(ctx, snap.player.x, snap.ghostY, snap.ghostAlpha, snap.player.size);
  }

  // Player
  if (snap.state !== 'MENU') {
    drawPlayer(ctx, snap.player, snap.milestoneFlash, snap.scoreFlash, snap.score, frameTick, snap.arcMode, snap.perfectFade);
  }

  ctx.restore();
}

// ─── Menu idle animation ──────────────────────────────────────────────────────

export function renderMenuPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  tick: number,
) {
  const floatY = y + Math.sin(tick * 0.045) * 9;
  const rot = Math.sin(tick * 0.03) * 0.12;
  const pulseScale = 1 + Math.sin(tick * 0.07) * 0.05;

  // Outer glow pulse
  const glowR = size * 0.9 + Math.sin(tick * 0.07) * 8;
  const gg = ctx.createRadialGradient(x, floatY, size * 0.2, x, floatY, glowR);
  gg.addColorStop(0, 'rgba(56,189,248,0.35)');
  gg.addColorStop(1, 'transparent');
  ctx.fillStyle = gg;
  ctx.beginPath();
  ctx.arc(x, floatY, glowR, 0, Math.PI * 2);
  ctx.fill();

  // Ring pulses
  for (let i = 0; i < 2; i++) {
    const rr = size * (0.8 + i * 0.45) + ((tick * 0.7 + i * 20) % 40);
    ctx.globalAlpha = Math.max(0, 0.22 - rr / (size * 3)) ;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(x, floatY, rr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.translate(x, floatY);
  ctx.rotate(rot);
  ctx.scale(pulseScale, pulseScale);
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 22 + Math.sin(tick * 0.07) * 10;

  if (arcImg) {
    ctx.drawImage(arcImg, -size / 2, -size / 2, size, size);
  } else {
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  ctx.shadowBlur = 0;

  // Trailing sparkles
  for (let i = 0; i < 4; i++) {
    const sparkAngle = tick * 0.04 + i * (Math.PI / 2);
    const sparkR = size * 0.65;
    const sx = x + Math.cos(sparkAngle) * sparkR;
    const sy = floatY + Math.sin(sparkAngle) * sparkR * 0.5;
    const sparkAlpha = 0.55 + 0.45 * Math.sin(tick * 0.08 + i);
    ctx.globalAlpha = sparkAlpha;
    ctx.fillStyle = ['#38bdf8', '#a78bfa', '#f9a8d4', '#fde68a'][i];
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;
}
