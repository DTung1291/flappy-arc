# 🎮 Flappy ARC

A premium arcade game built on the Arc ecosystem — Flappy Bird mechanics reimagined as a fast, colorful, onchain-inspired experience.

**[▶ Play Live](https://dtung0102-app-b771366c-f25f-4fdc-8886-ab0b92dc0376.static.hf.space)**

---

## Features

### Core Gameplay
- One-tap endless flying with responsive arcade physics
- 60 FPS game loop via `requestAnimationFrame`
- Gravity, jump force, and obstacle collision fully simulated
- Difficulty scales automatically every 10 points
- **4 Speed Tiers:** 🐢 Easy · 🚀 Normal · ⚡ Fast · 💀 Insane

### Solo Mode
- Official Arc icon as the player (no birds, no mascots)
- Bright futuristic background with parallax scrolling and animated network nodes
- Arc-inspired geometric gates replace green pipes
- Score-zone environments that shift color as you progress (sky blue → aqua → purple → electric city → Arc energy)

### 2 Player Battle Mode
- Split-screen on one device — P1 left/top, P2 right/bottom
- Shared identical obstacle sequence for fair competition
- Simultaneous multi-touch support
- 3-2-1-GO countdown before each round
- Winner detection with tie-breaking by score
- Fast rematch flow

### Perfect + Combo System
- **PERFECT!** detected when passing near the center of a gap
- Consecutive perfects build a combo: NICE! → GREAT! → ARC FLOW! → UNSTOPPABLE!
- Visual and audio feedback for each milestone

### ARC Energy Meter
- Charges from perfect gates
- Reaches 100 → activates **ARC MODE** (5 seconds of enhanced visuals and stronger effects)
- Smooth animated progress bar below the score

### Ghost Race
- Records your personal best run locally
- Replays as a semi-transparent ghost on subsequent runs
- Shows AHEAD / BEHIND / TIED comparison in real time
- Toggle ghost on/off during gameplay
- New personal best automatically replaces the ghost

### Challenge a Friend
- Create a shareable challenge link from the Game Over screen
- Challenge stores your score; recipients see the target during gameplay
- CHALLENGE CLEARED! / SO CLOSE! result screens
- Falls back to URL-encoded data if the backend is unavailable (works fully offline)

### Global Leaderboard
- Solo, Weekly, and Battle tabs
- Podium-style Top 3 with gold/silver/bronze treatment and animated effects
- Your rank highlighted with a "YOU" badge
- "X points to pass #N" motivational message
- RANK UP! / TOP 10! / ARC CHAMPION! overlays on improvement
- Backed by a Bun HTTP server with rate limiting and score validation

---

## Controls

| Action | Desktop | Mobile |
|---|---|---|
| Jump (Solo) | Space / Click | Tap anywhere |
| Jump P1 (Battle) | W / Left click | Tap left/top half |
| Jump P2 (Battle) | ↑ / Enter / Right click | Tap right/bottom half |

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v3 |
| Game loop | `requestAnimationFrame` (canvas 2D) |
| Audio | Web Audio API (synthesised, no external assets) |
| Backend | Bun HTTP server (leaderboard API) |
| Persistence | `localStorage` (scores, ghost, settings) + JSON file (server) |
| Package manager | Bun |

---

## Project Structure

```
src/
├── components/          # React UI layers (menus, HUD, overlays)
│   ├── Game.tsx         # Root orchestrator
│   ├── GameCanvas.tsx   # Canvas + game loop wiring
│   ├── BattleMode.tsx   # 2P battle orchestrator
│   ├── BattleCanvas.tsx # Battle canvas + shared loop
│   ├── MenuScreen.tsx   # Home screen + speed tier selector
│   ├── HUD.tsx          # In-game score / combo / ghost UI
│   ├── GameOverScreen.tsx
│   ├── LeaderboardScreen.tsx
│   └── ...              # Countdown, result, challenge, energy meter, etc.
├── game/                # Pure game logic (no React)
│   ├── gameLoop.ts      # State machine + tick
│   ├── battleLoop.ts    # Shared 2P loop
│   ├── renderer.ts      # Canvas draw calls
│   ├── battleRenderer.ts
│   ├── physics.ts       # Gravity + jump
│   ├── obstacles.ts     # Spawn + movement
│   ├── collision.ts     # AABB + score detection
│   ├── particles.ts     # Particle system
│   ├── background.ts    # Parallax + animated nodes
│   ├── palette.ts       # Score-zone color system
│   ├── audio.ts         # Web Audio synth
│   ├── perfectCombo.ts  # Perfect gate + combo tracker
│   ├── arcEnergy.ts     # ARC MODE energy meter
│   ├── ghostRace.ts     # Ghost recording + playback
│   ├── challengeService.ts
│   ├── leaderboard.ts   # API client + offline fallback
│   └── types.ts
├── assets/
│   └── arc-icon.png     # Official Arc icon (player character)
server/
└── index.ts             # Bun leaderboard API server
```

---

## Running Locally

```bash
# Install dependencies
bun install

# Start the leaderboard backend (optional — game works without it)
bun run server/index.ts &

# Start the dev server
bun run dev
```

Open `http://localhost:5173`.

The leaderboard API runs on port `3001`. Vite proxies `/api/*` to it automatically in dev. If the server is unreachable, the game falls back to localStorage-only mode.

---

## Building for Production

```bash
bun run build
NODE_ENV=production bun run server/index.ts
```

The production server serves the Vite build from `dist/` on port `7860` and handles `/api/*` routes on the same port.

---

## Design Principles

- **Arc identity first** — official Arc icon only, no alternative mascots
- **No dark crypto dashboard** — bright futuristic palette (sky blue, cyan, electric blue, violet, magenta)
- **Gameplay readability** — background effects stay subtle so obstacles are always clear
- **Mobile-first** — multi-touch, no accidental scroll, immediate tap response
- **Offline-capable** — all gameplay features work with zero network access

---

## License

MIT
