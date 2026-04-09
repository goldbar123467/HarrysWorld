# Harry's World — Claude Code Project Guide

## Project Overview

**Harry's World** is a 2D side-scrolling Phaser 3 platformer where Harry, a student late to class, runs through school hallways — jumping obstacles, collecting books/hall passes, avoiding hall monitors, and reaching Room 101 before time runs out.

- **Engine**: Phaser 3.80+ (Arcade Physics)
- **Build**: Vite 5
- **Tests**: Playwright e2e
- **Assets**: 100% procedural pixel art (no external files)
- **Audio**: Web Audio API procedural SFX + BGM
- **Levels**: 5 levels with increasing difficulty

## Architecture

```
src/
  main.js              — Phaser config, game boot, QA hooks (window.__GAME__ etc.)
  core/
    Constants.js       — All dimensions, speeds, colors, layouts (DPR-aware)
    EventBus.js        — Singleton Phaser EventEmitter for cross-scene comms
    GameState.js       — Centralized mutable state (score, combo, level, powerups)
    LevelData.js       — 5 level configs (platforms, obstacles, collectibles, monitors, powerups)
    AudioManager.js    — Web Audio API procedural SFX + BGM
    PixelRenderer.js   — renderPixelArt() / renderSpriteSheet() from palette-indexed arrays
  entities/
    Player.js          — Harry sprite, movement, jump physics, squash/stretch
    Obstacle.js        — Static desk/chair obstacles
    Collectible.js     — Books/hall passes with bobbing animation
    HallMonitor.js     — Patrolling enemy with walk animation
  scenes/
    BootScene.js       — Generates all textures from pixel data, creates animations
    TitleScene.js      — Animated title screen with level select
    GameScene.js       — Main gameplay (820 lines) — level building, collisions, powerups, particles
    HUDScene.js        — Overlay HUD (score, timer, combo)
    GameOverScene.js   — Win/lose screen with level progression
    PauseScene.js      — Pause overlay
  sprites/
    palette.js         — 22-color school-themed palette
    player.js          — Harry pixel data (32x48, 2 frames)
    enemies.js         — Hall monitor pixel data (16x24, 2 frames)
    obstacles.js       — Desk/chair pixel data
    items.js           — Book/hall pass pixel data
    door.js            — Classroom door pixel data
    tiles.js           — Ground (3 variants), platform, wall, locker pixel data
```

## Key Patterns

- **Event-driven**: All cross-scene communication via `EventBus.js` singleton
- **Centralized state**: `GameState.js` tracks score, combo, level, powerup flags
- **DPR-aware scaling**: All dimensions computed from `Constants.js` using `PX` multiplier
- **Procedural textures**: `PixelRenderer.js` converts palette-indexed 2D arrays to Phaser textures
- **Scene lifecycle**: BootScene -> TitleScene -> GameScene + HUDScene -> GameOverScene

## Running

```bash
npm run dev          # Start dev server on port 3000
npm run build        # Production build
npm run test         # Playwright e2e tests
npm run test:headed  # Playwright with browser visible
```

## Current Health: 52/100 (from Queen Agent Audit)

See `AUDIT_REPORT.md` for the full 35-finding audit. Key issues by priority:

