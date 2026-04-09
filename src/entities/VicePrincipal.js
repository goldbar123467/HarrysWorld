// VicePrincipal.js — Faster, larger patrolling enemy
// Appears in levels 3-5, patrols faster with larger range

import Phaser from 'phaser';
import { GAME } from '../core/Constants.js';

const VP_SPEED = Math.round(100 * GAME.PX);
const VP_PATROL_RANGE = Math.round(250 * GAME.PX);

export default class VicePrincipal extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, patrolRange) {
    super(scene, x, y, 'vice_principal');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(5);
    this.body.setAllowGravity(true);

    this._startX = x;
    this._patrolRange = patrolRange || VP_PATROL_RANGE;
    this._direction = 1;
    this._speed = VP_SPEED;
    this.body.setVelocityX(this._speed * this._direction);

    this.play('vp_walk_anim');
  }

  update(dt) {
    if (!this.active) return;

    const dist = this.x - this._startX;
    if (dist > this._patrolRange) {
      this._direction = -1;
      this.setFlipX(true);
    } else if (dist < -this._patrolRange) {
      this._direction = 1;
      this.setFlipX(false);
    }

    this.body.setVelocityX(this._speed * this._direction);
  }

  deactivate() {
    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;
  }
}
