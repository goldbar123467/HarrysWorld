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
    this._createDoor(levelWidth);

    // Player
    this.player = new Player(this, PLAYER.SPAWN_X, PLAYER.SPAWN_Y);

    // Camera follow with deadzone to prevent jitter on small movements
    this.cameras.main.startFollow(this.player, true, 0.1, 0.05);
    this.cameras.main.setDeadzone(Math.round(GAME.WIDTH * 0.15), Math.round(GAME.HEIGHT * 0.25));

    // Collisions
    this.physics.add.collider(this.player, this._groundGroup);
    this.physics.add.collider(this.player, this._platformGroup);
    this.physics.add.collider(this.player, this._obstacleGroup);
    this.physics.add.collider(this._monitorGroup, this._groundGroup);
    this.physics.add.collider(this._monitorGroup, this._platformGroup);

    // Overlaps
    this.physics.add.overlap(this.player, this._collectibleGroup, this._onCollect, null, this);
    this.physics.add.overlap(this.player, this._monitorGroup, this._onHitMonitor, null, this);
    this.physics.add.overlap(this.player, this._doorSprite, this._onReachDoor, null, this);
    if (this._powerupGroup) {
      this.physics.add.overlap(this.player, this._powerupGroup, this._onPowerup, null, this);
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
    const wallTexture = this.textures.get('wall');
    const wallFrame = wallTexture.getSourceImage();
    const tileW = wallFrame.width;
    const tileH = wallFrame.height;
    const numTilesX = Math.ceil(levelWidth / tileW) + 1;
    const numTilesY = Math.ceil(GAME.GROUND_Y / tileH) + 1;

    for (let ix = 0; ix < numTilesX; ix++) {
      for (let iy = 0; iy < numTilesY; iy++) {
        const wx = ix * tileW + tileW / 2;
        const wy = iy * tileH + tileH / 2;
        if (wy - tileH / 2 < GAME.GROUND_Y) {
          this.add.image(wx, wy, 'wall').setDepth(-10);
        }
      }
    }

    const lockerTexture = this.textures.get('locker');
    const lockerFrame = lockerTexture.getSourceImage();
    const lockerH = lockerFrame.height;
    const lockerSpacing = 200;
    const lockerY = GAME.GROUND_Y - lockerH / 2;
    const numLockers = Math.ceil(levelWidth / lockerSpacing);

    for (let i = 0; i < numLockers; i++) {
      this.add.image(i * lockerSpacing + lockerSpacing / 2, lockerY, 'locker').setDepth(-5);
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
  }

  _createParallaxElements() {
    // Floating dust motes in the hallway
    this._dustMotes = [];
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * this._levelWidth;
      const y = Math.random() * GAME.GROUND_Y * 0.8;
      const size = Math.round((2 + Math.random() * 3) * GAME.PX);
      const mote = this.add.circle(x, y, size, 0xFFFFFF, 0.15 + Math.random() * 0.15)
        .setDepth(-3);
      mote._speed = 0.2 + Math.random() * 0.3;
      mote._amplitude = 20 + Math.random() * 30;
      mote._offset = Math.random() * Math.PI * 2;
      mote._baseY = y;
      this._dustMotes.push(mote);
    }

    // Ceiling lights (fluorescent strip lights)
    const lightSpacing = Math.round(300 * GAME.PX);
    const numLights = Math.ceil(this._levelWidth / lightSpacing);
    for (let i = 0; i < numLights; i++) {
      const lx = i * lightSpacing + lightSpacing / 2;
      const lightW = Math.round(60 * GAME.PX);
      const lightH = Math.round(6 * GAME.PX);
      const light = this.add.rectangle(lx, Math.round(12 * GAME.PX), lightW, lightH, 0xFFF9C4)
        .setDepth(-4).setAlpha(0.6);

      // Subtle flicker
      this.tweens.add({
        targets: light,
        alpha: 0.4,
        duration: 800 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 1000,
      });
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

    // Combo decay
    if (gameState.combo > 0 && time - this._lastCollectTime > 2000) {
      gameState.combo = 0;
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

    // Combo
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

    // Apply combo multiplier to score
    const comboMultiplier = Math.max(1, gameState.combo);
    const earnedPoints = collectible.scoreValue * comboMultiplier;
    gameState.score += earnedPoints;

    // Score popup — show multiplied value and combo indicator
    const popupText = comboMultiplier > 1
      ? `+${earnedPoints} (${comboMultiplier}x)`
      : `+${collectible.scoreValue}`;
    const popupColor = comboMultiplier >= 5 ? '#FF4444' : comboMultiplier >= 3 ? '#FF8800' : '#FFD700';
    const flash = this.add.text(collectible.x, collectible.y, popupText, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round((comboMultiplier > 1 ? 24 : 20) * GAME.PX) + 'px',
      color: popupColor,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: comboMultiplier > 1 ? Math.round(2 * GAME.PX) : 0,
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: flash,
      y: flash.y - Math.round(40 * GAME.PX),
      alpha: 0,
      duration: 600,
      onComplete: () => flash.destroy(),
    });

    eventBus.emit(Events.ITEM_COLLECTED, { type: collectible.collectibleType, score: earnedPoints });
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

  _emitDeathParticles(x, y) {
    for (let i = 0; i < EFFECTS.DEATH_PARTICLE_COUNT; i++) {
      const particle = this.add.image(x, y, 'sparkle_particle').setDepth(15).setAlpha(1).setTint(0xFF4444);
      const angle = (Math.PI * 2 / EFFECTS.DEATH_PARTICLE_COUNT) * i + (Math.random() - 0.5) * 0.5;
      const speed = EFFECTS.DEATH_PARTICLE_SPEED * (0.5 + Math.random() * 0.5);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: EFFECTS.DEATH_PARTICLE_LIFESPAN,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
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

    if (!won && this.player && this.player.visible) {
      // Death: emit particles, then play death animation, delay scene transition
      this._emitDeathParticles(this.player.x, this.player.y);
      this.player.die();

      // Wait for death animation to finish before fading out
      const deathDelay = EFFECTS.DEATH_FLASH_COUNT * 2 * EFFECTS.DEATH_FLASH_DURATION + EFFECTS.DEATH_ANIM_DURATION;
      this.time.delayedCall(deathDelay, () => {
        this.cameras.main.fadeOut(EFFECTS.FADE_DURATION, 0, 0, 0);
        this.time.delayedCall(EFFECTS.FADE_DURATION + 200, () => {
          this.scene.stop('HUDScene');
          this.scene.start('GameOverScene');
        });
      });
    } else {
      // Win or already dead: immediate transition
      this.player.die();
      this.cameras.main.fadeOut(EFFECTS.FADE_DURATION, 0, 0, 0);
      this.time.delayedCall(EFFECTS.FADE_DURATION + 200, () => {
        this.scene.stop('HUDScene');
        this.scene.start('GameOverScene');
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
