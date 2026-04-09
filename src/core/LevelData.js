// LevelData.js — Level configurations with increasing difficulty

export const LEVELS = [
  // Level 1: Tutorial — Easy
  {
    name: 'The Hallway',
    timeLimit: 65,
    levelWidth: 4000,
    theme: {
      wallColor: 0xE8E0D4,      // warm beige
      wallAccent: 0xD4C5A9,     // darker beige for wainscoting
      lockerColors: [0x4A90D9, 0x5BA0E9], // blue lockers
      trimColor: 0x8B7355,       // wood trim
      ceilingColor: 0xF5F5F0,
    },
    platforms: [
      { x: 0.10, y: 0.70, w: 180 },
      { x: 0.20, y: 0.58, w: 150 },
      { x: 0.35, y: 0.65, w: 160 },
      { x: 0.50, y: 0.55, w: 140 },
      { x: 0.65, y: 0.62, w: 150 },
      { x: 0.80, y: 0.68, w: 140 },
    ],
    obstacles: [
      { x: 0.15, type: 'desk' },
      { x: 0.35, type: 'chair' },
      { x: 0.55, type: 'desk' },
      { x: 0.75, type: 'chair' },
    ],
    collectibles: [
      { x: 0.08, y: 0.65, type: 'book' },
      { x: 0.18, y: 0.52, type: 'book' },
      { x: 0.28, y: 0.60, type: 'pass' },
      { x: 0.40, y: 0.50, type: 'book' },
      { x: 0.52, y: 0.48, type: 'book' },
      { x: 0.62, y: 0.55, type: 'pass' },
      { x: 0.72, y: 0.60, type: 'book' },
      { x: 0.85, y: 0.55, type: 'book' },
    ],
    monitors: [
      { x: 0.30, onGround: true },
      { x: 0.60, onGround: true },
    ],
    powerups: [
      { x: 0.45, y: 0.48, type: 'speed' },
    ],
    movingPlatforms: [],
    paperAirplanes: [],
    checkpoints: [0.50],
    starThresholds: [40, 80, 130], // 1-star, 2-star, 3-star score
  },

  // Level 2: Picking Up Speed
  {
    name: 'The Science Wing',
    timeLimit: 60,
    levelWidth: 5000,
    theme: {
      wallColor: 0xE0E8E4,      // cool green-gray
      wallAccent: 0xC0D0C4,
      lockerColors: [0x4CAF50, 0x66BB6A], // green lockers
      trimColor: 0x607D8B,
      ceilingColor: 0xF0F5F0,
    },
    platforms: [
      { x: 0.08, y: 0.68, w: 160 },
      { x: 0.15, y: 0.55, w: 120 },
      { x: 0.25, y: 0.62, w: 140 },
      { x: 0.35, y: 0.50, w: 130 },
      { x: 0.45, y: 0.65, w: 150 },
      { x: 0.55, y: 0.52, w: 120 },
      { x: 0.65, y: 0.60, w: 140 },
      { x: 0.75, y: 0.48, w: 130 },
      { x: 0.85, y: 0.58, w: 120 },
    ],
    obstacles: [
      { x: 0.10, type: 'desk' },
      { x: 0.22, type: 'chair' },
      { x: 0.38, type: 'desk' },
      { x: 0.50, type: 'desk' },
      { x: 0.68, type: 'chair' },
      { x: 0.80, type: 'desk' },
    ],
    collectibles: [
      { x: 0.06, y: 0.65, type: 'book' },
      { x: 0.12, y: 0.50, type: 'pass' },
      { x: 0.20, y: 0.58, type: 'book' },
      { x: 0.30, y: 0.45, type: 'book' },
      { x: 0.40, y: 0.55, type: 'pass' },
      { x: 0.48, y: 0.48, type: 'book' },
      { x: 0.56, y: 0.60, type: 'book' },
      { x: 0.64, y: 0.42, type: 'pass' },
      { x: 0.72, y: 0.55, type: 'book' },
      { x: 0.82, y: 0.50, type: 'book' },
    ],
    monitors: [
      { x: 0.20, onGround: true },
      { x: 0.40, onGround: false, platformIndex: 3 },
      { x: 0.65, onGround: true },
    ],
    powerups: [
      { x: 0.35, y: 0.44, type: 'time' },
      { x: 0.70, y: 0.52, type: 'shield' },
    ],
    movingPlatforms: [],
    paperAirplanes: [],
    checkpoints: [0.40, 0.70],
    starThresholds: [60, 120, 200],
  },

  // Level 3: The Gauntlet
  {
    name: 'The Gym Corridor',
    timeLimit: 55,
    levelWidth: 5500,
    theme: {
      wallColor: 0xE8DCD0,      // warm tan
      wallAccent: 0xD4C0A8,
      lockerColors: [0xE65100, 0xF4511E], // orange lockers
      trimColor: 0x795548,
      ceilingColor: 0xFFF8E1,
    },
    platforms: [
      { x: 0.06, y: 0.70, w: 140 },
      { x: 0.14, y: 0.55, w: 110 },
      { x: 0.22, y: 0.65, w: 130 },
      { x: 0.30, y: 0.48, w: 120 },
      { x: 0.38, y: 0.60, w: 100 },
      { x: 0.46, y: 0.52, w: 130 },
      { x: 0.54, y: 0.68, w: 110 },
      { x: 0.62, y: 0.45, w: 120 },
      { x: 0.72, y: 0.58, w: 140 },
      { x: 0.80, y: 0.50, w: 110 },
      { x: 0.88, y: 0.62, w: 100 },
    ],
    obstacles: [
      { x: 0.08, type: 'desk' },
      { x: 0.18, type: 'chair' },
      { x: 0.28, type: 'desk' },
      { x: 0.42, type: 'chair' },
      { x: 0.52, type: 'desk' },
      { x: 0.62, type: 'desk' },
      { x: 0.74, type: 'chair' },
      { x: 0.84, type: 'desk' },
    ],
    collectibles: [
      { x: 0.05, y: 0.65, type: 'book' },
      { x: 0.12, y: 0.50, type: 'book' },
      { x: 0.20, y: 0.58, type: 'pass' },
      { x: 0.28, y: 0.42, type: 'book' },
      { x: 0.36, y: 0.55, type: 'book' },
      { x: 0.44, y: 0.46, type: 'pass' },
      { x: 0.52, y: 0.62, type: 'book' },
      { x: 0.60, y: 0.40, type: 'pass' },
      { x: 0.68, y: 0.52, type: 'book' },
      { x: 0.76, y: 0.45, type: 'book' },
      { x: 0.84, y: 0.55, type: 'pass' },
      { x: 0.92, y: 0.60, type: 'book' },
    ],
    monitors: [
      { x: 0.15, onGround: true },
      { x: 0.35, onGround: false, platformIndex: 3 },
      { x: 0.55, onGround: true },
      { x: 0.75, onGround: false, platformIndex: 9 },
    ],
    powerups: [
      { x: 0.25, y: 0.40, type: 'speed' },
      { x: 0.50, y: 0.45, type: 'shield' },
      { x: 0.78, y: 0.42, type: 'time' },
    ],
    movingPlatforms: [
      { x: 0.42, y: 0.55, w: 110, rangeX: 0.08, speed: 0.4 },
    ],
    paperAirplanes: [
      { x: 0.40, y: 0.30, amplitude: 30, speed: 100, range: 250 },
    ],
    checkpoints: [0.35, 0.65],
    starThresholds: [80, 160, 260],
  },

  // Level 4: Rush Hour
  {
    name: 'The Library',
    timeLimit: 50,
    levelWidth: 6000,
    theme: {
      wallColor: 0xDCD0E8,      // soft purple
      wallAccent: 0xC0B0D4,
      lockerColors: [0x7B1FA2, 0x9C27B0], // purple lockers
      trimColor: 0x5D4037,
      ceilingColor: 0xF3E5F5,
    },
    platforms: [
      { x: 0.05, y: 0.72, w: 120 },
      { x: 0.12, y: 0.58, w: 100 },
      { x: 0.19, y: 0.48, w: 110 },
      { x: 0.27, y: 0.65, w: 130 },
      { x: 0.34, y: 0.52, w: 100 },
      { x: 0.42, y: 0.42, w: 120 },
      { x: 0.50, y: 0.60, w: 110 },
      { x: 0.58, y: 0.50, w: 100 },
      { x: 0.66, y: 0.68, w: 120 },
      { x: 0.74, y: 0.45, w: 110 },
      { x: 0.82, y: 0.55, w: 100 },
      { x: 0.90, y: 0.62, w: 90 },
    ],
    obstacles: [
      { x: 0.07, type: 'desk' },
      { x: 0.16, type: 'chair' },
      { x: 0.24, type: 'desk' },
      { x: 0.32, type: 'chair' },
      { x: 0.44, type: 'desk' },
      { x: 0.54, type: 'desk' },
      { x: 0.64, type: 'chair' },
      { x: 0.72, type: 'desk' },
      { x: 0.82, type: 'chair' },
      { x: 0.90, type: 'desk' },
    ],
    collectibles: [
      { x: 0.04, y: 0.68, type: 'book' },
      { x: 0.10, y: 0.52, type: 'pass' },
      { x: 0.18, y: 0.42, type: 'book' },
      { x: 0.26, y: 0.58, type: 'book' },
      { x: 0.33, y: 0.46, type: 'pass' },
      { x: 0.41, y: 0.36, type: 'book' },
      { x: 0.49, y: 0.55, type: 'book' },
      { x: 0.57, y: 0.44, type: 'pass' },
      { x: 0.65, y: 0.62, type: 'book' },
      { x: 0.73, y: 0.40, type: 'book' },
      { x: 0.81, y: 0.48, type: 'pass' },
      { x: 0.89, y: 0.56, type: 'book' },
    ],
    monitors: [
      { x: 0.12, onGround: true },
      { x: 0.30, onGround: false, platformIndex: 4 },
      { x: 0.48, onGround: true },
      { x: 0.65, onGround: false, platformIndex: 9 },
      { x: 0.82, onGround: true },
    ],
    powerups: [
      { x: 0.20, y: 0.38, type: 'shield' },
      { x: 0.55, y: 0.40, type: 'time' },
    ],
    movingPlatforms: [
      { x: 0.35, y: 0.50, w: 100, rangeX: 0.06, speed: 0.5 },
      { x: 0.70, y: 0.48, w: 90, rangeY: 0.10, speed: 0.35 },
    ],
    paperAirplanes: [
      { x: 0.25, y: 0.28, amplitude: 35, speed: 110, range: 200 },
      { x: 0.60, y: 0.25, amplitude: 25, speed: 130, range: 280, direction: -1 },
    ],
    checkpoints: [0.30, 0.60],
    starThresholds: [80, 170, 280],
  },

  // Level 5: Final Exam
  {
    name: 'The Principal\'s Floor',
    timeLimit: 45,
    levelWidth: 7000,
    theme: {
      wallColor: 0xD4D4D4,      // serious gray
      wallAccent: 0xB0B0B0,
      lockerColors: [0xC62828, 0xD32F2F], // red lockers
      trimColor: 0x424242,
      ceilingColor: 0xECEFF1,
    },
    platforms: [
      { x: 0.04, y: 0.72, w: 110 },
      { x: 0.10, y: 0.55, w: 90 },
      { x: 0.16, y: 0.45, w: 100 },
      { x: 0.23, y: 0.65, w: 110 },
      { x: 0.30, y: 0.52, w: 90 },
      { x: 0.36, y: 0.40, w: 100 },
      { x: 0.43, y: 0.60, w: 90 },
      { x: 0.50, y: 0.48, w: 110 },
      { x: 0.57, y: 0.68, w: 100 },
      { x: 0.64, y: 0.42, w: 90 },
      { x: 0.71, y: 0.55, w: 100 },
      { x: 0.78, y: 0.45, w: 90 },
      { x: 0.85, y: 0.60, w: 100 },
      { x: 0.92, y: 0.52, w: 80 },
    ],
    obstacles: [
      { x: 0.06, type: 'desk' },
      { x: 0.14, type: 'chair' },
      { x: 0.21, type: 'desk' },
      { x: 0.28, type: 'chair' },
      { x: 0.35, type: 'desk' },
      { x: 0.45, type: 'desk' },
      { x: 0.53, type: 'chair' },
      { x: 0.61, type: 'desk' },
      { x: 0.69, type: 'chair' },
      { x: 0.77, type: 'desk' },
      { x: 0.85, type: 'chair' },
      { x: 0.92, type: 'desk' },
    ],
    collectibles: [
      { x: 0.03, y: 0.68, type: 'book' },
      { x: 0.09, y: 0.50, type: 'pass' },
      { x: 0.15, y: 0.40, type: 'book' },
      { x: 0.22, y: 0.58, type: 'book' },
      { x: 0.29, y: 0.46, type: 'pass' },
      { x: 0.35, y: 0.35, type: 'book' },
      { x: 0.42, y: 0.55, type: 'book' },
      { x: 0.49, y: 0.42, type: 'pass' },
      { x: 0.56, y: 0.62, type: 'book' },
      { x: 0.63, y: 0.38, type: 'book' },
      { x: 0.70, y: 0.50, type: 'pass' },
      { x: 0.77, y: 0.40, type: 'book' },
      { x: 0.84, y: 0.55, type: 'pass' },
      { x: 0.91, y: 0.48, type: 'book' },
    ],
    monitors: [
      { x: 0.10, onGround: true },
      { x: 0.25, onGround: false, platformIndex: 2 },
      { x: 0.40, onGround: true },
      { x: 0.55, onGround: false, platformIndex: 7 },
      { x: 0.70, onGround: true },
      { x: 0.85, onGround: false, platformIndex: 12 },
    ],
    powerups: [
      { x: 0.18, y: 0.35, type: 'speed' },
      { x: 0.45, y: 0.38, type: 'shield' },
      { x: 0.75, y: 0.38, type: 'time' },
    ],
    movingPlatforms: [
      { x: 0.30, y: 0.52, w: 90, rangeX: 0.07, speed: 0.55 },
      { x: 0.55, y: 0.45, w: 80, rangeY: 0.12, speed: 0.4 },
      { x: 0.80, y: 0.50, w: 90, rangeX: 0.06, speed: 0.6 },
    ],
    paperAirplanes: [
      { x: 0.20, y: 0.25, amplitude: 30, speed: 120, range: 220 },
      { x: 0.45, y: 0.30, amplitude: 40, speed: 140, range: 300, direction: -1 },
      { x: 0.70, y: 0.22, amplitude: 25, speed: 100, range: 250 },
    ],
    checkpoints: [0.25, 0.50, 0.75],
    starThresholds: [100, 200, 340],
  },
];

export function getLevelData(level) {
  const idx = Math.max(0, Math.min(level - 1, LEVELS.length - 1));
  return LEVELS[idx];
}
