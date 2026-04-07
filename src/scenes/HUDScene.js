// HUDScene.js — Overlay HUD showing score, timer, and combo

import Phaser from 'phaser';
import { GAME, COLORS, HUD, EFFECTS, UI, SAFE_ZONE } from '../core/Constants.js';
import eventBus, { Events } from '../core/EventBus.js';
import gameState from '../core/GameState.js';

export default class HUDScene extends Phaser.Scene {
  constructor() {
    super('HUDScene');
  }

  create() {
    const pad = HUD.PADDING;
    const top = SAFE_ZONE.TOP;

    // Score text (top-left)
    this._scoreText = this.add.text(pad, top, 'Score: 0', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: HUD.FONT_SIZE + 'px',
      color: COLORS.TEXT_PRIMARY,
      fontStyle: 'bold',
      stroke: COLORS.TEXT_SHADOW,
      strokeThickness: Math.round(2 * GAME.PX),
    }).setDepth(100).setScrollFactor(0);

    // Timer text (top-center)
    this._timerText = this.add.text(GAME.WIDTH / 2, top, gameState.timeLeft + 's', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: HUD.TIMER_FONT_SIZE + 'px',
      color: COLORS.TEXT_PRIMARY,
      fontStyle: 'bold',
      stroke: COLORS.TEXT_SHADOW,
      strokeThickness: Math.round(2 * GAME.PX),
    }).setOrigin(0.5, 0).setDepth(100).setScrollFactor(0);

    // Combo text (top-right)
    this._comboText = this.add.text(GAME.WIDTH - pad, top, '', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: HUD.COMBO_FONT_SIZE + 'px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: COLORS.TEXT_SHADOW,
      strokeThickness: Math.round(2 * GAME.PX),
    }).setOrigin(1, 0).setDepth(100).setScrollFactor(0);

    this._timerWarning = false;
    this._timerTween = null;

    // EventBus listeners
    this._onScoreChanged = ({ score }) => {
      this._scoreText.setText('Score: ' + score);
    };

    this._onTimeUpdate = ({ timeLeft }) => {
      this._timerText.setText(timeLeft + 's');

      // Time-low warning
      if (timeLeft <= EFFECTS.TIME_WARNING_THRESHOLD && !this._timerWarning) {
        this._timerWarning = true;
        this._timerText.setColor('#F44336');
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
      this._comboText.setText(combo + 'x COMBO!');
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
