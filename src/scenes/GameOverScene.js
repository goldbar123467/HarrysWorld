// GameOverScene.js — Game over / win screen with level progression

import Phaser from 'phaser';
import { GAME, COLORS, UI, SAFE_ZONE, EFFECTS } from '../core/Constants.js';
import eventBus, { Events } from '../core/EventBus.js';
import gameState from '../core/GameState.js';
import { LEVELS, getLevelData } from '../core/LevelData.js';
import audioManager from '../core/AudioManager.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create() {
    const cx = GAME.WIDTH / 2;
    const startY = SAFE_ZONE.TOP + Math.round(40 * GAME.PX);

    this.cameras.main.fadeIn(EFFECTS.FADE_DURATION, 0, 0, 0);

    // Play win/lose sound
    if (gameState.won) {
      audioManager.playWin();
    } else {
      audioManager.playDeath();
    }

    // Overlay
    const overlay = this.add.rectangle(cx, GAME.HEIGHT / 2, GAME.WIDTH, GAME.HEIGHT, COLORS.OVERLAY, 0).setDepth(0);
    this.tweens.add({ targets: overlay, fillAlpha: 0.7, duration: 400, ease: 'Sine.easeIn' });

    // Title
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
      targets: title, y: startY, alpha: 1,
      duration: 500, ease: 'Back.easeOut', delay: 150,
    });

    // Character sprite
    const charKey = gameState.won ? 'harry' : 'hall_monitor';
    const charSprite = this.add.image(cx, startY + Math.round(45 * GAME.PX), charKey)
      .setDepth(1).setAlpha(0).setScale(0.5);
    this.tweens.add({
      targets: charSprite, alpha: 1, scaleX: 1, scaleY: 1,
      duration: 400, ease: 'Back.easeOut', delay: 350,
    });

    // Level name
    const level = gameState.level || 1;
    const levelData = getLevelData(level);
    const levelLabel = this.add.text(cx, startY + Math.round(80 * GAME.PX), `Level ${level}: ${levelData.name}`, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(16 * GAME.PX) + 'px',
      color: '#AAAAAA',
      stroke: COLORS.TEXT_SHADOW,
      strokeThickness: Math.round(1 * GAME.PX),
    }).setOrigin(0.5).setDepth(1).setAlpha(0);
    this.tweens.add({ targets: levelLabel, alpha: 1, duration: 400, delay: 450 });

    // Score
    const scoreText = this.add.text(cx, startY + Math.round(110 * GAME.PX), 'Score: ' + gameState.score, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: UI.SUBTITLE_SIZE + 'px',
      color: COLORS.TEXT_PRIMARY,
      stroke: COLORS.TEXT_SHADOW,
      strokeThickness: Math.round(2 * GAME.PX),
    }).setOrigin(0.5).setDepth(1).setAlpha(0);
    this.tweens.add({ targets: scoreText, alpha: 1, duration: 400, delay: 500 });

    // Best score
    const bestText = this.add.text(cx, startY + Math.round(145 * GAME.PX), 'Best: ' + gameState.bestScore, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: UI.BODY_SIZE + 'px',
      color: '#FFD700',
      stroke: COLORS.TEXT_SHADOW,
      strokeThickness: Math.round(2 * GAME.PX),
    }).setOrigin(0.5).setDepth(1).setAlpha(0);
    this.tweens.add({ targets: bestText, alpha: 1, duration: 400, delay: 600 });

    // Time remaining (if won)
    if (gameState.won && gameState.timeLeft > 0) {
      const timeBonus = gameState.timeLeft * 5;
      const timeBonusText = this.add.text(cx, startY + Math.round(175 * GAME.PX),
        `Time Bonus: +${timeBonus} (${gameState.timeLeft}s left)`, {
          fontFamily: UI.FONT_FAMILY,
          fontSize: Math.round(16 * GAME.PX) + 'px',
          color: '#81C784',
          stroke: COLORS.TEXT_SHADOW,
          strokeThickness: Math.round(1 * GAME.PX),
        }).setOrigin(0.5).setDepth(1).setAlpha(0);
      this.tweens.add({ targets: timeBonusText, alpha: 1, duration: 400, delay: 700 });

      // Add time bonus to score
      gameState.score += timeBonus;
      if (gameState.score > gameState.bestScore) {
        gameState.bestScore = gameState.score;
        localStorage.setItem('harrys_world_best_score', gameState.bestScore.toString());
      }
    }

    // Buttons
    const btnY = startY + Math.round(235 * GAME.PX);
    const btnW = UI.BUTTON_WIDTH;
    const btnH = UI.BUTTON_HEIGHT;

    if (gameState.won && level < LEVELS.length) {
      // Next Level button
      this._createButton(cx, btnY, 'Next Level', 0x4CAF50, 0x66BB6A, btnW, btnH, 750, () => {
        this._goToLevel((gameState.level || 1) + 1);
      });

      // Replay button (smaller, below)
      this._createButton(cx, btnY + Math.round(60 * GAME.PX), 'Replay', COLORS.BUTTON_BG, COLORS.BUTTON_HOVER, btnW * 0.8, btnH * 0.85, 850, () => {
        this._goToLevel(gameState.level || 1);
      });

      // Menu button
      this._createButton(cx, btnY + Math.round(115 * GAME.PX), 'Menu', 0x616161, 0x757575, btnW * 0.8, btnH * 0.85, 950, () => {
        this._goToMenu();
      });
    } else if (gameState.won && level >= LEVELS.length) {
      // All levels completed!
      const congrats = this.add.text(cx, btnY - Math.round(20 * GAME.PX), 'ALL LEVELS COMPLETE!', {
        fontFamily: UI.FONT_FAMILY,
        fontSize: Math.round(22 * GAME.PX) + 'px',
        color: '#FFD700',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: Math.round(3 * GAME.PX),
      }).setOrigin(0.5).setDepth(2).setAlpha(0);
      this.tweens.add({ targets: congrats, alpha: 1, duration: 500, delay: 750 });

      this._createButton(cx, btnY + Math.round(30 * GAME.PX), 'Play Again', COLORS.BUTTON_BG, COLORS.BUTTON_HOVER, btnW, btnH, 850, () => {
        this._goToLevel(1);
      });

      this._createButton(cx, btnY + Math.round(90 * GAME.PX), 'Menu', 0x616161, 0x757575, btnW * 0.8, btnH * 0.85, 950, () => {
        this._goToMenu();
      });
    } else {
      // Lost — retry or menu
      this._createButton(cx, btnY, 'Try Again', COLORS.BUTTON_BG, COLORS.BUTTON_HOVER, btnW, btnH, 750, () => {
        this._goToLevel(gameState.level || 1);
      });

      this._createButton(cx, btnY + Math.round(60 * GAME.PX), 'Menu', 0x616161, 0x757575, btnW * 0.8, btnH * 0.85, 850, () => {
        this._goToMenu();
      });
    }

    // Keyboard shortcuts
    this.input.keyboard.on('keydown-ENTER', () => {
      if (gameState.won && level < LEVELS.length) {
        this._goToLevel((gameState.level || 1) + 1);
      } else {
        this._goToLevel(gameState.level || 1);
      }
    });
    this.input.keyboard.on('keydown-ESC', () => this._goToMenu());
  }

  _createButton(x, y, label, bgColor, hoverColor, w, h, delay, callback) {
    const gfx = this.add.graphics();
    gfx.fillStyle(bgColor, 1);
    gfx.fillRoundedRect(-w / 2, -h / 2, w, h, UI.BUTTON_RADIUS);

    const text = this.add.text(0, 0, label, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: UI.BODY_SIZE + 'px',
      color: COLORS.TEXT_PRIMARY,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const container = this.add.container(x, y, [gfx, text])
      .setSize(w, h)
      .setInteractive({ useHandCursor: true })
      .setDepth(2).setAlpha(0).setScale(0.5);

    this.tweens.add({
      targets: container, alpha: 1, scaleX: 1, scaleY: 1,
      duration: 400, ease: 'Back.easeOut', delay,
    });

    container.on('pointerover', () => {
      gfx.clear();
      gfx.fillStyle(hoverColor, 1);
      gfx.fillRoundedRect(-w / 2, -h / 2, w, h, UI.BUTTON_RADIUS);
      this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 100 });
    });
    container.on('pointerout', () => {
      gfx.clear();
      gfx.fillStyle(bgColor, 1);
      gfx.fillRoundedRect(-w / 2, -h / 2, w, h, UI.BUTTON_RADIUS);
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
    });

    this._transitioning = false;
    container.on('pointerdown', () => {
      if (this._transitioning) return;
      this._transitioning = true;
      callback();
    });
  }

  _goToLevel(level) {
    gameState.reset();
    gameState.level = level;
    eventBus.emit(Events.GAME_RESTART);
    this.cameras.main.fadeOut(EFFECTS.FADE_DURATION, 0, 0, 0);
    this.time.delayedCall(EFFECTS.FADE_DURATION, () => {
      this.scene.start('GameScene');
    });
  }

  _goToMenu() {
    gameState.reset();
    this.cameras.main.fadeOut(EFFECTS.FADE_DURATION, 0, 0, 0);
    this.time.delayedCall(EFFECTS.FADE_DURATION, () => {
      this.scene.start('TitleScene');
    });
  }

  shutdown() {
    // Clean up
  }
}
