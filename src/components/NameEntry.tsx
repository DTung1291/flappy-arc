// ─── Name Entry modal — first-time player setup ───────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { registerPlayer, storePlayer } from '../game/leaderboard';

interface Props {
  visible: boolean;
  onComplete: (id: string, name: string) => void;
}

export function NameEntry({ visible, onComplete }: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible) setTimeout(() => inputRef.current?.focus(), 200);
  }, [visible]);

  if (!visible) return null;

  const submit = async () => {
    const trimmed = name.trim().replace(/\s+/g, ' ');
    if (trimmed.length < 2) { setError('At least 2 characters'); return; }
    if (trimmed.length > 16) { setError('Max 16 characters'); return; }
    if (!/^[a-zA-Z0-9 _\-]+$/.test(trimmed)) { setError('Letters, numbers, spaces, _ or - only'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await registerPlayer(trimmed);
      storePlayer(res.id, res.name);
      onComplete(res.id, res.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const btnHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1.04)';
    e.currentTarget.style.filter = 'brightness(1.15)';
  };
  const btnLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.filter = 'brightness(1)';
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5,12,30,0.80)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, rgba(14,165,233,0.12), rgba(168,85,247,0.10))',
          border: '1px solid rgba(125,211,252,0.30)',
          borderRadius: 28,
          padding: '40px 36px',
          maxWidth: 340,
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 0 60px rgba(56,189,248,0.18), 0 8px 40px rgba(0,0,0,0.40)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Icon */}
        <div style={{ fontSize: 36, marginBottom: 6 }}>🎮</div>

        <div
          className="display"
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '0.04em',
            background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: 8,
          }}
        >
          CHOOSE YOUR NAME
        </div>
        <div style={{ fontSize: 12, color: 'rgba(186,230,253,0.55)', marginBottom: 28, letterSpacing: '0.06em' }}>
          This will appear on the global leaderboard.
        </div>

        <input
          ref={inputRef}
          value={name}
          onChange={e => { setName(e.target.value); setError(''); }}
          onKeyDown={e => { if (e.key === 'Enter') void submit(); }}
          maxLength={16}
          placeholder="Your name…"
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.08)',
            border: error ? '1.5px solid #f472b6' : '1.5px solid rgba(125,211,252,0.30)',
            borderRadius: 12,
            padding: '13px 16px',
            fontSize: 16,
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600,
            color: '#e0f2fe',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
            caretColor: '#38bdf8',
          }}
        />

        {error && (
          <div style={{ color: '#f472b6', fontSize: 12, marginTop: 8, textAlign: 'left' }}>
            {error}
          </div>
        )}

        <button
          onClick={() => void submit()}
          disabled={loading || name.trim().length < 2}
          style={{
            marginTop: 20,
            width: '100%',
            border: 'none',
            borderRadius: 14,
            padding: '15px 0',
            fontSize: 15,
            fontWeight: 700,
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '0.08em',
            cursor: loading || name.trim().length < 2 ? 'not-allowed' : 'pointer',
            background: loading || name.trim().length < 2
              ? 'rgba(99,102,241,0.30)'
              : 'linear-gradient(90deg, #0ea5e9, #6366f1, #a855f7)',
            color: '#fff',
            boxShadow: loading ? 'none' : '0 0 28px rgba(99,102,241,0.45)',
            transition: 'transform 0.1s, filter 0.1s',
            opacity: loading || name.trim().length < 2 ? 0.6 : 1,
          }}
          onMouseEnter={btnHover}
          onMouseLeave={btnLeave}
        >
          {loading ? 'JOINING…' : 'CONTINUE →'}
        </button>
      </div>
    </div>
  );
}
