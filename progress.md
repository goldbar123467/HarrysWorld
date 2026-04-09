# Progress

## Game Concept
- **Name**: Harry's World
- **Engine**: Phaser 3 (2D)
- **Description**: Side-scrolling platformer where Harry, a student late to class, navigates through a school hallway — jumping over desks/chairs, collecting books & hall passes, avoiding hall monitors, and reaching the classroom before time runs out.

## Step 1: Scaffold
- **Entities**: Player (Harry), Obstacle (desk/chair), Collectible (book/hall_pass), HallMonitor (patrolling enemy)
- **Events**: PLAYER_JUMP, PLAYER_DIED, PLAYER_LANDED, SCORE_CHANGED, ITEM_COLLECTED, GAME_START, GAME_OVER, GAME_RESTART, SPECTACLE_ENTRANCE, SPECTACLE_ACTION, SPECTACLE_HIT, SPECTACLE_COMBO, SPECTACLE_STREAK, SPECTACLE_NEAR_MISS, TIME_UPDATE
- **Constants keys**: GAME, PLAYER, OBSTACLE, COLLECTIBLE, HALL_MONITOR, COLORS, UI, SAFE_ZONE, TOUCH, PLATFORM_LAYOUTS, OBSTACLE_LAYOUTS, COLLECTIBLE_LAYOUTS, MONITOR_LAYOUTS
- **Scoring system**: Books = +10 pts, Hall passes = +25 pts, combo system for consecutive collects
- **Fail condition**: Hit a hall monitor, time runs out (60s), or fall off world
- **Win condition**: Reach the classroom door (ROOM 101) at the far right
- **Input scheme**: Arrow keys / WASD + Space (keyboard), touch buttons for left/right/jump (mobile)

## Step 1.5: Assets
- **Palette**: 22-color school-themed palette defined in `src/sprites/palette.js` (indices 0-21: transparent, outline, shadow, red, yellow, skin, blue, light blue, white, purple, green, dark gray, brown, desk brown, floor tile, locker gray, book blue, pages cream, monitor red, door brown, door window, door handle gold)
- **Sprites created**:
  - Harry (player): 32x48 grid, scale 4 (~128x192px), 2-frame spritesheet (idle + walk) — `src/sprites/player.js`
  - Hall Monitor (enemy): 16x24 grid, scale 3 (~48x72px), 2-frame spritesheet (idle + walk) — `src/sprites/enemies.js`
  - Desk obstacle: 16x12, scale 3 (~48x36px) — `src/sprites/obstacles.js`
  - Chair obstacle: 12x12, scale 3 (~36x36px) — `src/sprites/obstacles.js`
  - Book collectible: 12x12, scale 3 (~36x36px) — `src/sprites/items.js`
  - Hall Pass collectible: 12x8, scale 3 (~36x24px) — `src/sprites/items.js`
  - Classroom Door: 24x40, scale 3 (~72x120px) — `src/sprites/door.js`
  - Ground tiles: 16x16, scale 3 (~48x48px), 3 variants — `src/sprites/tiles.js`
  - Platform tile: 16x8, scale 3 (~48x24px) — `src/sprites/tiles.js`
  - Wall tile: 16x16, scale 3 (~48x48px) — `src/sprites/tiles.js`
  - Locker decoration: 8x16, scale 3 (~24x48px) — `src/sprites/tiles.js`
- **Rendering**: `src/core/PixelRenderer.js` — renderPixelArt() for static sprites, renderSpriteSheet() for animated sprites
- **Animations**: harry_walk_anim (6fps, 2 frames), monitor_walk_anim (4fps, 2 frames)
- **Background**: Wall tiles tiled across background (depth -10), locker decorations at regular intervals (depth -5)
- **Dimension note**: Sprite pixel sizes are fixed grid sizes rendered at scale factor; display sizes are controlled by Phaser setDisplaySize() in game entities using Constants.js values

## Step 2: Audio System
- **AudioManager**: `src/core/AudioManager.js` — Web Audio API procedural audio
- **BGM**: Chord progression loop (C-F-G-C) using triangle oscillators + bass
- **SFX**: Jump (square, rising), Land (sine, falling), Collect (two-tone square), Combo (rising arpeggio), Death (descending sawtooth), Win (victory fanfare), Menu click, Time warning, Powerup (rising sparkle)
- **Mute support**: EventBus `audio:mute` event toggles master gain

## Step 3: Level System
- **LevelData.js**: 5 levels with increasing difficulty
  - Level 1: "The Hallway" — 4000px, 65s, 2 monitors, 1 powerup
  - Level 2: "The Science Wing" — 5000px, 60s, 3 monitors, 2 powerups
  - Level 3: "The Gym Corridor" — 5500px, 55s, 4 monitors, 3 powerups
  - Level 4: "The Library" — 6000px, 50s, 5 monitors, 2 powerups
  - Level 5: "The Principal's Floor" — 7000px, 45s, 6 monitors, 3 powerups
- **Powerups**: Speed boost (1.5x, 5s), Shield (absorb 1 hit, 8s), Time (+10s)
- **Level progression**: Unlock next on win, localStorage persistence
- **Level select**: Title screen level button cycles through unlocked levels

## Step 4: Polish Features Added
- Parallax elements (floating dust motes, ceiling fluorescent lights)
- Tutorial overlay on first play (level 1)
- Level name banner on scene start
- Pause scene (ESC key)
- Shield visual effect (pulsing circle)
- Powerup popup text
- Screen flash on monitor hit

