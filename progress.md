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

## Decisions / Known Issues
- All textures generated procedurally (no external assets)
- Level is ~5000px wide with 10 platforms, 6 obstacles, 12 collectibles, 4 hall monitors
- Player is 12% of canvas width for mobile visibility
- Collectibles are 7-8% of canvas width minimum
