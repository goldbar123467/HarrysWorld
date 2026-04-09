// paperairplane.js — Paper airplane enemy sprite (16x8 pixels)

// Palette: 0=transparent, 8=white, 1=outline, 15=gray

export const PAPER_AIRPLANE_PIXELS = [
  [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,1,8,1,0,0],
  [0,0,0,0,0,0,0,0,0,1,1,8,8,8,1,0],
  [1,1,1,1,1,1,1,1,1,8,8,8,8,8,8,1],
  [0,1,8,8,8,8,8,8,8,8,8,8,8,8,1,0],
  [0,0,1,1,1,1,1,1,8,8,8,8,8,1,0,0],
  [0,0,0,0,0,0,0,0,1,15,15,1,1,0,0,0],
  [0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0],
];

export const PAPER_AIRPLANE_SCALE = 3;
