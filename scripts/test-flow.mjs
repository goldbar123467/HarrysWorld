import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
page.on('pageerror', err => console.log('ERROR:', err.message));

await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.screenshot({ path: 'screenshots/polish-1-title.png' });

// Start game
await page.mouse.click(270, 730);
await page.waitForTimeout(1500);
await page.screenshot({ path: 'screenshots/polish-2-tutorial.png' });

// Dismiss tutorial
await page.keyboard.press('Space');
await page.waitForTimeout(1000);
await page.screenshot({ path: 'screenshots/polish-3-game.png' });

// Move right and jump
for (let i = 0; i < 40; i++) {
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(50);
}
await page.keyboard.press('Space');
await page.waitForTimeout(300);
await page.keyboard.up('ArrowRight');
await page.waitForTimeout(800);
await page.screenshot({ path: 'screenshots/polish-4-action.png' });

// Pause
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshots/polish-5-pause.png' });

console.log('Polish QA complete');
await browser.close();
