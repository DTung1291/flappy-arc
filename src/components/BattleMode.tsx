// ─── Battle mode orchestrator ──────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { BattleCanvas } from './BattleCanvas';
import { BattleCountdown } from './BattleCountdown';
import { BattleHUD } from './BattleHUD';
import { BattleResult } from './BattleResult';
import type { BattleLoopState } from '../game/battleLoop';
import type { GameConfig } from '../game/types';
import { computeLayout } from '../game/battleRenderer';
import { Volume2, VolumeX } from 'lucide-react';
import { audio, loadAudioPref, saveAudioPref } from '../game/audio';
import { SPEED_MULTIPLIERS } from './Game';
import type { SpeedTier } from './MenuScreen';

interface Props {
  totalW: number;
  totalH: number;
  onHome: () => void;
  speedTier?: SpeedTier;
}

function buildPanelConfig(totalW: number, totalH: number, tier: SpeedTier = 'normal'): GameConfig {
  const landscape = totalW > totalH;
  const panelW = landscape ? Math.floor(totalW / 2) : totalW;
  const panelH = landscape ? totalH : Math.floor(totalH / 2);
  const isMobile = panelW < 400;
  const mul = SPEED_MULTIPLIERS[tier];
  return {
    width: panelW,
    height: panelH,
    gravity: 0.42 * (tier === 'insane' ? 1.15 : tier === 'fast' ? 1.05 : tier === 'easy' ? 0.9 : 1),
    jumpForce: -7.2 * (tier === 'insane' ? 1.10 : tier === 'fast' ? 1.05 : tier === 'easy' ? 0.92 : 1),
    maxFallSpeed: 10 * (tier === 'insane' ? 1.2 : 1),
    baseSpeed: (isMobile ? 3.8 : 4.4) * mul,
    obstacleSpacing: (isMobile ? 200 : 240) * (tier === 'easy' ? 1.15 : tier === 'insane' ? 0.88 : 1),
    obstacleWidth: isMobile ? 48 : 56,
    gapMin: (isMobile ? 120 : 135) * (tier === 'easy' ? 1.10 : tier === 'insane' ? 0.88 : 1),
    gapMax: (isMobile ? 185 : 200) * (tier === 'easy' ? 1.10 : tier === 'insane' ? 0.88 : 1),
    playerX: Math.round(panelW * 0.28),
  };
}

export function BattleMode({ totalW, totalH, onHome, speedTier = 'normal' }: Props) {
  const panelCfg = buildPanelConfig(totalW, totalH, speedTier);
  const layout = computeLayout(totalW, totalH);

  const [battleState, setBattleState] = useState<BattleLoopState | null>(null);
  const [startCounter, setStartCounter] = useState(0);
  const [muted, setMuted] = useState(() => {
    const p = loadAudioPref(); audio.setMuted(p); return p;
  });

  const handleRematch = useCallback(() => {
    setStartCounter(n => n + 1);
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev;
      audio.setMuted(next);
      saveAudioPref(next);
      return next;
    });
  }, []);

  const bState = battleState?.state ?? 'BATTLE_COUNTDOWN';
  const countdown = battleState?.countdown ?? 3;
  const countdownFrac = battleState?.countdownFrac ?? 0;
  const p1 = battleState?.p1;
  const p2 = battleState?.p2;
  const rawWinner = battleState?.winner ?? 0;
  // 0 = draw/undecided, 1 = P1 wins, 2 = P2 wins
  const winner: 1 | 2 | 'draw' = rawWinner === 1 ? 1 : rawWinner === 2 ? 2 : 'draw';

  const showCountdown = bState === 'BATTLE_COUNTDOWN';
  const showHUD = bState === 'BATTLE_PLAYING' || bState === 'BATTLE_DYING';
  const showResult = bState === 'BATTLE_RESULT';

  return (
    <div style={{ position: 'relative', width: totalW, height: totalH, overflow: 'hidden' }}>
      {/* Full-size shared canvas */}
      <BattleCanvas
        totalW={totalW}
        totalH={totalH}
        panelCfg={panelCfg}
        onStateChange={setBattleState}
        startCounter={startCounter}
      />

      {/* P1/P2 corner labels */}
      {!showResult && (
        <>
          <div style={cornerLabel('p1', layout.landscape, totalW, totalH)}>P1</div>
          <div style={cornerLabel('p2', layout.landscape, totalW, totalH)}>P2</div>
        </>
      )}

      {/* Live scores */}
      {showHUD && p1 && p2 && (
        <BattleHUD
          p1Score={p1.score}
          p2Score={p2.score}
          p1ScoreFlash={p1.scoreFlash}
          p2ScoreFlash={p2.scoreFlash}
          landscape={layout.landscape}
          totalW={totalW}
          totalH={totalH}
        />
      )}

      {/* Countdown */}
      <BattleCountdown
        countdown={countdown}
        frac={countdownFrac}
        visible={showCountdown}
      />

      {/* Result */}
      {showResult && p1 && p2 && (
        <BattleResult
          p1Score={p1.score}
          p2Score={p2.score}
          winner={winner}
          visible={true}
          onRematch={handleRematch}
          onHome={onHome}
        />
      )}

      {/* Control hints during countdown */}
      {showCountdown && (
        <div style={{
          position: 'absolute',
          bottom: layout.landscape ? 18 : totalH / 2 - 18,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 20px',
          pointerEvents: 'none',
          zIndex: 5,
        }}>
          <span style={hintText('#5b9bd5')}>
            {layout.landscape ? 'W / Left tap' : 'W / Top tap'}
          </span>
          <span style={hintText('#ac6ed5')}>
            {layout.landscape ? '↑ / Right tap' : '↑ / Bottom tap'}
          </span>
        </div>
      )}

      {/* Sound toggle */}
      <button
        onClick={handleToggleMute}
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 10,
          width: 38,
          height: 38,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'rgba(172,198,233,0.8)',
          zIndex: 10,
        }}
      >
        {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
      </button>
    </div>
  );
}

// ─── Style helpers ────────────────────────────────────────────────────────────

function cornerLabel(
  player: 'p1' | 'p2',
  landscape: boolean,
  totalW: number,
  totalH: number,
): React.CSSProperties {
  const color = player === 'p1' ? '#5b9bd5' : '#ac6ed5';
  const base: React.CSSProperties = {
    position: 'absolute',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color,
    padding: '4px 8px',
    background: `${color}18`,
    border: `1px solid ${color}33`,
    borderRadius: 6,
    pointerEvents: 'none',
    zIndex: 5,
  };

  if (landscape) {
    // P1: top-left; P2: top-left of right panel
    return player === 'p1'
      ? { ...base, top: 14, left: 14 }
      : { ...base, top: 14, left: Math.floor(totalW / 2) + 14 };
  } else {
    // P1: top-left of top panel; P2: top-left of bottom panel
    return player === 'p1'
      ? { ...base, top: 14, left: 14 }
      : { ...base, top: Math.floor(totalH / 2) + 14, left: 14 };
  }
}

function hintText(color: string): React.CSSProperties {
  return {
    fontSize: 11,
    color,
    opacity: 0.45,
    fontWeight: 500,
    letterSpacing: '0.04em',
    fontFamily: "'DM Sans', sans-serif",
  };
}
