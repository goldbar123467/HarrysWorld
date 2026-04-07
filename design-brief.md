# Harry's World — Design Brief

## Game Concept
A 2D side-scrolling platformer where "Harry," a student who is late to class, must navigate through a school environment. He runs from left to right through hallways, jumping over obstacles, collecting items, avoiding hall monitors, and reaching his classroom (Room 101) before time runs out.

## Core Mechanics
- **Movement**: Harry runs left/right and jumps. Variable-height jump (hold for higher).
- **Scrolling**: The camera follows Harry horizontally through a level roughly 5000 design-pixels wide.
- **Timer**: A 60-second countdown. If it hits zero, the game ends in a loss.
- **Scoring**: Collect books (+10 pts) and hall passes (+25 pts). Consecutive pickups within 2 seconds build a combo.
- **Obstacles**: Desks and chairs placed on the ground that Harry must jump over.
- **Enemies**: Hall monitors patrol back and forth on the ground or on platforms. Contact with one ends the game.
- **Platforms**: Elevated surfaces (shelves, tables) at varying heights for parkour-style traversal.

## Win / Lose Conditions
- **Win**: Reach the classroom door (Room 101) at the far-right end of the level before time expires.
- **Lose**: Timer reaches zero, Harry falls off the world, or Harry touches a hall monitor.

## Entity Interactions
| Entity | Interaction with Harry |
|---|---|
| Ground / Platforms | Solid collision — Harry stands and runs on them |
| Desks / Chairs | Solid collision — Harry must jump over |
| Books | Overlap — collected on touch, +10 score |
| Hall Passes | Overlap — collected on touch, +25 score |
| Hall Monitors | Overlap — instant game over |
| Classroom Door | Overlap — triggers win |

## Expression Map for Harry
| State | Visual Cue |
|---|---|
| Running | Alternating walk frames (legs shift left/right) |
| Jumping | Default standing texture, airborne |
| Idle | Default standing texture on ground |
| Collecting | Score flash text (+10/+25) pops above collected item |
| Dying (monitor) | Harry disappears, game transitions to Game Over |
| Winning | Reaches door, game transitions to Game Over with "MADE IT!" |

## Controls
- **Keyboard**: Arrow keys or WASD for movement, Space or Up/W to jump
- **Touch**: On-screen directional buttons (left, right) and a jump button; semi-transparent, positioned at screen bottom
