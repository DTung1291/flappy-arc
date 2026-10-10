// ─── Battle mode canvas: one loop, two player panels ─────────────────────────

import { useEffect, useRef, useCallback } from 'react';
import type { BattleLoopState } from '../game/battleLoop';
import { createBattleState, tickBattle, battleJump, resetBattle } from '../game/battleLoop';
import {
  computeLayout, renderPanel, renderDivider, setBattleArcImg,
  P1_THEME, P2_THEME,
} from '../game/battleRenderer';
import type { GameConfig } from '../game/types';
import { loadArcIcon } from '../game/renderer';
import arcIconUrl from '../assets/arc-icon.png';

interface Props {
  totalW: number;
  totalH: number;
  panelCfg: GameConfig;           // physics config sized for one panel
  onStateChange: (s: BattleLoopState) => void;
  startCounter: number;
}

export function BattleCanvas({
  totalW, totalH, panelCfg,
  onStateChange, startCounter,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<BattleLoopState>(createBattleState(panelCfg));
  const rafRef = useRef<number>(0);
  const lastStart = useRef(0);

  useEffect(() => {
    loadArcIcon(arcIconUrl)
      .then(img => setBattleArcImg(img))
      .catch(() => { /* fallback */ });
  }, []);

  useEffect(() => {
    stateRef.current = createBattleState(panelCfg);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelCfg.width, panelCfg.height]);

  useEffect(() => {
    if (startCounter !== lastStart.current) {
      lastStart.current = startCounter;
      stateRef.current = resetBattle(stateRef.current);
    }
  }, [startCounter]);

  // Touch: split by panel zone
  const handleTouch = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const layout = computeLayout(totalW, totalH);
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const cx = (t.clientX - rect.left) * (totalW / rect.width);
      const cy = (t.clientY - rect.top) * (totalH / rect.height);
      const isP1 = layout.landscape ? cx < layout.p1Rect.w : cy < layout.p1Rect.h;
      stateRef.current = battleJump(stateRef.current, isP1 ? 1 : 2);
    }
  }, [totalW, totalH]);

  // Mouse: split by click position
  const handleClick = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const layout = computeLayout(totalW, totalH);
    const cx = (e.clientX - rect.left) * (totalW / rect.width);
    const cy = (e.clientY - rect.top) * (totalH / rect.height);
    const isP1 = layout.landscape ? cx < layout.p1Rect.w : cy < layout.p1Rect.h;
    stateRef.current = battleJump(stateRef.current, isP1 ? 1 : 2);
  }, [totalW, totalH]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('click', handleClick);
    return () => {
      canvas.removeEventListener('touchstart', handleTouch);
      canvas.removeEventListener('click', handleClick);
    };
  }, [handleTouch, handleClick]);

  // Main RAF loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const layout = computeLayout(totalW, totalH);

    const loop = () => {
      stateRef.current = tickBattle(stateRef.current);
      const s = stateRef.current;

      // Render P1 panel
      ctx.save();
      if (s.p1.shakeX || s.p1.shakeY) ctx.translate(s.p1.shakeX, s.p1.shakeY);
      renderPanel(ctx, s.p1, layout.p1Rect, 'p1', P1_THEME, s.speed);
      ctx.restore();

      // Render P2 panel
      ctx.save();
      if (s.p2.shakeX || s.p2.shakeY) {
        const offX = layout.landscape ? layout.p2Rect.x : 0;
        const offY = layout.landscape ? 0 : layout.p2Rect.y;
        ctx.translate(offX + s.p2.shakeX, offY + s.p2.shakeY - (layout.landscape ? 0 : offY));
        ctx.translate(-offX, layout.landscape ? 0 : -offY);
      }
      renderPanel(ctx, s.p2, layout.p2Rect, 'p2', P2_THEME, s.speed);
      ctx.restore();

      renderDivider(ctx, layout, totalW, totalH);

      onStateChange({ ...s });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalW, totalH]);

  return (
    <canvas
      ref={canvasRef}
      width={totalW}
      height={totalH}
      style={{
        display: 'block',
        touchAction: 'none',
        cursor: 'pointer',
        width: totalW,
        height: totalH,
      }}
    />
  );
}
