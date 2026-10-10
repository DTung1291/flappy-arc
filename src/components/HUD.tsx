// ─── In-game HUD ─────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface Props {
  score: number;
  scoreFlash: number;
  muted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  visible: boolean;
  paused: boolean;
  comboLabel: string;
  comboFade: number;
}

export function HUD({ score, scoreFlash, muted, onToggleMute, visible, comboLabel, comboFade }: Props) {
  const scoreRef = useRef<HTMLDivElement>(null);
  const prevScore = useRef(score);

  useEffect(() => {
    if (scoreRef.current && score !== prevScore.current) {
      scoreRef.current.animate(
        [
          { transform: 'scale(1.5)', filter: 'drop-shadow(0 0 12px #38bdf8)' },
          { transform: 'scale(1)',   filter: 'drop-shadow(0 0 4px #38bdf8)' },
        ],
        { duration: 220, easing: 'cubic-bezier(0.22,1,0.36,1)' },
      );
      prevScore.current = score;
    }
  }, [score]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 14,
        pointerEvents: 'none',
      }}
    >
      {/* Score */}
      <div
        ref={scoreRef}
        className="display"
        style={{
          fontSize: 'clamp(44px, 11vw, 58px)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          background: 'linear-gradient(135deg, #ffffff, #7dd3fc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: `drop-shadow(0 0 ${8 + scoreFlash * 14}px rgba(56,189,248,${0.4 + scoreFlash * 0.5}))`,
          transition: 'filter 0.15s',
        }}
      >
        {score}
      </div>

      {/* Combo label */}
      {comboFade > 0 && comboLabel && (
        <div
          style={{
            position: 'absolute',
            top: 72,
            left: '50%',
            transform: `translateX(-50%) scale(${0.85 + comboFade * 0.15})`,
            opacity: comboFade,
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(18px, 5vw, 22px)',
            fontWeight: 700,
            letterSpacing: '0.1em',
            background: 'linear-gradient(90deg, #38bdf8, #a78bfa, #f472b6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 8px rgba(56,189,248,0.6))',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            transition: 'none',
          }}
        >
          {comboLabel}
        </div>
      )}

      {/* Sound toggle */}
      <div style={{ position: 'absolute', top: 14, right: 14, pointerEvents: 'auto' }}>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
          style={{
            background: 'rgba(255,255,255,0.14)',
            border: '1px solid rgba(255,255,255,0.20)',
            borderRadius: 10,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#7dd3fc',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            transition: 'transform 0.1s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>
    </div>
  );
}
