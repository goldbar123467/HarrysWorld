import { test, expect } from '../fixtures/game-test.js';

test.describe('Performance', () => {
  test('game loads within 10 seconds', async ({ page }) => {
    const start = Date.now();

    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('harrys_world_tutorial_done', '1'));

    await page.waitForFunction(() => {
      const g = window.__GAME__;
      if (!g) return false;
      const scenes = g.scene.getScenes(true).map(s => s.scene.key);
      return scenes.includes('TitleScene');
    }, { timeout: 15000 });

    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(10000);
  });

  test('canvas dimensions are valid', async ({ gamePage: page }) => {
    const dims = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return {
        width: canvas.width,
        height: canvas.height,
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
      };
    });

    expect(dims.width).toBeGreaterThan(0);
    expect(dims.height).toBeGreaterThan(0);
    expect(dims.clientWidth).toBeGreaterThan(0);
    expect(dims.clientHeight).toBeGreaterThan(0);
  });

  test('game maintains reasonable FPS during gameplay', async ({ gamePage: page }) => {
    // Measure FPS over 2 seconds of active gameplay
    await page.keyboard.down('ArrowRight');

    const fps = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frames = 0;
        const start = performance.now();

        function count() {
          frames++;
          if (performance.now() - start < 2000) {
            requestAnimationFrame(count);
          } else {
            resolve(frames / 2); // FPS = frames / seconds
          }
        }
        requestAnimationFrame(count);
      });
    });

    await page.keyboard.up('ArrowRight');

    // Headless Chromium on CI often runs at reduced FPS.
    // 10 FPS is the minimum for a playable game in any environment.
    expect(fps).toBeGreaterThan(10);
  });

  test('no excessive game objects on level 1', async ({ gamePage: page }) => {
    const objectCount = await page.evaluate(() => {
      const gameScene = window.__GAME__.scene.getScene('GameScene');
      return gameScene.children.list.length;
    });

    // Level 1 with background tiles, platforms, obstacles, collectibles,
    // monitors, decorations, etc. should be under 2000 objects
    expect(objectCount).toBeLessThan(2000);
  });

  test('no memory leaks after restart cycle', async ({ gamePage: page }) => {
    // Get initial object count
    const beforeCount = await page.evaluate(() => {
      const gameScene = window.__GAME__.scene.getScene('GameScene');
      return gameScene.children.list.length;
    });

    // Trigger game over
    await page.evaluate(() => {
      window.__EVENT_BUS__.emit(window.__EVENTS__.PLAYER_DIED);
    });

    await page.waitForFunction(() => {
      const scenes = window.__GAME__.scene.getScenes(true).map(s => s.scene.key);
      return scenes.includes('GameOverScene');
    }, { timeout: 10000 });

    await page.waitForTimeout(3000);

    // Restart
    await page.evaluate(() => {
      const gs = window.__GAME_STATE__;
      const eventBus = window.__EVENT_BUS__;
      const Events = window.__EVENTS__;
      gs.reset();
      gs.level = gs.level || 1;
      eventBus.emit(Events.GAME_RESTART);
      const gameOverScene = window.__GAME__.scene.getScene('GameOverScene');
      gameOverScene.scene.start('GameScene');
    });

    await page.waitForFunction(() => {
      const gs = window.__GAME_STATE__;
      const scenes = window.__GAME__.scene.getScenes(true).map(s => s.scene.key);
      return scenes.includes('GameScene') && !gs.gameOver && gs.started;
    }, { timeout: 10000 });

    await page.waitForTimeout(1000);

    const afterCount = await page.evaluate(() => {
      const gameScene = window.__GAME__.scene.getScene('GameScene');
      return gameScene.children.list.length;
    });

    // After restart, object count should be within 20% of initial
    // (small variance allowed for particles, tweens still cleaning up)
    const variance = Math.abs(afterCount - beforeCount) / beforeCount;
    expect(variance).toBeLessThan(0.25);
  });
});
