// EventBus.js — Singleton event bus for cross-scene communication

import Phaser from 'phaser';

export const Events = {
  PLAYER_JUMP: 'player:jump',
  PLAYER_DIED: 'player:died',
  PLAYER_LANDED: 'player:landed',
  PLAYER_HIT: 'player:hit',
  PLAYER_RESPAWN: 'player:respawn',
  LIVES_CHANGED: 'lives:changed',
  CHECKPOINT_REACHED: 'checkpoint:reached',
  SCORE_CHANGED: 'score:changed',
  ITEM_COLLECTED: 'item:collected',
  GAME_START: 'game:start',
  GAME_OVER: 'game:over',
  GAME_RESTART: 'game:restart',
  SPECTACLE_ENTRANCE: 'spectacle:entrance',
  SPECTACLE_ACTION: 'spectacle:action',
  SPECTACLE_HIT: 'spectacle:hit',
  SPECTACLE_COMBO: 'spectacle:combo',
  SPECTACLE_STREAK: 'spectacle:streak',
  SPECTACLE_NEAR_MISS: 'spectacle:nearMiss',
  TIME_UPDATE: 'time:update',
  GAME_PAUSE: 'game:pause',
  GAME_RESUME: 'game:resume',
};

const eventBus = new Phaser.Events.EventEmitter();

export default eventBus;
