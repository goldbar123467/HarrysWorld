// GameScene.js — Main gameplay scene

import Phaser from 'phaser';
import {
  GAME, PLAYER, OBSTACLE, COLLECTIBLE, HALL_MONITOR, COLORS, TOUCH, SAFE_ZONE,
  PLATFORM_LAYOUTS, OBSTACLE_LAYOUTS, COLLECTIBLE_LAYOUTS, MONITOR_LAYOUTS, UI,
} from '../core/Constants.js';
import eventBus, { Events } from '../core/EventBus.js';
import gameState from '../core/GameState.js';
import Player from '../entities/Player.js';
import ObstacleEntity from '../entities/Obstacle.js';
import CollectibleEntity from '../entities/Collectible.js';
import HallMonitor from '../entities/HallMonitor.js';

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

    // World bounds
    this.physics.world.setBounds(0, 0, GAME.LEVEL_WIDTH, GAME.HEIGHT);
    this.cameras.main.setBounds(0, 0, GAME.LEVEL_WIDTH, GAME.HEIGHT);
    this.cameras.main.setBackgroundColor(GAME.BG_COLOR);

    // Input state object — source agnostic
    this._inputState = { left: false, right: false, jump: false };

    // Build level
    this._createGround();
    this._createPlatforms();
    this._createObstacles();
    this._createCollectibles();
    this._createHallMonitors();
    this._createDoor();

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

    // Overlaps
    this.physics.add.overlap(this.player, this._collectibleGroup, this._onCollect, null, this);
    this.physics.add.overlap(this.player, this._monitorGroup, this._onHitMonitor, null, this);
    this.physics.add.overlap(this.player, this._doorSprite, this._onReachDoor, null, this);

    // Keyboard
    this._cursors = this.input.keyboard.createCursorKeys();
    this._spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this._aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this._dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this._wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);

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

    // Scene cleanup binding
    this.events.on('shutdown', this.shutdown, this);

    eventBus.emit(Events.GAME_START);
    eventBus.emit(Events.SPECTACLE_ENTRANCE, { entity: 'level' });
  }

  _createGround() {
    this._groundGroup = this.physics.add.staticGroup();
    const tileW = 64;
    const groundH = GAME.HEIGHT - GAME.GROUND_Y;
    const numTiles = Math.ceil(GAME.LEVEL_WIDTH / tileW) + 1;

    for (let i = 0; i < numTiles; i++) {
      const tile = this._groundGroup.create(i * tileW + tileW / 2, GAME.GROUND_Y + groundH / 2, 'ground');
      tile.setDisplaySize(tileW, groundH);
      tile.refreshBody();
    }
  }

  _createPlatforms() {
    this._platformGroup = this.physics.add.staticGroup();

    PLATFORM_LAYOUTS.forEach((layout) => {
      const px = Math.round(layout.x * GAME.LEVEL_WIDTH);
      const py = Math.round(layout.y * GAME.HEIGHT);
      const pw = Math.round(layout.w * GAME.PX);
      const ph = Math.round(16 * GAME.PX);

      const plat = this._platformGroup.create(px, py, 'platform');
      plat.setDisplaySize(pw, ph);
      plat.refreshBody();
    });
  }

  _createObstacles() {
    this._obstacleGroup = this.physics.add.staticGroup();

    OBSTACLE_LAYOUTS.forEach((layout) => {
      const ox = Math.round(layout.x * GAME.LEVEL_WIDTH);
      const oy = GAME.GROUND_Y;
      const obs = new ObstacleEntity(this, ox, oy, layout.type);
      this._obstacleGroup.add(obs);
    });
  }

  _createCollectibles() {
    this._collectibleGroup = this.physics.add.staticGroup();

    this._collectibles = [];
    COLLECTIBLE_LAYOUTS.forEach((layout) => {
      const cx = Math.round(layout.x * GAME.LEVEL_WIDTH);
      const cy = Math.round(layout.y * GAME.HEIGHT);
      const col = new CollectibleEntity(this, cx, cy, layout.type);
      this._collectibleGroup.add(col);
      this._collectibles.push(col);
    });
  }

  _createHallMonitors() {
    this._monitorGroup = this.physics.add.group();

    this._monitors = [];
    MONITOR_LAYOUTS.forEach((layout) => {
      const mx = Math.round(layout.x * GAME.LEVEL_WIDTH);
      let my;
      if (layout.onGround) {
        my = GAME.GROUND_Y - HALL_MONITOR.HEIGHT / 2;
      } else {
        const platLayout = PLATFORM_LAYOUTS[layout.platformIndex];
        my = Math.round(platLayout.y * GAME.HEIGHT) - HALL_MONITOR.HEIGHT / 2;
      }

      const mon = new HallMonitor(this, mx, my, HALL_MONITOR.PATROL_RANGE);
      this._monitorGroup.add(mon);
      this._monitors.push(mon);
    });
  }

  _createDoor() {
    const doorW = Math.round(100 * GAME.PX);
    const doorH = Math.round(160 * GAME.PX);
    const doorX = GAME.LEVEL_WIDTH - Math.round(80 * GAME.PX);
    const doorY = GAME.GROUND_Y - doorH / 2;

    this._doorSprite = this.physics.add.staticSprite(doorX, doorY, 'door');
    this._doorSprite.setDepth(3);

    // Room number text
    this._doorLabel = this.add.text(doorX, doorY - Math.round(10 * GAME.PX), 'ROOM\n101', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(14 * GAME.PX) + 'px',
      color: '#4E342E',
      align: 'center',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(4);
  }

  _setupTouchControls() {
    this._touchLeft = false;
    this._touchRight = false;
    this._touchJump = false;

    // Capability detection for touch support
    const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (!hasTouch) return;

    const btnSize = TOUCH.BUTTON_SIZE;
    const margin = TOUCH.MARGIN;
    const bottomY = GAME.HEIGHT - SAFE_ZONE.BOTTOM - btnSize / 2;

    // Left button
    this._btnLeft = this.add.image(margin + btnSize / 2, bottomY, 'btn_left')
      .setDisplaySize(btnSize, btnSize)
      .setAlpha(TOUCH.BUTTON_ALPHA)
      .setScrollFactor(0)
      .setDepth(100)
      .setInteractive();

    // Right button
    this._btnRight = this.add.image(margin + btnSize * 1.5 + margin, bottomY, 'btn_right')
      .setDisplaySize(btnSize, btnSize)
      .setAlpha(TOUCH.BUTTON_ALPHA)
      .setScrollFactor(0)
      .setDepth(100)
      .setInteractive();

    // Jump button
    this._btnJumpImg = this.add.image(GAME.WIDTH - margin - btnSize / 2, bottomY, 'btn_jump')
      .setDisplaySize(btnSize, btnSize)
      .setAlpha(TOUCH.BUTTON_ALPHA)
      .setScrollFactor(0)
      .setDepth(100)
      .setInteractive();

    // Touch handlers
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

    // Update hall monitors (patrol)
    this._monitors.forEach((m) => m.update(delta));

    // Combo decay
    if (gameState.combo > 0 && time - this._lastCollectTime > 2000) {
      gameState.combo = 0;
    }
  }

  _onCollect(player, collectible) {
    if (!collectible.active) return;

    const now = this.time.now;
    collectible.collect();

    // Score
    gameState.score += collectible.scoreValue;

    // Combo
    if (now - this._lastCollectTime < 2000) {
      gameState.combo++;
      if (gameState.combo > gameState.bestCombo) {
        gameState.bestCombo = gameState.combo;
      }
      if (gameState.combo >= 3) {
        eventBus.emit(Events.SPECTACLE_COMBO, { combo: gameState.combo });
      }
    } else {
      gameState.combo = 1;
    }
    this._lastCollectTime = now;

    // Collect flash tween
    const flash = this.add.text(collectible.x, collectible.y, '+' + collectible.scoreValue, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: Math.round(20 * GAME.PX) + 'px',
      color: '#FFD700',
      fontStyle: 'bold',
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

  _onHitMonitor(player, monitor) {
    if (this._gameEnded) return;
    if (!monitor.active) return;
    this._endGame(false);
  }

  _onReachDoor() {
    if (this._gameEnded) return;
    this._endGame(true);
  }

  _onTimerTick() {
    if (this._gameEnded) return;

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
    }

    this.player.die();
    this._timerEvent.destroy();

    eventBus.emit(Events.GAME_OVER, { won, score: gameState.score });

    this.time.delayedCall(800, () => {
      this.scene.start('GameOverScene');
    });
  }

  shutdown() {
    eventBus.off(Events.PLAYER_DIED, this._onPlayerDied);
    this.events.off('shutdown', this.shutdown, this);
  }
}
