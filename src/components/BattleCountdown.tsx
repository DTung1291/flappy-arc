// ─── Battle countdown (3, 2, 1, GO!) ─────────────────────────────────────────

interface Props {
  countdown: number;  // 3, 2, 1 → 0 = GO!
  frac: number;       // 0–1 progress within current step
  visible: boolean;
}

export function BattleCountdown({ countdown, frac, visible }: Props) {
  if (!visible) return null;

  const isGo = countdown === 0;
  const label = isGo ? 'GO!' : String(countdown);

  const scale = isGo ? 1 + (1 - frac) * 0.4 : 1.5 - frac * 0.5;
  const opacity = isGo ? Math.max(0, 1 - frac * 1.8) : Math.min(1, (1 - frac) * 2 + 0.2);

  const gradients: Record<string, string> = {
    '3': 'linear-gradient(135deg, #38bdf8, #818cf8)',
    '2': 'linear-gradient(135deg, #818cf8, #a78bfa)',
    '1': 'linear-gradient(135deg, #f472b6, #fb7185)',
    'GO!': 'linear-gradient(135deg, #34d399, #38bdf8)',
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      <div
        className="display"
        style={{
          fontSize: isGo ? 'clamp(60px, 16vw, 90px)' : 'clamp(80px, 20vw, 120px)',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 1,
          opacity,
          transform: `scale(${scale})`,
          background: gradients[label] ?? gradients['GO!'],
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: `drop-shadow(0 0 30px rgba(56,189,248,${opacity * 0.7}))`,
          willChange: 'transform, opacity',
        }}
      >
        {label}
      </div>
    </div>
  );
}
