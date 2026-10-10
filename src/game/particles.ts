// ─── Particle system ───────────────────────────────────────────────────────────

import type { Particle } from './types';

let nextId = 1;

// Bright arcade colours
const SCORE_COLORS = ['#38bdf8', '#7dd3fc', '#34d399', '#fde68a', '#f9a8d4', '#a78bfa', '#ffffff'];
const IMPACT_COLORS = ['#fb7185', '#f472b6', '#fbbf24', '#f97316', '#ffffff', '#e879f9'];
const MILESTONE_COLORS = ['#38bdf8', '#34d399', '#fde68a', '#a78bfa', '#f9a8d4', '#67e8f9', '#ffffff', '#fb7185'];
const JUMP_COLORS = ['#7dd3fc', '#bae6fd', '#ffffff', '#c7d2fe'];
const NEWBEST_COLORS = ['#fde68a', '#fcd34d', '#f59e0b', '#ffffff', '#6ee7b7', '#34d399'];

export function spawnImpact(x: number, y: number): Particle[] {
  return Array.from({ length: 28 }, (_, i) => {
    const angle = (i / 28) * Math.PI * 2 + Math.random() * 0.25;
    const speed = 2.5 + Math.random() * 5.5;
    return {
      id: nextId++,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2.5,
      life: 1,
      size: 2.5 + Math.random() * 4,
      color: IMPACT_COLORS[Math.floor(Math.random() * IMPACT_COLORS.length)],
      type: 'spark' as const,
    };
  });
}

export function spawnJump(x: number, y: number): Particle[] {
  return Array.from({ length: 6 }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
    const speed = 1.8 + Math.random() * 2.5;
    return {
      id: nextId++,
      x: x + (Math.random() - 0.5) * 14,
      y: y + 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.9,
      size: 1.5 + Math.random() * 2,
      color: JUMP_COLORS[Math.floor(Math.random() * JUMP_COLORS.length)],
      type: 'spark' as const,
    };
  });
}

export function spawnScore(x: number, y: number): Particle[] {
  return Array.from({ length: 12 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.8 + Math.random() * 3.5;
    return {
      id: nextId++,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.8,
      life: 1,
      size: 2 + Math.random() * 3,
      color: SCORE_COLORS[Math.floor(Math.random() * SCORE_COLORS.length)],
      type: 'spark' as const,
    };
  });
}

export function spawnMilestone(x: number, y: number): Particle[] {
  return Array.from({ length: 42 }, (_, i) => {
    const angle = (i / 42) * Math.PI * 2 + Math.random() * 0.3;
    const speed = 3 + Math.random() * 7;
    return {
      id: nextId++,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      life: 1,
      size: 2.5 + Math.random() * 5,
      color: MILESTONE_COLORS[Math.floor(Math.random() * MILESTONE_COLORS.length)],
      type: 'spark' as const,
    };
  });
}

export function spawnNewBest(x: number, y: number): Particle[] {
  return Array.from({ length: 55 }, (_, i) => {
    const angle = (i / 55) * Math.PI * 2 + Math.random() * 0.3;
    const speed = 1.5 + Math.random() * 9;
    return {
      id: nextId++,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      life: 1,
      size: 2 + Math.random() * 5,
      color: NEWBEST_COLORS[Math.floor(Math.random() * NEWBEST_COLORS.length)],
      type: 'spark' as const,
    };
  });
}

export function spawnPerfect(x: number, y: number): Particle[] {
  return Array.from({ length: 16 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    return {
      id: nextId++,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1,
      size: 1.5 + Math.random() * 2.5,
      color: ['#fde68a', '#fcd34d', '#ffffff', '#67e8f9'][Math.floor(Math.random() * 4)],
      type: 'spark' as const,
    };
  });
}

export function updateParticles(particles: Particle[]): Particle[] {
  return particles
    .map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.10,
      vx: p.vx * 0.96,
      life: p.life - 0.028,
    }))
    .filter(p => p.life > 0);
}
