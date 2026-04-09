// GameState.js — Centralized game state

const gameState = {
  score: 0,
  bestScore: 0,
  timeLeft: 60,
  combo: 0,
  bestCombo: 0,
  isMuted: false,
  gameOver: false,
  started: false,
  won: false,
  level: 1,
  maxLevel: 1,
  hasShield: false,
  hasSpeedBoost: false,
  hasTimeFreeze: false,

  reset() {
    this.score = 0;
    this.timeLeft = 60;
    this.combo = 0;
    this.bestCombo = 0;
    this.gameOver = false;
    this.started = false;
    this.won = false;
    this.hasShield = false;
    this.hasSpeedBoost = false;
    this.hasTimeFreeze = false;
    // bestScore, level, maxLevel persist across resets
  },
};

export default gameState;
