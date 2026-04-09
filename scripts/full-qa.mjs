import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
const errors = [];
page.on('pageerror', err => {
  errors.push(err.message);
  console.log('ERROR:', err.message);
});

console.log('=== QA Test Suite ===\n');

// 1. Title Screen
await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.screenshot({ path: 'screenshots/final-1-title.png' });
console.log('1. Title screen loaded');

// 2. Start game
await page.mouse.click(270, 730);
await page.waitForTimeout(500);

// 3. Dismiss tutorial
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(1500);
await page.screenshot({ path: 'screenshots/final-2-game-start.png' });
console.log('2. Game started, tutorial dismissed');

// 4. Move right and collect items
for (let i = 0; i < 80; i++) {
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(30);
  if (i % 20 === 0) {
    await page.keyboard.press('Space');
  }
}
await page.keyboard.up('ArrowRight');
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshots/final-3-exploring.png' });
console.log('3. Explored level');

// 5. Pause and resume
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshots/final-4-paused.png' });
console.log('4. Pause menu shown');

await page.keyboard.press('Escape');
await page.waitForTimeout(500);
console.log('5. Resumed from pause');

// 6. Check game state
const state = await page.evaluate(() => window.render_game_to_text());
console.log('6. Game state:', state);

// 7. Let timer run to trigger game over (move harry into a monitor)
// Just keep moving right until something happens
for (let i = 0; i < 200; i++) {
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(20);
}
await page.keyboard.up('ArrowRight');
await page.waitForTimeout(1000);
await page.screenshot({ path: 'screenshots/final-5-exploring2.png' });
console.log('7. Further exploration');

console.log('\n=== Results ===');
console.log('Errors:', errors.length === 0 ? 'NONE' : errors.join(', '));
console.log('QA Complete!');

await browser.close();
