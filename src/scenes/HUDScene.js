// HUDScene.js — Overlay HUD showing score, timer, combo, and progress bar

import Phaser from 'phaser';
import { GAME, COLORS, HUD, EFFECTS, UI, SAFE_ZONE } from '../core/Constants.js';
import eventBus, { Events } from '../core/EventBus.js';
import gameState from '../core/GameState.js';
import audioManager from '../core/AudioManager.js';

export default class HUDScene extends Phaser.Scene {
  constructor() {
    super('HUDScene');
  }

  create() {
    const pad = HUD.PADDING;
    const top = SAFE_ZONE.TOP;
    const px = GAME.PX;

    // Level text (top-left, small)
    const level = gameState.level || 1;
    this._levelText = this.add.text(pad, top, 'Lv.' + level, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(12 * px) + 'px',
      color: '#AAAAAA',
      stroke: COLORS.TEXT_SHADOW,
      strokeThickness: Math.round(1 * px),
    }).setDepth(100).setScrollFactor(0);

    // Score text (top-left, below level)
    this._scoreText = this.add.text(pad, top + Math.round(16 * px), 'Score: 0', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: HUD.FONT_SIZE + 'px',
      color: COLORS.TEXT_PRIMARY,
      fontStyle: 'bold',
      stroke: COLORS.TEXT_SHADOW,
      strokeThickness: Math.round(2 * px),
    }).setDepth(100).setScrollFactor(0);

    // Timer text (top-center)
    this._timerText = this.add.text(GAME.WIDTH / 2, top, gameState.timeLeft + 's', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: HUD.TIMER_FONT_SIZE + 'px',
      color: COLORS.TEXT_PRIMARY,
      fontStyle: 'bold',
      stroke: COLORS.TEXT_SHADOW,
      strokeThickness: Math.round(2 * px),
    }).setOrigin(0.5, 0).setDepth(100).setScrollFactor(0);

    // Combo text (top-right)
    this._comboText = this.add.text(GAME.WIDTH - pad, top, '', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: HUD.COMBO_FONT_SIZE + 'px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: COLORS.TEXT_SHADOW,
      strokeThickness: Math.round(2 * px),
    }).setOrigin(1, 0).setDepth(100).setScrollFactor(0);

    // Items collected counter (below timer)
    this._itemText = this.add.text(GAME.WIDTH / 2, top + Math.round(26 * px), '', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(10 * px) + 'px',
      color: '#BBBBBB',
      stroke: COLORS.TEXT_SHADOW,
      strokeThickness: Math.round(1 * px),
    }).setOrigin(0.5, 0).setDepth(100).setScrollFactor(0);
    this._updateItemCount();

    // Progress bar (bottom of screen, shows how far through level)
    const barW = GAME.WIDTH * 0.4;
    const barH = Math.round(6 * px);
    const barX = (GAME.WIDTH - barW) / 2;
    const barY = GAME.HEIGHT - SAFE_ZONE.BOTTOM - Math.round(8 * px);

    this._progressBg = this.add.rectangle(barX + barW / 2, barY, barW, barH, 0x333333, 0.5)
      .setDepth(100).setScrollFactor(0);
    this._progressFill = this.add.rectangle(barX, barY, 1, barH, 0x4CAF50, 0.8)
      .setOrigin(0, 0.5).setDepth(101).setScrollFactor(0);
    this._progressBarWidth = barW;
    this._progressBarX = barX;

    // Player icon on progress bar
    this._progressIcon = this.add.image(barX, barY, 'harry')
      .setDisplaySize(Math.round(12 * px), Math.round(18 * px))
      .setDepth(102).setScrollFactor(0);

    // Door icon at end
    this.add.image(barX + barW, barY, 'door')
      .setDisplaySize(Math.round(10 * px), Math.round(16 * px))
      .setDepth(102).setScrollFactor(0);

    this._timerWarning = false;
    this._timerTween = null;

    // EventBus listeners
    this._onScoreChanged = ({ score }) => {
      this._scoreText.setText('Score: ' + score);
    };

    this._onTimeUpdate = ({ timeLeft }) => {
      this._timerText.setText(timeLeft + 's');

      if (timeLeft <= EFFECTS.TIME_WARNING_THRESHOLD && !this._timerWarning) {
        this._timerWarning = true;
        this._timerText.setColor('#F44336');
        audioManager.playTimeWarning();
        this._timerTween = this.tweens.add({
          targets: this._timerText,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    };

    this._onCombo = ({ combo }) => {
      const multiplier = combo >= 5 ? '2x' : combo >= 3 ? '1.5x' : '';
      this._comboText.setText(combo + 'x COMBO!' + (multiplier ? ' (' + multiplier + ')' : ''));
      this._comboText.setColor(combo >= 5 ? '#FF4081' : combo >= 3 ? '#FF9100' : '#FFD700');
      this._comboText.setScale(1.5);
      this.tweens.add({
        targets: this._comboText,
        scaleX: 1,
        scaleY: 1,
        duration: HUD.COMBO_POPUP_DURATION,
        ease: 'Back.easeOut',
      });
    };

    this._onItemCollected = () => {
      if (gameState.combo < 3) {
        this._comboText.setText('');
      }
      this._updateItemCount();
    };

    this._onGameOver = () => {
      if (this._timerTween) this._timerTween.stop();
    };

    eventBus.on(Events.SCORE_CHANGED, this._onScoreChanged);
    eventBus.on(Events.TIME_UPDATE, this._onTimeUpdate);
    eventBus.on(Events.SPECTACLE_COMBO, this._onCombo);
    eventBus.on(Events.ITEM_COLLECTED, this._onItemCollected);
    eventBus.on(Events.GAME_OVER, this._onGameOver);

    this.events.on('shutdown', this.shutdown, this);
  }

  _updateItemCount() {
    if (gameState.totalCollectibles > 0) {
      this._itemText.setText(`${gameState.totalCollected}/${gameState.totalCollectibles} items`);
    }
  }

  update() {
    // Update progress bar based on player position
    const gameScene = this.scene.get('GameScene');
    if (gameScene && gameScene.player && gameScene.player.active && gameScene._levelWidth) {
      const progress = Math.min(1, Math.max(0, gameScene.player.x / gameScene._levelWidth));
      this._progressFill.setDisplaySize(this._progressBarWidth * progress, this._progressFill.height);
      this._progressIcon.setX(this._progressBarX + this._progressBarWidth * progress);
    }
  }

  shutdown() {
    if (this._timerTween) {
      this._timerTween.stop();
      this._timerTween = null;
    }
    eventBus.off(Events.SCORE_CHANGED, this._onScoreChanged);
    eventBus.off(Events.TIME_UPDATE, this._onTimeUpdate);
    eventBus.off(Events.SPECTACLE_COMBO, this._onCombo);
    eventBus.off(Events.ITEM_COLLECTED, this._onItemCollected);
    eventBus.off(Events.GAME_OVER, this._onGameOver);
    this.events.off('shutdown', this.shutdown, this);
  }
}
