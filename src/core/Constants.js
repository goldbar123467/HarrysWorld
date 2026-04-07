// Constants.js — All config values for Harry's World

const DPR = Math.min(window.devicePixelRatio || 1, 2);
const FORCE_PORTRAIT = false;
const _isPortrait = FORCE_PORTRAIT || window.innerHeight > window.innerWidth;
const _designW = _isPortrait ? 540 : 960;
const _designH = _isPortrait ? 960 : 540;
const _designAspect = _designW / _designH;
const _deviceW = window.innerWidth * DPR;
const _deviceH = window.innerHeight * DPR;
let _canvasW, _canvasH;
if (_deviceW / _deviceH > _designAspect) {
  _canvasH = _deviceH;
  _canvasW = Math.round(_deviceH * _designAspect);
} else {
  _canvasW = _deviceW;
  _canvasH = Math.round(_deviceW / _designAspect);
}
const PX = _canvasW / _designW;

export const GAME = {
  WIDTH: _canvasW,
  HEIGHT: _canvasH,
  DESIGN_WIDTH: _designW,
  DESIGN_HEIGHT: _designH,
  DPR,
  PX,
  LEVEL_WIDTH: Math.round(5000 * PX),
  GROUND_Y: Math.round(_canvasH * 0.88),
  GRAVITY: Math.round(800 * PX),
  BG_COLOR: 0xc8e6ff,
  COUNTDOWN_SECONDS: 60,
};

const SPRITE_ASPECT = 1.5;

export const PLAYER = {
  WIDTH: Math.round(_canvasW * 0.084),
  HEIGHT: Math.round(_canvasW * 0.084 * SPRITE_ASPECT),
  SPEED: Math.round(280 * PX),
  JUMP_FORCE: Math.round(-450 * PX),
  JUMP_HOLD_FORCE: Math.round(-25 * PX),
  JUMP_HOLD_FRAMES: 12,
  MAX_FALL_SPEED: Math.round(600 * PX),
  SPAWN_X: Math.round(100 * PX),
  SPAWN_Y: Math.round(_canvasH * 0.5),
  BOUNCE: 0,
};

export const OBSTACLE = {
  DESK_WIDTH: Math.round(80 * PX),
  DESK_HEIGHT: Math.round(50 * PX),
  CHAIR_WIDTH: Math.round(40 * PX),
  CHAIR_HEIGHT: Math.round(45 * PX),
};

export const COLLECTIBLE = {
  BOOK_WIDTH: Math.round(_canvasW * 0.07),
  BOOK_HEIGHT: Math.round(_canvasW * 0.085),
  PASS_WIDTH: Math.round(_canvasW * 0.08),
  PASS_HEIGHT: Math.round(_canvasW * 0.055),
  BOOK_SCORE: 10,
  PASS_SCORE: 25,
  BOB_SPEED: 1500,
  BOB_DISTANCE: Math.round(8 * PX),
};

export const HALL_MONITOR = {
  WIDTH: Math.round(40 * PX),
  HEIGHT: Math.round(70 * PX),
  SPEED: Math.round(60 * PX),
  PATROL_RANGE: Math.round(150 * PX),
};

export const COLORS = {
  SKY: 0xc8e6ff,
  GROUND: 0x8B7355,
  GROUND_TOP: 0x6B8E23,
  PLATFORM: 0x9E9E9E,
  DESK: 0x8B6914,
  CHAIR: 0x654321,
  BOOK_COVER: 0x1565C0,
  BOOK_PAGES: 0xFFF8DC,
  HALL_PASS: 0xFFEB3B,
  HARRY_SHIRT: 0x1E88E5,
  HARRY_PANTS: 0x37474F,
  HARRY_SKIN: 0xFFCC99,
  HARRY_HAIR: 0x5D4037,
  MONITOR_SHIRT: 0xB71C1C,
  MONITOR_PANTS: 0x424242,
  MONITOR_SKIN: 0xDEB887,
  DOOR: 0x6D4C41,
  DOOR_WINDOW: 0xB3E5FC,
  DOOR_HANDLE: 0xFFD700,
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SHADOW: '#000000',
  BUTTON_BG: 0x1E88E5,
  BUTTON_HOVER: 0x1565C0,
  OVERLAY: 0x000000,
};

