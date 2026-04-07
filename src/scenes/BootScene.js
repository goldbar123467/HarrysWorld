// BootScene.js — Generates all textures procedurally, then starts GameScene

import Phaser from 'phaser';
import { PLAYER, OBSTACLE, COLLECTIBLE, HALL_MONITOR, COLORS, GAME } from '../core/Constants.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this._generateHarryTexture();
    this._generateHarryWalkTexture();
    this._generatePlatformTexture();
    this._generateGroundTexture();
    this._generateDeskTexture();
    this._generateChairTexture();
    this._generateBookTexture();
    this._generateHallPassTexture();
    this._generateHallMonitorTexture();
    this._generateDoorTexture();
    this._generateTouchButtons();

    this.scene.start('GameScene');
  }

  _generateHarryTexture() {
    const w = PLAYER.WIDTH;
    const h = PLAYER.HEIGHT;
    const g = this.make.graphics({ add: false });

    // Legs / pants
    const legW = Math.round(w * 0.3);
    const legH = Math.round(h * 0.35);
    const legY = h - legH;
    g.fillStyle(COLORS.HARRY_PANTS);
    g.fillRect(Math.round(w * 0.15), legY, legW, legH);
    g.fillRect(Math.round(w * 0.55), legY, legW, legH);

    // Body / shirt
    const bodyH = Math.round(h * 0.35);
    const bodyY = legY - bodyH;
    g.fillStyle(COLORS.HARRY_SHIRT);
    g.fillRect(Math.round(w * 0.1), bodyY, Math.round(w * 0.8), bodyH);

    // Head
    const headSize = Math.round(w * 0.6);
    const headX = Math.round((w - headSize) / 2);
    const headY = bodyY - headSize;
    g.fillStyle(COLORS.HARRY_SKIN);
    g.fillRect(headX, headY, headSize, headSize);

    // Hair
    g.fillStyle(COLORS.HARRY_HAIR);
    g.fillRect(headX, headY, headSize, Math.round(headSize * 0.3));

    // Eyes
    g.fillStyle(0x000000);
    const eyeSize = Math.max(2, Math.round(headSize * 0.12));
    g.fillRect(headX + Math.round(headSize * 0.25), headY + Math.round(headSize * 0.45), eyeSize, eyeSize);
    g.fillRect(headX + Math.round(headSize * 0.6), headY + Math.round(headSize * 0.45), eyeSize, eyeSize);

    g.generateTexture('harry', w, h);
    g.destroy();
  }

  _generateHarryWalkTexture() {
    const w = PLAYER.WIDTH;
    const h = PLAYER.HEIGHT;
    const g = this.make.graphics({ add: false });

    // Legs / pants — shifted for walk frame
    const legW = Math.round(w * 0.3);
    const legH = Math.round(h * 0.35);
    const legY = h - legH;
    g.fillStyle(COLORS.HARRY_PANTS);
    g.fillRect(Math.round(w * 0.05), legY, legW, legH);
    g.fillRect(Math.round(w * 0.65), legY, legW, legH);

    // Body / shirt
    const bodyH = Math.round(h * 0.35);
    const bodyY = legY - bodyH;
    g.fillStyle(COLORS.HARRY_SHIRT);
    g.fillRect(Math.round(w * 0.1), bodyY, Math.round(w * 0.8), bodyH);

    // Head
    const headSize = Math.round(w * 0.6);
    const headX = Math.round((w - headSize) / 2);
    const headY = bodyY - headSize;
    g.fillStyle(COLORS.HARRY_SKIN);
    g.fillRect(headX, headY, headSize, headSize);

    // Hair
    g.fillStyle(COLORS.HARRY_HAIR);
    g.fillRect(headX, headY, headSize, Math.round(headSize * 0.3));

    // Eyes
    g.fillStyle(0x000000);
    const eyeSize = Math.max(2, Math.round(headSize * 0.12));
    g.fillRect(headX + Math.round(headSize * 0.25), headY + Math.round(headSize * 0.45), eyeSize, eyeSize);
    g.fillRect(headX + Math.round(headSize * 0.6), headY + Math.round(headSize * 0.45), eyeSize, eyeSize);

    g.generateTexture('harry_walk', w, h);
    g.destroy();
  }

  _generatePlatformTexture() {
    const w = 32;
    const h = 16;
    const g = this.make.graphics({ add: false });
    g.fillStyle(COLORS.PLATFORM);
    g.fillRect(0, 0, w, h);
    g.fillStyle(0x757575);
    g.fillRect(0, 0, w, 2);
    g.generateTexture('platform', w, h);
    g.destroy();
  }

  _generateGroundTexture() {
    const w = 64;
    const h = 32;
    const g = this.make.graphics({ add: false });
    g.fillStyle(COLORS.GROUND);
    g.fillRect(0, 0, w, h);
    g.fillStyle(COLORS.GROUND_TOP);
    g.fillRect(0, 0, w, 4);
    g.generateTexture('ground', w, h);
    g.destroy();
  }

  _generateDeskTexture() {
    const w = OBSTACLE.DESK_WIDTH;
    const h = OBSTACLE.DESK_HEIGHT;
    const g = this.make.graphics({ add: false });

    // Desktop surface
    g.fillStyle(COLORS.DESK);
    g.fillRect(0, 0, w, Math.round(h * 0.3));

    // Legs
    const legW = Math.max(3, Math.round(w * 0.08));
    g.fillStyle(0x5D4037);
    g.fillRect(Math.round(w * 0.1), Math.round(h * 0.3), legW, Math.round(h * 0.7));
    g.fillRect(Math.round(w * 0.82), Math.round(h * 0.3), legW, Math.round(h * 0.7));

    g.generateTexture('desk', w, h);
    g.destroy();
  }

  _generateChairTexture() {
    const w = OBSTACLE.CHAIR_WIDTH;
    const h = OBSTACLE.CHAIR_HEIGHT;
    const g = this.make.graphics({ add: false });

    // Seat
    g.fillStyle(COLORS.CHAIR);
    g.fillRect(0, Math.round(h * 0.4), w, Math.round(h * 0.15));

    // Back
    g.fillRect(0, 0, Math.max(3, Math.round(w * 0.15)), Math.round(h * 0.55));

    // Legs
    const legW = Math.max(2, Math.round(w * 0.1));
    g.fillStyle(0x4E342E);
    g.fillRect(Math.round(w * 0.05), Math.round(h * 0.55), legW, Math.round(h * 0.45));
    g.fillRect(Math.round(w * 0.8), Math.round(h * 0.55), legW, Math.round(h * 0.45));

    g.generateTexture('chair', w, h);
    g.destroy();
  }

  _generateBookTexture() {
    const w = COLLECTIBLE.BOOK_WIDTH;
    const h = COLLECTIBLE.BOOK_HEIGHT;
    const g = this.make.graphics({ add: false });

    // Cover
    g.fillStyle(COLORS.BOOK_COVER);
    g.fillRect(0, 0, w, h);

    // Pages
    const pageInset = Math.max(2, Math.round(w * 0.15));
    g.fillStyle(COLORS.BOOK_PAGES);
    g.fillRect(pageInset, Math.round(h * 0.1), w - pageInset * 2, Math.round(h * 0.8));

    // Spine line
    g.fillStyle(0x0D47A1);
    g.fillRect(Math.round(w * 0.45), 0, Math.max(1, Math.round(w * 0.1)), h);

    g.generateTexture('book', w, h);
    g.destroy();
  }

  _generateHallPassTexture() {
    const w = COLLECTIBLE.PASS_WIDTH;
    const h = COLLECTIBLE.PASS_HEIGHT;
    const g = this.make.graphics({ add: false });

    // Card background
    g.fillStyle(COLORS.HALL_PASS);
    g.fillRect(0, 0, w, h);

    // Border
    g.lineStyle(Math.max(1, Math.round(2 * GAME.PX)), 0xF57F17);
    g.strokeRect(1, 1, w - 2, h - 2);

    // Text line placeholder
    g.fillStyle(0x795548);
    g.fillRect(Math.round(w * 0.15), Math.round(h * 0.35), Math.round(w * 0.7), Math.max(2, Math.round(h * 0.12)));
    g.fillRect(Math.round(w * 0.2), Math.round(h * 0.55), Math.round(w * 0.6), Math.max(2, Math.round(h * 0.12)));

    g.generateTexture('hall_pass', w, h);
    g.destroy();
  }

  _generateHallMonitorTexture() {
    const w = HALL_MONITOR.WIDTH;
    const h = HALL_MONITOR.HEIGHT;
    const g = this.make.graphics({ add: false });

    // Legs / pants
    const legW = Math.round(w * 0.3);
    const legH = Math.round(h * 0.35);
    const legY = h - legH;
    g.fillStyle(COLORS.MONITOR_PANTS);
    g.fillRect(Math.round(w * 0.15), legY, legW, legH);
    g.fillRect(Math.round(w * 0.55), legY, legW, legH);

    // Body / shirt
    const bodyH = Math.round(h * 0.35);
    const bodyY = legY - bodyH;
    g.fillStyle(COLORS.MONITOR_SHIRT);
    g.fillRect(Math.round(w * 0.05), bodyY, Math.round(w * 0.9), bodyH);

    // Head
    const headSize = Math.round(w * 0.6);
    const headX = Math.round((w - headSize) / 2);
    const headY = bodyY - headSize;
    g.fillStyle(COLORS.MONITOR_SKIN);
    g.fillRect(headX, headY, headSize, headSize);

    // Angry eyebrows
    g.fillStyle(0x000000);
    const eyeSize = Math.max(2, Math.round(headSize * 0.12));
    g.fillRect(headX + Math.round(headSize * 0.2), headY + Math.round(headSize * 0.45), eyeSize, eyeSize);
    g.fillRect(headX + Math.round(headSize * 0.6), headY + Math.round(headSize * 0.45), eyeSize, eyeSize);
    // Brows
    g.fillRect(headX + Math.round(headSize * 0.15), headY + Math.round(headSize * 0.35), Math.round(headSize * 0.3), Math.max(1, Math.round(headSize * 0.06)));
    g.fillRect(headX + Math.round(headSize * 0.55), headY + Math.round(headSize * 0.35), Math.round(headSize * 0.3), Math.max(1, Math.round(headSize * 0.06)));

    g.generateTexture('hall_monitor', w, h);
    g.destroy();
  }

  _generateDoorTexture() {
    const w = Math.round(100 * GAME.PX);
    const h = Math.round(160 * GAME.PX);
    const g = this.make.graphics({ add: false });

    // Door body
    g.fillStyle(COLORS.DOOR);
    g.fillRect(0, 0, w, h);

    // Door frame
    g.lineStyle(Math.max(2, Math.round(4 * GAME.PX)), 0x4E342E);
    g.strokeRect(0, 0, w, h);

    // Window
    const winW = Math.round(w * 0.5);
    const winH = Math.round(h * 0.25);
    const winX = Math.round((w - winW) / 2);
    const winY = Math.round(h * 0.12);
    g.fillStyle(COLORS.DOOR_WINDOW);
    g.fillRect(winX, winY, winW, winH);

    // Handle
    const handleR = Math.max(3, Math.round(8 * GAME.PX));
    g.fillStyle(COLORS.DOOR_HANDLE);
    g.fillCircle(Math.round(w * 0.8), Math.round(h * 0.55), handleR);

    // Room number text area
    g.fillStyle(0xFFFFFF);
    g.fillRect(Math.round(w * 0.2), Math.round(h * 0.45), Math.round(w * 0.6), Math.round(h * 0.1));

    g.generateTexture('door', w, h);
    g.destroy();
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
