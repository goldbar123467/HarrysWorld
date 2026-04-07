// main.js — Entry point for Harry's World

import Phaser from 'phaser';
import { GAME } from './core/Constants.js';
import BootScene from './scenes/BootScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';
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
    preserveDrawingBuffer: true,
  },
  scene: [BootScene, GameScene, GameOverScene, HUDScene],
};

const game = new Phaser.Game(config);

export default game;
