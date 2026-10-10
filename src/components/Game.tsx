// ─── Top-level game orchestrator ──────────────────────────────────────────────

import { useState, useCallback, useEffect, useRef } from 'react';
import { GameCanvas } from './GameCanvas';
import { MenuScreen, loadSpeedTier } from './MenuScreen';
import type { SpeedTier } from './MenuScreen';
import { ReadyScreen } from './ReadyScreen';
import { HUD } from './HUD';
import { GameOverScreen } from './GameOverScreen';
import { MilestoneFlash } from './MilestoneFlash';
import { BattleMode } from './BattleMode';
import { LeaderboardScreen } from './LeaderboardScreen';
import { NameEntry } from './NameEntry';
import { RankUpOverlay } from './RankUpOverlay';
import { EnergyMeter } from './EnergyMeter';
import { PerfectLabel } from './PerfectLabel';
import { GhostToggle } from './GhostToggle';
import { ChallengeIncoming } from './ChallengeScreen';
import type { GameConfig, GameSnapshot } from '../game/types';
import { audio, loadAudioPref, saveAudioPref } from '../game/audio';
import {
  getStoredPlayerId, getStoredPlayerName,
  submitSoloScore, fetchPlayer,
} from '../game/leaderboard';
import type { SubmitResult } from '../game/leaderboard';
import { getChallengeIdFromUrl, clearChallengeFromUrl, fetchChallenge } from '../game/challengeService';
import type { Challenge } from '../game/challengeService';

// ─── App mode ─────────────────────────────────────────────────────────────────

type AppMode = 'MENU' | 'SOLO' | 'BATTLE' | 'LEADERBOARD';

// ─── Speed tier multipliers ───────────────────────────────────────────────────

export const SPEED_MULTIPLIERS: Record<SpeedTier, number> = {
  easy:   0.70,
  normal: 1.00,
  fast:   1.45,
  insane: 2.10,
};

// ─── Solo config ──────────────────────────────────────────────────────────────

function buildSoloConfig(width: number, height: number, tier: SpeedTier = 'normal'): GameConfig {
  const isMobile = width < 480;
  const mul = SPEED_MULTIPLIERS[tier];
  return {
    width,
    height,
    gravity: 0.42 * (tier === 'insane' ? 1.15 : tier === 'fast' ? 1.05 : tier === 'easy' ? 0.9 : 1),
    jumpForce: -7.2 * (tier === 'insane' ? 1.10 : tier === 'fast' ? 1.05 : tier === 'easy' ? 0.92 : 1),
    maxFallSpeed: 10 * (tier === 'insane' ? 1.2 : 1),
    baseSpeed: (isMobile ? 4.2 : 4.8) * mul,
    obstacleSpacing: (isMobile ? 220 : 260) * (tier === 'easy' ? 1.15 : tier === 'insane' ? 0.88 : 1),
    obstacleWidth: isMobile ? 52 : 60,
    gapMin: (isMobile ? 130 : 145) * (tier === 'easy' ? 1.10 : tier === 'insane' ? 0.88 : 1),
    gapMax: (isMobile ? 195 : 215) * (tier === 'easy' ? 1.10 : tier === 'insane' ? 0.88 : 1),
    playerX: Math.round(width * 0.28),
  };
}

