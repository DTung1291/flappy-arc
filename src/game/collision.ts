// ─── Collision detection ───────────────────────────────────────────────────────

import type { Player, Obstacle } from './types';

// Circle vs axis-aligned rectangle (AABB), with slight forgiveness radius
export function collidesWithObstacle(player: Player, obs: Obstacle): boolean {
  const r = player.size * 0.42; // forgiveness: use 42% of rendered size
  const cx = player.x;
  const cy = player.y;

  // Check horizontal overlap first (fast reject)
  if (cx + r < obs.x || cx - r > obs.x + obs.width) return false;

  // Top bar: y from 0 to obs.topH
  if (cy - r < obs.topH) return true;
  // Bottom bar: y from obs.botY to canvas bottom
  if (cy + r > obs.botY) return true;

  return false;
}

export function checkScore(player: Player, obs: Obstacle): boolean {
  // Score when player's centre passes the right edge of the obstacle
  return !obs.scored && player.x > obs.x + obs.width;
}
