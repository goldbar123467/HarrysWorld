// Collectible.js — Books and hall passes

import Phaser from 'phaser';
import { COLLECTIBLE } from '../core/Constants.js';

export default class Collectible extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type) {
    const texKey = type === 'book' ? 'book' : 'hall_pass';
    super(scene, x, y, texKey);
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body

    this.collectibleType = type;
    this.scoreValue = type === 'book' ? COLLECTIBLE.BOOK_SCORE : COLLECTIBLE.PASS_SCORE;
    this.setDepth(6);
    this._baseY = y;
    this._bobOffset = Math.random() * Math.PI * 2;
  }

  update(time) {
    if (!this.active) return;
    // Bobbing animation
    const bobY = Math.sin((time / COLLECTIBLE.BOB_SPEED) * Math.PI * 2 + this._bobOffset) * COLLECTIBLE.BOB_DISTANCE;
    this.setY(this._baseY + bobY);
    this.body.updateFromGameObject();
  }

  reset(x, y, type) {
    const texKey = type === 'book' ? 'book' : 'hall_pass';
    this.setTexture(texKey);
    this.setPosition(x, y);
    this._baseY = y;
    this._bobOffset = Math.random() * Math.PI * 2;
    this.setActive(true);
    this.setVisible(true);
    this.body.enable = true;
    this.body.updateFromGameObject();
    this.collectibleType = type;
    this.scoreValue = type === 'book' ? COLLECTIBLE.BOOK_SCORE : COLLECTIBLE.PASS_SCORE;
  }

  collect() {
    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;
  }
}
