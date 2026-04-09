import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
page.on('pageerror', err => console.log('ERROR:', err.message));

// Clear localStorage for fresh test
await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

// Start game
await page.keyboard.press('Enter');
await page.waitForTimeout(800);

// Dismiss tutorial
await page.mouse.click(270, 480);
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshots/go-1-playing.png' });

// Move right toward the hall monitor at x=0.30 of level
for (let i = 0; i < 150; i++) {
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(20);
}
await page.keyboard.up('ArrowRight');
await page.waitForTimeout(2000);
await page.screenshot({ path: 'screenshots/go-2-aftermath.png' });

// Check if game over
const state = await page.evaluate(() => window.render_game_to_text());
console.log('State:', state);
await page.waitForTimeout(1000);
await page.screenshot({ path: 'screenshots/go-3-gameover.png' });

console.log('Game over test complete');
await browser.close();
