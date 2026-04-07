// Player.js — Harry character entity

import Phaser from 'phaser';
import { PLAYER, GAME } from '../core/Constants.js';
import eventBus, { Events } from '../core/EventBus.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'harry');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(false);
    this.setBounce(PLAYER.BOUNCE);
    this.setDepth(10);

    this.body.setMaxVelocityY(PLAYER.MAX_FALL_SPEED);

    this._jumpHoldFrames = 0;
    this._isJumping = false;
    this._wasOnFloor = false;
    this._facingRight = true;
    this._animTimer = 0;
    this._animFrame = 0;

    // Entrance tween
    this.setPosition(-PLAYER.WIDTH * 2, y);
    scene.tweens.add({
      targets: this,
      x: PLAYER.SPAWN_X,
      duration: 600,
      ease: 'Back.easeOut',
      onComplete: () => {
        eventBus.emit(Events.SPECTACLE_ENTRANCE, { entity: 'player' });
      },
    });
  }

  update(dt, inputState) {
    if (!this.active) return;

    const dtSec = dt / 1000;

    // Horizontal movement
    if (inputState.left) {
      this.setVelocityX(-PLAYER.SPEED);
      this._facingRight = false;
      this.setFlipX(true);
    } else if (inputState.right) {
      this.setVelocityX(PLAYER.SPEED);
      this._facingRight = true;
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    const onFloor = this.body.blocked.down || this.body.touching.down;

    // Landing detection
    if (onFloor && !this._wasOnFloor) {
      eventBus.emit(Events.PLAYER_LANDED);
      this._isJumping = false;
      this._jumpHoldFrames = 0;
    }

    // Jump
    if (inputState.jump && onFloor && !this._isJumping) {
      this.setVelocityY(PLAYER.JUMP_FORCE);
      this._isJumping = true;
      this._jumpHoldFrames = 0;
      eventBus.emit(Events.PLAYER_JUMP);
      eventBus.emit(Events.SPECTACLE_ACTION, { action: 'jump' });
    }

    // Variable jump height — hold jump for higher
    if (inputState.jump && this._isJumping && this._jumpHoldFrames < PLAYER.JUMP_HOLD_FRAMES) {
      this.body.velocity.y += PLAYER.JUMP_HOLD_FORCE;
      this._jumpHoldFrames++;
    }

    if (!inputState.jump) {
      this._jumpHoldFrames = PLAYER.JUMP_HOLD_FRAMES; // stop hold boost
    }

    this._wasOnFloor = onFloor;

    // Simple walk animation (toggle texture frame)
    if (onFloor && (inputState.left || inputState.right)) {
      this._animTimer += dt;
      if (this._animTimer > 150) {
        this._animTimer = 0;
        this._animFrame = (this._animFrame + 1) % 2;
        this.setTexture(this._animFrame === 0 ? 'harry' : 'harry_walk');
      }
    } else {
      this._animTimer = 0;
      this.setTexture('harry');
    }

    // Fall off world — die
    if (this.y > GAME.HEIGHT + PLAYER.HEIGHT * 2) {
      eventBus.emit(Events.PLAYER_DIED);
    }
  }

  die() {
    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;
  }

  destroy(fromScene) {
    super.destroy(fromScene);
  }
}