function useWindowSize() {
  const getSize = () => {
    const maxW = Math.min(window.innerWidth, 520);
    const h = window.innerHeight;
    return { width: maxW, height: h };
  };
  const [size, setSize] = useState(getSize);
  useEffect(() => {
    const onResize = () => setSize(getSize());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

function useBattleSize() {
  const getSize = () => ({ width: window.innerWidth, height: window.innerHeight });
  const [size, setSize] = useState(getSize);
  useEffect(() => {
    const onResize = () => setSize(getSize());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

type FlowMode = 'MENU' | 'STARTING' | 'GOING_HOME';

type RankUpLabel = 'RANK UP!' | 'TOP 10!' | 'TOP 3!' | 'ARC CHAMPION!';

// ─── Root component ───────────────────────────────────────────────────────────

export function Game() {
  const [appMode, setAppMode] = useState<AppMode>('MENU');
  const soloSize = useWindowSize();
  const battleSize = useBattleSize();

  // ── Speed tier ──
  const [speedTier, setSpeedTier] = useState<SpeedTier>(loadSpeedTier);

  // ── Solo state ──
  const soloCfg = buildSoloConfig(soloSize.width, soloSize.height, speedTier);
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [muted, setMuted] = useState(() => {
    const pref = loadAudioPref(); audio.setMuted(pref); return pref;
  });
  const [tapCounter, setTapCounter] = useState(0);
  const [startCounter, setStartCounter] = useState(0);
  const [flowMode, setFlowMode] = useState<FlowMode>('MENU');

  // ── Player / leaderboard state ──
  const [playerId, setPlayerId] = useState<string | null>(getStoredPlayerId);
  const [playerName, setPlayerName] = useState<string | null>(getStoredPlayerName);
  const [playerRank, setPlayerRank] = useState(0);
  const [showNameEntry, setShowNameEntry] = useState(false);

  // ── Challenge state ──
  const [pendingChallenge, setPendingChallenge] = useState<Challenge | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);

  // ── Ghost toggle ──
  const [ghostEnabled, setGhostEnabled] = useState(true);
  const [ghostToggleCounter, setGhostToggleCounter] = useState(0);

  // Submit result state (for Game Over UI)
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Rank-up overlay
  const [rankUpLabel, setRankUpLabel] = useState<RankUpLabel>('RANK UP!');
  const [rankUpVisible, setRankUpVisible] = useState(false);
  const rankUpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerTap = useCallback(() => setTapCounter(n => n + 1), []);
  const triggerStart = useCallback(() => setStartCounter(n => n + 1), []);

  // Fetch player rank on mount / after name set
  useEffect(() => {
    if (!playerId) return;
    fetchPlayer(playerId)
      .then(p => setPlayerRank(p.rank))
      .catch(() => { /* server not available, ignore */ });
  }, [playerId]);

  // Detect challenge URL on mount
  useEffect(() => {
    const id = getChallengeIdFromUrl();
    if (!id) return;
    fetchChallenge(id)
      .then(ch => { if (ch) setTimeout(() => setPendingChallenge(ch), 0); })
      .catch(() => { /* ignore */ });
    clearChallengeFromUrl();
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev; audio.setMuted(next); saveAudioPref(next); return next;
    });
  }, []);

  const handleSolo = useCallback((tierOrChallenge?: SpeedTier | Challenge, challenge?: Challenge) => {
    // Overloaded: called from menu with (tier), from challenge with (undefined, challenge)
    let tier: SpeedTier | undefined;
    let ch: Challenge | undefined;
    if (typeof tierOrChallenge === 'string') {
      tier = tierOrChallenge;
    } else if (tierOrChallenge && typeof tierOrChallenge === 'object') {
      ch = tierOrChallenge;
    }
    if (challenge) ch = challenge;
    if (tier) setSpeedTier(tier);
    setAppMode('SOLO');
    setFlowMode('STARTING');
    setSubmitResult(null);
    if (ch) {
      setActiveChallenge(ch);
    } else {
      setActiveChallenge(null);
    }
    triggerStart();
  }, [triggerStart]);

  const handleAcceptChallenge = useCallback(() => {
    const ch = pendingChallenge;
    setPendingChallenge(null);
    if (ch) handleSolo(undefined, ch);
  }, [pendingChallenge, handleSolo]);

  const handleDeclineChallenge = useCallback(() => {
    setPendingChallenge(null);
  }, []);

  const handleToggleGhost = useCallback(() => {
    setGhostEnabled(prev => !prev);
    setGhostToggleCounter(n => n + 1);
  }, []);

  const handleBattle = useCallback((tier?: SpeedTier) => {
    if (tier) setSpeedTier(tier);
    setAppMode('BATTLE');
  }, []);
  const handleLeaderboard = useCallback(() => { setAppMode('LEADERBOARD'); }, []);

  const handleSoloPlayAgain = useCallback(() => {
    setFlowMode('STARTING');
    setSubmitResult(null);
    triggerStart();
  }, [triggerStart]);

  const handleSoloHome = useCallback(() => {
    setFlowMode('GOING_HOME');
    setAppMode('MENU');
    triggerStart();
  }, [triggerStart]);

  const handleBattleHome = useCallback(() => { setAppMode('MENU'); }, []);
  const handleLeaderboardBack = useCallback(() => { setAppMode('MENU'); }, []);

  const handleTap = useCallback(() => {
    setFlowMode('STARTING');
    setTapCounter(n => n + 1);
  }, []);

  const handleContainerTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    if (appMode !== 'SOLO') return;
    if (canvasState === 'PLAYING') triggerTap();
    else if (canvasState === 'READY') handleTap();
  }, [appMode, triggerTap, handleTap]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (appMode !== 'SOLO') return;
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (canvasState === 'PLAYING') triggerTap();
        else if (canvasState === 'READY') handleTap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [appMode, triggerTap, handleTap]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit score when game ends ──────────────────────────────────────────────
  const hasSubmittedThisRun = useRef(false);
  const pendingScoreRef = useRef(0);

  const canvasState = snapshot?.state ?? 'MENU';
  const score = snapshot?.score ?? 0;
  const best = snapshot?.best ?? 0;
  const isNewBest = snapshot?.isNewBest ?? false;
  const milestoneFlash = snapshot?.milestoneFlash ?? 0;
  const scoreFlash = snapshot?.scoreFlash ?? 0;
  const comboLabel = snapshot?.comboLabel ?? '';
  const comboFade = snapshot?.comboFade ?? 0;
  const envFlashVal = snapshot?.envFlash ?? 0;
  const energyFraction = snapshot?.energyFraction ?? 0;
  const arcMode = snapshot?.arcMode ?? false;
  const arcModeActivationFade = snapshot?.arcModeActivationFade ?? 0;
  const perfectFade = snapshot?.perfectFade ?? 0;
  const perfectLabel = snapshot?.perfectLabel ?? '';
  const perfectCount = snapshot?.perfectCount ?? 0;
  const ghostAlpha = snapshot?.ghostAlpha ?? 0;
  const ghostScore = snapshot?.ghostScore ?? 0;
  const ghostExists = snapshot?.ghostExists ?? false;
  const challengeCleared = snapshot?.challengeCleared ?? false;

  // Stable fire-and-forget submit function (called from event handlers / macrotasks only)
  const doSubmit = useCallback((pid: string, s: number) => {
    setSubmitLoading(true);
    submitSoloScore(pid, s)
      .then(res => {
        setSubmitResult(res);
        setPlayerRank(res.rank);
        if (res.rankImproved && res.rank > 0) {
          let label: RankUpLabel = 'RANK UP!';
          if (res.rank === 1) label = 'ARC CHAMPION!';
          else if (res.rank <= 3) label = 'TOP 3!';
          else if (res.rank <= 10) label = 'TOP 10!';
          setRankUpLabel(label);
          setRankUpVisible(true);
          if (rankUpTimer.current) clearTimeout(rankUpTimer.current);
          rankUpTimer.current = setTimeout(() => setRankUpVisible(false), 2200);
        }
      })
      .catch(() => { /* server down, silent */ })
      .finally(() => setSubmitLoading(false));
  }, []);

  // Watch for transition into GAME_OVER; all state updates fired via macrotask (setTimeout 0)
  // so they are never synchronous inside the effect body.
  const prevCanvasState = useRef('');

  useEffect(() => {
    const prev = prevCanvasState.current;
    prevCanvasState.current = canvasState;

    if (prev !== 'GAME_OVER' && canvasState === 'GAME_OVER') {
      hasSubmittedThisRun.current = false;
    }

    if (canvasState === 'GAME_OVER' && !hasSubmittedThisRun.current) {
      hasSubmittedThisRun.current = true;
      const capturedPid = playerId;
      const capturedScore = score;
      if (!capturedPid) {
        pendingScoreRef.current = capturedScore;
        setTimeout(() => setShowNameEntry(true), 0);
      } else {
        setTimeout(() => doSubmit(capturedPid, capturedScore), 0);
      }
    }
  }, [canvasState, playerId, score, doSubmit]);

  const handleNameComplete = useCallback((id: string, name: string) => {
    setPlayerId(id);
    setPlayerName(name);
    setShowNameEntry(false);
    doSubmit(id, pendingScoreRef.current);
  }, [doSubmit]);

  const isReturnToMenu = flowMode === 'GOING_HOME';
  const showMenu = appMode === 'MENU';
  const showLeaderboard = appMode === 'LEADERBOARD';
  const showSoloReady = appMode === 'SOLO' && canvasState === 'READY' && !isReturnToMenu;
  const showHUD = appMode === 'SOLO' && (canvasState === 'PLAYING' || canvasState === 'PAUSED');
  const showGameOver = appMode === 'SOLO' && canvasState === 'GAME_OVER';

  // ── Battle mode ──
  if (appMode === 'BATTLE') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#050d1a', overflow: 'hidden' }}>
        <BattleMode totalW={battleSize.width} totalH={battleSize.height} onHome={handleBattleHome} speedTier={speedTier} />
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050d1a',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: soloSize.width,
          height: soloSize.height,
          overflow: 'hidden',
          flexShrink: 0,
        }}
        onClick={handleContainerTap}
      >
        {/* Canvas always mounted */}
        <GameCanvas
          config={soloCfg}
          onSnapshot={setSnapshot}
          externalTap={tapCounter}
          externalStart={startCounter}
          externalGhostToggle={ghostToggleCounter}
          challengeTarget={activeChallenge?.challengerScore ?? 0}
          onReady={() => { /* icon loaded */ }}
        />

        <MilestoneFlash flash={milestoneFlash} envFlash={envFlashVal} />

        {/* Menu */}
        <MenuScreen
          best={best}
          muted={muted}
          onToggleMute={handleToggleMute}
          onSolo={handleSolo}
          onBattle={handleBattle}
          onLeaderboard={handleLeaderboard}
          playerName={playerName}
          playerRank={playerRank}
          visible={showMenu}
        />

        {/* Solo overlays */}
        <ReadyScreen visible={showSoloReady} />

        <HUD
          score={score}
          scoreFlash={scoreFlash}
          muted={muted}
          onToggleMute={handleToggleMute}
          onPause={() => { /* future */ }}
          visible={showHUD}
          paused={canvasState === 'PAUSED'}
          comboLabel={comboLabel}
          comboFade={comboFade}
        />

        {/* Perfect label overlay (shows near player) */}
        <PerfectLabel
          label={perfectLabel}
          fade={perfectFade}
          count={perfectCount}
          playerX={snapshot?.player.x ?? 0}
          playerY={snapshot?.player.y ?? 0}
          canvasW={soloCfg.width}
          canvasH={soloCfg.height}
          arcMode={arcMode}
        />

        {/* ARC Energy meter */}
        <EnergyMeter
          energyFraction={energyFraction}
          arcMode={arcMode}
          activationFade={arcModeActivationFade}
          visible={showHUD}
        />

        {/* Ghost compare label */}
        {showHUD && ghostExists && ghostAlpha > 0 && (
          <div style={{
            position: 'absolute',
            top: 80,
            right: 14,
            pointerEvents: 'none',
            textAlign: 'right',
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '0.10em',
              color: score > ghostScore
                ? '#34d399'
                : score < ghostScore
                  ? '#f472b6'
                  : 'rgba(186,230,253,0.55)',
              textShadow: score > ghostScore
                ? '0 0 8px rgba(52,211,153,0.7)'
                : score < ghostScore
                  ? '0 0 8px rgba(244,114,182,0.7)'
                  : 'none',
            }}>
              {score > ghostScore ? `AHEAD +${score - ghostScore}` : score < ghostScore ? `BEHIND -${ghostScore - score}` : 'TIED'}
            </div>
            <div style={{ fontSize: 8, color: 'rgba(196,181,253,0.45)', fontFamily: "'Space Grotesk', sans-serif" }}>vs GHOST</div>
          </div>
        )}

        {/* Ghost toggle button (in HUD area) */}
        {showHUD && (
          <div style={{ position: 'absolute', bottom: 56, right: 14, pointerEvents: 'auto' }}>
            <GhostToggle
              ghostEnabled={ghostEnabled}
              ghostExists={ghostExists}
              onToggle={handleToggleGhost}
            />
          </div>
        )}

        {/* Challenge HUD */}
        {showHUD && activeChallenge && (
          <div style={{ position: 'absolute', top: 14, left: 14, pointerEvents: 'none' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: challengeCleared ? '#34d399' : 'rgba(186,230,253,0.50)', fontFamily: "'Space Grotesk', sans-serif" }}>TARGET</div>
            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, fontFamily: "'Space Grotesk', sans-serif", color: challengeCleared ? '#34d399' : '#fb923c', filter: challengeCleared ? 'drop-shadow(0 0 8px rgba(52,211,153,0.7))' : 'none' }}>{activeChallenge.challengerScore}</div>
            {challengeCleared
              ? <div style={{ fontSize: 9, fontWeight: 700, color: '#34d399', letterSpacing: '0.10em', fontFamily: "'Space Grotesk', sans-serif" }}>CLEARED ✓</div>
              : <div style={{ fontSize: 9, color: 'rgba(186,230,253,0.40)', fontFamily: "'Space Grotesk', sans-serif" }}>{Math.max(0, activeChallenge.challengerScore - score + 1)} to go</div>
            }
          </div>
        )}

        <GameOverScreen
          score={score}
          best={best}
          isNewBest={isNewBest}
          visible={showGameOver}
          playerRank={submitResult?.rank ?? playerRank}
          prevRank={submitResult?.prevRank ?? 0}
          pointsToNext={submitResult?.pointsToNext ?? 0}
          aboveName={submitResult?.aboveName ?? null}
          rankImproved={submitResult?.rankImproved ?? false}
          submitLoading={submitLoading}
          onPlayAgain={handleSoloPlayAgain}
          onHome={handleSoloHome}
          onViewLeaderboard={handleLeaderboard}
          playerName={playerName ?? ''}
          challengeTarget={activeChallenge?.challengerScore ?? 0}
          challengeCleared={challengeCleared}
          challengerName={activeChallenge?.challengerName ?? ''}
          onChallengeAgain={() => { if (activeChallenge) handleSolo(activeChallenge); }}
        />

        {/* Rank-up pop */}
        <RankUpOverlay
          visible={rankUpVisible}
          prevRank={submitResult?.prevRank ?? 0}
          newRank={submitResult?.rank ?? 0}
          label={rankUpLabel}
        />

        {/* Leaderboard overlay */}
        <LeaderboardScreen
          visible={showLeaderboard}
          playerId={playerId}
          playerName={playerName}
          onBack={handleLeaderboardBack}
        />
      </div>

      {/* Name entry modal (global z-order) */}
      <NameEntry
        visible={showNameEntry}
        onComplete={handleNameComplete}
      />

      {/* Incoming challenge modal */}
      {pendingChallenge && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <ChallengeIncoming
            challenge={pendingChallenge}
            onAccept={handleAcceptChallenge}
            onDecline={handleDeclineChallenge}
          />
        </div>
      )}
    </div>
  );
}
