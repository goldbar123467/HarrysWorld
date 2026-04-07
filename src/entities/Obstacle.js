// Obstacle.js — Desk/chair static body obstacles

import Phaser from 'phaser';
import { OBSTACLE } from '../core/Constants.js';

export default class Obstacle extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type) {
    const texKey = type === 'desk' ? 'desk' : 'chair';
    super(scene, x, y, texKey);
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body

    this.obstacleType = type;
    this.setOrigin(0.5, 1); // bottom-center origin for ground placement
    this.setDepth(5);
  }

  reset(x, y, type) {
    const texKey = type === 'desk' ? 'desk' : 'chair';
    this.setTexture(texKey);
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.body.enable = true;
    this.body.updateFromGameObject();
    this.obstacleType = type;
  }

  deactivate() {
    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;
  }
}
