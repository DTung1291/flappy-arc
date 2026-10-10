// ─── Obstacle generation & movement ──────────────────────────────────────────

import type { Obstacle, GameConfig } from './types';

let nextId = 1;

export function createObstacle(x: number, cfg: GameConfig): Obstacle {
  const gap = Math.max(
    cfg.gapMin,
    cfg.gapMax - Math.random() * (cfg.gapMax - cfg.gapMin) * 0.4,
  );
  // Ensure gap fits within playfield (leave 60px margin top/bottom)
  const margin = 60;
  const maxTopH = cfg.height - gap - margin;
  const topH = margin + Math.random() * (maxTopH - margin);

  return {
    id: nextId++,
    x,
    topH,
    botY: topH + gap,
    gap,
    width: cfg.obstacleWidth,
    scored: false,
  };
}

export function moveObstacles(obstacles: Obstacle[], speed: number): Obstacle[] {
  return obstacles.map(o => ({ ...o, x: o.x - speed }));
}

export function filterObstacles(obstacles: Obstacle[], minX: number): Obstacle[] {
  return obstacles.filter(o => o.x + o.width > minX);
}

export function getNextObstacleX(obstacles: Obstacle[], cfg: GameConfig): number {
  if (obstacles.length === 0) return cfg.width + cfg.obstacleSpacing;
  const last = obstacles[obstacles.length - 1];
  return last.x + cfg.obstacleSpacing;
}

export function spawnIfNeeded(obstacles: Obstacle[], cfg: GameConfig): Obstacle[] {
  const result = [...obstacles];
  while (result.length === 0 || getNextObstacleX(result, cfg) < cfg.width + 60) {
    result.push(createObstacle(getNextObstacleX(result, cfg), cfg));
  }
  return result;
}