export const UI = {
  FONT_FAMILY: 'Arial, Helvetica, sans-serif',
  TITLE_SIZE: Math.round(48 * PX),
  SUBTITLE_SIZE: Math.round(28 * PX),
  BODY_SIZE: Math.round(22 * PX),
  BUTTON_WIDTH: Math.round(220 * PX),
  BUTTON_HEIGHT: Math.round(56 * PX),
  BUTTON_RADIUS: Math.round(12 * PX),
};

export const SAFE_ZONE = {
  TOP: Math.max(GAME.HEIGHT * 0.08, Math.round(44 * PX)),
  BOTTOM: Math.max(GAME.HEIGHT * 0.05, Math.round(34 * PX)),
  LEFT: Math.round(16 * PX),
  RIGHT: Math.round(16 * PX),
};

export const EFFECTS = {
  // Screen shake
  SHAKE_DURATION: 150,
  SHAKE_INTENSITY: 0.008,
  // Squash & stretch
  SQUASH_SCALE_X: 1.25,
  SQUASH_SCALE_Y: 0.75,
  STRETCH_SCALE_X: 0.8,
  STRETCH_SCALE_Y: 1.2,
  SQUASH_DURATION: 120,
  // Particles
  DUST_COUNT: 5,
  DUST_SPEED: Math.round(40 * PX),
  DUST_LIFESPAN: 400,
  SPARKLE_COUNT: 8,
  SPARKLE_SPEED: Math.round(80 * PX),
  SPARKLE_LIFESPAN: 500,
  // Transitions
  FADE_DURATION: 350,
  // Time warning
  TIME_WARNING_THRESHOLD: 10,
};

export const HUD = {
  PADDING: Math.round(12 * PX),
  FONT_SIZE: Math.round(18 * PX),
  TIMER_FONT_SIZE: Math.round(22 * PX),
  COMBO_FONT_SIZE: Math.round(32 * PX),
  COMBO_POPUP_DURATION: 800,
};

export const TOUCH = {
  BUTTON_SIZE: Math.round(64 * PX),
  BUTTON_ALPHA: 0.35,
  BUTTON_ACTIVE_ALPHA: 0.6,
  MARGIN: Math.round(20 * PX),
  LEFT_ZONE_WIDTH: 0.4,
  RIGHT_ZONE_WIDTH: 0.4,
  JUMP_ZONE_HEIGHT: 0.5,
};

export const PLATFORM_LAYOUTS = [
  // x (fraction of LEVEL_WIDTH), y (fraction of GAME.HEIGHT), widthPx
  { x: 0.08, y: 0.68, w: 160 },
  { x: 0.15, y: 0.55, w: 120 },
  { x: 0.25, y: 0.62, w: 140 },
  { x: 0.35, y: 0.50, w: 130 },
  { x: 0.45, y: 0.65, w: 150 },
  { x: 0.55, y: 0.52, w: 120 },
  { x: 0.65, y: 0.60, w: 140 },
  { x: 0.75, y: 0.48, w: 130 },
  { x: 0.82, y: 0.58, w: 120 },
  { x: 0.90, y: 0.65, w: 100 },
];

export const OBSTACLE_LAYOUTS = [
  { x: 0.10, type: 'desk' },
  { x: 0.22, type: 'chair' },
  { x: 0.38, type: 'desk' },
  { x: 0.52, type: 'chair' },
  { x: 0.68, type: 'desk' },
  { x: 0.80, type: 'desk' },
];

export const COLLECTIBLE_LAYOUTS = [
  { x: 0.06, y: 0.65, type: 'book' },
  { x: 0.12, y: 0.50, type: 'pass' },
  { x: 0.18, y: 0.58, type: 'book' },
  { x: 0.26, y: 0.45, type: 'book' },
  { x: 0.33, y: 0.55, type: 'pass' },
  { x: 0.42, y: 0.48, type: 'book' },
  { x: 0.50, y: 0.60, type: 'book' },
  { x: 0.58, y: 0.42, type: 'pass' },
  { x: 0.66, y: 0.55, type: 'book' },
  { x: 0.74, y: 0.50, type: 'book' },
  { x: 0.83, y: 0.45, type: 'pass' },
  { x: 0.91, y: 0.58, type: 'book' },
];

export const MONITOR_LAYOUTS = [
  { x: 0.20, onGround: true },
  { x: 0.40, onGround: false, platformIndex: 3 },
  { x: 0.60, onGround: true },
  { x: 0.78, onGround: false, platformIndex: 7 },
];
