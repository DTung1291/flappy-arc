// ─── ARC Energy Meter ────────────────────────────────────────────────────────
// Shows a 0–100 energy bar + "ARC MODE!" activation flash

import { useEffect, useRef } from 'react';

interface Props {
  energyFraction: number;  // 0–1
  arcMode: boolean;
  activationFade: number;  // 0–1
  visible: boolean;
}

export function EnergyMeter({ energyFraction, arcMode, activationFade, visible }: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  // Animate bar width smoothly via CSS (energyFraction is already smoothed in game loop)
  useEffect(() => {
    if (!barRef.current) return;
    barRef.current.style.width = `${Math.round(energyFraction * 100)}%`;
  }, [energyFraction]);

  if (!visible) return null;

  const pct = Math.round(energyFraction * 100);
  const isCharging = pct > 0 && !arcMode;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'clamp(140px, 38vw, 200px)',
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {/* ARC MODE! flash label */}
      {activationFade > 0 && (
        <div
          ref={labelRef}
          style={{
            position: 'absolute',
            bottom: '100%',
            marginBottom: 8,
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(14px, 4vw, 18px)',
            fontWeight: 800,
            letterSpacing: '0.12em',
            background: 'linear-gradient(90deg, #f0abfc, #818cf8, #38bdf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: `drop-shadow(0 0 ${10 * activationFade}px rgba(240,171,252,0.9))`,
            opacity: activationFade,
            whiteSpace: 'nowrap',
            animation: 'arcModeFlash 0.4s ease-out',
          }}
        >
          ARC MODE!
        </div>
      )}

      {/* Label row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          paddingBottom: 2,
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: arcMode ? '#f0abfc' : isCharging ? '#818cf8' : 'rgba(186,230,253,0.40)',
            transition: 'color 0.3s',
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          ARC ENERGY
        </div>
        {pct > 0 && (
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: arcMode ? '#f0abfc' : 'rgba(186,230,253,0.55)',
              fontFamily: "'Space Grotesk', sans-serif",
              transition: 'color 0.3s',
            }}
          >
            {arcMode ? 'ACTIVE' : `${pct}%`}
          </div>
        )}
      </div>

      {/* Bar track */}
      <div
        style={{
          width: '100%',
          height: 5,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 8,
          overflow: 'hidden',
          border: arcMode
            ? '1px solid rgba(240,171,252,0.55)'
            : '1px solid rgba(129,140,248,0.22)',
          boxShadow: arcMode ? '0 0 12px rgba(240,171,252,0.40)' : 'none',
          transition: 'border 0.3s, box-shadow 0.3s',
        }}
      >
        <div
          ref={barRef}
          style={{
            height: '100%',
            width: `${pct}%`,
            background: arcMode
              ? 'linear-gradient(90deg, #818cf8, #f0abfc, #38bdf8, #f0abfc)'
              : 'linear-gradient(90deg, #818cf8, #a78bfa, #c084fc)',
            backgroundSize: arcMode ? '200% 100%' : '100%',
            borderRadius: 8,
            transition: 'width 0.08s linear, background 0.3s',
            animation: arcMode ? 'energyShift 1.5s linear infinite' : 'none',
            boxShadow: isCharging ? '0 0 8px rgba(167,139,250,0.6)' : 'none',
          }}
        />
      </div>

      <style>{`
        @keyframes energyShift {
          from { background-position: 0% 0%; }
          to   { background-position: 200% 0%; }
        }
        @keyframes arcModeFlash {
          0%   { transform: scale(0.7) translateY(4px); opacity: 0; }
          60%  { transform: scale(1.1) translateY(-2px); opacity: 1; }
          100% { transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
