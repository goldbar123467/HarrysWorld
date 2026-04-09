import { test, expect } from '../fixtures/game-test.js';

test.describe('Visual Regression', () => {
  test('title screen renders correctly', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('harrys_world_tutorial_done', '1'));

    // Wait for TitleScene to fully load and animate
    await page.waitForFunction(() => {
      const g = window.__GAME__;
      if (!g) return false;
      const scenes = g.scene.getScenes(true).map(s => s.scene.key);
      return scenes.includes('TitleScene');
    }, { timeout: 15000 });

    // Wait for animations to settle
    await page.waitForTimeout(2000);

    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot('title-screen.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  test('gameplay initial state renders correctly', async ({ gamePage: page }) => {
    // Wait for entrance animation to finish
    await page.waitForTimeout(1500);

    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot('gameplay-initial.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  test('game over screen renders correctly', async ({ gamePage: page }) => {
    await page.evaluate(() => {
      window.__EVENT_BUS__.emit(window.__EVENTS__.PLAYER_DIED);
    });

    // Wait for death animation + GameOverScene to fully animate
    await page.waitForFunction(() => {
      const scenes = window.__GAME__.scene.getScenes(true).map(s => s.scene.key);
      return scenes.includes('GameOverScene');
    }, { timeout: 10000 });

    // Wait for all entrance animations
    await page.waitForTimeout(2500);

    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot('game-over.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  test('HUD elements are visible during gameplay', async ({ gamePage: page }) => {
    await page.waitForTimeout(1000);

    // Verify HUD scene is running
    const hudActive = await page.evaluate(() => {
      const scenes = window.__GAME__.scene.getScenes(true).map(s => s.scene.key);
      return scenes.includes('HUDScene');
    });
    expect(hudActive).toBe(true);

    // Verify HUD text objects exist
    const hudElements = await page.evaluate(() => {
      const hudScene = window.__GAME__.scene.getScene('HUDScene');
      return {
        hasScoreText: !!hudScene._scoreText,
        hasTimerText: !!hudScene._timerText,
        hasComboText: !!hudScene._comboText,
        hasLevelText: !!hudScene._levelText,
      };
    });

    expect(hudElements.hasScoreText).toBe(true);
    expect(hudElements.hasTimerText).toBe(true);
    expect(hudElements.hasComboText).toBe(true);
    expect(hudElements.hasLevelText).toBe(true);
  });
});
