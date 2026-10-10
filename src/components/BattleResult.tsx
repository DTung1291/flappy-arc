// ─── Battle result overlay ────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';

interface Props {
  p1Score: number;
  p2Score: number;
  winner: 1 | 2 | 'draw';
  visible: boolean;
  onRematch: () => void;
  onHome: () => void;
}

export function BattleResult({ p1Score, p2Score, winner, visible, onRematch, onHome }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current || !visible) return;
    cardRef.current.animate(
      [
        { opacity: 0, transform: 'scale(0.88) translateY(24px)' },
        { opacity: 1, transform: 'scale(1) translateY(0)' },
      ],
      { duration: 480, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'forwards' },
    );
  }, [visible]);

  if (!visible) return null;

  const winnerText =
    winner === 'draw' ? 'DRAW!' :
    winner === 1      ? 'PLAYER 1 WINS!' :
                        'PLAYER 2 WINS!';

  const winnerGrad =
    winner === 'draw' ? 'linear-gradient(135deg, #fde68a, #fcd34d)' :
    winner === 1      ? 'linear-gradient(135deg, #38bdf8, #818cf8)' :
                        'linear-gradient(135deg, #e879f9, #f472b6)';

  const btnBase: React.CSSProperties = {
    width: '100%',
    border: 'none',
    borderRadius: 16,
    padding: '15px 0',
    fontSize: 15,
    fontWeight: 700,
    fontFamily: "'Space Grotesk', sans-serif",
    letterSpacing: '0.07em',
    cursor: 'pointer',
    transition: 'transform 0.1s, filter 0.1s',
  };

  const btnHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1.03)';
    e.currentTarget.style.filter = 'brightness(1.12)';
  };
  const btnLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.filter = 'brightness(1)';
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5,12,28,0.60)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 30,
      }}
    >
      <div
        ref={cardRef}
        style={{
          background: 'rgba(255,255,255,0.09)',
          border: '1px solid rgba(125,211,252,0.22)',
          borderRadius: 28,
          padding: '36px 44px',
          textAlign: 'center',
          maxWidth: 320,
          width: '90%',
          boxShadow: '0 8px 56px rgba(0,0,0,0.40), 0 0 80px rgba(56,189,248,0.08)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      >
        {/* Winner headline */}
        <div
          className="display"
          style={{
            fontSize: 'clamp(22px, 6vw, 30px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            marginBottom: 24,
            background: winnerGrad,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 16px rgba(56,189,248,0.45))',
          }}
        >
          {winnerText}
        </div>

        {/* Score comparison */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28 }}>
          {/* P1 */}
          <div
            style={{
              flex: 1,
              padding: '14px 10px',
              background: winner === 1 ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.05)',
              border: winner === 1 ? '1.5px solid rgba(56,189,248,0.45)' : '1px solid rgba(255,255,255,0.10)',
              borderRadius: 14,
              boxShadow: winner === 1 ? '0 0 20px rgba(56,189,248,0.20)' : 'none',
            }}
          >
            <div style={{ fontSize: 10, color: 'rgba(56,189,248,0.75)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>P1</div>
            <div className="display" style={{ fontSize: 36, fontWeight: 700, lineHeight: 1, background: 'linear-gradient(135deg, #fff, #7dd3fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {p1Score}
            </div>
          </div>

          <div style={{ color: 'rgba(255,255,255,0.30)', fontSize: 18, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", flexShrink: 0 }}>VS</div>

          {/* P2 */}
          <div
            style={{
              flex: 1,
              padding: '14px 10px',
              background: winner === 2 ? 'rgba(232,121,249,0.15)' : 'rgba(255,255,255,0.05)',
              border: winner === 2 ? '1.5px solid rgba(232,121,249,0.45)' : '1px solid rgba(255,255,255,0.10)',
              borderRadius: 14,
              boxShadow: winner === 2 ? '0 0 20px rgba(232,121,249,0.20)' : 'none',
            }}
          >
            <div style={{ fontSize: 10, color: 'rgba(232,121,249,0.75)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>P2</div>
            <div className="display" style={{ fontSize: 36, fontWeight: 700, lineHeight: 1, background: 'linear-gradient(135deg, #fff, #f0abfc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {p2Score}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <button
          onClick={(e) => { e.stopPropagation(); onRematch(); }}
          style={{
            ...btnBase,
            background: 'linear-gradient(90deg, #0ea5e9, #818cf8, #a855f7)',
            color: '#ffffff',
            boxShadow: '0 0 28px rgba(99,102,241,0.45)',
            marginBottom: 10,
          }}
          onMouseEnter={btnHover}
          onMouseLeave={btnLeave}
        >
          REMATCH
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onHome(); }}
          style={{
            ...btnBase,
            background: 'rgba(255,255,255,0.07)',
            color: '#bae6fd',
            border: '1px solid rgba(125,211,252,0.22)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
        >
          HOME
        </button>
      </div>
    </div>
  );
}
