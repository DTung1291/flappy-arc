// ─── Ghost Race toggle button ─────────────────────────────────────────────────

interface Props {
  ghostEnabled: boolean;
  ghostExists: boolean;
  onToggle: () => void;
}

export function GhostToggle({ ghostEnabled, ghostExists, onToggle }: Props) {
  if (!ghostExists) return null;

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: ghostEnabled
          ? 'linear-gradient(90deg, rgba(139,92,246,0.25), rgba(56,189,248,0.20))'
          : 'rgba(255,255,255,0.06)',
        border: ghostEnabled
          ? '1px solid rgba(139,92,246,0.45)'
          : '1px solid rgba(255,255,255,0.14)',
        borderRadius: 10,
        padding: '6px 12px',
        fontSize: 11,
        fontWeight: 700,
        fontFamily: "'Space Grotesk', sans-serif",
        letterSpacing: '0.10em',
        color: ghostEnabled ? '#c4b5fd' : 'rgba(186,230,253,0.45)',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <span style={{ fontSize: 12 }}>👻</span>
      GHOST {ghostEnabled ? 'ON' : 'OFF'}
    </button>
  );
}
