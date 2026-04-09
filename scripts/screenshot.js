import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });

page.on('console', msg => {
  if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
});
page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

await page.goto('http://localhost:3000');
await page.waitForTimeout(3500);

// Title screen
await page.screenshot({ path: '/home/user/HarrysWorld/screenshots/30-title.png' });

// Click level select
await page.click('canvas', { position: { x: 480, y: 432 } });
await page.waitForTimeout(1000);
await page.screenshot({ path: '/home/user/HarrysWorld/screenshots/31-levelselect.png' });

// Click back (or ESC)
await page.keyboard.press('Escape');
await page.waitForTimeout(500);

// Click PLAY
await page.click('canvas', { position: { x: 480, y: 370 } });
await page.waitForTimeout(3000);

// Dismiss tutorial
await page.click('canvas');
await page.waitForTimeout(500);
await page.screenshot({ path: '/home/user/HarrysWorld/screenshots/32-gameplay.png' });

// Run right and collect items
await page.keyboard.down('ArrowRight');
await page.waitForTimeout(2000);
await page.keyboard.press('Space');
await page.waitForTimeout(600);
await page.keyboard.press('Space');
await page.waitForTimeout(3000);
await page.screenshot({ path: '/home/user/HarrysWorld/screenshots/33-midgame.png' });

// Continue running toward the end
await page.waitForTimeout(5000);
await page.screenshot({ path: '/home/user/HarrysWorld/screenshots/34-lategame.png' });

// Keep going
await page.waitForTimeout(5000);
await page.screenshot({ path: '/home/user/HarrysWorld/screenshots/35-further.png' });

await page.keyboard.up('ArrowRight');

// Wait for any potential game over
await page.waitForTimeout(3000);
await page.screenshot({ path: '/home/user/HarrysWorld/screenshots/36-result.png' });

await browser.close();
console.log('Screenshots captured!');
