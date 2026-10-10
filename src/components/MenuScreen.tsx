// ─── Menu / Home screen ────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Trophy } from 'lucide-react';

export type SpeedTier = 'easy' | 'normal' | 'fast' | 'insane';

const SPEED_TIERS: { id: SpeedTier; label: string; emoji: string; color: string; glow: string }[] = [
  { id: 'easy',   label: 'EASY',   emoji: '🐢', color: '#4ade80', glow: 'rgba(74,222,128,0.40)' },
  { id: 'normal', label: 'NORMAL', emoji: '🚀', color: '#38bdf8', glow: 'rgba(56,189,248,0.40)' },
  { id: 'fast',   label: 'FAST',   emoji: '⚡', color: '#f472b6', glow: 'rgba(244,114,182,0.40)' },
  { id: 'insane', label: 'INSANE', emoji: '💀', color: '#f97316', glow: 'rgba(249,115,22,0.50)' },
];

const SPEED_KEY = 'flappyarc_speed_tier';

export function loadSpeedTier(): SpeedTier {
  const v = localStorage.getItem(SPEED_KEY);
  if (v === 'easy' || v === 'normal' || v === 'fast' || v === 'insane') return v;
  return 'normal';
}

function saveSpeedTier(t: SpeedTier) { localStorage.setItem(SPEED_KEY, t); }

interface Props {
  best: number;
  muted: boolean;
  onToggleMute: () => void;
  onSolo: (tier: SpeedTier) => void;
  onBattle: (tier: SpeedTier) => void;
  onLeaderboard: () => void;
  playerName: string | null;
  playerRank: number;
  visible: boolean;
}

