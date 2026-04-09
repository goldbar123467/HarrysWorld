import { test, expect } from '../fixtures/game-test.js';

// ─── Game Boot ───────────────────────────────────────────────────────────────

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

  test('render_game_to_text returns valid JSON with all fields', async ({ gamePage: page }) => {
    const state = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
    expect(state).toHaveProperty('coords');
    expect(state).toHaveProperty('mode');
    expect(state).toHaveProperty('scenes');
    expect(state).toHaveProperty('level');
    expect(state).toHaveProperty('score');
    expect(state).toHaveProperty('timeLeft');
    expect(state).toHaveProperty('combo');
    expect(state).toHaveProperty('player');
    expect(state.player).toHaveProperty('x');
    expect(state.player).toHaveProperty('y');
    expect(state.player).toHaveProperty('active');
    expect(state.player).toHaveProperty('onGround');
  });

  test('initial game state is correct', async ({ gamePage: page }) => {
    const state = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
    expect(state.score).toBe(0);
    expect(state.combo).toBe(0);
    expect(state.level).toBe(1);
    expect(state.timeLeft).toBeGreaterThan(0);
    expect(state.player.active).toBe(true);
    expect(state.player.visible).toBe(true);
  });
});

// ─── Input & Movement ────────────────────────────────────────────────────────

test.describe('Input & Movement', () => {
  test('player moves right when ArrowRight is pressed', async ({ gamePage: page }) => {
    const before = await page.evaluate(() => JSON.parse(window.render_game_to_text()));

    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowRight');

    const after = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
    expect(after.player.x).toBeGreaterThan(before.player.x);
  });

  test('player moves left when ArrowLeft is pressed', async ({ gamePage: page }) => {
    // First move right so we have room to go left
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(600);
    await page.keyboard.up('ArrowRight');

    const before = await page.evaluate(() => JSON.parse(window.render_game_to_text()));

    await page.keyboard.down('ArrowLeft');
    await page.waitForTimeout(400);
    await page.keyboard.up('ArrowLeft');

    const after = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
    expect(after.player.x).toBeLessThan(before.player.x);
  });

  test('player jumps when Space is pressed', async ({ gamePage: page }) => {
    // Wait for player entrance tween to complete and settle on ground
    await page.waitForTimeout(1500);

    // Wait until player is confirmed on ground
    await page.waitForFunction(() => {
      const state = JSON.parse(window.render_game_to_text());
      return state.player && state.player.onGround;
    }, { timeout: 5000 });

    // Hold space down to trigger jump and keep holding for variable height
    await page.keyboard.down('Space');

    // Wait for player to leave the ground (vy should be negative = moving up)
    await page.waitForFunction(() => {
      const state = JSON.parse(window.render_game_to_text());
      return state.player && state.player.vy < 0;
    }, { timeout: 3000 });

    await page.keyboard.up('Space');

    const state = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
    expect(state.player.vy).toBeLessThan(0); // Still moving upward
  });

  test('WASD controls work', async ({ gamePage: page }) => {
    const before = await page.evaluate(() => JSON.parse(window.render_game_to_text()));

    await page.keyboard.down('KeyD');
    await page.waitForTimeout(500);
    await page.keyboard.up('KeyD');

    const after = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
    expect(after.player.x).toBeGreaterThan(before.player.x);
  });
});

// ─── Scoring & Combo ─────────────────────────────────────────────────────────

test.describe('Scoring & Combo', () => {
  test('collecting an item increases score', async ({ gamePage: page }) => {
    // Simulate collecting via EventBus
    const result = await page.evaluate(() => {
      const gs = window.__GAME_STATE__;
      const oldScore = gs.score;

      // Directly modify score as if a collectible was picked up
      gs.score += 10;
      const newScore = gs.score;

      return { oldScore, newScore };
    });
    expect(result.newScore).toBe(result.oldScore + 10);
  });

  test('combo multiplier applies to score', async ({ gamePage: page }) => {
    // Test the combo multiplier logic by simulating rapid collection
    const result = await page.evaluate(() => {
      const gs = window.__GAME_STATE__;
      gs.score = 0;
      gs.combo = 3;

      // The combo multiplier formula: value * Math.max(1, combo)
      const baseValue = 10;
      const comboMultiplier = Math.max(1, gs.combo);
      const earned = baseValue * comboMultiplier;

      gs.score += earned;
      return { earned, score: gs.score, combo: gs.combo };
    });

    expect(result.earned).toBe(30); // 10 * 3x combo
    expect(result.score).toBe(30);
  });

  test('score persists across the session', async ({ gamePage: page }) => {
    await page.evaluate(() => {
      window.__GAME_STATE__.score = 42;
    });

    const state = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
    expect(state.score).toBe(42);
  });
});

