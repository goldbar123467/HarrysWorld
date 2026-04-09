// GameOverScene.js — Game over / win screen with star rating and level progression

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
    const px = GAME.PX;
    const startY = SAFE_ZONE.TOP + Math.round(20 * px);

    this.cameras.main.fadeIn(EFFECTS.FADE_DURATION, 0, 0, 0);

    // Play win/lose sound
    if (gameState.won) {
      audioManager.playWin();
    } else {
      audioManager.playDeath();
    }

    // Overlay
    const overlay = this.add.rectangle(cx, GAME.HEIGHT / 2, GAME.WIDTH, GAME.HEIGHT, COLORS.OVERLAY, 0).setDepth(0);
    this.tweens.add({ targets: overlay, fillAlpha: 0.75, duration: 400, ease: 'Sine.easeIn' });

    // Title
    const titleText = gameState.won ? 'MADE IT!' : 'BUSTED!';
    const titleColor = gameState.won ? '#4CAF50' : '#F44336';
    const title = this.add.text(cx, startY, titleText, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(44 * px) + 'px',
      color: titleColor,
      fontStyle: 'bold',
      stroke: COLORS.TEXT_SHADOW,
      strokeThickness: Math.round(4 * px),
    }).setOrigin(0.5).setDepth(1).setAlpha(0).setScale(0.3);

    this.tweens.add({
      targets: title, alpha: 1, scaleX: 1, scaleY: 1,
      duration: 500, ease: 'Back.easeOut', delay: 150,
    });

    // Level name
    const level = gameState.level || 1;
    const levelData = getLevelData(level);
    const levelLabel = this.add.text(cx, startY + Math.round(42 * px), `Level ${level}: ${levelData.name}`, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(14 * px) + 'px',
      color: '#BBBBBB',
      stroke: COLORS.TEXT_SHADOW,
      strokeThickness: Math.round(1 * px),
    }).setOrigin(0.5).setDepth(1).setAlpha(0);
    this.tweens.add({ targets: levelLabel, alpha: 1, duration: 400, delay: 350 });

    // Star rating (if won)
    let earnedStars = 0;
    if (gameState.won) {
      const thresholds = levelData.starThresholds || [40, 80, 130];

      // Calculate time bonus first
      const timeBonus = gameState.timeLeft > 0 ? gameState.timeLeft * 5 : 0;
      const totalScore = gameState.score + timeBonus;

      // Count stars
      for (let i = 0; i < thresholds.length; i++) {
        if (totalScore >= thresholds[i]) earnedStars++;
      }

      // Star display
      const starY = startY + Math.round(75 * px);
      const starSpacing = Math.round(45 * px);
      const starSize = Math.round(20 * px);

      for (let i = 0; i < 3; i++) {
        const sx = cx - starSpacing + i * starSpacing;
        const filled = i < earnedStars;
        const star = this._drawStar(sx, starY, starSize, filled);
        star.setDepth(2).setAlpha(0).setScale(0);

        this.tweens.add({
          targets: star,
          alpha: 1,
          scaleX: 1,
          scaleY: 1,
          duration: 400,
          ease: 'Back.easeOut',
          delay: 500 + i * 200,
          onComplete: filled ? () => {
            // Sparkle on filled star
            this.tweens.add({
              targets: star, scaleX: 1.2, scaleY: 1.2,
              duration: 200, yoyo: true,
            });
          } : undefined,
        });
      }

      // Save stars
      gameState.saveStars(level, earnedStars);

      // Time bonus display
      if (timeBonus > 0) {
        const timeBonusText = this.add.text(cx, starY + Math.round(35 * px),
          `Time Bonus: +${timeBonus} (${gameState.timeLeft}s left)`, {
            fontFamily: UI.FONT_FAMILY,
            fontSize: Math.round(13 * px) + 'px',
            color: '#81C784',
            stroke: COLORS.TEXT_SHADOW,
            strokeThickness: Math.round(1 * px),
          }).setOrigin(0.5).setDepth(1).setAlpha(0);
        this.tweens.add({ targets: timeBonusText, alpha: 1, duration: 400, delay: 700 });

        // Add time bonus to score
        gameState.score += timeBonus;
        if (gameState.score > gameState.bestScore) {
          gameState.bestScore = gameState.score;
          localStorage.setItem('harrys_world_best_score', gameState.bestScore.toString());
        }
      }
    }

    // Score panel
    const panelY = startY + Math.round((gameState.won ? 145 : 80) * px);

    // Score
    const scoreText = this.add.text(cx, panelY, 'Score: ' + gameState.score, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(22 * px) + 'px',
      color: COLORS.TEXT_PRIMARY,
      fontStyle: 'bold',
      stroke: COLORS.TEXT_SHADOW,
      strokeThickness: Math.round(2 * px),
    }).setOrigin(0.5).setDepth(1).setAlpha(0);
    this.tweens.add({ targets: scoreText, alpha: 1, duration: 400, delay: 800 });

    // Stats row
    const statsY = panelY + Math.round(30 * px);
    const collectPct = gameState.totalCollectibles > 0
      ? Math.round((gameState.totalCollected / gameState.totalCollectibles) * 100) : 0;
    const statsLine = `Items: ${gameState.totalCollected}/${gameState.totalCollectibles} (${collectPct}%)  |  Best Combo: ${gameState.bestCombo}x`;
    const statsText = this.add.text(cx, statsY, statsLine, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(11 * px) + 'px',
      color: '#AAAAAA',
      stroke: COLORS.TEXT_SHADOW,
      strokeThickness: Math.round(1 * px),
    }).setOrigin(0.5).setDepth(1).setAlpha(0);
    this.tweens.add({ targets: statsText, alpha: 1, duration: 400, delay: 900 });

    // Best score
    const bestText = this.add.text(cx, statsY + Math.round(25 * px), 'Best: ' + gameState.bestScore, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(16 * px) + 'px',
      color: '#FFD700',
      stroke: COLORS.TEXT_SHADOW,
      strokeThickness: Math.round(2 * px),
    }).setOrigin(0.5).setDepth(1).setAlpha(0);
    this.tweens.add({ targets: bestText, alpha: 1, duration: 400, delay: 950 });

    // Buttons
    const btnY = statsY + Math.round(65 * px);
    const btnW = UI.BUTTON_WIDTH;
    const btnH = UI.BUTTON_HEIGHT;

    if (gameState.won && level < LEVELS.length) {
      this._createButton(cx, btnY, 'Next Level  \u25B6', 0x4CAF50, 0x66BB6A, btnW, btnH, 1000, () => {
        this._goToLevel((gameState.level || 1) + 1);
      });
      this._createButton(cx, btnY + Math.round(55 * px), 'Replay', COLORS.BUTTON_BG, COLORS.BUTTON_HOVER, btnW * 0.75, btnH * 0.8, 1100, () => {
        this._goToLevel(gameState.level || 1);
      });
      this._createButton(cx, btnY + Math.round(105 * px), 'Menu', 0x616161, 0x757575, btnW * 0.75, btnH * 0.8, 1200, () => {
        this._goToMenu();
      });
    } else if (gameState.won && level >= LEVELS.length) {
      const congrats = this.add.text(cx, btnY - Math.round(15 * px), 'ALL LEVELS COMPLETE!', {
        fontFamily: UI.FONT_FAMILY,
        fontSize: Math.round(22 * px) + 'px',
        color: '#FFD700',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: Math.round(3 * px),
      }).setOrigin(0.5).setDepth(2).setAlpha(0);
      this.tweens.add({ targets: congrats, alpha: 1, duration: 500, delay: 1000 });

      // Total stars
      const totalStars = gameState.getTotalStars();
      const maxStars = LEVELS.length * 3;
      this.add.text(cx, btnY + Math.round(15 * px), `Total Stars: ${totalStars}/${maxStars}`, {
        fontFamily: UI.FONT_FAMILY,
        fontSize: Math.round(16 * px) + 'px',
        color: '#FFD700',
      }).setOrigin(0.5).setDepth(2).setAlpha(0);

      this._createButton(cx, btnY + Math.round(55 * px), 'Play Again', COLORS.BUTTON_BG, COLORS.BUTTON_HOVER, btnW, btnH, 1100, () => {
        this._goToLevel(1);
      });
      this._createButton(cx, btnY + Math.round(115 * px), 'Menu', 0x616161, 0x757575, btnW * 0.8, btnH * 0.85, 1200, () => {
        this._goToMenu();
      });
    } else {
      // Lost
      this._createButton(cx, btnY, 'Try Again', COLORS.BUTTON_BG, COLORS.BUTTON_HOVER, btnW, btnH, 1000, () => {
        this._goToLevel(gameState.level || 1);
      });
      this._createButton(cx, btnY + Math.round(55 * px), 'Menu', 0x616161, 0x757575, btnW * 0.8, btnH * 0.85, 1100, () => {
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

  _drawStar(x, y, size, filled) {
    const gfx = this.add.graphics();
    const color = filled ? 0xFFD700 : 0x555555;
    const alpha = filled ? 1 : 0.5;
    gfx.fillStyle(color, alpha);

    // 5-point star path
    const points = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI / 5) - Math.PI / 2;
      const r = i % 2 === 0 ? size : size * 0.4;
      points.push(x + Math.cos(angle) * r);
      points.push(y + Math.sin(angle) * r);
    }

    gfx.beginPath();
    gfx.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) {
      gfx.lineTo(points[i], points[i + 1]);
    }
    gfx.closePath();
    gfx.fillPath();

    if (filled) {
      gfx.lineStyle(Math.round(1.5 * GAME.PX), 0xFFA000);
      gfx.beginPath();
      gfx.moveTo(points[0], points[1]);
      for (let i = 2; i < points.length; i += 2) {
        gfx.lineTo(points[i], points[i + 1]);
      }
      gfx.closePath();
      gfx.strokePath();
    }

    return gfx;
  }

  _createButton(x, y, label, bgColor, hoverColor, w, h, delay, callback) {
    const gfx = this.add.graphics();
    gfx.fillStyle(bgColor, 1);
    gfx.fillRoundedRect(-w / 2, -h / 2, w, h, UI.BUTTON_RADIUS);

    const text = this.add.text(0, 0, label, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(18 * GAME.PX) + 'px',
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
      audioManager.playMenuClick();
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
}
