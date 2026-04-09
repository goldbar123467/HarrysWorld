// TitleScene.js — Animated title screen with level select grid and star display

import Phaser from 'phaser';
import { GAME, COLORS, UI, SAFE_ZONE, EFFECTS } from '../core/Constants.js';
import gameState from '../core/GameState.js';
import { LEVELS } from '../core/LevelData.js';
import audioManager from '../core/AudioManager.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    const cx = GAME.WIDTH / 2;
    const px = GAME.PX;

    // Dark background with tiled walls
    this.cameras.main.setBackgroundColor(0x1a1a2e);
    this._tileBackground();

    // Fade in
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Load state
    const savedBest = localStorage.getItem('harrys_world_best_score');
    if (savedBest && parseInt(savedBest) > 0) gameState.bestScore = parseInt(savedBest);
    const savedLevel = localStorage.getItem('harrys_world_max_level');
    if (savedLevel) gameState.maxLevel = parseInt(savedLevel);
    gameState.loadStars();

    this._showingLevelSelect = false;
    this._starting = false;

    // ====== Title Section ======
    // School bell icon
    const bellY = SAFE_ZONE.TOP + Math.round(50 * px);
    const bellSize = Math.round(22 * px);
    const bell = this.add.graphics().setDepth(5);
    bell.fillStyle(0xFFD700);
    bell.fillCircle(cx, bellY, bellSize);
    bell.fillStyle(0xFFA000);
    bell.fillRect(cx - bellSize * 0.15, bellY + bellSize - 2, bellSize * 0.3, bellSize * 0.35);

    // Pulse the bell
    this.tweens.add({
      targets: bell, angle: 5,
      duration: 300, yoyo: true, repeat: -1, delay: 2000,
    });

    // Title text
    const titleY = bellY + Math.round(55 * px);
    const titleTop = this.add.text(cx, titleY, "HARRY'S", {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(48 * px) + 'px',
      color: '#5FCDE4',
      fontStyle: 'bold',
      stroke: '#1a1a2e',
      strokeThickness: Math.round(5 * px),
    }).setOrigin(0.5).setDepth(10).setAlpha(0).setScale(0.3);

    const titleBot = this.add.text(cx, titleY + Math.round(45 * px), 'WORLD', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(56 * px) + 'px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#1a1a2e',
      strokeThickness: Math.round(5 * px),
    }).setOrigin(0.5).setDepth(10).setAlpha(0).setScale(0.3);

    this.tweens.add({
      targets: titleTop, alpha: 1, scaleX: 1, scaleY: 1,
      duration: 600, ease: 'Back.easeOut', delay: 200,
    });
    this.tweens.add({
      targets: titleBot, alpha: 1, scaleX: 1, scaleY: 1,
      duration: 600, ease: 'Back.easeOut', delay: 350,
    });

    // ====== Running Harry ======
    const harryY = titleY + Math.round(120 * px);
    const harry = this.add.sprite(-80, harryY, 'harry').setDepth(10);
    harry.play('harry_walk_anim');

    // Ground line
    const lineY = harryY + harry.displayHeight / 2 + 2;
    const groundLine = this.add.graphics().setDepth(5);
    groundLine.lineStyle(Math.round(2 * px), 0x8B7355);
    groundLine.lineBetween(0, lineY, GAME.WIDTH, lineY);

    // Run Harry across
    this.tweens.add({
      targets: harry, x: GAME.WIDTH + 80,
      duration: 3500, ease: 'Linear', repeat: -1,
      onRepeat: () => { harry.x = -80; },
    });

    // ====== Subtitle & Stats ======
    const subY = lineY + Math.round(18 * px);
    const subtitle = this.add.text(cx, subY, 'Late to class! Run, jump, survive!', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(13 * px) + 'px',
      color: '#CCCCCC',
      fontStyle: 'italic',
    }).setOrigin(0.5).setDepth(10).setAlpha(0);
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 500, delay: 600 });

    // Stats row (best score + total stars)
    const totalStars = gameState.getTotalStars();
    const maxStars = LEVELS.length * 3;
    const statsY = subY + Math.round(22 * px);

    if (gameState.bestScore > 0 || totalStars > 0) {
      const statsItems = [];
      if (gameState.bestScore > 0) statsItems.push(`Best: ${gameState.bestScore}`);
      if (totalStars > 0) statsItems.push(`Stars: ${totalStars}/${maxStars}`);

      const statsText = this.add.text(cx, statsY, statsItems.join('  |  '), {
        fontFamily: UI.FONT_FAMILY,
        fontSize: Math.round(12 * px) + 'px',
        color: '#FFD700',
      }).setOrigin(0.5).setDepth(10).setAlpha(0);
      this.tweens.add({ targets: statsText, alpha: 1, duration: 400, delay: 800 });
    }

    // ====== Buttons ======
    const btnStartY = GAME.HEIGHT - SAFE_ZONE.BOTTOM - Math.round(140 * px);

    // START button
    this._createButton(cx, btnStartY, 'PLAY', 0x4CAF50, 0x66BB6A,
      UI.BUTTON_WIDTH * 1.15, UI.BUTTON_HEIGHT * 1.15,
      Math.round(26 * px), 700, () => this._startGame());

    // Level Select button
    this._createButton(cx, btnStartY + Math.round(65 * px), 'LEVEL SELECT', 0x1E88E5, 0x1565C0,
      UI.BUTTON_WIDTH, UI.BUTTON_HEIGHT * 0.9,
      Math.round(18 * px), 850, () => this._openLevelSelect());

    // Controls hint
    const controlsY = GAME.HEIGHT - SAFE_ZONE.BOTTOM - Math.round(18 * px);
    this.add.text(cx, controlsY, 'Arrow Keys / WASD to move \u2022 Space to jump', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(10 * px) + 'px',
      color: '#777777',
      align: 'center',
    }).setOrigin(0.5).setDepth(10).setAlpha(0.7);

    // Keyboard start
    this.input.keyboard.on('keydown-SPACE', () => this._startGame());
    this.input.keyboard.on('keydown-ENTER', () => this._startGame());

    // Level select container (hidden initially)
    this._levelSelectContainer = null;
  }

  _openLevelSelect() {
    if (this._showingLevelSelect) return;
    this._showingLevelSelect = true;

    const cx = GAME.WIDTH / 2;
    const px = GAME.PX;

    // Dark overlay
    const overlay = this.add.rectangle(cx, GAME.HEIGHT / 2, GAME.WIDTH, GAME.HEIGHT, 0x000000, 0)
      .setDepth(30).setInteractive();
    this.tweens.add({ targets: overlay, fillAlpha: 0.8, duration: 300 });

    const container = this.add.container(0, 0).setDepth(31);
    this._levelSelectContainer = container;

    // Title
    const title = this.add.text(cx, SAFE_ZONE.TOP + Math.round(30 * px), 'SELECT LEVEL', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(28 * px) + 'px',
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: Math.round(3 * px),
    }).setOrigin(0.5);
    container.add(title);

    // Level cards grid
    const gridStartY = SAFE_ZONE.TOP + Math.round(80 * px);
    const cardW = Math.round(140 * px);
    const cardH = Math.round(80 * px);
    const gap = Math.round(16 * px);
    const cols = 3;

    LEVELS.forEach((level, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cardX = cx - (cols - 1) * (cardW + gap) / 2 + col * (cardW + gap);
      const cardY = gridStartY + row * (cardH + gap);

      const unlocked = (i + 1) <= (gameState.maxLevel || 1);
      const stars = gameState.levelStars[i + 1] || 0;

      // Card background
      const card = this.add.graphics();
      const bgColor = unlocked ? 0x2E3B55 : 0x1A1A2E;
      card.fillStyle(bgColor, 1);
      card.fillRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, Math.round(8 * px));
      if (unlocked) {
        card.lineStyle(Math.round(2 * px), 0x4A90D9);
        card.strokeRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, Math.round(8 * px));
      }
      container.add(card);

      // Level number
      const numText = this.add.text(cardX, cardY - Math.round(18 * px), `${i + 1}`, {
        fontFamily: UI.FONT_FAMILY,
        fontSize: Math.round(22 * px) + 'px',
        color: unlocked ? '#FFFFFF' : '#555555',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(numText);

      // Level name
      const nameText = this.add.text(cardX, cardY + Math.round(5 * px), level.name, {
        fontFamily: UI.FONT_FAMILY,
        fontSize: Math.round(9 * px) + 'px',
        color: unlocked ? '#AAAAAA' : '#444444',
      }).setOrigin(0.5);
      container.add(nameText);

      // Stars
      if (unlocked) {
        const starY = cardY + Math.round(25 * px);
        const starSpacing = Math.round(16 * px);
        for (let s = 0; s < 3; s++) {
          const sx = cardX - starSpacing + s * starSpacing;
          const filled = s < stars;
          const starGfx = this._drawMiniStar(sx, starY, Math.round(7 * px), filled);
          container.add(starGfx);
        }
      } else {
        // Lock icon
        const lockText = this.add.text(cardX, cardY + Math.round(22 * px), '\uD83D\uDD12', {
          fontSize: Math.round(14 * px) + 'px',
        }).setOrigin(0.5);
        container.add(lockText);
      }

      // Click handler
      if (unlocked) {
        const hitArea = this.add.rectangle(cardX, cardY, cardW, cardH, 0x000000, 0)
          .setInteractive({ useHandCursor: true });
        container.add(hitArea);

        hitArea.on('pointerover', () => {
          card.clear();
          card.fillStyle(0x3A4B6B, 1);
          card.fillRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, Math.round(8 * px));
          card.lineStyle(Math.round(2 * px), 0x64B5F6);
          card.strokeRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, Math.round(8 * px));
        });
        hitArea.on('pointerout', () => {
          card.clear();
          card.fillStyle(bgColor, 1);
          card.fillRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, Math.round(8 * px));
          card.lineStyle(Math.round(2 * px), 0x4A90D9);
          card.strokeRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, Math.round(8 * px));
        });
        hitArea.on('pointerdown', () => {
          gameState.level = i + 1;
          this._startGame();
        });
      }
    });

    // Back button
    const backY = GAME.HEIGHT - SAFE_ZONE.BOTTOM - Math.round(40 * px);
    const backGfx = this.add.graphics();
    backGfx.fillStyle(0x616161, 1);
    const bw = Math.round(100 * px);
    const bh = Math.round(40 * px);
    backGfx.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, Math.round(6 * px));

    const backText = this.add.text(0, 0, 'BACK', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(16 * px) + 'px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const backContainer = this.add.container(cx, backY, [backGfx, backText])
      .setSize(bw, bh)
      .setInteractive({ useHandCursor: true });
    container.add(backContainer);

    backContainer.on('pointerdown', () => this._closeLevelSelect(overlay, container));
    overlay.on('pointerdown', () => this._closeLevelSelect(overlay, container));

    this.input.keyboard.once('keydown-ESC', () => this._closeLevelSelect(overlay, container));

    // Animate in
    container.setAlpha(0);
    this.tweens.add({ targets: container, alpha: 1, duration: 300, ease: 'Sine.easeOut' });
  }

  _closeLevelSelect(overlay, container) {
    this._showingLevelSelect = false;
    this.tweens.add({
      targets: [overlay, container],
      alpha: 0,
      duration: 200,
      onComplete: () => {
        overlay.destroy();
        container.destroy();
      },
    });
  }

  _drawMiniStar(x, y, size, filled) {
    const gfx = this.add.graphics();
    gfx.fillStyle(filled ? 0xFFD700 : 0x555555, filled ? 1 : 0.4);
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
    return gfx;
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

  _createButton(x, y, label, bgColor, hoverColor, w, h, fontSize, delay, callback) {
    const gfx = this.add.graphics();
    gfx.fillStyle(bgColor, 1);
    gfx.fillRoundedRect(-w / 2, -h / 2, w, h, UI.BUTTON_RADIUS);

    const text = this.add.text(0, 0, label, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: fontSize + 'px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const container = this.add.container(x, y, [gfx, text])
      .setSize(w, h)
      .setInteractive({ useHandCursor: true })
      .setDepth(20).setAlpha(0).setScale(0.5);

    this.tweens.add({
      targets: container, alpha: 1, scaleX: 1, scaleY: 1,
      duration: 500, ease: 'Back.easeOut', delay,
    });

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
