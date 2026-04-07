// HallMonitor.js — Patrolling teacher/hall monitor enemy

import Phaser from 'phaser';
import { HALL_MONITOR } from '../core/Constants.js';

export default class HallMonitor extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, patrolRange) {
    super(scene, x, y, 'hall_monitor');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(5);
    this.body.setAllowGravity(true);

    this._startX = x;
    this._patrolRange = patrolRange || HALL_MONITOR.PATROL_RANGE;
    this._direction = 1;
    this.body.setVelocityX(HALL_MONITOR.SPEED * this._direction);
  }

  update(dt) {
    if (!this.active) return;

    // Patrol back and forth
    const dist = this.x - this._startX;
    if (dist > this._patrolRange) {
      this._direction = -1;
      this.setFlipX(true);
    } else if (dist < -this._patrolRange) {
      this._direction = 1;
      this.setFlipX(false);
    }

    this.body.setVelocityX(HALL_MONITOR.SPEED * this._direction);
  }

  reset(x, y, patrolRange) {
    this.setPosition(x, y);
    this._startX = x;
    this._patrolRange = patrolRange || HALL_MONITOR.PATROL_RANGE;
    this._direction = 1;
    this.setActive(true);
    this.setVisible(true);
    this.body.enable = true;
    this.body.setVelocityX(HALL_MONITOR.SPEED * this._direction);
  }

  deactivate() {
    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;
  }
}
