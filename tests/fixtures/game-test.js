import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  gamePage: async ({ page }, use) => {
    await page.goto('/');
    // Wait for the game to boot and GameScene to be active
    await page.waitForFunction(() => {
      const g = window.__GAME__;
      if (!g) return false;
      const scenes = g.scene.getScenes(true).map(s => s.scene.key);
      return scenes.includes('GameScene');
    }, { timeout: 15000 });
    // Let the game settle
    await page.waitForTimeout(500);
    await use(page);
  },
});

export { expect };
