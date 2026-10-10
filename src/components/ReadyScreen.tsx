// ─── Ready overlay ────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';

interface Props {
  visible: boolean;
}

export function ReadyScreen({ visible }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.opacity = visible ? '1' : '0';
    ref.current.style.pointerEvents = visible ? 'auto' : 'none';
  }, [visible]);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.2s ease',
        pointerEvents: 'none',
      }}
    >
      <div
        className="display"
        style={{
          fontSize: 'clamp(20px, 6vw, 26px)',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          background: 'linear-gradient(90deg, #38bdf8, #a78bfa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 0 12px rgba(56,189,248,0.5))',
          animation: visible ? 'readyPulse 0.75s ease-in-out infinite alternate' : 'none',
        }}
      >
        Tap to fly
      </div>

      <style>{`
        @keyframes readyPulse {
          from { opacity: 0.55; transform: scale(0.96); }
          to   { opacity: 1;    transform: scale(1.04); }
        }
      `}</style>
    </div>
  );
}