### Critical Fixes Needed (Phase 1 — Quick Wins)
1. Player death has zero visual feedback (Finding #1) — HIGH
2. Combo system has no score multiplier (Finding #2) — HIGH  
3. Jump re-triggers while key held / bunny-hop (Finding #5) — HIGH
4. Obstacle origin/body mismatch (Finding #10) — MEDIUM
5. PLAYER_DIED fires every frame off-screen (Finding #13) — MEDIUM
6. No camera deadzone (Finding #22) — MEDIUM
7. Tab switch doesn't pause timer (Finding #25) — MEDIUM

### Already Fixed (from audit)
- pixelArt: true in Phaser config (#4)
- setCollideWorldBounds(true) (#11)
- Combo font uses correct COMBO_FONT_SIZE (#3)

### Phase 2 — Important Improvements
- Coyote time (#8), Jump buffering (#9)
- End zone has no enemies 80-100% (#7)
- Background performance: 500-2000+ image objects (#6)
- One-way platforms (#12), Fast-fall (#26)
- Difficulty escalation (#28)

### Phase 3 — Strategic
- Tile border grid lines (#29)
- More walk frames (#20)
- Movement acceleration/deceleration (#24)
- Invincibility frames / stomp mechanic (#35)
- Parallax scrolling (partially done — dust motes + ceiling lights exist)

---

## Improvement Loop System

When the user says **"run improvements"**, **"improve loop"**, or **"improve"**, execute the following closed-loop improvement cycle. Each cycle picks the highest-impact unfixed issue from the audit, implements it, verifies it, and commits.

### How It Works

The improvement loop runs these phases in order:

#### Phase 1: ASSESS
- Read `AUDIT_REPORT.md` and `progress.md`
- Identify what has been fixed vs what remains
- Pick the highest-priority unfixed finding (by Priority score = Impact / Effort)
- If all audit items are done, use `/review-game` to find new improvements

#### Phase 2: IMPLEMENT  
Choose the right skill based on what needs fixing:
- **Bug fixes / gameplay mechanics** → Direct code changes (coyote time, jump buffering, death animation, combo multiplier, etc.)
- **Visual polish / design** → `/design-game` — backgrounds, particles, animations, UI
- **Audio improvements** → `/add-audio` — SFX, BGM, mixing
- **Sprite/asset quality** → `/add-assets` — pixel art, animation frames
- **New features** → `/add-feature` — new gameplay mechanics
- **Architecture** → Direct refactoring following patterns in `game-architecture`

#### Phase 3: VERIFY
- Run `npm run dev` and check the game loads
- Run `npm run test` if tests exist for the changed area
- Use `/qa-game` if the change affects gameplay flow
- Visually inspect via dev server if design changes

#### Phase 4: RECORD
- Update `progress.md` with what was changed
- Mark the finding as FIXED in the progress tracker
- Commit with a descriptive message: `improve: [finding #N] description`
- Push to the current branch

#### Phase 5: LOOP or STOP
- If user said "run improvements" → do 3-5 cycles then report what was done
- If user said "improve loop" → keep going until told to stop
- If user said "improve" → do 1 cycle

### Improvement Priority Queue

Track fixes in `progress.md` under "## Improvement Log". Each entry:
```
### Cycle N — [Date]
- **Finding**: #N — Description
- **Skill Used**: /design-game | /add-audio | direct fix | etc.
- **Changes**: List of files modified
- **Status**: DONE
```

### Available Skills Reference

| Skill | Use When |
|-------|----------|
| `/improve-game` | General improvements — analyzes and implements highest-impact change |
| `/review-game` | Code review — finds new issues after audit items are resolved |
| `/design-game` | Visual polish — backgrounds, particles, animations, UI/UX |
| `/add-audio` | Sound — SFX, BGM, audio mixing |
| `/add-assets` | Sprites — pixel art characters, items, animation frames |
| `/add-feature` | New gameplay — mechanics, powerups, systems |
| `/qa-game` | Testing — Playwright tests, visual regression |
| `/phaser` | Phaser-specific patterns and implementation |
| `/game-architecture` | Architecture decisions and refactoring |

### Trigger Words

| User Says | Action |
|-----------|--------|
| "run improvements" | Run 3-5 improvement cycles, then summarize |
| "improve loop" | Continuous improvement until stopped |
| "improve" | Single improvement cycle |
| "improve [topic]" | Single cycle focused on the specific topic |
| "improve audio" | Focus on audio using /add-audio |
| "improve visuals" | Focus on visual polish using /design-game |
| "improve sprites" | Focus on sprite quality using /add-assets |
| "improve gameplay" | Focus on gameplay feel and mechanics |
| "review and improve" | Run /review-game first, then fix top finding |

---

## Git Workflow

- **Main branch**: `main` — stable, mergeable
- **Feature branches**: `claude/*` — improvement work happens here
- Always commit after each improvement cycle
- User merges to main when ready via PR

## Testing

- Playwright e2e tests in `tests/e2e/game.spec.js`
- QA scripts in `scripts/` (debug, screenshot, full-qa, test-flow, test-gameover)
- Game exposes `window.__GAME__`, `window.__GAME_STATE__`, `window.__EVENT_BUS__` for test hooks
- `window.render_game_to_text()` returns JSON game state for Playwright assertions
