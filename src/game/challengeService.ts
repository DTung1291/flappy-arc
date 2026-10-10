// ─── Challenge-a-Friend service ───────────────────────────────────────────────
//
// Creates challenge records backed by the existing leaderboard server.
// Challenges are stored server-side (GET /challenge/:id, POST /challenge).
// Falls back to URL-encoded data if the server is unavailable.

export interface Challenge {
  id: string;
  challengerName: string;
  challengerScore: number;
  createdAt: number;
}

export interface ChallengeResult {
  success: boolean;
  challenge?: Challenge;
  error?: string;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function createChallenge(
  challengerName: string,
  score: number,
): Promise<{ id: string; url: string }> {
  try {
    const res = await fetch('/api/challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengerName, score }),
    });
    if (!res.ok) throw new Error('server error');
    const data = await res.json() as { id: string };
    const url = `${window.location.origin}${window.location.pathname}?challenge=${data.id}`;
    return { id: data.id, url };
  } catch {
    // Fallback: encode challenge in URL
    const fallbackId = btoa(JSON.stringify({ n: challengerName, s: score, t: Date.now() }))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const url = `${window.location.origin}${window.location.pathname}?challenge=${fallbackId}`;
    return { id: fallbackId, url };
  }
}

export async function fetchChallenge(id: string): Promise<Challenge | null> {
  // Try server first
  try {
    const res = await fetch(`/api/challenge/${encodeURIComponent(id)}`);
    if (res.ok) {
      return await res.json() as Challenge;
    }
  } catch { /* fall through */ }

  // Fallback: decode from id
  try {
    const padded = id.replace(/-/g, '+').replace(/_/g, '/');
    const pad = padded.length % 4;
    const b64 = pad ? padded + '='.repeat(4 - pad) : padded;
    const obj = JSON.parse(atob(b64)) as { n: string; s: number; t: number };
    return {
      id,
      challengerName: obj.n,
      challengerScore: obj.s,
      createdAt: obj.t,
    };
  } catch { return null; }
}

// ─── URL helpers ─────────────────────────────────────────────────────────────

export function getChallengeIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('challenge');
}

export function clearChallengeFromUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('challenge');
  window.history.replaceState({}, '', url.toString());
}
