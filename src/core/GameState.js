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

  reset() {
    this.score = 0;
    this.timeLeft = 60;
    this.combo = 0;
    this.bestCombo = 0;
    this.gameOver = false;
    this.started = false;
    this.won = false;
    // bestScore persists across resets
  },
};

export default gameState;
