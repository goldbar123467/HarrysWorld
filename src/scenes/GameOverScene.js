// GameOverScene.js — Game over / win screen with animations

import Phaser from 'phaser';
import { GAME, COLORS, UI, SAFE_ZONE, EFFECTS } from '../core/Constants.js';
import eventBus, { Events } from '../core/EventBus.js';
import gameState from '../core/GameState.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create() {
    const cx = GAME.WIDTH / 2;
    const startY = SAFE_ZONE.TOP + Math.round(40 * GAME.PX);

    // Fade in
    this.cameras.main.fadeIn(EFFECTS.FADE_DURATION, 0, 0, 0);

    // Overlay
    const overlay = this.add.rectangle(cx, GAME.HEIGHT / 2, GAME.WIDTH, GAME.HEIGHT, COLORS.OVERLAY, 0)
      .setDepth(0);
    this.tweens.add({
      targets: overlay,
      fillAlpha: 0.7,
      duration: 400,
      ease: 'Sine.easeIn',
    });

    // Title — slides down
    const titleText = gameState.won ? 'MADE IT!' : 'LATE!';
    const titleColor = gameState.won ? '#4CAF50' : '#F44336';
    const title = this.add.text(cx, startY - Math.round(60 * GAME.PX), titleText, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: UI.TITLE_SIZE + 'px',
      color: titleColor,
      fontStyle: 'bold',
      stroke: COLORS.TEXT_SHADOW,
      strokeThickness: Math.round(4 * GAME.PX),
    }).setOrigin(0.5).setDepth(1).setAlpha(0);

    this.tweens.add({
      targets: title,
      y: startY,
      alpha: 1,
      duration: 500,
      ease: 'Back.easeOut',
      delay: 150,
    });

    // Character sprite
    const charKey = gameState.won ? 'harry' : 'hall_monitor';
    const charSprite = this.add.image(cx, startY + Math.round(45 * GAME.PX), charKey)
      .setDepth(1).setAlpha(0).setScale(0.5);
    this.tweens.add({
      targets: charSprite,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut',
      delay: 350,
    });

    // Score — fades in
    const scoreText = this.add.text(cx, startY + Math.round(95 * GAME.PX), 'Score: ' + gameState.score, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: UI.SUBTITLE_SIZE + 'px',
      color: COLORS.TEXT_PRIMARY,
      stroke: COLORS.TEXT_SHADOW,
      strokeThickness: Math.round(2 * GAME.PX),
    }).setOrigin(0.5).setDepth(1).setAlpha(0);

    this.tweens.add({
      targets: scoreText,
      alpha: 1,
      duration: 400,
      delay: 500,
    });

    // Best score
    const bestText = this.add.text(cx, startY + Math.round(130 * GAME.PX), 'Best: ' + gameState.bestScore, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: UI.BODY_SIZE + 'px',
      color: '#FFD700',
      stroke: COLORS.TEXT_SHADOW,
      strokeThickness: Math.round(2 * GAME.PX),
    }).setOrigin(0.5).setDepth(1).setAlpha(0);

    this.tweens.add({
      targets: bestText,
      alpha: 1,
      duration: 400,
      delay: 600,
    });

    // Play Again button — scales up
    const btnW = UI.BUTTON_WIDTH;
    const btnH = UI.BUTTON_HEIGHT;
    const btnY = startY + Math.round(200 * GAME.PX);

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
      .setDepth(2)
      .setAlpha(0)
      .setScale(0.5);

    this.tweens.add({
      targets: btnContainer,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut',
      delay: 750,
    });

    btnContainer.on('pointerover', () => {
      btnGfx.clear();
      btnGfx.fillStyle(COLORS.BUTTON_HOVER, 1);
      btnGfx.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, UI.BUTTON_RADIUS);
      this.tweens.add({
        targets: btnContainer,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
      });
    });

    btnContainer.on('pointerout', () => {
      btnGfx.clear();
      btnGfx.fillStyle(COLORS.BUTTON_BG, 1);
      btnGfx.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, UI.BUTTON_RADIUS);
      this.tweens.add({
        targets: btnContainer,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
    });

    this._restarting = false;
    btnContainer.on('pointerdown', () => {
      if (this._restarting) return;
      this._restarting = true;
      gameState.reset();
      eventBus.emit(Events.GAME_RESTART);
      this.cameras.main.fadeOut(EFFECTS.FADE_DURATION, 0, 0, 0);
      this.time.delayedCall(EFFECTS.FADE_DURATION, () => {
        this.scene.start('GameScene');
      });
    });
  }

  shutdown() {
    // Clean up any EventBus listeners
  }
}
