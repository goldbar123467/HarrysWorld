// PaperAirplane.js — Flying paper airplane enemy that swoops across the screen

import Phaser from 'phaser';
import { GAME } from '../core/Constants.js';

export default class PaperAirplane extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, config = {}) {
    super(scene, x, y, 'paper_airplane');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(6);
    this.body.setAllowGravity(false);

    this._startX = x;
    this._startY = y;
    this._speed = config.speed || Math.round(120 * GAME.PX);
    this._amplitude = config.amplitude || Math.round(40 * GAME.PX);
    this._direction = config.direction || 1; // 1=right, -1=left
    this._range = config.range || Math.round(300 * GAME.PX);
    this._time = Math.random() * Math.PI * 2;

    this.setFlipX(this._direction < 0);
    this.body.setVelocityX(this._speed * this._direction);
  }

  update(delta) {
    if (!this.active) return;

    this._time += delta / 1000;

    // Sine wave flight path
    this.y = this._startY + Math.sin(this._time * 2) * this._amplitude;

    // Slight rotation based on vertical movement
    this.angle = Math.cos(this._time * 2) * 15 * this._direction;

    // Reverse direction at range limits
    const dist = this.x - this._startX;
    if (Math.abs(dist) > this._range) {
      this._direction *= -1;
      this.setFlipX(this._direction < 0);
      this.body.setVelocityX(this._speed * this._direction);
    }
  }

  deactivate() {
    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;
  }
}
