// LevelSelectScene.js — Level selection grid with star ratings

import Phaser from 'phaser';
import { GAME, COLORS, UI, SAFE_ZONE, EFFECTS } from '../core/Constants.js';
import gameState from '../core/GameState.js';
import { LEVELS } from '../core/LevelData.js';
import audioManager from '../core/AudioManager.js';

export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelectScene');
  }

  create() {
    const cx = GAME.WIDTH / 2;

    this.cameras.main.setBackgroundColor(0x1a1a2e);
    this._tileBackground();
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Load stars from localStorage
    const savedStars = JSON.parse(localStorage.getItem('harrys_world_stars') || '{}');
    gameState.levelStars = savedStars;

    // Title
    const title = this.add.text(cx, SAFE_ZONE.TOP + Math.round(30 * GAME.PX), 'SELECT LEVEL', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(36 * GAME.PX) + 'px',
      color: '#5FCDE4',
      fontStyle: 'bold',
      stroke: '#1a1a2e',
      strokeThickness: Math.round(4 * GAME.PX),
    }).setOrigin(0.5).setDepth(10);

    // Level buttons in a grid
    const maxLevel = gameState.maxLevel || 1;
    const btnSize = Math.round(100 * GAME.PX);
    const spacing = Math.round(20 * GAME.PX);
    const cols = Math.min(LEVELS.length, 3);
    const rows = Math.ceil(LEVELS.length / cols);
    const gridW = cols * btnSize + (cols - 1) * spacing;
    const startX = cx - gridW / 2 + btnSize / 2;
    const startY = SAFE_ZONE.TOP + Math.round(100 * GAME.PX);

    this._transitioning = false;

    LEVELS.forEach((level, idx) => {
      const levelNum = idx + 1;
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = startX + col * (btnSize + spacing);
      const y = startY + row * (btnSize + spacing + Math.round(10 * GAME.PX));
      const isUnlocked = levelNum <= maxLevel;
      const stars = savedStars[levelNum] || 0;

      this._createLevelButton(x, y, btnSize, levelNum, level.name, isUnlocked, stars, idx * 80);
    });

    // Back button
    const backY = GAME.HEIGHT - SAFE_ZONE.BOTTOM - Math.round(40 * GAME.PX);
    this._createBackButton(cx, backY);

    // Keyboard: ESC to go back
    this.input.keyboard.on('keydown-ESC', () => this._goBack());
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
          .setDepth(0).setAlpha(0.1);
      }
    }
  }

  _createLevelButton(x, y, size, levelNum, name, unlocked, stars, delay) {
    const gfx = this.add.graphics();
    const bgColor = unlocked ? 0x1E88E5 : 0x424242;
    gfx.fillStyle(bgColor, 1);
    gfx.fillRoundedRect(-size / 2, -size / 2, size, size, Math.round(8 * GAME.PX));

    // Level number
    const numText = this.add.text(0, Math.round(-12 * GAME.PX), levelNum.toString(), {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(28 * GAME.PX) + 'px',
      color: unlocked ? '#FFFFFF' : '#888888',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Level name
    const nameText = this.add.text(0, Math.round(14 * GAME.PX), name, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(8 * GAME.PX) + 'px',
      color: unlocked ? '#CCCCCC' : '#666666',
      align: 'center',
      wordWrap: { width: size - Math.round(10 * GAME.PX) },
    }).setOrigin(0.5);

    // Stars
    const starSize = Math.round(12 * GAME.PX);
    const starSpacing = Math.round(14 * GAME.PX);
    const starStartX = -starSpacing;
    const starTexts = [];
    for (let i = 0; i < 3; i++) {
      const filled = i < stars;
      const star = this.add.text(starStartX + i * starSpacing, Math.round(30 * GAME.PX), '\u2605', {
        fontFamily: UI.FONT_FAMILY,
        fontSize: starSize + 'px',
        color: filled ? '#FFD700' : (unlocked ? '#555555' : '#333333'),
      }).setOrigin(0.5);
      starTexts.push(star);
    }

    // Lock icon if locked
    let lockText = null;
    if (!unlocked) {
      lockText = this.add.text(0, Math.round(-12 * GAME.PX), '\uD83D\uDD12', {
        fontFamily: UI.FONT_FAMILY,
        fontSize: Math.round(24 * GAME.PX) + 'px',
      }).setOrigin(0.5);
      numText.setVisible(false);
    }

    const children = [gfx, numText, nameText, ...starTexts];
    if (lockText) children.push(lockText);

    const container = this.add.container(x, y, children)
      .setSize(size, size)
      .setDepth(5)
      .setAlpha(0).setScale(0.5);

    this.tweens.add({
      targets: container, alpha: 1, scaleX: 1, scaleY: 1,
      duration: 400, ease: 'Back.easeOut', delay: 200 + delay,
    });

    if (unlocked) {
      container.setInteractive({ useHandCursor: true });
      container.on('pointerover', () => {
        gfx.clear();
        gfx.fillStyle(0x1565C0, 1);
        gfx.fillRoundedRect(-size / 2, -size / 2, size, size, Math.round(8 * GAME.PX));
        this.tweens.add({ targets: container, scaleX: 1.08, scaleY: 1.08, duration: 100 });
      });
      container.on('pointerout', () => {
        gfx.clear();
        gfx.fillStyle(bgColor, 1);
        gfx.fillRoundedRect(-size / 2, -size / 2, size, size, Math.round(8 * GAME.PX));
        this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
      });
      container.on('pointerdown', () => {
        if (this._transitioning) return;
        this._transitioning = true;
        audioManager.playMenuClick();
        this._startLevel(levelNum);
      });
    }
  }

  _createBackButton(x, y) {
    const w = Math.round(140 * GAME.PX);
    const h = UI.BUTTON_HEIGHT * 0.8;
    const gfx = this.add.graphics();
    gfx.fillStyle(0x616161, 1);
    gfx.fillRoundedRect(-w / 2, -h / 2, w, h, UI.BUTTON_RADIUS);

    const text = this.add.text(0, 0, 'Back', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(18 * GAME.PX) + 'px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const container = this.add.container(x, y, [gfx, text])
      .setSize(w, h)
      .setInteractive({ useHandCursor: true })
      .setDepth(10);

    container.on('pointerover', () => {
      gfx.clear();
      gfx.fillStyle(0x757575, 1);
      gfx.fillRoundedRect(-w / 2, -h / 2, w, h, UI.BUTTON_RADIUS);
    });
    container.on('pointerout', () => {
      gfx.clear();
      gfx.fillStyle(0x616161, 1);
      gfx.fillRoundedRect(-w / 2, -h / 2, w, h, UI.BUTTON_RADIUS);
    });
    container.on('pointerdown', () => this._goBack());
  }

  _startLevel(level) {
    gameState.reset();
    gameState.level = level;
    audioManager.init();
    this.cameras.main.fadeOut(EFFECTS.FADE_DURATION, 0, 0, 0);
    this.time.delayedCall(EFFECTS.FADE_DURATION, () => {
      this.scene.start('GameScene');
    });
  }

  _goBack() {
    if (this._transitioning) return;
    this._transitioning = true;
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.time.delayedCall(200, () => {
      this.scene.start('TitleScene');
    });
  }
}
