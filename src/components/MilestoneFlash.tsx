// ─── Milestone / env flash overlay ───────────────────────────────────────────

interface Props {
  flash: number;     // 0–1
  envFlash: number;  // 0–1 score-zone wave
}

export function MilestoneFlash({ flash, envFlash }: Props) {
  if (flash <= 0 && envFlash <= 0) return null;

  const intensity = Math.max(flash, envFlash);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
      }}
    >
      {/* Radial pulse from player side */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 30% 50%,
            rgba(56,189,248,${intensity * 0.18}) 0%,
            rgba(167,139,250,${intensity * 0.10}) 40%,
            transparent 70%)`,
        }}
      />
      {/* Edge glow wave */}
      {envFlash > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: `inset 0 0 60px rgba(56,189,248,${envFlash * 0.22})`,
          }}
        />
      )}
    </div>
  );
}
