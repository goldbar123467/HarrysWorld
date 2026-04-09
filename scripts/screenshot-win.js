import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });

page.on('console', msg => {
  if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
});
page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

await page.goto('http://localhost:3000');
await page.waitForTimeout(3000);

// Start game
await page.click('canvas', { position: { x: 480, y: 370 } });
await page.waitForTimeout(2500);

// Dismiss tutorial
await page.click('canvas');
await page.waitForTimeout(500);

// Run right a bit first to show gameplay with the new features
await page.keyboard.down('ArrowRight');
await page.waitForTimeout(3000);
await page.keyboard.press('Space');
await page.waitForTimeout(500);
await page.screenshot({ path: '/home/user/HarrysWorld/screenshots/50-playing.png' });
await page.keyboard.up('ArrowRight');

// Teleport player near the door to test win
await page.evaluate(() => {
  const gameScene = window.__GAME__.scene.getScene('GameScene');
  if (gameScene && gameScene.player) {
    // Deactivate all monitors first
    if (gameScene._monitors) {
      gameScene._monitors.forEach(m => m.deactivate());
    }
    // Add some score for star testing
    window.__GAME_STATE__.score = 120;
    window.__GAME_STATE__.totalCollected = 6;
    window.__GAME_STATE__.combo = 4;
    window.__GAME_STATE__.bestCombo = 5;
    // Teleport near door
    const doorX = gameScene._levelWidth - 200;
    gameScene.player.setPosition(doorX - 300, gameScene.player.y);
  }
});

await page.waitForTimeout(500);
await page.screenshot({ path: '/home/user/HarrysWorld/screenshots/51-neardoor.png' });

// Run to the door
await page.keyboard.down('ArrowRight');
await page.waitForTimeout(3000);
await page.keyboard.up('ArrowRight');

await page.waitForTimeout(2000);
await page.screenshot({ path: '/home/user/HarrysWorld/screenshots/52-winanimation.png' });

// Wait for win screen
await page.waitForTimeout(3000);
await page.screenshot({ path: '/home/user/HarrysWorld/screenshots/53-winscreen.png' });

await browser.close();
console.log('Win screenshots captured!');
