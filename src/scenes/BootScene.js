// BootScene.js — Generates all textures from pixel art data, then starts GameScene

import Phaser from 'phaser';
import { renderPixelArt, renderSpriteSheet } from '../core/PixelRenderer.js';
import { PALETTE } from '../sprites/palette.js';
import { HARRY_FRAMES, HARRY_SCALE } from '../sprites/player.js';
import { HALL_MONITOR_FRAMES, HALL_MONITOR_SCALE } from '../sprites/enemies.js';
import { BOOK_PIXELS, BOOK_SCALE, HALL_PASS_PIXELS, HALL_PASS_SCALE } from '../sprites/items.js';
import { DESK_PIXELS, DESK_SCALE, CHAIR_PIXELS, CHAIR_SCALE } from '../sprites/obstacles.js';
import { DOOR_PIXELS, DOOR_SCALE } from '../sprites/door.js';
import {
  GROUND_V1, GROUND_V2, GROUND_V3, GROUND_SCALE,
  PLATFORM_PIXELS, PLATFORM_SCALE,
  WALL_PIXELS, WALL_SCALE,
  LOCKER_PIXELS, LOCKER_SCALE,
} from '../sprites/tiles.js';
import { PAPER_AIRPLANE_PIXELS, PAPER_AIRPLANE_SCALE } from '../sprites/paperairplane.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    // Player spritesheet (2 frames: idle + walk)
    renderSpriteSheet(this, HARRY_FRAMES, PALETTE, 'harry', HARRY_SCALE);

    // Hall monitor spritesheet (2 frames: idle + walk)
    renderSpriteSheet(this, HALL_MONITOR_FRAMES, PALETTE, 'hall_monitor', HALL_MONITOR_SCALE);

    // Single-frame sprites
    renderPixelArt(this, DESK_PIXELS, PALETTE, 'desk', DESK_SCALE);
    renderPixelArt(this, CHAIR_PIXELS, PALETTE, 'chair', CHAIR_SCALE);
    renderPixelArt(this, BOOK_PIXELS, PALETTE, 'book', BOOK_SCALE);
    renderPixelArt(this, HALL_PASS_PIXELS, PALETTE, 'hall_pass', HALL_PASS_SCALE);
    renderPixelArt(this, DOOR_PIXELS, PALETTE, 'door', DOOR_SCALE);

    // Ground tile variants
    renderPixelArt(this, GROUND_V1, PALETTE, 'ground', GROUND_SCALE);
    renderPixelArt(this, GROUND_V1, PALETTE, 'ground_v1', GROUND_SCALE);
    renderPixelArt(this, GROUND_V2, PALETTE, 'ground_v2', GROUND_SCALE);
    renderPixelArt(this, GROUND_V3, PALETTE, 'ground_v3', GROUND_SCALE);

    // Platform tile
    renderPixelArt(this, PLATFORM_PIXELS, PALETTE, 'platform', PLATFORM_SCALE);

    // Background tiles
    renderPixelArt(this, WALL_PIXELS, PALETTE, 'wall', WALL_SCALE);
    renderPixelArt(this, LOCKER_PIXELS, PALETTE, 'locker', LOCKER_SCALE);

    // Paper airplane
    renderPixelArt(this, PAPER_AIRPLANE_PIXELS, PALETTE, 'paper_airplane', PAPER_AIRPLANE_SCALE);

    // Touch buttons (kept as procedural graphics)
    this._generateTouchButtons();

    // Create animations
    this._createAnimations();

    this.scene.start('TitleScene');
  }

  _createAnimations() {
    // Harry walk animation from spritesheet frames
    if (!this.anims.exists('harry_walk_anim')) {
      this.anims.create({
        key: 'harry_walk_anim',
        frames: this.anims.generateFrameNumbers('harry', { start: 0, end: 1 }),
        frameRate: 6,
        repeat: -1,
      });
    }

    // Harry idle (single frame)
    if (!this.anims.exists('harry_idle')) {
      this.anims.create({
        key: 'harry_idle',
        frames: [{ key: 'harry', frame: 0 }],
        frameRate: 1,
      });
    }

    // Hall monitor walk animation
    if (!this.anims.exists('monitor_walk_anim')) {
      this.anims.create({
        key: 'monitor_walk_anim',
        frames: this.anims.generateFrameNumbers('hall_monitor', { start: 0, end: 1 }),
        frameRate: 4,
        repeat: -1,
      });
    }
  }

  _generateTouchButtons() {
    const size = 64;
    // Left arrow
    let g = this.make.graphics({ add: false });
    g.fillStyle(0xFFFFFF);
    g.fillTriangle(size * 0.2, size * 0.5, size * 0.8, size * 0.2, size * 0.8, size * 0.8);
    g.generateTexture('btn_left', size, size);
    g.destroy();

    // Right arrow
    g = this.make.graphics({ add: false });
    g.fillStyle(0xFFFFFF);
    g.fillTriangle(size * 0.8, size * 0.5, size * 0.2, size * 0.2, size * 0.2, size * 0.8);
    g.generateTexture('btn_right', size, size);
    g.destroy();

    // Jump button
    g = this.make.graphics({ add: false });
    g.fillStyle(0xFFFFFF);
    g.fillTriangle(size * 0.5, size * 0.15, size * 0.15, size * 0.75, size * 0.85, size * 0.75);
    g.generateTexture('btn_jump', size, size);
    g.destroy();
  }
}
