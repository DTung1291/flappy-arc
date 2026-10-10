// ─── Bright parallax background renderer ─────────────────────────────────────
//
// Three speed layers of network nodes + floating light orbs + a scrolling grid.
// Zone-driven gradient colours shift as the score climbs.

import { getZone } from './palette';

// ─── Node layers ─────────────────────────────────────────────────────────────

interface Node { x: number; y: number; r: number; baseVx: number; py: number; phy: number }

interface BGLayer {
  nodes: Node[];
  speedFactor: number;
  alphaBase: number;
}

let layers: BGLayer[] = [];
let orbs: { x: number; y: number; r: number; speed: number; phase: number }[] = [];
let sparks: { x: number; y: number; vy: number; life: number; size: number; color: string }[] = [];
let w = 0;
let h = 0;
let tick = 0;
let currentScore = 0;

function buildLayer(width: number, height: number, count: number, speedFactor: number, alpha: number): BGLayer {
  const nodes: Node[] = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: 1 + Math.random() * 2.5,
    baseVx: speedFactor,
    py: Math.random() * height,
    phy: Math.random() * Math.PI * 2,
  }));
  return { nodes, speedFactor, alphaBase: alpha };
}

export function initBackground(width: number, height: number) {
  w = width; h = height; tick = 0;
  layers = [
    buildLayer(width, height, 22, 0.12, 0.22),
    buildLayer(width, height, 14, 0.28, 0.40),
    buildLayer(width, height, 9,  0.55, 0.60),
  ];
  orbs = Array.from({ length: 5 }, () => ({
    x: Math.random() * width,
    y: 60 + Math.random() * (height - 120),
    r: 28 + Math.random() * 60,
    speed: 0.06 + Math.random() * 0.08,
    phase: Math.random() * Math.PI * 2,
  }));
  sparks = [];
}

export function updateBackground(speed: number, score: number) {
  tick++;
  currentScore = score;
  const scale = speed / 3.5;

  // Spawn ambient sparkles
  if (tick % 8 === 0 && sparks.length < 40) {
    const zone = getZone(score);
    const col = zone.particleColors[Math.floor(Math.random() * zone.particleColors.length)];
    sparks.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vy: -0.4 - Math.random() * 0.6,
      life: 1,
      size: 1 + Math.random() * 2,
      color: col,
    });
  }
  sparks = sparks
    .map(s => ({ ...s, y: s.y + s.vy, life: s.life - 0.015 }))
    .filter(s => s.life > 0);

  for (const layer of layers) {
    for (const node of layer.nodes) {
      node.x -= layer.speedFactor * scale;
      node.phy += 0.008;
      node.y = node.py + Math.sin(node.phy) * (h * 0.04);
      if (node.x < -20) {
        node.x = w + 20;
        node.py = Math.random() * h;
        node.phy = Math.random() * Math.PI * 2;
      }
    }
  }

  for (const orb of orbs) {
    orb.x -= orb.speed * scale;
    orb.phase += 0.012;
    if (orb.x + orb.r < 0) {
      orb.x = w + orb.r;
      orb.y = 60 + Math.random() * (h - 120);
    }
  }
}

// ─── Draw ─────────────────────────────────────────────────────────────────────

export function drawBackground(ctx: CanvasRenderingContext2D, score?: number) {
  const s = score ?? currentScore;
  const zone = getZone(s);

  // Main gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0,   zone.gradTop);
  grad.addColorStop(0.5, zone.gradMid);
  grad.addColorStop(1,   zone.gradBot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Soft ambient orbs
  for (const orb of orbs) {
    const orbY = orb.y + Math.sin(orb.phase) * 18;
    const pulseR = orb.r * (0.9 + 0.1 * Math.sin(orb.phase * 1.4));
    const og = ctx.createRadialGradient(orb.x, orbY, 0, orb.x, orbY, pulseR);
    og.addColorStop(0,   `${zone.glowColor}28`);
    og.addColorStop(0.5, `${zone.glowColor}0f`);
    og.addColorStop(1,   'transparent');
    ctx.fillStyle = og;
    ctx.fillRect(orb.x - pulseR, orbY - pulseR, pulseR * 2, pulseR * 2);
  }

  // Scrolling grid (subtle)
  const gridSize = 54;
  const offsetX = (tick * 0.35) % gridSize;
  ctx.strokeStyle = zone.lineColor;
  ctx.lineWidth = 0.5;
  for (let x = -gridSize + (-offsetX % gridSize); x < w + gridSize; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h + gridSize; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Floating sparkles
  for (const spark of sparks) {
    ctx.globalAlpha = spark.life * 0.7;
    ctx.fillStyle = spark.color;
    ctx.beginPath();
    ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Network node layers
  for (const layer of layers) {
    const alpha = layer.alphaBase;

    // Connections
    ctx.strokeStyle = zone.lineColor;
    ctx.lineWidth = 0.7;
    for (let i = 0; i < layer.nodes.length; i++) {
      for (let j = i + 1; j < layer.nodes.length; j++) {
        const a = layer.nodes[i]; const b = layer.nodes[j];
        const dx = a.x - b.x; const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          const fade = 1 - dist / 140;
          ctx.globalAlpha = alpha * fade * 0.55;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;

    // Nodes
    for (const node of layer.nodes) {
      const pulse = 0.7 + 0.3 * Math.sin(tick * 0.035 + node.x * 0.015);
      ctx.globalAlpha = alpha * pulse;
      ctx.fillStyle = zone.nodeColor;
      ctx.shadowColor = zone.glowColor;
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }
}
