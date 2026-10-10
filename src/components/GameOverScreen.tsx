// ─── Game Over overlay ────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import { Trophy } from 'lucide-react';
import { ChallengeCreateButton } from './ChallengeScreen';

interface Props {
  score: number;
  best: number;
  isNewBest: boolean;
  visible: boolean;
  // Leaderboard integration
  playerRank: number;
  prevRank: number;
  pointsToNext: number;
  aboveName: string | null;
  rankImproved: boolean;
  submitLoading: boolean;
  onPlayAgain: () => void;
  onHome: () => void;
  onViewLeaderboard: () => void;
  // New props
  playerName?: string;
  challengeTarget?: number;
  challengeCleared?: boolean;
  challengerName?: string;
  onChallengeAgain?: () => void;
}

export function GameOverScreen({
  score, best, isNewBest, visible,
  playerRank, prevRank, pointsToNext, aboveName, rankImproved, submitLoading,
  onPlayAgain, onHome, onViewLeaderboard,
  playerName, challengeTarget, challengeCleared, challengerName, onChallengeAgain,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (visible) {
      containerRef.current.animate(
        [
          { opacity: 0, transform: 'translateY(28px) scale(0.92)' },
          { opacity: 1, transform: 'translateY(0) scale(1)' },
        ],
        { duration: 420, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'forwards' },
      );
    }
  }, [visible]);

  if (!visible) return null;

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

  const showRankUp = rankImproved && playerRank > 0 && prevRank > 0 && prevRank !== playerRank;
  const isTop10 = playerRank > 0 && playerRank <= 10;
  const isTop3  = playerRank > 0 && playerRank <= 3;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5,15,35,0.55)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        overflowY: 'auto',
      }}
    >
      <div
        ref={containerRef}
        style={{
          background: 'rgba(255,255,255,0.09)',
          border: '1px solid rgba(125,211,252,0.22)',
          borderRadius: 28,
          padding: '32px 36px',
          textAlign: 'center',
          boxShadow: '0 8px 48px rgba(0,0,0,0.35), 0 0 60px rgba(56,189,248,0.08)',
          maxWidth: 310,
          width: '92%',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {/* GAME OVER */}
        <div
          className="display"
          style={{
            fontSize: 'clamp(26px, 7vw, 36px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            marginBottom: 20,
            background: 'linear-gradient(135deg, #f472b6, #fb923c)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 12px rgba(244,114,182,0.5))',
          }}
        >
          GAME OVER
        </div>

        {/* Score row */}
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 18 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'rgba(186,230,253,0.50)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>
              Score
            </div>
            <div
              className="display"
              style={{
                fontSize: 42,
                fontWeight: 700,
                lineHeight: 1,
                background: 'linear-gradient(135deg, #ffffff, #7dd3fc)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {score}
            </div>
          </div>
          <div style={{ width: 1, background: 'rgba(125,211,252,0.13)', margin: '0 6px' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'rgba(186,230,253,0.50)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>
              Best
            </div>
            <div
              className="display"
              style={{
                fontSize: 42,
                fontWeight: 700,
                lineHeight: 1,
                background: 'linear-gradient(135deg, #a78bfa, #f472b6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {best}
            </div>
          </div>
        </div>

        {/* New best badge */}
        {isNewBest && (
          <div
            style={{
              border: '1px solid rgba(52,211,153,0.45)',
              borderRadius: 10,
              padding: '7px 16px',
              marginBottom: 14,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              background: 'linear-gradient(90deg, rgba(52,211,153,0.12), rgba(56,189,248,0.12))',
              color: '#34d399',
            }}
          >
            NEW BEST!
          </div>
        )}

        {/* Rank section */}
        {!submitLoading && playerRank > 0 && (
          <div
            style={{
              background: isTop3
                ? 'linear-gradient(90deg, rgba(251,191,36,0.14), rgba(249,115,22,0.12))'
                : isTop10
                  ? 'linear-gradient(90deg, rgba(52,211,153,0.12), rgba(56,189,248,0.10))'
                  : 'rgba(255,255,255,0.06)',
              border: `1px solid ${isTop3 ? 'rgba(251,191,36,0.40)' : isTop10 ? 'rgba(52,211,153,0.30)' : 'rgba(125,211,252,0.18)'}`,
              borderRadius: 12,
              padding: '10px 14px',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 9, color: 'rgba(186,230,253,0.50)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>
                Global Rank
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span
                  className="display"
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    background: isTop3
                      ? 'linear-gradient(135deg, #ffd700, #fb923c)'
                      : isTop10
                        ? 'linear-gradient(135deg, #34d399, #38bdf8)'
                        : 'linear-gradient(135deg, #7dd3fc, #a78bfa)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  #{playerRank}
                </span>
                {showRankUp && (
                  <span style={{ fontSize: 11, color: '#34d399', fontWeight: 700 }}>
                    ↑{prevRank - playerRank}
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {isTop3 && <div style={{ fontSize: 20 }}>🏆</div>}
              {isTop10 && !isTop3 && <div style={{ fontSize: 16 }}>⭐</div>}
            </div>
          </div>
        )}

        {/* Rank-up banner */}
        {showRankUp && (
          <div
            style={{
              borderRadius: 10,
              padding: '7px 14px',
              marginBottom: 10,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              background: isTop3
                ? 'linear-gradient(90deg, rgba(251,191,36,0.18), rgba(249,115,22,0.14))'
                : 'linear-gradient(90deg, rgba(56,189,248,0.14), rgba(99,102,241,0.12))',
              color: isTop3 ? '#fbbf24' : '#38bdf8',
              border: `1px solid ${isTop3 ? 'rgba(251,191,36,0.35)' : 'rgba(56,189,248,0.30)'}`,
            }}
          >
            {isTop3 ? '🏅 PODIUM!' : isTop10 ? '⭐ TOP 10!' : `RANK UP!  #${prevRank} → #${playerRank}`}
          </div>
        )}

        {/* Points to next */}
        {!submitLoading && pointsToNext > 0 && aboveName && (
          <div
            style={{
              fontSize: 11,
              color: 'rgba(186,230,253,0.55)',
              marginBottom: 14,
              lineHeight: 1.4,
            }}
          >
            <span style={{ color: '#f472b6', fontWeight: 700 }}>{pointsToNext} pts</span>
            {' '}to pass{' '}
            <span style={{ color: '#e0f2fe', fontWeight: 600 }}>{aboveName}</span>
          </div>
        )}

        {submitLoading && (
          <div style={{ fontSize: 11, color: 'rgba(186,230,253,0.45)', marginBottom: 14 }}>
            Submitting score…
          </div>
        )}

        {/* Challenge result summary if in a challenge */}
        {challengeTarget && challengeTarget > 0 && (
          <div style={{
            background: challengeCleared ? 'rgba(52,211,153,0.10)' : 'rgba(244,114,182,0.08)',
            border: `1px solid ${challengeCleared ? 'rgba(52,211,153,0.35)' : 'rgba(244,114,182,0.22)'}`,
            borderRadius: 12,
            padding: '10px 16px',
            marginBottom: 16,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.10em', color: challengeCleared ? '#34d399' : '#f472b6', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif" }}>
              {challengeCleared ? 'CHALLENGE CLEARED!' : 'SO CLOSE!'}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(186,230,253,0.50)', marginTop: 3, fontFamily: "'Space Grotesk', sans-serif" }}>
              {challengerName}'s target: {challengeTarget}
            </div>
            {challengeCleared && onChallengeAgain && (
              <button
                onClick={(e) => { e.stopPropagation(); onChallengeAgain?.(); }}
                style={{ marginTop: 8, ...btnBase, padding: '8px 0', fontSize: 12, background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.30)' }}
              >
                PLAY AGAIN
              </button>
            )}
          </div>
        )}

        {/* Buttons */}
        {!(challengeTarget && challengeTarget > 0) && (
        <button
          onClick={(e) => { e.stopPropagation(); onPlayAgain(); }}
          style={{
            ...btnBase,
            background: 'linear-gradient(90deg, #0ea5e9, #6366f1, #a855f7)',
            color: '#ffffff',
            boxShadow: '0 0 28px rgba(99,102,241,0.45), 0 4px 16px rgba(0,0,0,0.25)',
            marginBottom: 8,
          }}
          onMouseEnter={btnHover}
          onMouseLeave={btnLeave}
        >
          PLAY AGAIN
        </button>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onViewLeaderboard(); }}
          style={{
            ...btnBase,
            background: 'linear-gradient(90deg, rgba(251,191,36,0.14), rgba(249,115,22,0.12))',
            color: '#fbbf24',
            border: '1.5px solid rgba(251,191,36,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            marginBottom: 8,
          }}
          onMouseEnter={btnHover}
          onMouseLeave={btnLeave}
        >
          <Trophy size={14} /> VIEW LEADERBOARD
        </button>

        {/* Challenge a Friend */}
        {score > 0 && !challengeTarget && (
          <div style={{ marginBottom: 8 }}>
            <ChallengeCreateButton score={score} playerName={playerName ?? 'Anonymous'} />
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onHome(); }}
          style={{
            ...btnBase,
            background: 'rgba(255,255,255,0.07)',
            color: '#bae6fd',
            border: '1px solid rgba(125,211,252,0.20)',
            padding: '12px 0',
            fontSize: 13,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
        >
          HOME
        </button>
      </div>
    </div>
  );
}
