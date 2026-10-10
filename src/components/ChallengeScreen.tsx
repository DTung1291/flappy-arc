// ─── Challenge-a-Friend screens ───────────────────────────────────────────────
// 1. ChallengeCreateButton – post-game "CHALLENGE A FRIEND" button
// 2. ChallengeIncoming   – shown when URL has ?challenge=<id>
// 3. ChallengeHUD        – subtle "TARGET: N" during a challenge run
// 4. ChallengeResultOverlay – cleared / failed overlay

import { useState, useCallback } from 'react';
import { createChallenge, type Challenge } from '../game/challengeService';

// ─── Shared button styles ─────────────────────────────────────────────────────

const btnBase: React.CSSProperties = {
  border: 'none',
  borderRadius: 14,
  padding: '13px 0',
  fontSize: 14,
  fontWeight: 700,
  fontFamily: "'Space Grotesk', sans-serif",
  letterSpacing: '0.08em',
  cursor: 'pointer',
  width: '100%',
  transition: 'transform 0.1s, filter 0.1s',
};
const onHover = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.style.transform = 'scale(1.03)';
  e.currentTarget.style.filter = 'brightness(1.12)';
};
const onLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.style.transform = 'scale(1)';
  e.currentTarget.style.filter = 'brightness(1)';
};

// ─── 1. Create challenge button ───────────────────────────────────────────────

interface CreateProps {
  score: number;
  playerName: string;
}

export function ChallengeCreateButton({ score, playerName }: CreateProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreate = useCallback(async () => {
    if (state !== 'idle') return;
    setState('loading');
    try {
      const result = await createChallenge(playerName || 'Anonymous', score);
      setUrl(result.url);
      setState('done');
    } catch {
      setState('idle');
    }
  }, [state, playerName, score]);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [url]);

  if (state === 'done') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
        <div
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(125,211,252,0.22)',
            borderRadius: 12,
            padding: '10px 14px',
            fontSize: 11,
            color: '#7dd3fc',
            fontFamily: 'monospace',
            wordBreak: 'break-all',
            lineHeight: 1.5,
          }}
        >
          {url}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); handleCopy(); }}
          style={{
            ...btnBase,
            background: copied
              ? 'linear-gradient(90deg, #34d399, #059669)'
              : 'linear-gradient(90deg, #0ea5e9, #6366f1)',
            color: '#fff',
            boxShadow: '0 0 24px rgba(99,102,241,0.40)',
            fontSize: 13,
          }}
          onMouseEnter={onHover}
          onMouseLeave={onLeave}
        >
          {copied ? '✓ COPIED!' : 'COPY LINK'}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); void handleCreate(); }}
      disabled={state === 'loading'}
      style={{
        ...btnBase,
        background: 'linear-gradient(90deg, rgba(14,165,233,0.22), rgba(168,85,247,0.22))',
        color: '#e0f2fe',
        border: '1.5px solid rgba(168,85,247,0.40)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 0 20px rgba(168,85,247,0.18)',
        opacity: state === 'loading' ? 0.7 : 1,
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {state === 'loading' ? 'CREATING…' : '⚔ CHALLENGE A FRIEND'}
    </button>
  );
}

// ─── 2. Challenge incoming screen ─────────────────────────────────────────────

interface IncomingProps {
  challenge: Challenge;
  onAccept: () => void;
  onDecline: () => void;
}

