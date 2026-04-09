// main.js — Entry point for Harry's World

import Phaser from 'phaser';
import { GAME } from './core/Constants.js';
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import PauseScene from './scenes/PauseScene.js';
import HUDScene from './scenes/HUDScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  backgroundColor: GAME.BG_COLOR,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: 1 / GAME.DPR,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: GAME.GRAVITY },
      debug: false,
    },
  },
  render: {
    pixelArt: true,
    roundPixels: true,
    preserveDrawingBuffer: true,
  },
  scene: [BootScene, TitleScene, GameScene, GameOverScene, PauseScene, HUDScene],
};

const game = new Phaser.Game(config);

// Expose for Playwright QA
import eventBus, { Events } from './core/EventBus.js';
import gameState from './core/GameState.js';

window.__GAME__ = game;
window.__GAME_STATE__ = gameState;
window.__EVENT_BUS__ = eventBus;
window.__EVENTS__ = Events;

window.render_game_to_text = () => {
  if (!game || !gameState) return JSON.stringify({ error: 'not_ready' });

  const activeScenes = game.scene.getScenes(true).map(s => s.scene.key);
  const payload = {
    coords: 'origin:top-left x:right y:down',
    mode: gameState.gameOver ? 'game_over' : 'playing',
    scenes: activeScenes,
    level: gameState.level,
    maxLevel: gameState.maxLevel,
    score: gameState.score,
    bestScore: gameState.bestScore,
    timeLeft: gameState.timeLeft,
    combo: gameState.combo,
  };

  const gameScene = game.scene.getScene('GameScene');
  if (gameState.started && gameScene?.player) {
    const p = gameScene.player;
    const body = p.body;
    payload.player = {
      x: Math.round(p.x), y: Math.round(p.y),
      active: p.active, visible: p.visible,
      vx: body ? Math.round(body.velocity.x) : 0,
      vy: body ? Math.round(body.velocity.y) : 0,
      onGround: body ? body.blocked.down : false,
    };
  }

  return JSON.stringify(payload);
};

window.advanceTime = (ms) => {
  return new Promise((resolve) => {
    const start = performance.now();
    function step() {
      if (performance.now() - start >= ms) return resolve();
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
};

export default game;
