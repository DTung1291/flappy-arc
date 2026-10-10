// ─── Rank-up celebration overlay ─────────────────────────────────────────────

import { useEffect, useRef } from 'react';

interface Props {
  visible: boolean;
  prevRank: number;
  newRank: number;
  label: 'RANK UP!' | 'TOP 10!' | 'TOP 3!' | 'ARC CHAMPION!';
}

export function RankUpOverlay({ visible, prevRank, newRank, label }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !visible) return;
    ref.current.animate(
      [
        { opacity: 0, transform: 'scale(0.6) translateY(-20px)' },
        { opacity: 1, transform: 'scale(1.1) translateY(0)' },
        { opacity: 1, transform: 'scale(1) translateY(0)', offset: 0.6 },
        { opacity: 0, transform: 'scale(0.9) translateY(-10px)' },
      ],
      { duration: 1800, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'forwards' },
    );
  }, [visible]);

  if (!visible) return null;

  const colors: Record<string, string> = {
    'RANK UP!':        'linear-gradient(90deg, #38bdf8, #818cf8)',
    'TOP 10!':         'linear-gradient(90deg, #34d399, #38bdf8)',
    'TOP 3!':          'linear-gradient(90deg, #fbbf24, #f97316)',
    'ARC CHAMPION!':   'linear-gradient(90deg, #ffd700, #f59e0b, #fb923c)',
  };

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: '22%',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        pointerEvents: 'none',
        zIndex: 200,
      }}
    >
      <div
        className="display"
        style={{
          fontSize: 'clamp(26px, 8vw, 40px)',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          background: colors[label] ?? colors['RANK UP!'],
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: `drop-shadow(0 0 20px rgba(56,189,248,0.7))`,
        }}
      >
        {label}
      </div>
      {prevRank > 0 && newRank > 0 && label === 'RANK UP!' && (
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#e0f2fe',
            marginTop: 6,
            fontFamily: "'Space Grotesk', sans-serif",
            textShadow: '0 0 10px rgba(56,189,248,0.6)',
          }}
        >
          #{prevRank} → #{newRank}
        </div>
      )}
    </div>
  );
}