export function ChallengeIncoming({ challenge, onAccept, onDecline }: IncomingProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5,15,35,0.60)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.09)',
          border: '1px solid rgba(125,211,252,0.28)',
          borderRadius: 28,
          padding: '36px 40px',
          maxWidth: 310,
          width: '88%',
          textAlign: 'center',
          boxShadow: '0 8px 48px rgba(0,0,0,0.35), 0 0 60px rgba(168,85,247,0.12)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          animation: 'slideUp 0.4s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 10 }}>⚔️</div>
        <div
          style={{
            fontSize: 11,
            color: 'rgba(186,230,253,0.60)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 6,
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600,
          }}
        >
          {challenge.challengerName} challenged you
        </div>
        <div
          className="display"
          style={{
            fontSize: 'clamp(22px, 6vw, 28px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            marginBottom: 16,
            background: 'linear-gradient(135deg, #f472b6, #fb923c)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          BEAT THIS SCORE
        </div>
        <div
          className="display"
          style={{
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1,
            marginBottom: 24,
            background: 'linear-gradient(135deg, #ffffff, #7dd3fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 18px rgba(56,189,248,0.55))',
          }}
        >
          {challenge.challengerScore}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onAccept(); }}
            style={{
              ...btnBase,
              background: 'linear-gradient(90deg, #0ea5e9, #6366f1, #a855f7)',
              color: '#fff',
              boxShadow: '0 0 28px rgba(99,102,241,0.45)',
            }}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
          >
            START CHALLENGE
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDecline(); }}
            style={{
              ...btnBase,
              background: 'rgba(255,255,255,0.07)',
              color: 'rgba(186,230,253,0.55)',
              border: '1px solid rgba(125,211,252,0.18)',
            }}
          >
            MAYBE LATER
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(28px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── 3. Challenge HUD strip ───────────────────────────────────────────────────

interface HudProps {
  target: number;
  score: number;
  cleared: boolean;
  visible: boolean;
}

export function ChallengeHUD({ target, score, cleared, visible }: HudProps) {
  if (!visible || target <= 0) return null;
  const diff = score - target;

  return (
    <div
      style={{
        position: 'absolute',
        top: 14,
        left: 14,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 2,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: cleared ? '#34d399' : 'rgba(186,230,253,0.50)',
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        TARGET
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          lineHeight: 1,
          fontFamily: "'Space Grotesk', sans-serif",
          color: cleared ? '#34d399' : '#fb923c',
          filter: cleared ? 'drop-shadow(0 0 8px rgba(52,211,153,0.7))' : 'none',
        }}
      >
        {target}
      </div>
      {!cleared && diff < 0 && (
        <div style={{ fontSize: 9, color: 'rgba(186,230,253,0.40)', fontFamily: "'Space Grotesk', sans-serif" }}>
          {Math.abs(diff)} to go
        </div>
      )}
      {cleared && (
        <div style={{ fontSize: 10, fontWeight: 700, color: '#34d399', letterSpacing: '0.10em', fontFamily: "'Space Grotesk', sans-serif" }}>
          CLEARED! ✓
        </div>
      )}
    </div>
  );
}

// ─── 4. Challenge Result overlay ──────────────────────────────────────────────

interface ResultProps {
  score: number;
  target: number;
  cleared: boolean;
  challengerName: string;
  playerName: string;
  visible: boolean;
  onTryAgain: () => void;
  onHome: () => void;
}

export function ChallengeResultOverlay({
  score, target, cleared, challengerName, playerName, visible, onTryAgain, onHome,
}: ResultProps) {
  const [shareCreating, setShareCreating] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    if (shareCreating) return;
    setShareCreating(true);
    const result = await createChallenge(playerName || 'Anonymous', score);
    setShareUrl(result.url);
    setShareCreating(false);
  }, [shareCreating, playerName, score]);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5,15,35,0.60)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.10)',
          border: `1px solid ${cleared ? 'rgba(52,211,153,0.35)' : 'rgba(244,114,182,0.28)'}`,
          borderRadius: 28,
          padding: '32px 38px',
          maxWidth: 310,
          width: '88%',
          textAlign: 'center',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: cleared
            ? '0 8px 48px rgba(52,211,153,0.15)'
            : '0 8px 48px rgba(244,114,182,0.12)',
          animation: 'slideUp 0.4s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {/* Status heading */}
        <div
          className="display"
          style={{
            fontSize: 'clamp(22px, 7vw, 30px)',
            fontWeight: 700,
            marginBottom: 8,
            background: cleared
              ? 'linear-gradient(135deg, #34d399, #38bdf8)'
              : 'linear-gradient(135deg, #f472b6, #fb923c)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: cleared ? 'drop-shadow(0 0 12px rgba(52,211,153,0.5))' : 'none',
          }}
        >
          {cleared ? 'CHALLENGE CLEARED!' : 'SO CLOSE!'}
        </div>

        {/* vs info */}
        <div style={{ fontSize: 11, color: 'rgba(186,230,253,0.50)', marginBottom: 18, letterSpacing: '0.08em', fontFamily: "'Space Grotesk', sans-serif" }}>
          {challengerName}'s target: {target}
        </div>

        {/* Score pair */}
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 22 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'rgba(186,230,253,0.50)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2, fontFamily: "'Space Grotesk', sans-serif" }}>Your Score</div>
            <div className="display" style={{ fontSize: 44, fontWeight: 700, lineHeight: 1, background: 'linear-gradient(135deg, #ffffff, #7dd3fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{score}</div>
          </div>
          <div style={{ width: 1, background: 'rgba(125,211,252,0.12)', margin: '0 6px' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'rgba(186,230,253,0.50)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2, fontFamily: "'Space Grotesk', sans-serif" }}>Target</div>
            <div className="display" style={{ fontSize: 44, fontWeight: 700, lineHeight: 1, background: 'linear-gradient(135deg, #fb923c, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{target}</div>
          </div>
        </div>

        {/* Share result */}
        {cleared && !shareUrl && (
          <button
            onClick={(e) => { e.stopPropagation(); void handleShare(); }}
            disabled={shareCreating}
            style={{
              ...btnBase,
              background: 'linear-gradient(90deg, #0ea5e9, #6366f1, #a855f7)',
              color: '#fff',
              boxShadow: '0 0 28px rgba(99,102,241,0.40)',
              marginBottom: 10,
              opacity: shareCreating ? 0.7 : 1,
            }}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
          >
            {shareCreating ? 'CREATING…' : 'SHARE MY RESULT'}
          </button>
        )}
        {shareUrl && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(125,211,252,0.20)', borderRadius: 10, padding: '8px 12px', fontSize: 10, color: '#7dd3fc', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: 6 }}>{shareUrl}</div>
            <button onClick={(e) => { e.stopPropagation(); handleCopy(); }} style={{ ...btnBase, background: copied ? 'linear-gradient(90deg, #34d399, #059669)' : 'linear-gradient(90deg, #0ea5e9, #6366f1)', color: '#fff', marginBottom: 0 }} onMouseEnter={onHover} onMouseLeave={onLeave}>
              {copied ? '✓ COPIED!' : 'COPY LINK'}
            </button>
          </div>
        )}

        {/* Actions */}
        <button
          onClick={(e) => { e.stopPropagation(); onTryAgain(); }}
          style={{
            ...btnBase,
            background: 'linear-gradient(90deg, #0ea5e9, #6366f1, #a855f7)',
            color: '#fff',
            boxShadow: '0 0 28px rgba(99,102,241,0.40)',
            marginBottom: 8,
          }}
          onMouseEnter={onHover}
          onMouseLeave={onLeave}
        >
          TRY AGAIN
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onHome(); }}
          style={{ ...btnBase, background: 'rgba(255,255,255,0.07)', color: '#bae6fd', border: '1px solid rgba(125,211,252,0.20)' }}
        >
          HOME
        </button>
      </div>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(28px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
