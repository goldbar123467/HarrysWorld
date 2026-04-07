// GameOverScene.js — Game over / win screen

import Phaser from 'phaser';
import { GAME, COLORS, UI, SAFE_ZONE } from '../core/Constants.js';
import eventBus, { Events } from '../core/EventBus.js';
import gameState from '../core/GameState.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create() {
    const cx = GAME.WIDTH / 2;
    const startY = SAFE_ZONE.TOP + Math.round(40 * GAME.PX);

    // Overlay
    this.add.rectangle(cx, GAME.HEIGHT / 2, GAME.WIDTH, GAME.HEIGHT, COLORS.OVERLAY, 0.7).setDepth(0);

    // Title
    const titleText = gameState.won ? 'MADE IT!' : 'LATE!';
    const titleColor = gameState.won ? '#4CAF50' : '#F44336';
    this.add.text(cx, startY, titleText, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: UI.TITLE_SIZE + 'px',
      color: titleColor,
      fontStyle: 'bold',
      stroke: COLORS.TEXT_SHADOW,
      strokeThickness: Math.round(4 * GAME.PX),
    }).setOrigin(0.5).setDepth(1);

    // Score
    this.add.text(cx, startY + Math.round(70 * GAME.PX), 'Score: ' + gameState.score, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: UI.SUBTITLE_SIZE + 'px',
      color: COLORS.TEXT_PRIMARY,
      stroke: COLORS.TEXT_SHADOW,
      strokeThickness: Math.round(2 * GAME.PX),
    }).setOrigin(0.5).setDepth(1);

    // Best score
    this.add.text(cx, startY + Math.round(110 * GAME.PX), 'Best: ' + gameState.bestScore, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: UI.BODY_SIZE + 'px',
      color: '#FFD700',
      stroke: COLORS.TEXT_SHADOW,
      strokeThickness: Math.round(2 * GAME.PX),
    }).setOrigin(0.5).setDepth(1);

    // Play Again button — Container + Graphics + Text pattern
    const btnW = UI.BUTTON_WIDTH;
    const btnH = UI.BUTTON_HEIGHT;
    const btnY = startY + Math.round(180 * GAME.PX);

    const btnGfx = this.add.graphics();
    btnGfx.fillStyle(COLORS.BUTTON_BG, 1);
    btnGfx.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, UI.BUTTON_RADIUS);

    const btnText = this.add.text(0, 0, 'Play Again', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: UI.BODY_SIZE + 'px',
      color: COLORS.TEXT_PRIMARY,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const btnContainer = this.add.container(cx, btnY, [btnGfx, btnText])
      .setSize(btnW, btnH)
      .setInteractive({ useHandCursor: true })
      .setDepth(2);

    btnContainer.on('pointerover', () => {
      btnGfx.clear();
      btnGfx.fillStyle(COLORS.BUTTON_HOVER, 1);
      btnGfx.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, UI.BUTTON_RADIUS);
    });

    btnContainer.on('pointerout', () => {
      btnGfx.clear();
      btnGfx.fillStyle(COLORS.BUTTON_BG, 1);
      btnGfx.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, UI.BUTTON_RADIUS);
    });

    btnContainer.on('pointerdown', () => {
      gameState.reset();
      eventBus.emit(Events.GAME_RESTART);
      this.scene.start('GameScene');
    });
  }

  shutdown() {
    // Clean up any EventBus listeners (none registered in this scene currently)
  }
}
