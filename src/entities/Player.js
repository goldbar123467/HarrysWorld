// Player.js — Harry character entity

import Phaser from 'phaser';
import { PLAYER, GAME, EFFECTS } from '../core/Constants.js';
import eventBus, { Events } from '../core/EventBus.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'harry');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setBounce(PLAYER.BOUNCE);
    this.setDepth(10);

    this.body.setMaxVelocityY(PLAYER.MAX_FALL_SPEED);

    this._jumpHoldFrames = 0;
    this._isJumping = false;
    this._wasOnFloor = false;
    this._facingRight = true;
    this._speedMultiplier = 1;
    this._isDead = false;

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
    const speed = PLAYER.SPEED * (this._speedMultiplier || 1);
    if (inputState.left) {
      this.setVelocityX(-speed);
      this._facingRight = false;
      this.setFlipX(true);
    } else if (inputState.right) {
      this.setVelocityX(speed);
      this._facingRight = true;
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    const onFloor = this.body.blocked.down || this.body.touching.down;

    // Landing detection
    if (onFloor && !this._wasOnFloor) {
      // Squash on land
      this._squashStretch(EFFECTS.SQUASH_SCALE_X, EFFECTS.SQUASH_SCALE_Y);
      eventBus.emit(Events.PLAYER_LANDED);
      this._isJumping = false;
      this._jumpHoldFrames = 0;
    }

    // Jump
    if (inputState.jump && onFloor && !this._isJumping) {
      this.setVelocityY(PLAYER.JUMP_FORCE);
      this._isJumping = true;
      this._jumpHoldFrames = 0;
      // Stretch on jump
      this._squashStretch(EFFECTS.STRETCH_SCALE_X, EFFECTS.STRETCH_SCALE_Y);
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

    // Spritesheet walk animation
    if (onFloor && (inputState.left || inputState.right)) {
      if (!this.anims.isPlaying || this.anims.currentAnim?.key !== 'harry_walk_anim') {
        this.play('harry_walk_anim');
      }
    } else {
      if (this.anims.isPlaying && this.anims.currentAnim?.key === 'harry_walk_anim') {
        this.stop();
      }
      this.setFrame(0);
    }

    // Fall off world — die (fire only once)
    if (!this._isDead && this.y > GAME.HEIGHT + PLAYER.HEIGHT * 2) {
      this._isDead = true;
      eventBus.emit(Events.PLAYER_DIED);
    }
  }

  _squashStretch(sx, sy) {
    this.setScale(sx, sy);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: EFFECTS.SQUASH_DURATION,
      ease: 'Back.easeOut',
    });
  }

  die() {
    if (this._isDead) return;
    this._isDead = true;
    this.setActive(false);

    // Disable physics so player doesn't collide during death anim
    this.body.enable = false;

    // Flash/blink effect
    let flashCount = 0;
    const flashTimer = this.scene.time.addEvent({
      delay: EFFECTS.DEATH_FLASH_DURATION,
      callback: () => {
        this.setVisible(!this.visible);
        flashCount++;
        if (flashCount >= EFFECTS.DEATH_FLASH_COUNT * 2) {
          flashTimer.destroy();
          this.setVisible(true);
          // After flashing, rise up and spin off screen
          this._deathFall();
        }
      },
      loop: true,
    });
  }

  _deathFall() {
    // Tint red briefly
    this.setTint(0xFF4444);

    // Rise up, then fall off screen with spin
    this.scene.tweens.add({
      targets: this,
      y: this.y + EFFECTS.DEATH_RISE_VELOCITY,
      angle: 360 * (this._facingRight ? 1 : -1),
      duration: EFFECTS.DEATH_ANIM_DURATION * 0.4,
      ease: 'Quad.easeOut',
      onComplete: () => {
        // Fall off screen
        this.scene.tweens.add({
          targets: this,
          y: GAME.HEIGHT + PLAYER.HEIGHT * 3,
          angle: this.angle + 180,
          duration: EFFECTS.DEATH_ANIM_DURATION * 0.6,
          ease: 'Quad.easeIn',
          onComplete: () => {
            this.setVisible(false);
          },
        });
      },
    });
  }

  destroy(fromScene) {
    super.destroy(fromScene);
  }
}
