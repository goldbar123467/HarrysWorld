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

## Decisions / Known Issues
- All textures generated procedurally (no external assets)
- Level is ~5000px wide with 10 platforms, 6 obstacles, 12 collectibles, 4 hall monitors
- Player is 12% of canvas width for mobile visibility
- Collectibles are 7-8% of canvas width minimum
