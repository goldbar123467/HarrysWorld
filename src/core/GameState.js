// GameState.js — Centralized game state

const gameState = {
  score: 0,
  bestScore: 0,
  timeLeft: 60,
  combo: 0,
  bestCombo: 0,
  lives: 3,
  maxLives: 3,
  isMuted: false,
  gameOver: false,
  started: false,
  won: false,
  level: 1,
  maxLevel: 1,
  hasShield: false,
  hasSpeedBoost: false,
  hasTimeFreeze: false,
  isInvincible: false,
  checkpointX: 0,
  checkpointY: 0,
  // Star ratings per level: { 1: 0-3, 2: 0-3, ... }
  levelStars: {},

  reset() {
    this.score = 0;
    this.timeLeft = 60;
    this.combo = 0;
    this.bestCombo = 0;
    this.lives = 3;
    this.gameOver = false;
    this.started = false;
    this.won = false;
    this.hasShield = false;
    this.hasSpeedBoost = false;
    this.hasTimeFreeze = false;
    this.isInvincible = false;
    this.checkpointX = 0;
    this.checkpointY = 0;
    // bestScore, level, maxLevel, levelStars persist across resets
  },
};

export default gameState;
