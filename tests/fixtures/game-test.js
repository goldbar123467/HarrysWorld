import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  gamePage: async ({ page }, use) => {
    await page.goto('/');
    // Clear tutorial flag so tests are consistent
    await page.evaluate(() => localStorage.setItem('harrys_world_tutorial_done', '1'));

    // Wait for TitleScene to load
    await page.waitForFunction(() => {
      const g = window.__GAME__;
      if (!g) return false;
      const scenes = g.scene.getScenes(true).map(s => s.scene.key);
      return scenes.includes('TitleScene');
    }, { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Start game by pressing Enter
    await page.keyboard.press('Enter');

    // Wait for GameScene to be active
    await page.waitForFunction(() => {
      const g = window.__GAME__;
      if (!g) return false;
      const gs = window.__GAME_STATE__;
      const scenes = g.scene.getScenes(true).map(s => s.scene.key);
      return scenes.includes('GameScene') && gs && gs.started;
    }, { timeout: 15000 });

    // Let the game settle
    await page.waitForTimeout(500);
    await use(page);
  },
});

export { expect };
