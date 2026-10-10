// ─── Canvas layer: game loop, rendering, input ────────────────────────────────

import { useEffect, useRef, useCallback } from 'react';
import type { GameLoopState } from '../game/gameLoop';
import {
  createInitialState, startGame, handleTap, tickFrame, toSnapshot, setGhostEnabled,
} from '../game/gameLoop';
import type { GameConfig, GameSnapshot } from '../game/types';
import { renderFrame, loadArcIcon } from '../game/renderer';
import { initBackground, updateBackground } from '../game/background';
import arcIconUrl from '../assets/arc-icon.png';

interface Props {
  config: GameConfig;
  onSnapshot: (snap: GameSnapshot) => void;
  externalTap: number;          // increment to signal a tap from outside
  externalStart: number;        // increment to start a new game
  externalGhostToggle?: number; // increment to toggle ghost
  challengeTarget?: number;     // >0 when running a challenge
  onReady: () => void;
}

export function GameCanvas({
  config, onSnapshot, externalTap, externalStart,
  externalGhostToggle, challengeTarget, onReady,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameLoopState>(createInitialState(config));
  const rafRef = useRef<number>(0);
  const lastExternalTap = useRef(0);
  const lastExternalStart = useRef(0);
  const lastGhostToggle = useRef(0);
  const menuTickRef = useRef(0);

  // Load icon once
  useEffect(() => {
    loadArcIcon(arcIconUrl).then(() => {
      onReady();
    }).catch(() => {
      onReady(); // proceed even if image fails
    });
  }, [onReady]);

  // Re-initialise config when dimensions change
  useEffect(() => {
    stateRef.current = {
      ...stateRef.current,
      cfg: config,
      player: {
        ...stateRef.current.player,
        x: config.playerX,
        size: config.width < 400 ? 38 : 44,
      },
    };
    initBackground(config.width, config.height);
  }, [config.width, config.height, config]);

  // External start trigger
  useEffect(() => {
    if (externalStart !== lastExternalStart.current) {
      lastExternalStart.current = externalStart;
      stateRef.current = startGame(stateRef.current, challengeTarget ?? 0);
    }
  }, [externalStart, challengeTarget]);

  // External ghost toggle
  useEffect(() => {
    if (externalGhostToggle !== undefined && externalGhostToggle !== lastGhostToggle.current) {
      lastGhostToggle.current = externalGhostToggle;
      const cur = stateRef.current.ghost.ghostEnabled;
      stateRef.current = setGhostEnabled(stateRef.current, !cur);
    }
  }, [externalGhostToggle]);

  // External tap trigger
  useEffect(() => {
    if (externalTap !== lastExternalTap.current) {
      lastExternalTap.current = externalTap;
      stateRef.current = handleTap(stateRef.current);
    }
  }, [externalTap]);

  // Canvas input handlers
  const handleInput = useCallback(() => {
    stateRef.current = handleTap(stateRef.current);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleInput();
      }
    };
    const onTouch = (e: TouchEvent) => {
      e.preventDefault();
      handleInput();
    };
    const onClick = () => handleInput();

    canvas.addEventListener('click', onClick);
    canvas.addEventListener('touchstart', onTouch, { passive: false });
    window.addEventListener('keydown', onKey);

    return () => {
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('touchstart', onTouch);
      window.removeEventListener('keydown', onKey);
    };
  }, [handleInput]);

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;

    const loop = () => {
      menuTickRef.current++;

      // Tick state machine
      stateRef.current = tickFrame(stateRef.current);

      // Also scroll background on menu
      if (stateRef.current.state === 'MENU') {
        updateBackground(stateRef.current.cfg.baseSpeed * 0.5, 0);
      }

      const snap = toSnapshot(stateRef.current);

      // Render
      renderFrame(ctx, snap, config.width, config.height);

      // Emit snapshot for UI layer
      onSnapshot(snap);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.width, config.height]);

  return (
    <canvas
      ref={canvasRef}
      width={config.width}
      height={config.height}
      style={{ display: 'block', touchAction: 'none', cursor: 'pointer' }}
    />
  );
}