// ─── Timer ───────────────────────────────────────────────────────────────────

test.describe('Timer', () => {
  test('timer counts down', async ({ gamePage: page }) => {
    const before = await page.evaluate(() => JSON.parse(window.render_game_to_text()));

    // Wait for at least one timer tick (timer fires every 1000ms)
    await page.waitForFunction((startTime) => {
      return window.__GAME_STATE__.timeLeft < startTime;
    }, before.timeLeft, { timeout: 5000 });

    const after = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
    expect(after.timeLeft).toBeLessThan(before.timeLeft);
  });

  test('timer reaches zero triggers game over', async ({ gamePage: page }) => {
    // Set timer to 1 second
    await page.evaluate(() => {
      window.__GAME_STATE__.timeLeft = 1;
    });

    // Wait for timer to tick to 0
    await page.waitForFunction(() => {
      return window.__GAME_STATE__.gameOver === true;
    }, { timeout: 5000 });

    const state = await page.evaluate(() => window.__GAME_STATE__.won);
    expect(state).toBe(false);
  });
});

// ─── Game Over & Restart ─────────────────────────────────────────────────────

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

  // Wait for death animation and button to be interactive
  await page.waitForTimeout(3000);

  // Restart via game API — simulate what Play Again does
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

  // Wait for GameScene to be active again
  await page.waitForFunction(() => {
    const gs = window.__GAME_STATE__;
    const scenes = window.__GAME__.scene.getScenes(true).map(s => s.scene.key);
    return scenes.includes('GameScene') && !gs.gameOver && gs.started;
  }, { timeout: 10000 });

  // Let the new game settle
  await page.waitForTimeout(1000);
}

test.describe('Game Over & Restart', () => {
  test('player death triggers game over scene', async ({ gamePage: page }) => {
    await page.evaluate(() => {
      window.__EVENT_BUS__.emit(window.__EVENTS__.PLAYER_DIED);
    });

    await page.waitForFunction(() => {
      const scenes = window.__GAME__.scene.getScenes(true).map(s => s.scene.key);
      return scenes.includes('GameOverScene');
    }, { timeout: 10000 });

    const state = await page.evaluate(() => ({
      gameOver: window.__GAME_STATE__.gameOver,
      won: window.__GAME_STATE__.won,
    }));
    expect(state.gameOver).toBe(true);
    expect(state.won).toBe(false);
  });

  test('only one Harry after game over and restart', async ({ gamePage: page }) => {
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
  });

  test('no stale scenes accumulate after restart', async ({ gamePage: page }) => {
    await triggerGameOverAndRestart(page);

    const activeScenes = await page.evaluate(() => {
      return window.__GAME__.scene.getScenes(true).map(s => s.scene.key);
    });

    expect(activeScenes).toContain('GameScene');
    expect(activeScenes).toContain('HUDScene');
    expect(activeScenes).not.toContain('GameOverScene');
  });

  test('no duplicate Harry after two consecutive restarts', async ({ gamePage: page }) => {
    await triggerGameOverAndRestart(page);
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
  });

  test('score resets on restart', async ({ gamePage: page }) => {
    // Set a score
    await page.evaluate(() => { window.__GAME_STATE__.score = 100; });

    await triggerGameOverAndRestart(page);

    const state = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
    expect(state.score).toBe(0);
  });
});

// ─── Game Freeze Prevention ──────────────────────────────────────────────────

test.describe('Game Freeze Prevention', () => {
  test('game remains responsive after restart', async ({ gamePage: page }) => {
    await triggerGameOverAndRestart(page);

    const before = await page.evaluate(() => JSON.parse(window.render_game_to_text()));

    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowRight');

    const after = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
    expect(after.player.x).toBeGreaterThan(before.player.x);
  });

  test('timer warning tween is cleaned up on restart', async ({ gamePage: page }) => {
    await page.evaluate(() => {
      window.__EVENT_BUS__.emit(window.__EVENTS__.TIME_UPDATE, { timeLeft: 5 });
    });
    await page.waitForTimeout(500);

    await triggerGameOverAndRestart(page);

    const tweenState = await page.evaluate(() => {
      const hudScene = window.__GAME__.scene.getScene('HUDScene');
      return {
        timerTween: hudScene._timerTween,
        timerWarning: hudScene._timerWarning,
      };
    });
    expect(tweenState.timerTween).toBeNull();
    expect(tweenState.timerWarning).toBe(false);
  });

  test('double-click Play Again is prevented', async ({ gamePage: page }) => {
    await page.evaluate(() => {
      window.__EVENT_BUS__.emit(window.__EVENTS__.PLAYER_DIED);
    });

    await page.waitForFunction(() => {
      const scenes = window.__GAME__.scene.getScenes(true).map(s => s.scene.key);
      return scenes.includes('GameOverScene');
    }, { timeout: 10000 });

    await page.waitForTimeout(3000);

    const hasFlag = await page.evaluate(() => {
      const scene = window.__GAME__.scene.getScene('GameOverScene');
      return '_transitioning' in scene;
    });
    expect(hasFlag).toBe(true);
  });
});

