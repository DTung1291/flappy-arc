// ─── Physics helpers ──────────────────────────────────────────────────────────

import type { Player, GameConfig } from './types';

export function applyGravity(player: Player, cfg: GameConfig): Player {
  const vy = Math.min(player.vy + cfg.gravity, cfg.maxFallSpeed);
  const y = player.y + vy;
  // Angle: tilt up on jump, tilt down on fall
  const targetAngle = vy < 0
    ? Math.max(-0.45, vy * 0.07)
    : Math.min(Math.PI / 2.2, vy * 0.11);
  const angle = player.angle + (targetAngle - player.angle) * 0.14;

  // Update trail
  const trail = [{ x: player.x, y: player.y }, ...player.trail].slice(0, 8);

  return { ...player, vy, y, angle, trail };
}

export function jump(player: Player, cfg: GameConfig): Player {
  return { ...player, vy: cfg.jumpForce };
}

export function clampPlayer(player: Player, height: number): Player {
  const minY = player.size / 2;
  const maxY = height - player.size / 2;
  return { ...player, y: Math.max(minY, Math.min(maxY, player.y)) };
}

export function isOutOfBounds(player: Player, height: number): boolean {
  return player.y >= height - player.size / 2 || player.y <= player.size / 2;
}
