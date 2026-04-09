import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });

page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

await page.goto('http://localhost:3000');
await page.waitForTimeout(3000);

// Start game
await page.click('canvas', { position: { x: 480, y: 370 } });
await page.waitForTimeout(2500);
await page.click('canvas');
await page.waitForTimeout(300);

// Teleport near door to see the glow
await page.evaluate(() => {
  const gameScene = window.__GAME__.scene.getScene('GameScene');
  if (gameScene && gameScene.player) {
    if (gameScene._monitors) gameScene._monitors.forEach(m => m.deactivate());
    const doorX = gameScene._levelWidth - 200;
    gameScene.player.setPosition(doorX - 150, gameScene.player.y);
  }
});

await page.waitForTimeout(1000);
await page.screenshot({ path: '/home/user/HarrysWorld/screenshots/60-doorglow.png' });

// Now go back to title and check level select with earned stars
await page.evaluate(() => {
  const gs = window.__GAME_STATE__;
  gs.saveStars(1, 3);
  gs.saveStars(2, 2);
});

// Go to menu
await page.keyboard.press('Escape');
await page.waitForTimeout(1500);

// Get to title (click quit to menu on pause screen)
await page.evaluate(() => {
  const gs = window.__GAME_STATE__;
  gs.reset();
  gs.maxLevel = 3;
  localStorage.setItem('harrys_world_max_level', '3');
  window.__GAME__.scene.stop('GameScene');
  window.__GAME__.scene.stop('HUDScene');
  window.__GAME__.scene.stop('PauseScene');
  window.__GAME__.scene.start('TitleScene');
});
await page.waitForTimeout(2000);
await page.screenshot({ path: '/home/user/HarrysWorld/screenshots/61-title-stars.png' });

// Open level select
await page.click('canvas', { position: { x: 480, y: 432 } });
await page.waitForTimeout(1000);
await page.screenshot({ path: '/home/user/HarrysWorld/screenshots/62-levelselect-stars.png' });

await browser.close();
console.log('Final screenshots captured!');
