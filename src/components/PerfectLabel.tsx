// ─── Perfect! floating label ──────────────────────────────────────────────────
// Shows "PERFECT!" or "ARC PERFECT!" near the player position,
// plus the current streak count if > 1.

interface Props {
  label: string;        // 'PERFECT!' or 'ARC PERFECT!'
  fade: number;         // 0–1
  count: number;        // streak count
  playerX: number;      // canvas coords
  playerY: number;
  canvasW: number;
  canvasH: number;
  arcMode: boolean;
}

export function PerfectLabel({
  label, fade, count, playerX, playerY, canvasW, canvasH, arcMode,
}: Props) {
  if (fade <= 0 || !label) return null;

  // Convert canvas coords to CSS % position
  const left = `${Math.round((playerX / canvasW) * 100)}%`;
  const top  = `${Math.round(((playerY - 52) / canvasH) * 100)}%`;

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        transform: `translate(-50%, -50%) scale(${0.82 + fade * 0.18})`,
        opacity: fade,
        pointerEvents: 'none',
        textAlign: 'center',
        zIndex: 20,
      }}
    >
      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 'clamp(13px, 3.5vw, 16px)',
          fontWeight: 800,
          letterSpacing: '0.10em',
          background: arcMode
            ? 'linear-gradient(90deg, #f0abfc, #38bdf8, #f0abfc)'
            : 'linear-gradient(90deg, #67e8f9, #a78bfa)',
          backgroundSize: '200% 100%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: `drop-shadow(0 0 ${8 * fade}px rgba(103,232,249,0.8))`,
          whiteSpace: 'nowrap',
          lineHeight: 1,
        }}
      >
        {label}
      </div>
      {count > 1 && (
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(10px, 2.5vw, 12px)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: arcMode ? '#f0abfc' : '#a78bfa',
            opacity: 0.9,
            marginTop: 1,
          }}
        >
          ×{count}
        </div>
      )}
    </div>
  );
}
