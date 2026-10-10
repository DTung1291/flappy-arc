// ─── Leaderboard Screen ───────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchLeaderboard } from '../game/leaderboard';
import type { LBEntry, LBResult } from '../game/leaderboard';

interface Props {
  visible: boolean;
  playerId: string | null;
  playerName: string | null;
  onBack: () => void;
}

type Tab = 'global' | 'weekly' | 'battle';

// ─── Rank medal colours ───────────────────────────────────────────────────────

const GOLD   = { bg: 'linear-gradient(135deg,#ffd700,#f59e0b)', border: 'rgba(251,191,36,0.6)',  shadow: 'rgba(251,191,36,0.40)', text: '#1a0e00' };
const SILVER = { bg: 'linear-gradient(135deg,#e2e8f0,#94a3b8)', border: 'rgba(148,163,184,0.6)', shadow: 'rgba(148,163,184,0.30)', text: '#0f172a' };
const BRONZE = { bg: 'linear-gradient(135deg,#fb923c,#c2410c)', border: 'rgba(251,146,60,0.6)',  shadow: 'rgba(251,146,60,0.30)', text: '#fff' };

const MEDAL = [GOLD, SILVER, BRONZE];

// ─── Avatar generation (deterministic from name) ──────────────────────────────

const AVATAR_COLORS = [
  ['#38bdf8','#0ea5e9'],['#818cf8','#6366f1'],['#f472b6','#ec4899'],
  ['#34d399','#10b981'],['#fb923c','#f97316'],['#a78bfa','#8b5cf6'],
];

function avatarStyle(name: string): { bg: string; char: string } {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  const [a, b] = AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
  return { bg: `linear-gradient(135deg,${a},${b})`, char: name[0].toUpperCase() };
}

// ─── Podium card ──────────────────────────────────────────────────────────────

function PodiumCard({ entry, rankIdx, isMe }: { entry: LBEntry; rankIdx: number; isMe: boolean }) {
  const medal = MEDAL[rankIdx];
  const av = avatarStyle(entry.name);
  const heights = [140, 110, 90]; // visual platform heights
  const sizes   = [72, 60, 52];   // avatar sizes
  const fSizes  = [20, 16, 14];   // name font
  const scoreSizes = [38, 30, 26];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: rankIdx === 0 ? '0 0 38%' : '0 0 28%',
        order: rankIdx === 1 ? -1 : rankIdx === 2 ? 1 : 0, // 2nd-1st-3rd
        alignSelf: 'flex-end',
      }}
    >
      {/* Crown for #1 */}
      {rankIdx === 0 && (
        <div
          style={{
            fontSize: 28,
            marginBottom: 4,
            filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.8))',
            animation: 'crownBob 2s ease-in-out infinite',
          }}
        >
          👑
        </div>
      )}

      {/* Avatar */}
      <div
        style={{
          width: sizes[rankIdx],
          height: sizes[rankIdx],
          borderRadius: '50%',
          background: av.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: Math.round(sizes[rankIdx] * 0.4),
          fontWeight: 700,
          color: '#fff',
          fontFamily: "'Space Grotesk', sans-serif",
          boxShadow: `0 0 ${rankIdx === 0 ? 28 : 18}px ${medal.shadow}, 0 0 0 3px ${medal.border}`,
          marginBottom: 8,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {av.char}
        {isMe && (
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              background: '#38bdf8',
              borderRadius: 6,
              padding: '1px 5px',
              fontSize: 8,
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '0.05em',
            }}
          >
            YOU
          </div>
        )}
      </div>

      {/* Platform card */}
      <div
        style={{
          width: '100%',
          height: heights[rankIdx],
          background: rankIdx === 0
            ? 'linear-gradient(180deg, rgba(251,191,36,0.18), rgba(251,191,36,0.06))'
            : rankIdx === 1
              ? 'linear-gradient(180deg, rgba(148,163,184,0.16), rgba(148,163,184,0.05))'
              : 'linear-gradient(180deg, rgba(251,146,60,0.16), rgba(251,146,60,0.05))',
          border: `1.5px solid ${medal.border}`,
          borderRadius: '16px 16px 8px 8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          boxShadow: `0 0 24px ${medal.shadow}, inset 0 1px 0 rgba(255,255,255,0.12)`,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          padding: '8px 6px',
        }}
      >
        {/* Rank badge */}
        <div
          style={{
            background: medal.bg,
            borderRadius: 8,
            padding: '2px 10px',
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'Space Grotesk', sans-serif",
            color: medal.text,
            letterSpacing: '0.04em',
          }}
        >
          #{rankIdx + 1}
        </div>

        {/* Name */}
        <div
          style={{
            fontSize: fSizes[rankIdx],
            fontWeight: 700,
            color: '#e0f2fe',
            fontFamily: "'Space Grotesk', sans-serif",
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '90%',
            letterSpacing: '-0.02em',
          }}
        >
          {entry.name}
        </div>

        {/* Score */}
        <div
          className="display"
          style={{
            fontSize: scoreSizes[rankIdx],
            fontWeight: 700,
            lineHeight: 1,
            background: rankIdx === 0
              ? 'linear-gradient(135deg,#ffd700,#fb923c)'
              : rankIdx === 1
                ? 'linear-gradient(135deg,#e2e8f0,#94a3b8)'
                : 'linear-gradient(135deg,#fb923c,#f97316)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {entry.score}
        </div>
      </div>
    </div>
  );
}

