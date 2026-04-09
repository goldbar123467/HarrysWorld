// GameScene.js — Main gameplay scene

import Phaser from 'phaser';
import {
  GAME, PLAYER, OBSTACLE, COLLECTIBLE, HALL_MONITOR, COLORS, TOUCH, SAFE_ZONE, UI, EFFECTS, HUD,
} from '../core/Constants.js';
import eventBus, { Events } from '../core/EventBus.js';
import gameState from '../core/GameState.js';
import { getLevelData } from '../core/LevelData.js';
import Player from '../entities/Player.js';
import ObstacleEntity from '../entities/Obstacle.js';
import CollectibleEntity from '../entities/Collectible.js';
import HallMonitor from '../entities/HallMonitor.js';
import PaperAirplane from '../entities/PaperAirplane.js';
import audioManager from '../core/AudioManager.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    gameState.started = true;
    gameState.gameOver = false;
    this._gameEnded = false;
    this._comboTimer = 0;
    this._lastCollectTime = 0;

    // Load level data
    const level = gameState.level || 1;
    this._levelData = getLevelData(level);
    const levelWidth = Math.round(this._levelData.levelWidth * GAME.PX);
    this._levelWidth = levelWidth;

    // Set time limit from level
    gameState.timeLeft = this._levelData.timeLimit;

    // World bounds
    this.physics.world.setBounds(0, 0, levelWidth, GAME.HEIGHT);
    this.cameras.main.setBounds(0, 0, levelWidth, GAME.HEIGHT);
    this.cameras.main.setBackgroundColor(GAME.BG_COLOR);

    // Input state
    this._inputState = { left: false, right: false, jump: false };

    // Build level
    this._createBackground(levelWidth);
    this._createGround(levelWidth);
    this._createPlatforms();
    this._createObstacles(levelWidth);
    this._createCollectibles();
    this._createPowerups();
    this._createHallMonitors();
    this._createPaperAirplanes();
    this._createDoor(levelWidth);

    // Moving platforms
    this._createMovingPlatforms();

    // Checkpoints
    this._createCheckpoints();

    // Player
    this.player = new Player(this, PLAYER.SPAWN_X, PLAYER.SPAWN_Y);

    // Camera follow
    this.cameras.main.startFollow(this.player, true, 0.1, 0.05);

    // Collisions
    this.physics.add.collider(this.player, this._groundGroup);
    this.physics.add.collider(this.player, this._platformGroup);
    this.physics.add.collider(this.player, this._obstacleGroup);
    this.physics.add.collider(this._monitorGroup, this._groundGroup);
    this.physics.add.collider(this._monitorGroup, this._platformGroup);
    if (this._movingPlatformGroup) {
      this.physics.add.collider(this.player, this._movingPlatformGroup);
    }

    // Overlaps
    this.physics.add.overlap(this.player, this._collectibleGroup, this._onCollect, null, this);
    this.physics.add.overlap(this.player, this._monitorGroup, this._onHitMonitor, null, this);
    if (this._airplaneGroup) {
      this.physics.add.overlap(this.player, this._airplaneGroup, this._onHitMonitor, null, this);
    }
    this.physics.add.overlap(this.player, this._doorSprite, this._onReachDoor, null, this);
    if (this._powerupGroup) {
      this.physics.add.overlap(this.player, this._powerupGroup, this._onPowerup, null, this);
    }
    if (this._checkpointGroup) {
      this.physics.add.overlap(this.player, this._checkpointGroup, this._onCheckpoint, null, this);
    }

    // Keyboard
    this._cursors = this.input.keyboard.createCursorKeys();
    this._spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this._aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this._dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this._wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this._escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Touch controls
    this._setupTouchControls();

    // Timer
    this._timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this._onTimerTick,
      callbackScope: this,
      loop: true,
    });

    // EventBus listeners
    this._onPlayerDied = () => this._endGame(false);
    eventBus.on(Events.PLAYER_DIED, this._onPlayerDied);

    this.events.on('shutdown', this.shutdown, this);

    // Launch HUD
    this.scene.launch('HUDScene');

    // Particle textures
    this._createParticleTextures();

    // Landing dust
    this._onPlayerLanded = () => this._emitDustParticles();
    eventBus.on(Events.PLAYER_LANDED, this._onPlayerLanded);

    // Fade in
    this.cameras.main.fadeIn(EFFECTS.FADE_DURATION, 0, 0, 0);

    // Parallax decorations
    this._createParallaxElements();

    // Level name banner
    this._showLevelBanner();

    // Tutorial overlay (level 1, first time)
    if ((gameState.level || 1) === 1 && !localStorage.getItem('harrys_world_tutorial_done')) {
      this._showTutorial();
    }

    eventBus.emit(Events.GAME_START);
    eventBus.emit(Events.SPECTACLE_ENTRANCE, { entity: 'level' });

    // Pause handler
    this._onPause = () => {
      if (this._gameEnded) return;
      this.scene.pause('GameScene');
      this.scene.pause('HUDScene');
      this.scene.launch('PauseScene');
    };
    this._escKey.on('down', this._onPause);
    eventBus.on(Events.GAME_PAUSE, this._onPause);
  }

  _showLevelBanner() {
    const level = gameState.level || 1;
    const name = this._levelData.name || 'Level ' + level;
    const banner = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.35, `Level ${level}\n${name}`, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(28 * GAME.PX) + 'px',
      color: '#FFFFFF',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#000000',
      strokeThickness: Math.round(3 * GAME.PX),
    }).setOrigin(0.5).setDepth(50).setScrollFactor(0).setAlpha(0);

    this.tweens.add({
      targets: banner,
      alpha: 1,
      duration: 400,
      hold: 1500,
      yoyo: true,
      onComplete: () => banner.destroy(),
    });
  }

  _createParticleTextures() {
    if (!this.textures.exists('dust_particle')) {
      const dg = this.make.graphics({ add: false });
      const dustSize = Math.max(Math.round(3 * GAME.PX), 2);
      dg.fillStyle(0xBCAAA4);
      dg.fillCircle(dustSize, dustSize, dustSize);
      dg.generateTexture('dust_particle', dustSize * 2, dustSize * 2);
      dg.destroy();
    }

    if (!this.textures.exists('sparkle_particle')) {
      const sg = this.make.graphics({ add: false });
      const spSize = Math.max(Math.round(3 * GAME.PX), 2);
      sg.fillStyle(0xFFD700);
      sg.fillRect(spSize, 0, spSize, spSize * 2);
      sg.fillRect(0, spSize, spSize * 2, spSize);
      sg.generateTexture('sparkle_particle', spSize * 2, spSize * 2);
      sg.destroy();
    }

    // Shield particle
    if (!this.textures.exists('shield_particle')) {
      const shg = this.make.graphics({ add: false });
      const shSize = Math.max(Math.round(3 * GAME.PX), 2);
      shg.fillStyle(0x42A5F5);
      shg.fillCircle(shSize, shSize, shSize);
      shg.generateTexture('shield_particle', shSize * 2, shSize * 2);
      shg.destroy();
    }
  }

  _emitDustParticles() {
    if (!this.player || !this.player.active) return;
    const px = this.player.x;
    const py = this.player.y + this.player.displayHeight / 2;

    for (let i = 0; i < EFFECTS.DUST_COUNT; i++) {
      const dust = this.add.image(px, py, 'dust_particle').setDepth(9).setAlpha(0.7);
      const angle = Math.PI + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = EFFECTS.DUST_SPEED * (0.5 + Math.random() * 0.5);
      this.tweens.add({
        targets: dust,
        x: px + Math.cos(angle) * speed,
        y: py + Math.sin(angle) * speed * 0.3 - Math.random() * EFFECTS.DUST_SPEED * 0.5,
        alpha: 0, scaleX: 0.3, scaleY: 0.3,
        duration: EFFECTS.DUST_LIFESPAN,
        onComplete: () => dust.destroy(),
      });
    }
  }

  _emitSparkles(x, y) {
    for (let i = 0; i < EFFECTS.SPARKLE_COUNT; i++) {
      const sparkle = this.add.image(x, y, 'sparkle_particle').setDepth(15).setAlpha(1);
      const angle = (Math.PI * 2 / EFFECTS.SPARKLE_COUNT) * i + (Math.random() - 0.5) * 0.5;
      const speed = EFFECTS.SPARKLE_SPEED * (0.5 + Math.random() * 0.5);
      this.tweens.add({
        targets: sparkle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0, scaleX: 0.2, scaleY: 0.2,
        duration: EFFECTS.SPARKLE_LIFESPAN,
        ease: 'Quad.easeOut',
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  _createBackground(levelWidth) {
    const theme = this._levelData.theme || {
      wallColor: 0xE8E0D4, wallAccent: 0xD4C5A9,
      lockerColors: [0x4A90D9, 0x5BA0E9], trimColor: 0x8B7355, ceilingColor: 0xF5F5F0,
    };

    // --- Solid wall background (colored per level) ---
    const wallBg = this.add.graphics().setDepth(-12);
    wallBg.fillStyle(theme.wallColor, 1);
    wallBg.fillRect(0, 0, levelWidth, GAME.GROUND_Y);

    // --- Ceiling strip ---
    const ceilH = Math.round(20 * GAME.PX);
    wallBg.fillStyle(theme.ceilingColor, 1);
    wallBg.fillRect(0, 0, levelWidth, ceilH);

    // Crown molding line
    wallBg.fillStyle(theme.trimColor, 1);
    wallBg.fillRect(0, ceilH, levelWidth, Math.round(4 * GAME.PX));

    // --- Wainscoting (lower wall panel) ---
    const wainscotY = GAME.GROUND_Y * 0.62;
    const wainscotH = GAME.GROUND_Y - wainscotY;
    wallBg.fillStyle(theme.wallAccent, 1);
    wallBg.fillRect(0, wainscotY, levelWidth, wainscotH);

    // Chair rail (divider line)
    wallBg.fillStyle(theme.trimColor, 1);
    wallBg.fillRect(0, wainscotY, levelWidth, Math.round(3 * GAME.PX));

    // Baseboard
    wallBg.fillStyle(theme.trimColor, 1);
    wallBg.fillRect(0, GAME.GROUND_Y - Math.round(6 * GAME.PX), levelWidth, Math.round(6 * GAME.PX));

    // --- Tile grid pattern on wall (subtle) ---
    const gridGfx = this.add.graphics().setDepth(-11).setAlpha(0.06);
    const gridSpacing = Math.round(48 * GAME.PX);
    gridGfx.lineStyle(1, 0x000000);
    for (let x = 0; x < levelWidth; x += gridSpacing) {
      gridGfx.lineBetween(x, ceilH, x, wainscotY);
    }
    for (let y = ceilH; y < wainscotY; y += gridSpacing) {
      gridGfx.lineBetween(0, y, levelWidth, y);
    }

    // --- Colored Lockers ---
    const lockerGfx = this.add.graphics().setDepth(-5);
    const lockerW = Math.round(22 * GAME.PX);
    const lockerH = Math.round(70 * GAME.PX);
    const lockerSpacing = Math.round(120 * GAME.PX);
    const lockerY = GAME.GROUND_Y - lockerH - Math.round(6 * GAME.PX);
    const numLockers = Math.ceil(levelWidth / lockerSpacing);

    for (let i = 0; i < numLockers; i++) {
      const lx = i * lockerSpacing + Math.round(40 * GAME.PX);
      const color = theme.lockerColors[i % theme.lockerColors.length];
      const darkColor = Phaser.Display.Color.ValueToColor(color).darken(20).color;

      // Locker body
      lockerGfx.fillStyle(color, 1);
      lockerGfx.fillRect(lx, lockerY, lockerW, lockerH);
      // Locker border
      lockerGfx.lineStyle(Math.round(1.5 * GAME.PX), darkColor);
      lockerGfx.strokeRect(lx, lockerY, lockerW, lockerH);
      // Divider line (two locker doors)
      lockerGfx.lineBetween(lx, lockerY + lockerH / 2, lx + lockerW, lockerY + lockerH / 2);
      // Handle dots
      const handleX = lx + lockerW * 0.7;
      lockerGfx.fillStyle(0xC0C0C0, 1);
      lockerGfx.fillCircle(handleX, lockerY + lockerH * 0.3, Math.round(2 * GAME.PX));
      lockerGfx.fillCircle(handleX, lockerY + lockerH * 0.7, Math.round(2 * GAME.PX));
      // Vent slots (top of each door)
      lockerGfx.fillStyle(darkColor, 0.4);
      for (let s = 0; s < 3; s++) {
        const sy = lockerY + Math.round(6 * GAME.PX) + s * Math.round(4 * GAME.PX);
        lockerGfx.fillRect(lx + Math.round(4 * GAME.PX), sy, lockerW * 0.5, Math.round(1.5 * GAME.PX));
      }
    }

    // --- Wall Decorations ---
    this._createWallDecorations(levelWidth, theme, ceilH, wainscotY);
  }

  _createWallDecorations(levelWidth, theme, ceilH, wainscotY) {
    const decoGfx = this.add.graphics().setDepth(-6);
    const px = GAME.PX;

    // Decoration spacing
    const sectionWidth = Math.round(400 * px);
    const numSections = Math.ceil(levelWidth / sectionWidth);
    const decoTypes = ['clock', 'poster', 'bulletin', 'exitSign', 'poster2', 'trophy'];

    for (let i = 0; i < numSections; i++) {
      const baseX = i * sectionWidth + sectionWidth / 2;
      const type = decoTypes[i % decoTypes.length];
      const upperY = ceilH + (wainscotY - ceilH) * 0.45;

      if (type === 'clock') {
        // Wall clock
        const r = Math.round(18 * px);
        decoGfx.fillStyle(0xFAFAFA, 1);
        decoGfx.fillCircle(baseX, upperY, r);
        decoGfx.lineStyle(Math.round(2 * px), 0x333333);
        decoGfx.strokeCircle(baseX, upperY, r);
        // Clock hands
        decoGfx.lineStyle(Math.round(2 * px), 0x333333);
        decoGfx.lineBetween(baseX, upperY, baseX, upperY - r * 0.6); // minute
        decoGfx.lineBetween(baseX, upperY, baseX + r * 0.4, upperY + r * 0.1); // hour
        // Hour marks
        for (let h = 0; h < 12; h++) {
          const angle = (h / 12) * Math.PI * 2 - Math.PI / 2;
          const mx = baseX + Math.cos(angle) * r * 0.8;
          const my = upperY + Math.sin(angle) * r * 0.8;
          decoGfx.fillStyle(0x333333, 1);
          decoGfx.fillCircle(mx, my, Math.round(1.5 * px));
        }
      } else if (type === 'poster' || type === 'poster2') {
        // Colorful school poster
        const w = Math.round(45 * px);
        const h = Math.round(55 * px);
        const colors = type === 'poster'
          ? [0xFF7043, 0xFFEB3B, 0x4FC3F7] // orange/yellow/blue
          : [0x66BB6A, 0xAB47BC, 0xFFA726]; // green/purple/orange
        const posterColor = colors[i % colors.length];
        // Paper shadow
        decoGfx.fillStyle(0x000000, 0.1);
        decoGfx.fillRect(baseX - w / 2 + 2, upperY - h / 2 + 2, w, h);
        // Poster body
        decoGfx.fillStyle(posterColor, 1);
        decoGfx.fillRect(baseX - w / 2, upperY - h / 2, w, h);
        // Border
        decoGfx.lineStyle(Math.round(1 * px), 0x333333, 0.3);
        decoGfx.strokeRect(baseX - w / 2, upperY - h / 2, w, h);
        // Text lines
        decoGfx.fillStyle(0xFFFFFF, 0.8);
        for (let line = 0; line < 3; line++) {
          const lw = w * (0.5 + Math.random() * 0.3);
          decoGfx.fillRect(baseX - lw / 2, upperY - h / 4 + line * Math.round(10 * px), lw, Math.round(3 * px));
        }
        // Thumb tack
        decoGfx.fillStyle(0xF44336, 1);
        decoGfx.fillCircle(baseX, upperY - h / 2 - Math.round(1 * px), Math.round(3 * px));
      } else if (type === 'bulletin') {
        // Bulletin board
        const w = Math.round(70 * px);
        const h = Math.round(50 * px);
        // Cork background
        decoGfx.fillStyle(0xD4A76A, 1);
        decoGfx.fillRect(baseX - w / 2, upperY - h / 2, w, h);
        // Wood frame
        decoGfx.lineStyle(Math.round(3 * px), 0x795548);
        decoGfx.strokeRect(baseX - w / 2, upperY - h / 2, w, h);
        // Pinned papers
        const paperColors = [0xFFFFFF, 0xFFF9C4, 0xE1F5FE, 0xFCE4EC, 0xE8F5E9];
        for (let p = 0; p < 5; p++) {
          const pw = Math.round((12 + Math.random() * 10) * px);
          const ph = Math.round((10 + Math.random() * 12) * px);
          const ppx = baseX - w / 3 + Math.random() * w * 0.6;
          const ppy = upperY - h / 3 + Math.random() * h * 0.5;
          decoGfx.fillStyle(paperColors[p % paperColors.length], 0.9);
          decoGfx.fillRect(ppx, ppy, pw, ph);
          // Pin
          decoGfx.fillStyle([0xF44336, 0x2196F3, 0x4CAF50, 0xFFEB3B, 0xFF9800][p % 5], 1);
          decoGfx.fillCircle(ppx + pw / 2, ppy, Math.round(2 * px));
        }
      } else if (type === 'exitSign') {
        // Exit sign
        const w = Math.round(50 * px);
        const h = Math.round(18 * px);
        const signY = ceilH + Math.round(20 * px);
        decoGfx.fillStyle(0xC62828, 1);
        decoGfx.fillRect(baseX - w / 2, signY, w, h);
        // We'll add the text separately since graphics can't render text
        this.add.text(baseX, signY + h / 2, 'EXIT', {
          fontFamily: UI.FONT_FAMILY,
          fontSize: Math.round(10 * px) + 'px',
          color: '#FFFFFF',
          fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(-5);
      } else if (type === 'trophy') {
        // Trophy case (glass cabinet)
        const w = Math.round(55 * px);
        const h = Math.round(50 * px);
        // Cabinet
        decoGfx.fillStyle(0x5D4037, 1);
        decoGfx.fillRect(baseX - w / 2, upperY - h / 2, w, h);
        // Glass
        decoGfx.fillStyle(0xBBDEFB, 0.3);
        decoGfx.fillRect(baseX - w / 2 + Math.round(4 * px), upperY - h / 2 + Math.round(4 * px),
          w - Math.round(8 * px), h - Math.round(8 * px));
        // Trophy shape
        decoGfx.fillStyle(0xFFD700, 1);
        const ty = upperY - Math.round(5 * px);
        decoGfx.fillRect(baseX - Math.round(4 * px), ty, Math.round(8 * px), Math.round(12 * px));
        decoGfx.fillCircle(baseX, ty - Math.round(2 * px), Math.round(6 * px));
        // Base
        decoGfx.fillRect(baseX - Math.round(6 * px), ty + Math.round(12 * px), Math.round(12 * px), Math.round(3 * px));
      }
    }
  }

  _createGround(levelWidth) {
    this._groundGroup = this.physics.add.staticGroup();
    const groundTexture = this.textures.get('ground');
    const groundFrame = groundTexture.getSourceImage();
    const tileW = groundFrame.width;
    const groundH = GAME.HEIGHT - GAME.GROUND_Y;
    const numTiles = Math.ceil(levelWidth / tileW) + 1;
    const variants = ['ground_v1', 'ground_v2', 'ground_v3'];

    for (let i = 0; i < numTiles; i++) {
      const variantKey = variants[i % 3];
      const tile = this._groundGroup.create(i * tileW + tileW / 2, GAME.GROUND_Y + groundH / 2, variantKey);
      tile.setDisplaySize(tileW, groundH);
      tile.refreshBody();
    }
  }

  _createPlatforms() {
    this._platformGroup = this.physics.add.staticGroup();
    this._platformLayouts = this._levelData.platforms;

    this._platformLayouts.forEach((layout) => {
      const px = Math.round(layout.x * this._levelWidth);
      const py = Math.round(layout.y * GAME.HEIGHT);
      const pw = Math.round(layout.w * GAME.PX);
      const ph = Math.round(16 * GAME.PX);
      const plat = this._platformGroup.create(px, py, 'platform');
      plat.setDisplaySize(pw, ph);
      plat.refreshBody();
    });
  }

  _createMovingPlatforms() {
    const movingData = this._levelData.movingPlatforms;
    if (!movingData || movingData.length === 0) return;

    this._movingPlatformGroup = this.physics.add.staticGroup();
    this._movingPlatforms = [];

    movingData.forEach((data) => {
      const px = Math.round(data.x * this._levelWidth);
      const py = Math.round(data.y * GAME.HEIGHT);
      const pw = Math.round((data.w || 100) * GAME.PX);
      const ph = Math.round(16 * GAME.PX);

      const plat = this._movingPlatformGroup.create(px, py, 'platform');
      plat.setDisplaySize(pw, ph);
      plat.refreshBody();

      // Add an indicator arrow below the platform
      const indicator = this.add.graphics().setDepth(2);
      if (data.rangeX) {
        // Horizontal arrows
        const arrowSize = Math.round(4 * GAME.PX);
        indicator.fillStyle(0xFFFFFF, 0.3);
        indicator.fillTriangle(px - pw / 2 - arrowSize, py, px - pw / 2, py - arrowSize, px - pw / 2, py + arrowSize);
        indicator.fillTriangle(px + pw / 2 + arrowSize, py, px + pw / 2, py - arrowSize, px + pw / 2, py + arrowSize);
      }

      plat._startX = px;
      plat._startY = py;
      plat._rangeX = data.rangeX ? Math.round(data.rangeX * this._levelWidth) : 0;
      plat._rangeY = data.rangeY ? Math.round(data.rangeY * GAME.HEIGHT) : 0;
      plat._speed = data.speed || 0.5;
      plat._indicator = indicator;

      this._movingPlatforms.push(plat);
    });
  }

  _createCheckpoints() {
    const checkpointData = this._levelData.checkpoints;
    if (!checkpointData || checkpointData.length === 0) return;

    this._checkpointGroup = this.physics.add.staticGroup();
    this._checkpoints = [];
    this._lastCheckpointX = PLAYER.SPAWN_X;

    checkpointData.forEach((xFrac, i) => {
      const cx = Math.round(xFrac * this._levelWidth);
      const cy = GAME.GROUND_Y;
      const flagH = Math.round(60 * GAME.PX);
      const flagW = Math.round(25 * GAME.PX);

      // Flag pole
      const pole = this.add.rectangle(cx, cy - flagH / 2, Math.round(3 * GAME.PX), flagH, 0x795548)
        .setDepth(3);

      // Flag triangle
      const flag = this.add.graphics().setDepth(3);
      flag.fillStyle(0x4CAF50, 0.8);
      flag.fillTriangle(
        cx + Math.round(2 * GAME.PX), cy - flagH + Math.round(5 * GAME.PX),
        cx + flagW, cy - flagH + Math.round(18 * GAME.PX),
        cx + Math.round(2 * GAME.PX), cy - flagH + Math.round(30 * GAME.PX)
      );

      // Invisible collision zone
      const zone = this._checkpointGroup.create(cx, cy - flagH / 2, null);
      zone.setVisible(false);
      zone.body.setSize(Math.round(40 * GAME.PX), flagH);
      zone.body.updateFromGameObject();
      zone._checkpointIndex = i;
      zone._activated = false;
      zone._pole = pole;
      zone._flag = flag;
      zone._x = cx;

      this._checkpoints.push(zone);
    });
  }

  _createObstacles(levelWidth) {
    this._obstacleGroup = this.physics.add.staticGroup();

    this._levelData.obstacles.forEach((layout) => {
      const ox = Math.round(layout.x * levelWidth);
      const oy = GAME.GROUND_Y;
      const obs = new ObstacleEntity(this, ox, oy, layout.type);
      this._obstacleGroup.add(obs);
    });
  }

  _createCollectibles() {
    this._collectibleGroup = this.physics.add.staticGroup();
    this._collectibles = [];

    this._levelData.collectibles.forEach((layout) => {
      const cx = Math.round(layout.x * this._levelWidth);
      const cy = Math.round(layout.y * GAME.HEIGHT);
      const col = new CollectibleEntity(this, cx, cy, layout.type);
      this._collectibleGroup.add(col);
      this._collectibles.push(col);
    });
    gameState.totalCollectibles = this._collectibles.length;
    gameState.totalCollected = 0;
  }

  _createPowerups() {
    if (!this._levelData.powerups || this._levelData.powerups.length === 0) return;

    this._powerupGroup = this.physics.add.staticGroup();
    this._powerups = [];

    this._levelData.powerups.forEach((layout) => {
      const px = Math.round(layout.x * this._levelWidth);
      const py = Math.round(layout.y * GAME.HEIGHT);
      const powerup = this._createPowerupSprite(px, py, layout.type);
      this._powerupGroup.add(powerup);
      this._powerups.push(powerup);
    });
  }

  _createPowerupSprite(x, y, type) {
    // Create powerup texture if not exists
    const texKey = 'powerup_' + type;
    if (!this.textures.exists(texKey)) {
      const g = this.make.graphics({ add: false });
      const size = Math.round(14 * GAME.PX);
      const colors = { speed: 0x00E676, shield: 0x42A5F5, time: 0xFFD740 };
      g.fillStyle(colors[type] || 0xFFFFFF);
      g.fillCircle(size, size, size);
      // Inner icon
      g.fillStyle(0xFFFFFF);
      if (type === 'speed') {
        // Lightning bolt shape
        g.fillTriangle(size - 3, size + 5, size + 2, size - 2, size - 1, size - 1);
        g.fillTriangle(size + 3, size - 5, size - 2, size + 2, size + 1, size + 1);
      } else if (type === 'shield') {
        // Shield shape
        g.fillCircle(size, size, size * 0.5);
        g.fillStyle(colors[type]);
        g.fillCircle(size, size, size * 0.3);
      } else if (type === 'time') {
        // Clock hands
        g.lineStyle(2, 0xFFFFFF);
        g.fillCircle(size, size, size * 0.5);
        g.fillStyle(colors[type]);
        g.fillCircle(size, size, size * 0.35);
      }
      g.generateTexture(texKey, size * 2, size * 2);
      g.destroy();
    }

    const sprite = this.physics.add.staticSprite(x, y, texKey);
    sprite.setDepth(7);
    sprite.powerupType = type;

    // Bobbing
    sprite._baseY = y;
    sprite._bobOffset = Math.random() * Math.PI * 2;

    // Glow pulse
    this.tweens.add({
      targets: sprite,
      alpha: 0.6,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    return sprite;
  }

  _createHallMonitors() {
    this._monitorGroup = this.physics.add.group();
    this._monitors = [];

    this._levelData.monitors.forEach((layout) => {
      const mx = Math.round(layout.x * this._levelWidth);
      let my;
      if (layout.onGround) {
        my = GAME.GROUND_Y - HALL_MONITOR.HEIGHT / 2;
      } else {
        const platLayout = this._platformLayouts[layout.platformIndex];
        if (!platLayout) {
          my = GAME.GROUND_Y - HALL_MONITOR.HEIGHT / 2;
        } else {
          my = Math.round(platLayout.y * GAME.HEIGHT) - HALL_MONITOR.HEIGHT / 2;
        }
      }

      const mon = new HallMonitor(this, mx, my, HALL_MONITOR.PATROL_RANGE);
      this._monitorGroup.add(mon);
      this._monitors.push(mon);
    });
  }

  _createPaperAirplanes() {
    const airplaneData = this._levelData.paperAirplanes;
    if (!airplaneData || airplaneData.length === 0) return;

    this._airplaneGroup = this.physics.add.group();
    this._airplanes = [];

    airplaneData.forEach((data) => {
      const ax = Math.round(data.x * this._levelWidth);
      const ay = Math.round(data.y * GAME.HEIGHT);
      const airplane = new PaperAirplane(this, ax, ay, {
        amplitude: Math.round((data.amplitude || 30) * GAME.PX),
        speed: Math.round((data.speed || 120) * GAME.PX),
        range: Math.round((data.range || 250) * GAME.PX),
        direction: data.direction || 1,
      });
      this._airplaneGroup.add(airplane);
      this._airplanes.push(airplane);
    });
  }

  _createDoor(levelWidth) {
    const doorW = Math.round(100 * GAME.PX);
    const doorH = Math.round(160 * GAME.PX);
    const doorX = levelWidth - Math.round(80 * GAME.PX);
    const doorY = GAME.GROUND_Y - doorH / 2;

    this._doorSprite = this.physics.add.staticSprite(doorX, doorY, 'door');
    this._doorSprite.setDepth(3);

    this._doorLabel = this.add.text(doorX, doorY - Math.round(10 * GAME.PX), 'ROOM\n101', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(14 * GAME.PX) + 'px',
      color: '#4E342E',
      align: 'center',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(4);

    // Pulsing glow around door
    const glowSize = Math.max(doorW, doorH) * 0.8;
    const doorGlow = this.add.circle(doorX, doorY, glowSize, 0x4CAF50, 0.12).setDepth(2);
    this.tweens.add({
      targets: doorGlow,
      alpha: 0.25,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Arrow indicator above door
    const arrowY = doorY - doorH / 2 - Math.round(20 * GAME.PX);
    const doorArrow = this.add.text(doorX, arrowY, '\u25BC', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(20 * GAME.PX) + 'px',
      color: '#4CAF50',
    }).setOrigin(0.5).setDepth(4);
    this.tweens.add({
      targets: doorArrow,
      y: arrowY + Math.round(8 * GAME.PX),
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  _createParallaxElements() {
    const px = GAME.PX;

    // Floating dust motes in the hallway
    this._dustMotes = [];
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * this._levelWidth;
      const y = Math.random() * GAME.GROUND_Y * 0.8;
      const size = Math.round((1.5 + Math.random() * 2.5) * px);
      const mote = this.add.circle(x, y, size, 0xFFFFFF, 0.08 + Math.random() * 0.12)
        .setDepth(-3);
      mote._speed = 0.15 + Math.random() * 0.25;
      mote._amplitude = 15 + Math.random() * 25;
      mote._offset = Math.random() * Math.PI * 2;
      mote._baseY = y;
      this._dustMotes.push(mote);
    }

    // Ceiling lights (fluorescent strip lights with housing)
    const lightSpacing = Math.round(250 * px);
    const numLights = Math.ceil(this._levelWidth / lightSpacing);
    this._ceilingLights = [];
    for (let i = 0; i < numLights; i++) {
      const lx = i * lightSpacing + lightSpacing / 2;
      const lightW = Math.round(80 * px);
      const lightH = Math.round(8 * px);
      const ceilH = Math.round(20 * px);

      // Light housing (dark gray)
      this.add.rectangle(lx, ceilH + Math.round(2 * px), lightW + Math.round(8 * px), Math.round(6 * px), 0x616161)
        .setDepth(-4);

      // Light tube
      const light = this.add.rectangle(lx, ceilH + Math.round(5 * px), lightW, lightH, 0xFFF9C4)
        .setDepth(-3).setAlpha(0.7);

      // Light glow on floor below
      const glowW = lightW * 1.5;
      const glowH = Math.round(60 * px);
      const glow = this.add.rectangle(lx, ceilH + glowH / 2 + Math.round(10 * px), glowW, glowH, 0xFFF9C4)
        .setDepth(-9).setAlpha(0.04);

      // Subtle flicker
      this.tweens.add({
        targets: [light, glow],
        alpha: light.alpha * 0.7,
        duration: 800 + Math.random() * 600,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 1000,
      });
      this._ceilingLights.push(light);
    }

    // Floor reflections (subtle light patches)
    for (let i = 0; i < numLights; i++) {
      const lx = i * lightSpacing + lightSpacing / 2;
      const reflW = Math.round(100 * px);
      const reflH = Math.round(20 * px);
      this.add.ellipse(lx, GAME.GROUND_Y - Math.round(2 * px), reflW, reflH, 0xFFFFFF, 0.04)
        .setDepth(-1);
    }

    // Room number signs above certain sections
    const signSpacing = Math.round(800 * px);
    const numSigns = Math.ceil(this._levelWidth / signSpacing);
    const roomBase = 100 + ((gameState.level || 1) - 1) * 10;
    for (let i = 0; i < numSigns; i++) {
      const sx = i * signSpacing + signSpacing * 0.7;
      const sy = Math.round(28 * px);
      // Sign plate
      const signGfx = this.add.graphics().setDepth(-4);
      const sw = Math.round(40 * px);
      const sh = Math.round(16 * px);
      signGfx.fillStyle(0x1565C0, 1);
      signGfx.fillRoundedRect(sx - sw / 2, sy, sw, sh, Math.round(2 * px));
      // Room number text
      this.add.text(sx, sy + sh / 2, '' + (roomBase + i), {
        fontFamily: UI.FONT_FAMILY,
        fontSize: Math.round(9 * px) + 'px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(-3);
    }
  }

  _showTutorial() {
    // Pause briefly for tutorial
    const overlay = this.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.WIDTH, GAME.HEIGHT, 0x000000, 0.5)
      .setDepth(80).setScrollFactor(0);

    const cx = GAME.WIDTH / 2;
    const baseY = GAME.HEIGHT * 0.3;

    const title = this.add.text(cx, baseY, 'HOW TO PLAY', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(28 * GAME.PX) + 'px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: Math.round(3 * GAME.PX),
    }).setOrigin(0.5).setDepth(81).setScrollFactor(0);

    const instructions = [
      '\u2190 \u2192 or A/D to move',
      'SPACE or W to jump',
      'Collect books (+10) and passes (+25)',
      'Avoid hall monitors!',
      'Reach ROOM 101 before time runs out',
      'ESC to pause',
    ];

    const texts = instructions.map((line, i) => {
      return this.add.text(cx, baseY + Math.round((40 + i * 28) * GAME.PX), line, {
        fontFamily: UI.FONT_FAMILY,
        fontSize: Math.round(14 * GAME.PX) + 'px',
        color: '#FFFFFF',
        align: 'center',
      }).setOrigin(0.5).setDepth(81).setScrollFactor(0);
    });

    const tapText = this.add.text(cx, baseY + Math.round((40 + instructions.length * 28 + 30) * GAME.PX), 'Click or press any key to start!', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(16 * GAME.PX) + 'px',
      color: '#4CAF50',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(81).setScrollFactor(0);

    // Pulse tap text
    this.tweens.add({
      targets: tapText,
      alpha: 0.4,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    const dismiss = () => {
      localStorage.setItem('harrys_world_tutorial_done', '1');
      overlay.destroy();
      title.destroy();
      texts.forEach(t => t.destroy());
      tapText.destroy();
    };

    // Dismiss on any input
    this.input.once('pointerdown', dismiss);
    this.input.keyboard.once('keydown', dismiss);
  }

  _setupTouchControls() {
    this._touchLeft = false;
    this._touchRight = false;
    this._touchJump = false;

    const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (!hasTouch) return;

    const btnSize = TOUCH.BUTTON_SIZE;
    const margin = TOUCH.MARGIN;
    const bottomY = GAME.HEIGHT - SAFE_ZONE.BOTTOM - btnSize / 2;

    this._btnLeft = this.add.image(margin + btnSize / 2, bottomY, 'btn_left')
      .setDisplaySize(btnSize, btnSize).setAlpha(TOUCH.BUTTON_ALPHA)
      .setScrollFactor(0).setDepth(100).setInteractive();

    this._btnRight = this.add.image(margin + btnSize * 1.5 + margin, bottomY, 'btn_right')
      .setDisplaySize(btnSize, btnSize).setAlpha(TOUCH.BUTTON_ALPHA)
      .setScrollFactor(0).setDepth(100).setInteractive();

    this._btnJumpImg = this.add.image(GAME.WIDTH - margin - btnSize / 2, bottomY, 'btn_jump')
      .setDisplaySize(btnSize, btnSize).setAlpha(TOUCH.BUTTON_ALPHA)
      .setScrollFactor(0).setDepth(100).setInteractive();

    this._btnLeft.on('pointerdown', () => { this._touchLeft = true; this._btnLeft.setAlpha(TOUCH.BUTTON_ACTIVE_ALPHA); });
    this._btnLeft.on('pointerup', () => { this._touchLeft = false; this._btnLeft.setAlpha(TOUCH.BUTTON_ALPHA); });
    this._btnLeft.on('pointerout', () => { this._touchLeft = false; this._btnLeft.setAlpha(TOUCH.BUTTON_ALPHA); });

    this._btnRight.on('pointerdown', () => { this._touchRight = true; this._btnRight.setAlpha(TOUCH.BUTTON_ACTIVE_ALPHA); });
    this._btnRight.on('pointerup', () => { this._touchRight = false; this._btnRight.setAlpha(TOUCH.BUTTON_ALPHA); });
    this._btnRight.on('pointerout', () => { this._touchRight = false; this._btnRight.setAlpha(TOUCH.BUTTON_ALPHA); });

    this._btnJumpImg.on('pointerdown', () => { this._touchJump = true; this._btnJumpImg.setAlpha(TOUCH.BUTTON_ACTIVE_ALPHA); });
    this._btnJumpImg.on('pointerup', () => { this._touchJump = false; this._btnJumpImg.setAlpha(TOUCH.BUTTON_ALPHA); });
    this._btnJumpImg.on('pointerout', () => { this._touchJump = false; this._btnJumpImg.setAlpha(TOUCH.BUTTON_ALPHA); });
  }

  update(time, delta) {
    if (this._gameEnded) return;

    // Gather input
    this._inputState.left = this._cursors.left.isDown || this._aKey.isDown || this._touchLeft;
    this._inputState.right = this._cursors.right.isDown || this._dKey.isDown || this._touchRight;
    this._inputState.jump = this._cursors.up.isDown || this._spaceKey.isDown || this._wKey.isDown || this._touchJump;

    // Update player
    this.player.update(delta, this._inputState);

    // Update collectibles (bobbing)
    this._collectibles.forEach((c) => c.update(time));

    // Update powerups (bobbing)
    if (this._powerups) {
      this._powerups.forEach((p) => {
        if (!p.active) return;
        const bobY = Math.sin((time / 1500) * Math.PI * 2 + p._bobOffset) * Math.round(8 * GAME.PX);
        p.setY(p._baseY + bobY);
        p.body.updateFromGameObject();
      });
    }

    // Update hall monitors (patrol)
    this._monitors.forEach((m) => m.update(delta));

    // Update paper airplanes
    if (this._airplanes) {
      this._airplanes.forEach((a) => a.update(delta));
    }

    // Update moving platforms
    if (this._movingPlatforms) {
      const t = time / 1000;
      this._movingPlatforms.forEach((plat) => {
        if (!plat.active) return;
        let newX = plat._startX;
        let newY = plat._startY;
        if (plat._rangeX) {
          newX = plat._startX + Math.sin(t * plat._speed) * plat._rangeX;
        }
        if (plat._rangeY) {
          newY = plat._startY + Math.sin(t * plat._speed) * plat._rangeY;
        }
        plat.setPosition(newX, newY);
        plat.body.updateFromGameObject();
        if (plat._indicator) {
          const dx = newX - plat._startX;
          const dy = newY - plat._startY;
          plat._indicator.setPosition(dx, dy);
        }
      });
    }

    // Combo decay
    if (gameState.combo > 0 && time - this._lastCollectTime > 2000) {
      gameState.combo = 0;
    }

    // Near-miss detection (pass close to a monitor without dying)
    if (this.player.active && !this._gameEnded) {
      this._monitors.forEach((m) => {
        if (!m.active) return;
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, m.x, m.y);
        const nearThreshold = Math.round(80 * GAME.PX);
        if (dist < nearThreshold && !m._nearMissTriggered) {
          m._nearMissTriggered = true;
          // Near miss bonus
          gameState.score += 5;
          eventBus.emit(Events.SCORE_CHANGED, { score: gameState.score });
          eventBus.emit(Events.SPECTACLE_NEAR_MISS, {});
          const popup = this.add.text(this.player.x, this.player.y - Math.round(50 * GAME.PX), 'CLOSE CALL! +5', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: Math.round(14 * GAME.PX) + 'px',
            color: '#FF5722',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: Math.round(2 * GAME.PX),
          }).setOrigin(0.5).setDepth(25);
          this.tweens.add({
            targets: popup,
            y: popup.y - Math.round(30 * GAME.PX),
            alpha: 0, duration: 800,
            onComplete: () => popup.destroy(),
          });
        }
        if (dist >= nearThreshold * 1.5) {
          m._nearMissTriggered = false;
        }
      });
    }

    // Speed boost trail
    if (gameState.hasSpeedBoost && this.player.active) {
      if (!this._lastTrailTime || time - this._lastTrailTime > 80) {
        this._lastTrailTime = time;
        const trail = this.add.image(this.player.x, this.player.y, 'harry')
          .setDepth(8).setAlpha(0.3).setTint(0x00E676);
        this.tweens.add({
          targets: trail,
          alpha: 0,
          scaleX: 0.5,
          scaleY: 0.5,
          duration: 300,
          onComplete: () => trail.destroy(),
        });
      }
    }

    // Shield visual
    if (gameState.hasShield && this._shieldGfx) {
      this._shieldGfx.setPosition(this.player.x, this.player.y);
    }

    // Dust mote animation
    if (this._dustMotes) {
      const t = time / 1000;
      this._dustMotes.forEach(mote => {
        mote.y = mote._baseY + Math.sin(t * mote._speed + mote._offset) * mote._amplitude;
      });
    }
  }

  _onCollect(player, collectible) {
    if (!collectible.active) return;
    const now = this.time.now;
    collectible.collect();

    this._emitSparkles(collectible.x, collectible.y);
    gameState.totalCollected++;

    // Combo tracking
    if (now - this._lastCollectTime < 2000) {
      gameState.combo++;
      if (gameState.combo > gameState.bestCombo) gameState.bestCombo = gameState.combo;
      if (gameState.combo >= 3) {
        eventBus.emit(Events.SPECTACLE_COMBO, { combo: gameState.combo });
      }
    } else {
      gameState.combo = 1;
    }
    this._lastCollectTime = now;

    // Combo multiplier: 1x for combo<3, 1.5x for 3-4, 2x for 5+
    const comboMultiplier = gameState.combo >= 5 ? 2 : gameState.combo >= 3 ? 1.5 : 1;
    const points = Math.round(collectible.scoreValue * comboMultiplier);
    gameState.score += points;

    // Score popup with multiplier indicator
    const popupText = comboMultiplier > 1 ? `+${points} (${comboMultiplier}x)` : '+' + points;
    const popupColor = comboMultiplier >= 2 ? '#FF4081' : comboMultiplier >= 1.5 ? '#FF9100' : '#FFD700';
    const flash = this.add.text(collectible.x, collectible.y, popupText, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round((comboMultiplier > 1 ? 24 : 20) * GAME.PX) + 'px',
      color: popupColor,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: Math.round(2 * GAME.PX),
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: flash,
      y: flash.y - Math.round(40 * GAME.PX),
      alpha: 0,
      duration: 600,
      onComplete: () => flash.destroy(),
    });

    eventBus.emit(Events.ITEM_COLLECTED, { type: collectible.collectibleType, score: collectible.scoreValue });
    eventBus.emit(Events.SCORE_CHANGED, { score: gameState.score });
    eventBus.emit(Events.SPECTACLE_HIT, { item: collectible.collectibleType });
  }

  _onPowerup(player, powerup) {
    if (!powerup.active) return;
    powerup.setActive(false);
    powerup.setVisible(false);
    powerup.body.enable = false;

    const type = powerup.powerupType;

    // Powerup popup text
    const labels = { speed: 'SPEED BOOST!', shield: 'SHIELD!', time: '+10 SECONDS!' };
    const colors = { speed: '#00E676', shield: '#42A5F5', time: '#FFD740' };
    const popup = this.add.text(powerup.x, powerup.y, labels[type] || 'POWER UP!', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(18 * GAME.PX) + 'px',
      color: colors[type] || '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: Math.round(2 * GAME.PX),
    }).setOrigin(0.5).setDepth(25);

    this.tweens.add({
      targets: popup,
      y: popup.y - Math.round(50 * GAME.PX),
      alpha: 0,
      duration: 1000,
      onComplete: () => popup.destroy(),
    });

    // Sparkle burst
    this._emitSparkles(powerup.x, powerup.y);
    eventBus.emit('powerup:collected', { type });

    if (type === 'speed') {
      gameState.hasSpeedBoost = true;
      // Boost player speed temporarily
      const origSpeed = PLAYER.SPEED;
      this.player._speedMultiplier = 1.5;
      this.time.delayedCall(5000, () => {
        if (this.player) this.player._speedMultiplier = 1;
        gameState.hasSpeedBoost = false;
      });
    } else if (type === 'shield') {
      gameState.hasShield = true;
      // Visual shield
      this._shieldGfx = this.add.graphics().setDepth(11);
      this._shieldGfx.lineStyle(2, 0x42A5F5, 0.6);
      this._shieldGfx.strokeCircle(0, 0, Math.round(PLAYER.WIDTH * 0.8));
      this._shieldGfx.setPosition(this.player.x, this.player.y);

      this.tweens.add({
        targets: this._shieldGfx,
        alpha: 0.3,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });

      this.time.delayedCall(8000, () => {
        gameState.hasShield = false;
        if (this._shieldGfx) {
          this._shieldGfx.destroy();
          this._shieldGfx = null;
        }
      });
    } else if (type === 'time') {
      gameState.timeLeft = Math.min(gameState.timeLeft + 10, 99);
      eventBus.emit(Events.TIME_UPDATE, { timeLeft: gameState.timeLeft });
    }
  }

  _onCheckpoint(player, zone) {
    if (zone._activated || this._gameEnded) return;
    zone._activated = true;
    this._lastCheckpointX = zone._x;

    // Visual feedback - change flag color to gold
    if (zone._flag) {
      zone._flag.clear();
      zone._flag.fillStyle(0xFFD700, 1);
      const cx = zone._x;
      const flagH = Math.round(60 * GAME.PX);
      const flagW = Math.round(25 * GAME.PX);
      zone._flag.fillTriangle(
        cx + Math.round(2 * GAME.PX), GAME.GROUND_Y - flagH + Math.round(5 * GAME.PX),
        cx + flagW, GAME.GROUND_Y - flagH + Math.round(18 * GAME.PX),
        cx + Math.round(2 * GAME.PX), GAME.GROUND_Y - flagH + Math.round(30 * GAME.PX)
      );
    }

    // Popup
    const popup = this.add.text(zone._x, GAME.GROUND_Y - Math.round(75 * GAME.PX), 'CHECKPOINT!', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(14 * GAME.PX) + 'px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: Math.round(2 * GAME.PX),
    }).setOrigin(0.5).setDepth(25);
    this.tweens.add({
      targets: popup,
      y: popup.y - Math.round(30 * GAME.PX),
      alpha: 0, duration: 1000,
      onComplete: () => popup.destroy(),
    });
  }

  _onHitMonitor(player, monitor) {
    if (this._gameEnded) return;
    if (!monitor.active) return;

    // Shield absorbs one hit
    if (gameState.hasShield) {
      gameState.hasShield = false;
      if (this._shieldGfx) {
        this._shieldGfx.destroy();
        this._shieldGfx = null;
      }
      // Knock monitor back
      monitor.deactivate();
      this.cameras.main.shake(100, 0.005);

      const shieldBreak = this.add.text(player.x, player.y - Math.round(30 * GAME.PX), 'SHIELD BREAK!', {
        fontFamily: UI.FONT_FAMILY,
        fontSize: Math.round(16 * GAME.PX) + 'px',
        color: '#42A5F5',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: Math.round(2 * GAME.PX),
      }).setOrigin(0.5).setDepth(25);

      this.tweens.add({
        targets: shieldBreak,
        y: shieldBreak.y - Math.round(40 * GAME.PX),
        alpha: 0,
        duration: 800,
        onComplete: () => shieldBreak.destroy(),
      });
      return;
    }

    this.cameras.main.shake(EFFECTS.SHAKE_DURATION, EFFECTS.SHAKE_INTENSITY);
    this.cameras.main.flash(200, 255, 0, 0, false, null, this);
    this._endGame(false);
  }

  _onReachDoor() {
    if (this._gameEnded) return;
    this._endGame(true);
  }

  _onTimerTick() {
    if (this._gameEnded) return;
    if (gameState.hasTimeFreeze) return;

    gameState.timeLeft--;
    eventBus.emit(Events.TIME_UPDATE, { timeLeft: gameState.timeLeft });

    if (gameState.timeLeft <= 0) {
      this._endGame(false);
    }
  }

  _endGame(won) {
    if (this._gameEnded) return;
    this._gameEnded = true;
    gameState.gameOver = true;
    gameState.won = won;

    if (gameState.score > gameState.bestScore) {
      gameState.bestScore = gameState.score;
      localStorage.setItem('harrys_world_best_score', gameState.bestScore.toString());
    }

    // Unlock next level
    if (won) {
      const nextLevel = (gameState.level || 1) + 1;
      if (nextLevel > (gameState.maxLevel || 1)) {
        gameState.maxLevel = nextLevel;
        localStorage.setItem('harrys_world_max_level', gameState.maxLevel.toString());
      }
    }

    this._timerEvent.destroy();
    eventBus.emit(Events.GAME_OVER, { won, score: gameState.score });

    if (won) {
      // Win animation: Harry celebrates — jump + spin + freeze frame
      this.player.body.setVelocity(0, 0);
      this.player.body.setAllowGravity(false);
      this.tweens.add({
        targets: this.player,
        y: this.player.y - Math.round(60 * GAME.PX),
        angle: 360,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 600,
        ease: 'Back.easeOut',
        onComplete: () => {
          // Confetti burst
          for (let i = 0; i < 20; i++) {
            const confettiColors = [0xFF4081, 0x448AFF, 0xFFD740, 0x69F0AE, 0xE040FB];
            const size = Math.round((3 + Math.random() * 4) * GAME.PX);
            const conf = this.add.rectangle(
              this.player.x, this.player.y,
              size, size * 0.6,
              confettiColors[i % confettiColors.length]
            ).setDepth(20).setAngle(Math.random() * 360);
            this.tweens.add({
              targets: conf,
              x: this.player.x + (Math.random() - 0.5) * Math.round(200 * GAME.PX),
              y: this.player.y + Math.random() * Math.round(150 * GAME.PX),
              angle: conf.angle + (Math.random() - 0.5) * 720,
              alpha: 0,
              duration: 1000 + Math.random() * 500,
              ease: 'Quad.easeOut',
              onComplete: () => conf.destroy(),
            });
          }
        },
      });
      // Delayed transition
      this.time.delayedCall(1200, () => {
        this.cameras.main.fadeOut(EFFECTS.FADE_DURATION, 0, 0, 0);
        this.time.delayedCall(EFFECTS.FADE_DURATION + 200, () => {
          this.player.die();
          this.scene.stop('HUDScene');
          this.scene.start('GameOverScene');
        });
      });
    } else {
      // Death animation: Harry spins and falls off screen
      this.player.body.setVelocity(0, 0);
      this.player.body.setAllowGravity(false);
      this.tweens.add({
        targets: this.player,
        y: this.player.y - Math.round(40 * GAME.PX),
        angle: -15,
        scaleX: 1.1,
        scaleY: 0.9,
        duration: 250,
        ease: 'Quad.easeOut',
        yoyo: false,
        onComplete: () => {
          this.tweens.add({
            targets: this.player,
            y: GAME.HEIGHT + PLAYER.HEIGHT * 2,
            angle: 360,
            alpha: 0.4,
            duration: 700,
            ease: 'Quad.easeIn',
          });
        },
      });
      // Delayed transition
      this.time.delayedCall(1000, () => {
        this.cameras.main.fadeOut(EFFECTS.FADE_DURATION, 0, 0, 0);
        this.time.delayedCall(EFFECTS.FADE_DURATION + 200, () => {
          this.player.die();
          this.scene.stop('HUDScene');
          this.scene.start('GameOverScene');
        });
      });
    }
  }

  shutdown() {
    eventBus.off(Events.PLAYER_DIED, this._onPlayerDied);
    eventBus.off(Events.PLAYER_LANDED, this._onPlayerLanded);
    eventBus.off(Events.GAME_PAUSE, this._onPause);
    this.events.off('shutdown', this.shutdown, this);

    if (this.player) {
      this.player.destroy();
      this.player = null;
    }

    if (this._timerEvent) {
      this._timerEvent.destroy();
      this._timerEvent = null;
    }

    if (this._shieldGfx) {
      this._shieldGfx.destroy();
      this._shieldGfx = null;
    }
  }
}
