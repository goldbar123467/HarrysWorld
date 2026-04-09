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
  levelStars: {}, // { 1: 3, 2: 2, ... } stars earned per level
  totalCollected: 0,
  totalCollectibles: 0,

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
    this.totalCollected = 0;
    this.totalCollectibles = 0;
    // bestScore, level, maxLevel, levelStars persist across resets
  },

  loadStars() {
    try {
      const saved = localStorage.getItem('harrys_world_stars');
      if (saved) this.levelStars = JSON.parse(saved);
    } catch (e) { /* ignore */ }
  },

  saveStars(level, stars) {
    const current = this.levelStars[level] || 0;
    if (stars > current) {
      this.levelStars[level] = stars;
      localStorage.setItem('harrys_world_stars', JSON.stringify(this.levelStars));
    }
  },

  getTotalStars() {
    return Object.values(this.levelStars).reduce((sum, s) => sum + s, 0);
  },
};

export default gameState;