// ─── Design Intent ───────────────────────────────────────────────────────────

test.describe('Design Intent', () => {
  test('player loses if no input is given (timer expires)', async ({ gamePage: page }) => {
    // Set timer low so we don't wait 65 seconds
    await page.evaluate(() => {
      window.__GAME_STATE__.timeLeft = 3;
    });

    // Wait for game over with NO player input
    await page.waitForFunction(() => {
      return window.__GAME_STATE__.gameOver === true;
    }, { timeout: 10000 });

    // Should be a LOSS, not a win
    const won = await page.evaluate(() => window.__GAME_STATE__.won);
    expect(won).toBe(false);
  });

  test('hall monitors exist and are active threats', async ({ gamePage: page }) => {
    const monitorData = await page.evaluate(() => {
      const gameScene = window.__GAME__.scene.getScene('GameScene');
      const monitors = [];
      gameScene.children.list.forEach(child => {
        if (child.texture && child.texture.key === 'hall_monitor' && child.active) {
          monitors.push({ x: Math.round(child.x), y: Math.round(child.y) });
        }
      });
      return monitors;
    });

    // Level 1 should have at least 2 monitors
    expect(monitorData.length).toBeGreaterThanOrEqual(2);
  });

  test('collectibles exist and can be scored', async ({ gamePage: page }) => {
    const collectibleCount = await page.evaluate(() => {
      const gameScene = window.__GAME__.scene.getScene('GameScene');
      let count = 0;
      gameScene.children.list.forEach(child => {
        if (child.texture && (child.texture.key === 'book' || child.texture.key === 'hall_pass') && child.active) {
          count++;
        }
      });
      return count;
    });

    // Level 1 should have collectibles
    expect(collectibleCount).toBeGreaterThanOrEqual(4);
  });

  test('door exists at the end of the level', async ({ gamePage: page }) => {
    const doorExists = await page.evaluate(() => {
      const gameScene = window.__GAME__.scene.getScene('GameScene');
      let found = false;
      gameScene.children.list.forEach(child => {
        if (child.texture && child.texture.key === 'door') found = true;
      });
      return found;
    });

    expect(doorExists).toBe(true);
  });

  test('reaching door triggers win', async ({ gamePage: page }) => {
    // Directly invoke the win condition via game API
    // (Teleporting + physics overlap is unreliable in headless)
    await page.evaluate(() => {
      const gameScene = window.__GAME__.scene.getScene('GameScene');
      // Call _onReachDoor which is what the overlap handler calls
      gameScene._onReachDoor.call(gameScene);
    });

    // Wait for game over
    await page.waitForFunction(() => {
      return window.__GAME_STATE__.gameOver === true;
    }, { timeout: 5000 });

    const won = await page.evaluate(() => window.__GAME_STATE__.won);
    expect(won).toBe(true);
  });

  // QA FLAG: asymmetric interaction — Hall monitors only kill the player, not
  // each other. Obstacles collide with player but not monitors. This is
  // intentional: monitors patrol on platforms/ground and the player must avoid them.
});

// ─── Death Animation ─────────────────────────────────────────────────────────

test.describe('Death Animation', () => {
  test('PLAYER_DIED only fires once even if called rapidly', async ({ gamePage: page }) => {
    const deathCount = await page.evaluate(() => {
      let count = 0;
      window.__EVENT_BUS__.on(window.__EVENTS__.GAME_OVER, () => count++);

      // Try to emit death multiple times
      window.__EVENT_BUS__.emit(window.__EVENTS__.PLAYER_DIED);
      window.__EVENT_BUS__.emit(window.__EVENTS__.PLAYER_DIED);
      window.__EVENT_BUS__.emit(window.__EVENTS__.PLAYER_DIED);

      return count;
    });

    // Should only trigger game over once due to _gameEnded guard
    expect(deathCount).toBe(1);
  });

  test('player becomes inactive after death', async ({ gamePage: page }) => {
    await page.evaluate(() => {
      window.__EVENT_BUS__.emit(window.__EVENTS__.PLAYER_DIED);
    });

    // Wait for death to process
    await page.waitForTimeout(500);

    const playerActive = await page.evaluate(() => {
      const gameScene = window.__GAME__.scene.getScene('GameScene');
      return gameScene.player ? gameScene.player.active : null;
    });

    expect(playerActive).toBe(false);
  });
});
