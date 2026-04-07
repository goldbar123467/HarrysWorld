import { test, expect } from '@playwright/test';

// Test the FULL game lifecycle: timer runs out → game over → play again → verify
test('full game cycle: timer game-over then restart', async ({ page }) => {
  test.setTimeout(90000);

  await page.goto('/');

  // Wait for game to boot
  await page.waitForFunction(() => {
    const g = window.__GAME__;
    if (!g) return false;
    const scenes = g.scene.getScenes(true).map(s => s.scene.key);
    return scenes.includes('GameScene');
  }, { timeout: 15000 });
  await page.waitForTimeout(500);

  // Speed up the game timer: set timeLeft to 3 so game ends quickly
  await page.evaluate(() => {
    window.__GAME_STATE__.timeLeft = 3;
  });

  // Wait for game over (timer will tick down via the real timer event)
  await page.waitForFunction(() => {
    return window.__GAME_STATE__.gameOver === true;
  }, { timeout: 15000 });

  console.log('Game over triggered via timer');

  // Wait for GameOverScene
  await page.waitForFunction(() => {
    const scenes = window.__GAME__.scene.getScenes(true).map(s => s.scene.key);
    return scenes.includes('GameOverScene');
  }, { timeout: 10000 });

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/full-cycle-gameover.png' });

  // Get button position and click it
  const btnPos = await page.evaluate(() => {
    const scene = window.__GAME__.scene.getScene('GameOverScene');
    let bx = 0, by = 0;
    scene.children.list.forEach(child => {
      if (child.type === 'Container') { bx = child.x; by = child.y; }
    });
    return { x: bx, y: by, gw: window.__GAME__.config.width, gh: window.__GAME__.config.height };
  });

  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  const cx = btnPos.x * (box.width / btnPos.gw);
  const cy = btnPos.y * (box.height / btnPos.gh);

  await canvas.click({ position: { x: cx, y: cy } });

  // Wait for restart
  const restarted = await page.waitForFunction(() => {
    const gs = window.__GAME_STATE__;
    const scenes = window.__GAME__.scene.getScenes(true).map(s => s.scene.key);
    return scenes.includes('GameScene') && !gs.gameOver && gs.started;
  }, { timeout: 15000 }).catch(() => false);

  expect(restarted).toBeTruthy();

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/full-cycle-restart.png' });

  // Count harry sprites
  const harryCount = await page.evaluate(() => {
    let total = 0;
    window.__GAME__.scene.scenes.forEach(scene => {
      if (scene.children && scene.children.list) {
        scene.children.list.forEach(child => {
          if (child.texture && child.texture.key === 'harry') total++;
        });
      }
    });
    return total;
  });

  console.log('Harry count after full cycle restart:', harryCount);
  expect(harryCount).toBe(1);

  // Verify game is responsive
  const before = await page.evaluate(() => {
    const p = window.__GAME__.scene.getScene('GameScene').player;
    return { x: p.x, active: p.active };
  });

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(500);
  await page.keyboard.up('ArrowRight');

  const after = await page.evaluate(() => {
    const p = window.__GAME__.scene.getScene('GameScene').player;
    return { x: p.x, active: p.active };
  });

  console.log('Player moved:', before.x, '->', after.x);
  expect(after.x).toBeGreaterThan(before.x);
});

// Test rapid double-click on Play Again (race condition)
test('rapid restart does not cause duplicate', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => {
    const g = window.__GAME__;
    return g && g.scene.getScenes(true).map(s => s.scene.key).includes('GameScene');
  }, { timeout: 15000 });
  await page.waitForTimeout(500);

  // Trigger game over
  await page.evaluate(() => {
    const gs = window.__GAME__.scene.getScene('GameScene');
    gs._endGame(false);
  });

  await page.waitForFunction(() => {
    return window.__GAME__.scene.getScenes(true).map(s => s.scene.key).includes('GameOverScene');
  }, { timeout: 10000 });
  await page.waitForTimeout(2000);

  // Double click Play Again rapidly
  const btnPos = await page.evaluate(() => {
    const scene = window.__GAME__.scene.getScene('GameOverScene');
    let bx = 0, by = 0;
    scene.children.list.forEach(child => {
      if (child.type === 'Container') { bx = child.x; by = child.y; }
    });
    return { x: bx, y: by, gw: window.__GAME__.config.width, gh: window.__GAME__.config.height };
  });

  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  const cx = btnPos.x * (box.width / btnPos.gw);
  const cy = btnPos.y * (box.height / btnPos.gh);

  // Rapid double click
  await canvas.click({ position: { x: cx, y: cy } });
  await canvas.click({ position: { x: cx, y: cy } });

  await page.waitForFunction(() => {
    const gs = window.__GAME_STATE__;
    const scenes = window.__GAME__.scene.getScenes(true).map(s => s.scene.key);
    return scenes.includes('GameScene') && !gs.gameOver;
  }, { timeout: 15000 });

  await page.waitForTimeout(1000);

  const harryCount = await page.evaluate(() => {
    let total = 0;
    window.__GAME__.scene.scenes.forEach(scene => {
      if (scene.children && scene.children.list) {
        scene.children.list.forEach(child => {
          if (child.texture && child.texture.key === 'harry') total++;
        });
      }
    });
    return total;
  });

  console.log('Harry count after double-click restart:', harryCount);
  expect(harryCount).toBe(1);

  const scenes = await page.evaluate(() => {
    return window.__GAME__.scene.getScenes(true).map(s => s.scene.key);
  });
  expect(scenes).not.toContain('GameOverScene');
});
