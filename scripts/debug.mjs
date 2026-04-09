import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
page.on('console', msg => {
  if (msg.type() === 'error' || msg.type() === 'warning') 
    console.log(`[${msg.type()}]`, msg.text());
});
page.on('pageerror', err => console.log('PAGE ERROR:', err.message, '\nSTACK:', err.stack || 'no stack'));
await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.screenshot({ path: 'screenshots/debug.png' });
await browser.close();