## Decisions / Known Issues
- All textures generated procedurally (no external assets)
- Level is ~5000px wide with 10 platforms, 6 obstacles, 12 collectibles, 4 hall monitors
- Player is 12% of canvas width for mobile visibility
- Collectibles are 7-8% of canvas width minimum

---

## Audit Status (Queen Agent — Score: 52/100)

Full audit in `AUDIT_REPORT.md`. Tracking fix status here:

### Already Fixed
- [x] #4 — pixelArt: true in Phaser config
- [x] #11 — setCollideWorldBounds(true) 
- [x] #3 — Combo font uses COMBO_FONT_SIZE
- [x] #31 — Audio system implemented (AudioManager.js)

### Remaining — Phase 1 (Quick Wins)
- [x] #1 — Player death visual feedback (HIGH, Priority 4.50) — FIXED
- [x] #2 — Combo score multiplier (HIGH, Priority 4.00) — FIXED
- [ ] #5 — Jump bunny-hop fix / rising-edge detection (HIGH, Priority 3.50)
- [ ] #10 — Obstacle origin/body mismatch (MEDIUM, Priority 3.00)
- [x] #13 — PLAYER_DIED fires every frame (MEDIUM, Priority 4.00) — FIXED
- [x] #22 — Camera deadzone (MEDIUM, Priority 5.00) — FIXED
- [ ] #25 — Tab switch pause timer (MEDIUM, Priority 2.50)

### Remaining — Phase 2 (Important)
- [ ] #8 — Coyote time (HIGH, Priority 3.50)
- [ ] #9 — Jump input buffering (HIGH, Priority 3.00)
- [ ] #7 — End zone empty 80-100% (HIGH, Priority 4.00)
- [ ] #6 — Background performance / TileSprite (HIGH, Priority 2.67)
- [ ] #12 — One-way platforms (HIGH, Priority 2.33)
- [ ] #26 — Fast-fall / asymmetric jump (MEDIUM, Priority 2.50)
- [ ] #27 — Rapid restart race condition (MEDIUM, Priority 2.00)
- [ ] #28 — Enemy density escalation (MEDIUM, Priority 2.00)

### Remaining — Phase 3 (Strategic)
- [ ] #29 — Tile border grid lines (MEDIUM, Priority 1.25)
- [ ] #20 — More walk frames (MEDIUM, Priority 1.00)
- [ ] #24 — Movement acceleration/deceleration (MEDIUM, Priority 1.67)
- [ ] #35 — Invincibility frames / stomp mechanic (MEDIUM, Priority 1.25)
- [ ] #14 — Resize handler for constants (MEDIUM, Priority 0.83)
- [ ] #34 — Parallax scrolling [PARTIAL — dust motes + lights done]
- [ ] #30 — Pixel font instead of Arial (LOW, Priority 1.00)

### Dead Code / Minor
- [ ] #16 — Duplicate ground texture in BootScene
- [ ] #17 — Particle textures regenerated each session (mitigated)
- [ ] #18 — GAME_RESTART event with no listener
- [ ] #19 — Unused reset/deactivate methods
- [ ] #21 — Harry sprite non-integer scale 2.8
- [ ] #23 — Collectible bobbing updates static body each frame
- [ ] #32 — GameOverScene.shutdown() empty
- [ ] #33 — HUDScene launched without guard

---

## Improvement Log

Track each improvement cycle here. Format:

```
### Cycle N — YYYY-MM-DD
- **Finding**: #N — Description  
- **Skill Used**: /skill-name or direct fix
- **Changes**: files modified
- **Status**: DONE
```

### Cycle 1 — 2026-04-09
- **Finding**: #1 — Player death has zero visual feedback
- **Skill Used**: /improve-game (direct fix)
- **Changes**: `src/entities/Player.js` — Added `_isDead` guard, flash/blink death animation (5 flashes), red tint, rise-and-spin-off-screen death fall. `src/scenes/GameScene.js` — Added `_emitDeathParticles()` with 12 red sparkle particles on death, delayed scene transition to wait for death anim. `src/core/Constants.js` — Added DEATH_FLASH_COUNT, DEATH_FLASH_DURATION, DEATH_RISE_VELOCITY, DEATH_SPIN_SPEED, DEATH_ANIM_DURATION, DEATH_PARTICLE_COUNT, DEATH_PARTICLE_SPEED, DEATH_PARTICLE_LIFESPAN.
- **Status**: DONE

### Cycle 2 — 2026-04-09
- **Finding**: #13 — PLAYER_DIED fires every frame off-screen
- **Skill Used**: /improve-game (direct fix)
- **Changes**: `src/entities/Player.js` — Added `_isDead` flag, guarded both the fall-off-world emit and `die()` to fire only once.
- **Status**: DONE

### Cycle 3 — 2026-04-09
- **Finding**: #2 — Combo system has no score multiplier
- **Skill Used**: /improve-game (direct fix)
- **Changes**: `src/scenes/GameScene.js` — Score now multiplied by combo count (`value * combo`). Popup shows multiplied value with combo indicator (e.g. "+50 (2x)"). Color scales with combo level: gold (1x), orange (3x+), red (5x+). Higher combo = larger popup font.
- **Status**: DONE

### Cycle 4 — 2026-04-09
- **Finding**: #22 — No camera deadzone
- **Skill Used**: /improve-game (direct fix)
- **Changes**: `src/scenes/GameScene.js` — Added `setDeadzone(WIDTH * 0.15, HEIGHT * 0.25)` after `startFollow`. Camera now ignores small player movements, eliminating jitter.
- **Status**: DONE
