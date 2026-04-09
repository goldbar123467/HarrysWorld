import { chromium } from '@playwright/test';
const name = process.argv[2] || 'screenshot';
const delay = parseInt(process.argv[3] || '2000');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 540, height: 960 } });

// Capture console errors
page.on('console', msg => {
  if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
});
page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await page.waitForTimeout(delay);
await page.screenshot({ path: `screenshots/${name}.png` });
console.log(`Screenshot saved: screenshots/${name}.png`);
await browser.close();
