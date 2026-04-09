// TitleScene.js — Animated title screen with school theme

import Phaser from 'phaser';
import { GAME, COLORS, UI, SAFE_ZONE, EFFECTS } from '../core/Constants.js';
import gameState from '../core/GameState.js';
import audioManager from '../core/AudioManager.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    const cx = GAME.WIDTH / 2;

    // Dark background with tiled walls
    this.cameras.main.setBackgroundColor(0x1a1a2e);
    this._tileBackground();

    // Fade in
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // School bell icon
    const bellY = SAFE_ZONE.TOP + Math.round(60 * GAME.PX);
    const bellSize = Math.round(28 * GAME.PX);
    const bell = this.add.graphics().setDepth(5);
    bell.fillStyle(0xFFD700);
    bell.fillCircle(cx, bellY, bellSize);
    bell.fillStyle(0xFFA000);
    bell.fillRect(cx - bellSize * 0.15, bellY + bellSize - 2, bellSize * 0.3, bellSize * 0.4);

    // Title text
    const titleY = bellY + Math.round(70 * GAME.PX);
    const titleTop = this.add.text(cx, titleY, "HARRY'S", {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(52 * GAME.PX) + 'px',
      color: '#5FCDE4',
      fontStyle: 'bold',
      stroke: '#1a1a2e',
      strokeThickness: Math.round(5 * GAME.PX),
    }).setOrigin(0.5).setDepth(10).setAlpha(0).setScale(0.3);

    const titleBot = this.add.text(cx, titleY + Math.round(50 * GAME.PX), 'WORLD', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(60 * GAME.PX) + 'px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#1a1a2e',
      strokeThickness: Math.round(5 * GAME.PX),
    }).setOrigin(0.5).setDepth(10).setAlpha(0).setScale(0.3);

    // Animate titles
    this.tweens.add({
      targets: titleTop, alpha: 1, scaleX: 1, scaleY: 1,
      duration: 600, ease: 'Back.easeOut', delay: 300,
    });
    this.tweens.add({
      targets: titleBot, alpha: 1, scaleX: 1, scaleY: 1,
      duration: 600, ease: 'Back.easeOut', delay: 450,
    });

    // Harry sprite running
    const harryY = titleY + Math.round(140 * GAME.PX);
    const harry = this.add.sprite(-80, harryY, 'harry').setDepth(10);
    harry.play('harry_walk_anim');

    // Ground line
    const lineY = harryY + harry.displayHeight / 2 + 2;
    const groundLine = this.add.graphics().setDepth(5);
    groundLine.lineStyle(Math.round(2 * GAME.PX), 0x8B7355);
    groundLine.lineBetween(0, lineY, GAME.WIDTH, lineY);

    // Run Harry across
    this.tweens.add({
      targets: harry, x: GAME.WIDTH + 80,
      duration: 3000, ease: 'Linear', repeat: -1,
      onRepeat: () => { harry.x = -80; },
    });

    // Subtitle
    const subY = lineY + Math.round(30 * GAME.PX);
    const subtitle = this.add.text(cx, subY, 'Late to class! Run, jump, survive!', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(16 * GAME.PX) + 'px',
      color: '#CCCCCC',
      fontStyle: 'italic',
    }).setOrigin(0.5).setDepth(10).setAlpha(0);
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 500, delay: 800 });

    // Load best score from localStorage
    const savedBest = localStorage.getItem('harrys_world_best_score');
    if (savedBest && parseInt(savedBest) > 0) {
      gameState.bestScore = parseInt(savedBest);
      const bestY = subY + Math.round(30 * GAME.PX);
      const bestText = this.add.text(cx, bestY, 'Best Score: ' + gameState.bestScore, {
        fontFamily: UI.FONT_FAMILY,
        fontSize: Math.round(14 * GAME.PX) + 'px',
        color: '#FFD700',
      }).setOrigin(0.5).setDepth(10).setAlpha(0);
      this.tweens.add({ targets: bestText, alpha: 1, duration: 400, delay: 1000 });
    }

    // Load level progress
    const savedLevel = localStorage.getItem('harrys_world_max_level');
    if (savedLevel) gameState.maxLevel = parseInt(savedLevel);

    // START button
    const btnY = GAME.HEIGHT - SAFE_ZONE.BOTTOM - Math.round(180 * GAME.PX);
    this._createButton(cx, btnY, 'START', 0x4CAF50, 0x66BB6A,
      UI.BUTTON_WIDTH * 1.2, UI.BUTTON_HEIGHT * 1.2,
      Math.round(28 * GAME.PX), 900, () => this._startGame());

    // Level button
    const lvlBtnY = btnY + Math.round(70 * GAME.PX);
    const currentLevel = gameState.level || 1;
    this._levelText = null;
    this._createButton(cx, lvlBtnY, 'Level ' + currentLevel, 0x1E88E5, 0x1565C0,
      UI.BUTTON_WIDTH, UI.BUTTON_HEIGHT,
      Math.round(20 * GAME.PX), 1050, () => this._cycleLevel(), true);

    // Controls hint
    const controlsY = GAME.HEIGHT - SAFE_ZONE.BOTTOM - Math.round(30 * GAME.PX);
    this.add.text(cx, controlsY, 'Arrow Keys / WASD to move \u2022 Space to jump', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(11 * GAME.PX) + 'px',
      color: '#999999',
      align: 'center',
    }).setOrigin(0.5).setDepth(10).setAlpha(0.7);

    // Keyboard start
    this.input.keyboard.on('keydown-SPACE', () => this._startGame());
    this.input.keyboard.on('keydown-ENTER', () => this._startGame());

    this._starting = false;
  }

  _tileBackground() {
    const wallTexture = this.textures.get('wall');
    const wallFrame = wallTexture.getSourceImage();
    const tileW = wallFrame.width;
    const tileH = wallFrame.height;
    const numTilesX = Math.ceil(GAME.WIDTH / tileW) + 1;
    const numTilesY = Math.ceil(GAME.HEIGHT / tileH) + 1;
    for (let ix = 0; ix < numTilesX; ix++) {
      for (let iy = 0; iy < numTilesY; iy++) {
        this.add.image(ix * tileW + tileW / 2, iy * tileH + tileH / 2, 'wall')
          .setDepth(0).setAlpha(0.15);
      }
    }
  }

  _createButton(x, y, label, bgColor, hoverColor, w, h, fontSize, delay, callback, isLevelBtn) {
    const gfx = this.add.graphics();
    gfx.fillStyle(bgColor, 1);
    gfx.fillRoundedRect(-w / 2, -h / 2, w, h, UI.BUTTON_RADIUS);

    const text = this.add.text(0, 0, label, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: fontSize + 'px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    if (isLevelBtn) this._levelText = text;

    const container = this.add.container(x, y, [gfx, text])
      .setSize(w, h)
      .setInteractive({ useHandCursor: true })
      .setDepth(20).setAlpha(0).setScale(0.5);

    this.tweens.add({
      targets: container, alpha: 1, scaleX: 1, scaleY: 1,
      duration: 500, ease: 'Back.easeOut', delay,
    });

    if (!isLevelBtn) {
      // Pulse the start button
      this.time.delayedCall(delay + 500, () => {
        this.tweens.add({
          targets: container,
          scaleX: 1.05, scaleY: 1.05,
          duration: 800, yoyo: true, repeat: -1,
          ease: 'Sine.easeInOut',
        });
      });
    }

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

  _cycleLevel() {
    const maxLevel = gameState.maxLevel || 1;
    gameState.level = ((gameState.level || 1) % maxLevel) + 1;
    if (this._levelText) this._levelText.setText('Level ' + gameState.level);
  }

  _startGame() {
    if (this._starting) return;
    this._starting = true;
    audioManager.init();
    audioManager.playMenuClick();
    gameState.reset();
    if (!gameState.level) gameState.level = 1;
    this.cameras.main.fadeOut(EFFECTS.FADE_DURATION, 0, 0, 0);
    this.time.delayedCall(EFFECTS.FADE_DURATION, () => {
      this.scene.start('GameScene');
    });
  }
}
