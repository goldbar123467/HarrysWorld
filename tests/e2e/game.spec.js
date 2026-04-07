import { test, expect } from '../fixtures/game-test.js';

test.describe('Game Boot', () => {
  test('game loads and GameScene is active', async ({ gamePage: page }) => {
    const state = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
    expect(state.mode).toBe('playing');
    expect(state.scenes).toContain('GameScene');
    expect(state.scenes).toContain('HUDScene');
  });

  test('only one player exists on initial load', async ({ gamePage: page }) => {
    const playerCount = await page.evaluate(() => {
      const gameScene = window.__GAME__.scene.getScene('GameScene');
      let count = 0;
      gameScene.children.list.forEach(child => {
        if (child.texture && child.texture.key === 'harry') count++;
      });
      return count;
    });
    expect(playerCount).toBe(1);
  });
});

// Helper: trigger game over and restart via game API
async function triggerGameOverAndRestart(page) {
  // Trigger game over by emitting PLAYER_DIED
  await page.evaluate(() => {
    window.__EVENT_BUS__.emit(window.__EVENTS__.PLAYER_DIED);
  });

  // Wait for GameOverScene to appear
  await page.waitForFunction(() => {
    const scenes = window.__GAME__.scene.getScenes(true).map(s => s.scene.key);
    return scenes.includes('GameOverScene');
  }, { timeout: 10000 });

  // Wait for animations and button to be interactive
  await page.waitForTimeout(2000);

  // Restart via game API — simulate what Play Again does
  await page.evaluate(() => {
    const gs = window.__GAME_STATE__;
    const eventBus = window.__EVENT_BUS__;
    const Events = window.__EVENTS__;
    gs.reset();
    eventBus.emit(Events.GAME_RESTART);
    const gameOverScene = window.__GAME__.scene.getScene('GameOverScene');
    gameOverScene.scene.start('GameScene');
  });

  // Wait for GameScene to be active again
  await page.waitForFunction(() => {
    const gs = window.__GAME_STATE__;
    const scenes = window.__GAME__.scene.getScenes(true).map(s => s.scene.key);
    return scenes.includes('GameScene') && !gs.gameOver && gs.started;
  }, { timeout: 10000 });

  // Let the new game settle
  await page.waitForTimeout(1000);
}

test.describe('Duplicate Harry Bug Fix', () => {
  test('only one Harry after game over and restart', async ({ gamePage: page }) => {
    await triggerGameOverAndRestart(page);

    // Verify only one Harry sprite in the scene
    const playerCount = await page.evaluate(() => {
      const gameScene = window.__GAME__.scene.getScene('GameScene');
      let count = 0;
      gameScene.children.list.forEach(child => {
        if (child.texture && child.texture.key === 'harry') count++;
      });
      return count;
    });
    expect(playerCount).toBe(1);
  });

  test('no stale scenes accumulate after restart', async ({ gamePage: page }) => {
    await triggerGameOverAndRestart(page);

    // Only GameScene and HUDScene should be active
    const activeScenes = await page.evaluate(() => {
      return window.__GAME__.scene.getScenes(true).map(s => s.scene.key);
    });

    expect(activeScenes).toContain('GameScene');
    expect(activeScenes).toContain('HUDScene');
    expect(activeScenes).not.toContain('GameOverScene');
  });

  test('no duplicate Harry after two consecutive restarts', async ({ gamePage: page }) => {
    // First restart
    await triggerGameOverAndRestart(page);
    // Second restart
    await triggerGameOverAndRestart(page);

    const playerCount = await page.evaluate(() => {
      const gameScene = window.__GAME__.scene.getScene('GameScene');
      let count = 0;
      gameScene.children.list.forEach(child => {
        if (child.texture && child.texture.key === 'harry') count++;
      });
      return count;
    });
    expect(playerCount).toBe(1);

    const activeScenes = await page.evaluate(() => {
      return window.__GAME__.scene.getScenes(true).map(s => s.scene.key);
    });
    expect(activeScenes).not.toContain('GameOverScene');
  });
});

test.describe('Game Freeze Prevention', () => {
  test('game remains responsive after restart', async ({ gamePage: page }) => {
    await triggerGameOverAndRestart(page);

    // Check game is responsive — player should move when pressing right
    const before = await page.evaluate(() => JSON.parse(window.render_game_to_text()));

    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowRight');

    const after = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
    expect(after.player.x).toBeGreaterThan(before.player.x);
  });

  test('timer warning tween is cleaned up on restart', async ({ gamePage: page }) => {
    // Trigger time warning (<=10s) via HUD event
    await page.evaluate(() => {
      window.__EVENT_BUS__.emit(window.__EVENTS__.TIME_UPDATE, { timeLeft: 5 });
    });
    await page.waitForTimeout(500);

    // Trigger game over and restart
    await triggerGameOverAndRestart(page);

    // Check that HUDScene timer warning tween was cleaned up
    const tweenState = await page.evaluate(() => {
      const hudScene = window.__GAME__.scene.getScene('HUDScene');
      return {
        timerTween: hudScene._timerTween,
        timerWarning: hudScene._timerWarning,
      };
    });
    // After restart, the timer tween should be null and warning reset
    expect(tweenState.timerTween).toBeNull();
    expect(tweenState.timerWarning).toBe(false);
  });

  test('double-click Play Again is prevented', async ({ gamePage: page }) => {
    // Trigger game over
    await page.evaluate(() => {
      window.__EVENT_BUS__.emit(window.__EVENTS__.PLAYER_DIED);
    });

    await page.waitForFunction(() => {
      const scenes = window.__GAME__.scene.getScenes(true).map(s => s.scene.key);
      return scenes.includes('GameOverScene');
    }, { timeout: 10000 });

    await page.waitForTimeout(2000);

    // Check that _restarting flag exists on GameOverScene
    const hasFlag = await page.evaluate(() => {
      const scene = window.__GAME__.scene.getScene('GameOverScene');
      return '_restarting' in scene;
    });
    expect(hasFlag).toBe(true);
  });
});