export function MenuScreen({ best, muted, onToggleMute, onSolo, onBattle, onLeaderboard, playerName, playerRank, visible }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tier, setTier] = useState<SpeedTier>(loadSpeedTier);

  const selectTier = (t: SpeedTier) => {
    setTier(t);
    saveSpeedTier(t);
  };

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.style.opacity = visible ? '1' : '0';
    containerRef.current.style.pointerEvents = visible ? 'auto' : 'none';
  }, [visible]);

  const btnHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1.04)';
    e.currentTarget.style.filter = 'brightness(1.15)';
  };
  const btnLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.filter = 'brightness(1)';
  };
  const btnDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(0.96)';
  };
  const btnUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1.04)';
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.35s ease',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        background: 'linear-gradient(180deg, rgba(10,60,120,0.55) 0%, rgba(15,20,50,0.45) 100%)',
      }}
    >
      {/* Top-right controls */}
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
        <button
          onClick={(e) => { e.stopPropagation(); onLeaderboard(); }}
          style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(251,191,36,0.35)',
            borderRadius: 12,
            width: 44, height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#fbbf24',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            transition: 'transform 0.1s, filter 0.1s',
            boxShadow: '0 0 12px rgba(251,191,36,0.20)',
          }}
          onMouseEnter={btnHover}
          onMouseLeave={btnLeave}
          title="Leaderboard"
        >
          <Trophy size={18} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
          style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.20)',
            borderRadius: 12,
            width: 44, height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#7dd3fc',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            transition: 'transform 0.1s',
          }}
          onMouseEnter={btnHover}
          onMouseLeave={btnLeave}
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div
          className="display"
          style={{
            fontSize: 'clamp(34px, 10vw, 58px)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            background: 'linear-gradient(90deg, #38bdf8, #818cf8, #f472b6, #38bdf8)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 24px rgba(56,189,248,0.55))',
            animation: 'titleShift 4s linear infinite',
          }}
        >
          FLAPPY ARC
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 'clamp(11px, 3vw, 13px)',
            color: 'rgba(186,230,253,0.80)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}
        >
          Navigate the Arc.
        </div>
      </div>

      {/* Rank + best score row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'stretch' }}>
        {best > 0 && (
          <div
            style={{
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(125,211,252,0.30)',
              borderRadius: 14,
              padding: '8px 22px',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              boxShadow: '0 0 20px rgba(56,189,248,0.12)',
            }}
          >
            <div style={{ fontSize: 9, color: 'rgba(186,230,253,0.50)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>
              Best
            </div>
            <div
              className="display"
              style={{
                fontSize: 26,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #7dd3fc, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {best}
            </div>
          </div>
        )}
        {playerName && playerRank > 0 && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(249,115,22,0.10))',
              border: '1px solid rgba(251,191,36,0.30)',
              borderRadius: 14,
              padding: '8px 22px',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              boxShadow: '0 0 16px rgba(251,191,36,0.12)',
            }}
          >
            <div style={{ fontSize: 9, color: 'rgba(251,191,36,0.65)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>
              Global
            </div>
            <div
              className="display"
              style={{
                fontSize: 26,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #fbbf24, #f97316)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              #{playerRank}
            </div>
          </div>
        )}
      </div>

      {/* Player greeting */}
      {playerName && (
        <div style={{ fontSize: 11, color: 'rgba(186,230,253,0.50)', letterSpacing: '0.08em', marginBottom: 16, textTransform: 'uppercase' }}>
          Welcome back, <span style={{ color: '#7dd3fc', fontWeight: 700 }}>{playerName}</span>
        </div>
      )}

      {/* Speed selector */}
      <div style={{ marginBottom: 18, textAlign: 'center' }}>
        <div style={{
          fontSize: 9, color: 'rgba(186,230,253,0.45)', letterSpacing: '0.18em',
          textTransform: 'uppercase', marginBottom: 8, fontWeight: 600,
        }}>
          Speed
        </div>
        <div style={{ display: 'flex', gap: 7 }}>
          {SPEED_TIERS.map(t => {
            const active = tier === t.id;
            return (
              <button
                key={t.id}
                onClick={(e) => { e.stopPropagation(); selectTier(t.id); }}
                style={{
                  border: active ? `2px solid ${t.color}` : '2px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  padding: '7px 10px',
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: "'Space Grotesk', sans-serif",
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  minWidth: 58,
                  background: active
                    ? `linear-gradient(135deg, ${t.color}22, ${t.color}11)`
                    : 'rgba(255,255,255,0.06)',
                  color: active ? t.color : 'rgba(186,230,253,0.55)',
                  boxShadow: active ? `0 0 14px ${t.glow}` : 'none',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                  transition: 'all 0.15s ease',
                  transform: active ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <div style={{ fontSize: 14, lineHeight: 1, marginBottom: 3 }}>{t.emoji}</div>
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        {/* SOLO */}
        <button
          onClick={(e) => { e.stopPropagation(); onSolo(tier); }}
          style={{
            border: 'none',
            borderRadius: 16,
            padding: '16px 0',
            fontSize: 15,
            fontWeight: 700,
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '0.08em',
            cursor: 'pointer',
            width: 228,
            background: 'linear-gradient(90deg, #0ea5e9, #6366f1, #a855f7)',
            color: '#ffffff',
            boxShadow: '0 0 32px rgba(99,102,241,0.50), 0 4px 18px rgba(0,0,0,0.30)',
            transition: 'transform 0.1s, filter 0.1s',
          }}
          onMouseEnter={btnHover}
          onMouseLeave={btnLeave}
          onMouseDown={btnDown}
          onMouseUp={btnUp}
        >
          PLAY SOLO
        </button>

        {/* 2P BATTLE */}
        <button
          onClick={(e) => { e.stopPropagation(); onBattle(tier); }}
          style={{
            border: '2px solid rgba(167,139,250,0.45)',
            borderRadius: 16,
            padding: '14px 0',
            fontSize: 15,
            fontWeight: 700,
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '0.08em',
            cursor: 'pointer',
            width: 228,
            background: 'linear-gradient(90deg, rgba(14,165,233,0.18), rgba(168,85,247,0.20))',
            color: '#e0f2fe',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: '0 4px 24px rgba(168,85,247,0.20)',
            transition: 'transform 0.1s, filter 0.1s',
          }}
          onMouseEnter={btnHover}
          onMouseLeave={btnLeave}
          onMouseDown={btnDown}
          onMouseUp={btnUp}
        >
          2P BATTLE
        </button>

        {/* LEADERBOARD */}
        <button
          onClick={(e) => { e.stopPropagation(); onLeaderboard(); }}
          style={{
            border: '1.5px solid rgba(251,191,36,0.40)',
            borderRadius: 16,
            padding: '13px 0',
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '0.08em',
            cursor: 'pointer',
            width: 228,
            background: 'linear-gradient(90deg, rgba(251,191,36,0.12), rgba(249,115,22,0.10))',
            color: '#fbbf24',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: '0 0 20px rgba(251,191,36,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'transform 0.1s, filter 0.1s',
          }}
          onMouseEnter={btnHover}
          onMouseLeave={btnLeave}
          onMouseDown={btnDown}
          onMouseUp={btnUp}
        >
          <Trophy size={15} /> LEADERBOARD
        </button>
      </div>

      {/* Hint */}
      <div style={{ marginTop: 20, fontSize: 11, color: 'rgba(186,230,253,0.30)', letterSpacing: '0.06em' }}>
        Tap · Click · Space
      </div>

      <style>{`
        @keyframes titleShift {
          from { background-position: 0% 0%; }
          to   { background-position: 200% 0%; }
        }
      `}</style>
    </div>
  );
}
