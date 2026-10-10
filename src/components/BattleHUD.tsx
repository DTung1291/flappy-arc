// ─── Battle HUD: P1/P2 scores ─────────────────────────────────────────────────

interface Props {
  p1Score: number;
  p2Score: number;
  p1ScoreFlash: number;
  p2ScoreFlash: number;
  landscape: boolean;
  totalW: number;
  totalH: number;
}

export function BattleHUD({ p1Score, p2Score, p1ScoreFlash, p2ScoreFlash, landscape, totalW, totalH }: Props) {
  const scoreStyle = (flash: number): React.CSSProperties => ({
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 'clamp(30px, 6vw, 42px)',
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: '-0.02em',
    transform: `scale(${1 + flash * 0.18})`,
    transition: 'transform 0.1s',
  });

  if (landscape) {
    const panelW = totalW / 2;
    return (
      <>
        <div style={{
          position: 'absolute', top: 12, left: panelW / 2,
          transform: 'translateX(-50%)', pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          filter: `drop-shadow(0 0 ${4 + p1ScoreFlash * 10}px #38bdf8)`,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'rgba(56,189,248,0.80)' }}>P1</span>
          <span style={{ ...scoreStyle(p1ScoreFlash), background: 'linear-gradient(135deg, #ffffff, #7dd3fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{p1Score}</span>
        </div>
        <div style={{
          position: 'absolute', top: 12, left: panelW + panelW / 2,
          transform: 'translateX(-50%)', pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          filter: `drop-shadow(0 0 ${4 + p2ScoreFlash * 10}px #e879f9)`,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'rgba(232,121,249,0.80)' }}>P2</span>
          <span style={{ ...scoreStyle(p2ScoreFlash), background: 'linear-gradient(135deg, #ffffff, #f0abfc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{p2Score}</span>
        </div>
      </>
    );
  }

  const panelH = totalH / 2;
  return (
    <>
      <div style={{
        position: 'absolute', top: 12, left: '50%',
        transform: 'translateX(-50%)', pointerEvents: 'none',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        filter: `drop-shadow(0 0 ${4 + p1ScoreFlash * 10}px #38bdf8)`,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'rgba(56,189,248,0.80)' }}>P1</span>
        <span style={{ ...scoreStyle(p1ScoreFlash), background: 'linear-gradient(135deg, #ffffff, #7dd3fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{p1Score}</span>
      </div>
      <div style={{
        position: 'absolute', top: panelH + 12, left: '50%',
        transform: 'translateX(-50%)', pointerEvents: 'none',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        filter: `drop-shadow(0 0 ${4 + p2ScoreFlash * 10}px #e879f9)`,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'rgba(232,121,249,0.80)' }}>P2</span>
        <span style={{ ...scoreStyle(p2ScoreFlash), background: 'linear-gradient(135deg, #ffffff, #f0abfc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{p2Score}</span>
      </div>
    </>
  );
}
