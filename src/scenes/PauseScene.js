// PauseScene.js — Pause overlay with resume, restart, mute, and quit

import Phaser from 'phaser';
import { GAME, COLORS, UI, SAFE_ZONE, EFFECTS } from '../core/Constants.js';
import eventBus, { Events } from '../core/EventBus.js';
import gameState from '../core/GameState.js';

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create() {
    const cx = GAME.WIDTH / 2;
    const cy = GAME.HEIGHT / 2;

    // Semi-transparent overlay
    const overlay = this.add.rectangle(cx, cy, GAME.WIDTH, GAME.HEIGHT, 0x000000, 0.6)
      .setDepth(0).setInteractive();

    // Title
    const title = this.add.text(cx, cy - Math.round(120 * GAME.PX), 'PAUSED', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(40 * GAME.PX) + 'px',
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: Math.round(3 * GAME.PX),
    }).setOrigin(0.5).setDepth(1);

    const btnW = UI.BUTTON_WIDTH;
    const btnH = UI.BUTTON_HEIGHT;

    // Resume button
    this._createButton(cx, cy - Math.round(30 * GAME.PX), 'Resume', 0x4CAF50, 0x66BB6A, btnW, btnH, () => {
      this._resume();
    });

    // Mute button
    const muteLabel = gameState.isMuted ? 'Unmute' : 'Mute';
    this._muteText = null;
    this._createButton(cx, cy + Math.round(35 * GAME.PX), muteLabel, 0xFF9800, 0xFFA726, btnW, btnH, () => {
      gameState.isMuted = !gameState.isMuted;
      if (this._muteText) this._muteText.setText(gameState.isMuted ? 'Unmute' : 'Mute');
      eventBus.emit('audio:mute', { muted: gameState.isMuted });
    }, true);

    // Restart button
    this._createButton(cx, cy + Math.round(100 * GAME.PX), 'Restart Level', COLORS.BUTTON_BG, COLORS.BUTTON_HOVER, btnW, btnH, () => {
      this._restart();
    });

    // Quit to Menu
    this._createButton(cx, cy + Math.round(165 * GAME.PX), 'Quit to Menu', 0x616161, 0x757575, btnW, btnH, () => {
      this._quit();
    });

    // ESC to resume
    this.input.keyboard.on('keydown-ESC', () => this._resume());
    this.input.keyboard.on('keydown-P', () => this._resume());

    this._transitioning = false;
  }

  _createButton(x, y, label, bgColor, hoverColor, w, h, callback, isMuteBtn) {
    const gfx = this.add.graphics();
    gfx.fillStyle(bgColor, 1);
    gfx.fillRoundedRect(-w / 2, -h / 2, w, h, UI.BUTTON_RADIUS);

    const text = this.add.text(0, 0, label, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: UI.BODY_SIZE + 'px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    if (isMuteBtn) this._muteText = text;

    const container = this.add.container(x, y, [gfx, text])
      .setSize(w, h)
      .setInteractive({ useHandCursor: true })
      .setDepth(2);

    container.on('pointerover', () => {
      gfx.clear();
      gfx.fillStyle(hoverColor, 1);
      gfx.fillRoundedRect(-w / 2, -h / 2, w, h, UI.BUTTON_RADIUS);
    });
    container.on('pointerout', () => {
      gfx.clear();
      gfx.fillStyle(bgColor, 1);
      gfx.fillRoundedRect(-w / 2, -h / 2, w, h, UI.BUTTON_RADIUS);
    });
    container.on('pointerdown', callback);
  }

  _resume() {
    if (this._transitioning) return;
    this._transitioning = true;
    this.scene.resume('GameScene');
    this.scene.resume('HUDScene');
    this.scene.stop('PauseScene');
    eventBus.emit(Events.GAME_RESUME);
  }

  _restart() {
    if (this._transitioning) return;
    this._transitioning = true;
    this.scene.stop('HUDScene');
    this.scene.stop('PauseScene');
    gameState.reset();
    gameState.level = gameState.level || 1;
    eventBus.emit(Events.GAME_RESTART);
    this.scene.start('GameScene');
  }

  _quit() {
    if (this._transitioning) return;
    this._transitioning = true;
    this.scene.stop('HUDScene');
    this.scene.stop('GameScene');
    this.scene.stop('PauseScene');
    gameState.reset();
    this.scene.start('TitleScene');
  }
}