// ─── Battle podium card (wins instead of score) ───────────────────────────────

function BattlePodiumCard({ entry, rankIdx, isMe }: { entry: LBEntry; rankIdx: number; isMe: boolean }) {
  const medal = MEDAL[rankIdx];
  const av = avatarStyle(entry.name);
  const heights = [140, 110, 90];
  const sizes   = [72, 60, 52];
  const fSizes  = [20, 16, 14];
  const scoreSizes = [34, 26, 22];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: rankIdx === 0 ? '0 0 38%' : '0 0 28%',
        order: rankIdx === 1 ? -1 : rankIdx === 2 ? 1 : 0,
        alignSelf: 'flex-end',
      }}
    >
      {rankIdx === 0 && (
        <div style={{ fontSize: 28, marginBottom: 4, filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.8))', animation: 'crownBob 2s ease-in-out infinite' }}>
          👑
        </div>
      )}
      <div
        style={{
          width: sizes[rankIdx], height: sizes[rankIdx], borderRadius: '50%', background: av.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: Math.round(sizes[rankIdx] * 0.4), fontWeight: 700, color: '#fff',
          fontFamily: "'Space Grotesk', sans-serif",
          boxShadow: `0 0 ${rankIdx === 0 ? 28 : 18}px ${medal.shadow}, 0 0 0 3px ${medal.border}`,
          marginBottom: 8, position: 'relative', flexShrink: 0,
        }}
      >
        {av.char}
        {isMe && (
          <div style={{ position: 'absolute', bottom: -4, right: -4, background: '#38bdf8', borderRadius: 6, padding: '1px 5px', fontSize: 8, fontWeight: 700, color: '#fff' }}>
            YOU
          </div>
        )}
      </div>
      <div
        style={{
          width: '100%', height: heights[rankIdx],
          background: rankIdx === 0
            ? 'linear-gradient(180deg, rgba(251,191,36,0.18), rgba(251,191,36,0.06))'
            : rankIdx === 1 ? 'linear-gradient(180deg, rgba(148,163,184,0.16), rgba(148,163,184,0.05))'
            : 'linear-gradient(180deg, rgba(251,146,60,0.16), rgba(251,146,60,0.05))',
          border: `1.5px solid ${medal.border}`,
          borderRadius: '16px 16px 8px 8px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
          boxShadow: `0 0 24px ${medal.shadow}, inset 0 1px 0 rgba(255,255,255,0.12)`,
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', padding: '8px 6px',
        }}
      >
        <div style={{ background: medal.bg, borderRadius: 8, padding: '2px 10px', fontSize: 12, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: medal.text, letterSpacing: '0.04em' }}>
          #{rankIdx + 1}
        </div>
        <div style={{ fontSize: fSizes[rankIdx], fontWeight: 700, color: '#e0f2fe', fontFamily: "'Space Grotesk', sans-serif", textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>
          {entry.name}
        </div>
        <div className="display" style={{ fontSize: scoreSizes[rankIdx], fontWeight: 700, lineHeight: 1, background: rankIdx === 0 ? 'linear-gradient(135deg,#ffd700,#fb923c)' : rankIdx === 1 ? 'linear-gradient(135deg,#e2e8f0,#94a3b8)' : 'linear-gradient(135deg,#fb923c,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          {entry.battleWins}W
        </div>
        <div style={{ fontSize: 11, color: 'rgba(186,230,253,0.55)', fontWeight: 500 }}>
          {entry.winRate}% WR
        </div>
      </div>
    </div>
  );
}

// ─── Row for ranks 4+ ────────────────────────────────────────────────────────

function RankRow({ entry, rank, isMe, tab }: { entry: LBEntry; rank: number; isMe: boolean; tab: Tab }) {
  const av = avatarStyle(entry.name);
  const value = tab === 'battle' ? `${entry.battleWins}W` : tab === 'weekly' ? entry.weeklyScore : entry.score;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 12,
        background: isMe
          ? 'linear-gradient(90deg, rgba(56,189,248,0.14), rgba(99,102,241,0.12))'
          : 'rgba(255,255,255,0.04)',
        border: isMe ? '1.5px solid rgba(56,189,248,0.45)' : '1px solid rgba(255,255,255,0.06)',
        boxShadow: isMe ? '0 0 16px rgba(56,189,248,0.18)' : 'none',
        transition: 'background 0.2s',
      }}
    >
      {/* Rank number */}
      <div
        style={{
          minWidth: 32,
          fontSize: 13,
          fontWeight: 700,
          fontFamily: "'Space Grotesk', sans-serif",
          color: 'rgba(186,230,253,0.55)',
          textAlign: 'right',
        }}
      >
        #{rank}
      </div>

      {/* Avatar */}
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: av.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 700,
          color: '#fff',
          fontFamily: "'Space Grotesk', sans-serif",
          flexShrink: 0,
        }}
      >
        {av.char}
      </div>

      {/* Name */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: isMe ? '#7dd3fc' : '#e0f2fe',
            fontFamily: "'Space Grotesk', sans-serif",
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {entry.name}
          {isMe && (
            <span
              style={{
                marginLeft: 7,
                fontSize: 10,
                background: 'rgba(56,189,248,0.25)',
                border: '1px solid rgba(56,189,248,0.5)',
                borderRadius: 5,
                padding: '1px 6px',
                color: '#38bdf8',
                fontWeight: 700,
                letterSpacing: '0.05em',
              }}
            >
              YOU
            </span>
          )}
        </div>
      </div>

      {/* Score */}
      <div
        className="display"
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: isMe ? '#7dd3fc' : '#e0f2fe',
          minWidth: 48,
          textAlign: 'right',
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function LeaderboardScreen({ visible, playerId, playerName, onBack }: Props) {
  const [tab, setTab] = useState<Tab>('global');
  const [data, setData] = useState<LBResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (t: Tab) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchLeaderboard(t, 50);
      setData(res);
    } catch {
      setError('Could not load leaderboard. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load when tab or visibility changes
  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; });
  useEffect(() => {
    if (!visible) return;
    void loadRef.current(tab);
  }, [visible, tab]);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.style.opacity = visible ? '1' : '0';
    containerRef.current.style.transform = visible ? 'translateY(0)' : 'translateY(32px)';
    containerRef.current.style.pointerEvents = visible ? 'auto' : 'none';
  }, [visible]);

  // Find current player in list
  const list = data?.list ?? [];
  const top3 = list.slice(0, 3);
  const rest = list.slice(3);

  // Find my entry
  const myEntry = playerId ? list.find(e => e.id === playerId) : null;
  const myRank = myEntry
    ? (tab === 'battle'
        ? (data?.list.findIndex(e => e.id === playerId) ?? -1) + 1
        : (tab === 'weekly' ? myEntry.weeklyRank : myEntry.rank))
    : -1;
  const aboveEntry = myEntry && myRank > 1 ? list[myRank - 2] : null;
  const myScore = tab === 'battle' ? myEntry?.battleWins ?? 0 : tab === 'weekly' ? myEntry?.weeklyScore ?? 0 : myEntry?.score ?? 0;
  const aboveScore = tab === 'battle' ? aboveEntry?.battleWins ?? 0 : tab === 'weekly' ? aboveEntry?.weeklyScore ?? 0 : aboveEntry?.score ?? 0;
  const pointsToNext = aboveEntry ? aboveScore - myScore + 1 : 0;
  const myInRest = rest.findIndex(e => e.id === playerId);

  const btnHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1.04)';
    e.currentTarget.style.filter = 'brightness(1.15)';
  };
  const btnLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.filter = 'brightness(1)';
  };

  const tabLabel = (t: Tab) => ({ global: 'GLOBAL', weekly: 'WEEKLY', battle: 'BATTLE' }[t]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, rgba(5,20,55,0.88) 0%, rgba(10,5,30,0.82) 100%)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        transition: 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.22,1,0.36,1)',
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 100,
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '18px 18px 0',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onBack(); }}
          style={{
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(125,211,252,0.25)',
            borderRadius: 10,
            width: 38,
            height: 38,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#7dd3fc',
            fontSize: 18,
            flexShrink: 0,
            transition: 'transform 0.1s, filter 0.1s',
          }}
          onMouseEnter={btnHover}
          onMouseLeave={btnLeave}
        >
          ←
        </button>
        <div
          className="display"
          style={{
            fontSize: 'clamp(20px, 6vw, 28px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(90deg, #38bdf8, #818cf8, #f472b6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 12px rgba(56,189,248,0.45))',
          }}
        >
          LEADERBOARD
        </div>
      </div>

      {/* ── My rank preview (when logged in) ───────────────── */}
      {myEntry && (
        <div
          style={{
            margin: '14px 16px 0',
            background: 'linear-gradient(90deg, rgba(56,189,248,0.12), rgba(99,102,241,0.10))',
            border: '1px solid rgba(56,189,248,0.35)',
            borderRadius: 14,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'rgba(186,230,253,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
              Your rank
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="display" style={{ fontSize: 26, fontWeight: 700, color: '#7dd3fc' }}>
                #{myRank > 0 ? myRank : '—'}
              </span>
              <span style={{ fontSize: 14, color: '#e0f2fe', fontWeight: 600 }}>
                {playerName}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'rgba(186,230,253,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
              {tab === 'battle' ? 'Wins' : 'Score'}
            </div>
            <div className="display" style={{ fontSize: 22, fontWeight: 700, color: '#38bdf8' }}>
              {myScore}
            </div>
          </div>
          {pointsToNext > 0 && aboveEntry && (
            <div
              style={{
                marginLeft: 4,
                background: 'rgba(255,255,255,0.07)',
                borderRadius: 10,
                padding: '6px 10px',
                fontSize: 11,
                color: 'rgba(186,230,253,0.70)',
                textAlign: 'center',
                maxWidth: 90,
              }}
            >
              <span style={{ color: '#f472b6', fontWeight: 700 }}>+{pointsToNext}</span>
              {' '}to pass
              <br />
              <span style={{ color: '#e0f2fe', fontWeight: 600 }}>{aboveEntry.name}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Tabs ───────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '14px 16px 0',
          flexShrink: 0,
        }}
      >
        {(['global', 'weekly', 'battle'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={(e) => { e.stopPropagation(); setTab(t); }}
            style={{
              flex: 1,
              border: tab === t ? '1.5px solid rgba(56,189,248,0.55)' : '1px solid rgba(255,255,255,0.10)',
              borderRadius: 10,
              padding: '9px 0',
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '0.08em',
              cursor: 'pointer',
              background: tab === t
                ? 'linear-gradient(90deg, rgba(14,165,233,0.22), rgba(99,102,241,0.20))'
                : 'rgba(255,255,255,0.05)',
              color: tab === t ? '#7dd3fc' : 'rgba(186,230,253,0.50)',
              transition: 'all 0.18s',
            }}
          >
            {tabLabel(t)}
          </button>
        ))}
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      {loading && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(186,230,253,0.50)', fontSize: 13 }}>
          Loading…
        </div>
      )}

      {error && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <div style={{ color: '#f472b6', fontSize: 13 }}>{error}</div>
          <button
            onClick={() => void load(tab)}
            style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(125,211,252,0.25)', borderRadius: 10, padding: '8px 20px', fontSize: 13, color: '#7dd3fc', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 24px' }}>
          {/* Podium */}
          {top3.length >= 3 && (
            <div style={{ padding: '18px 12px 8px' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', justifyContent: 'center' }}>
                {top3.map((e, i) =>
                  tab === 'battle'
                    ? <BattlePodiumCard key={e.id} entry={e} rankIdx={i} isMe={e.id === playerId} />
                    : <PodiumCard key={e.id} entry={e} rankIdx={i} isMe={e.id === playerId} />
                )}
              </div>
            </div>
          )}

          {/* Divider */}
          {rest.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 16px 10px' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(125,211,252,0.12)' }} />
              <div style={{ fontSize: 10, color: 'rgba(186,230,253,0.35)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600 }}>RANKINGS</div>
              <div style={{ flex: 1, height: 1, background: 'rgba(125,211,252,0.12)' }} />
            </div>
          )}

          {/* Rank 4+ rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '0 14px' }}>
            {rest.map((e, i) => (
              <RankRow
                key={e.id}
                entry={e}
                rank={i + 4}
                isMe={e.id === playerId}
                tab={tab}
              />
            ))}
          </div>

          {/* Pinned player row if not in visible list */}
          {myEntry && myInRest === -1 && !top3.find(e => e.id === playerId) && myRank > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 16px 8px' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(125,211,252,0.10)' }} />
                <div style={{ fontSize: 10, color: 'rgba(186,230,253,0.35)', letterSpacing: '0.10em', textTransform: 'uppercase' }}>YOUR RANK</div>
                <div style={{ flex: 1, height: 1, background: 'rgba(125,211,252,0.10)' }} />
              </div>
              <div style={{ padding: '0 14px' }}>
                <RankRow entry={myEntry} rank={myRank} isMe tab={tab} />
              </div>
            </>
          )}

          {/* Empty state */}
          {list.length === 0 && (
            <div style={{ textAlign: 'center', color: 'rgba(186,230,253,0.40)', fontSize: 13, marginTop: 60 }}>
              No scores yet. Be the first!
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes crownBob {
          0%,100% { transform: translateY(0) rotate(-4deg); }
          50%      { transform: translateY(-5px) rotate(4deg); }
        }
      `}</style>
    </div>
  );
}
