import { describe, it, expect, beforeAll } from 'vitest';
import { SAVE_KEY, SAVE_VERSION } from '../src/save.js';
import { worlds, allOrder } from '../src/levels/worlds.js';
import { tuning } from '../src/config/tuning.js';
import { DT, makeApp, drive } from './helpers.js';

beforeAll(() => {
  tuning.debug.invincible = true;
});

describe('scene smoke tests', () => {
  for (let wi = 0; wi < worlds.length; wi++) {
    const world = worlds[wi];

    if (world.levels.length) it(world.name + ': a level runs, renders and finishes', () => {
      const app = makeApp(1000, 700);
      app.scenes.go('Level', { world: wi, index: 0 });
      drive(app, 600, 5);
      expect(app.scenes.name).toBe('Level');
      expect(app.scenes.current.runtime.distance).toBeGreaterThan(0);
      app.scenes.current.skip();
      drive(app, 5, 1);
      expect(app.scenes.name).toBe('Results');
      expect(app.save.completed(world.levels[0].id)).toBe(true);
      expect(app.save.stars(world.levels[0].id)).toBe(1);
    });

    if (world.boss) it(world.name + ': the boss fight can be played to a win', () => {
      const app = makeApp(1000, 700);
      let result = null;
      const go = app.scenes.go.bind(app.scenes);
      app.scenes.go = (name, params) => {
        if (name === 'Results') result = params;
        go(name, params);
      };
      app.scenes.go('Boss', { world: wi });
      drive(app, 120 * 120, 40);
      expect(app.scenes.name).toBe('Results');
      expect(app.save.completed(world.bossId)).toBe(true);
      expect(result.time).toBeGreaterThanOrEqual(15);
      expect(result.time).toBeLessThanOrEqual(45);
    });

    it(world.name + ': small landscape screens scale the world down instead of clipping it', () => {
      const app = makeApp(800, 360);
      if (world.levels.length) app.scenes.go('Level', { world: wi, index: 0 });
      else app.scenes.go('Boss', { world: wi });
      drive(app, 120, 5);
      const scene = app.scenes.current;
      expect(scene.sc).toBeLessThan(1);
      expect(scene.env.groundY() - tuning.view.hudH / scene.sc).toBeGreaterThan(
        (world.mode === 'flap' ? tuning.flap.fieldH : world.mode === 'flip' ? tuning.flip.fieldH : tuning.run.field) - 1
      );
    });
  }

  it('pause keeps the level and quitting returns to level select on that world', () => {
    const app = makeApp(1000, 700);
    app.scenes.go('Level', { world: 1, index: 1 });
    drive(app, 60, 5);
    expect(app.scenes.pause('Pause')).toBe(true);
    drive(app, 10, 1);
    app.overlay.querySelector('[data-act="levels"]').click();
    expect(app.scenes.name).toBe('WorldSelect');
    expect(app.scenes.under).toBe(null);
  });

  it('level select unlocks across worlds only after the previous world is finished', () => {
    const app = makeApp(1000, 700);
    app.scenes.go('WorldSelect', { world: 1 });
    const first = app.overlay.querySelector('.cta[data-i="0"]');
    expect(first.disabled).toBe(true);
    for (const id of allOrder.slice(0, 2)) app.save.record(id, { stars: 1, time: 60, retries: 1 });
    app.scenes.go('WorldSelect', { world: 1 });
    expect(app.overlay.querySelector('.cta[data-i="0"]').disabled).toBe(false);
    app.overlay.querySelector('.cta[data-i="0"]').click();
    expect(app.scenes.name).toBe('Level');
    expect(app.scenes.current.worldIndex).toBe(1);
  });

  it('results lead on to the next world and the final boss, and nothing after it', () => {
    const app = makeApp(1000, 700);
    app.scenes.go('Results', { kind: 'level', world: 0, index: 0, stars: 2, deaths: 1, time: 28, collected: 9, total: 10 });
    expect(app.overlay.querySelector('[data-act="next"]').textContent).toBe('Next level');
    app.scenes.go('Results', { kind: 'level', world: 0, index: 1, stars: 2, deaths: 1, time: 28, collected: 9, total: 10 });
    expect(app.overlay.querySelector('[data-act="next"]').textContent).toBe('Next world');
    app.overlay.querySelector('[data-act="next"]').click();
    expect(app.scenes.name).toBe('Level');
    expect(app.scenes.current.worldIndex).toBe(1);
    app.scenes.go('Results', { kind: 'level', world: 2, index: 1, stars: 2, deaths: 1, time: 28, collected: 9, total: 10 });
    expect(app.overlay.querySelector('[data-act="next"]').textContent).toBe('Face the boss');
    app.overlay.querySelector('[data-act="next"]').click();
    expect(app.scenes.name).toBe('Boss');
    app.scenes.go('Results', { kind: 'boss', world: worlds.length - 1, index: 0, stars: 2, deaths: 1, time: 28, collected: 5, total: 5 });
    expect(app.overlay.querySelector('[data-act="next"]')).toBe(null);
  });

  it('writes a versioned save that survives a reload', () => {
    const app = makeApp(1000, 700);
    app.save.record('w1l1', { stars: 3, time: 50, retries: 0 });
    expect(JSON.parse(app.storage.get(SAVE_KEY)).version).toBe(SAVE_VERSION);
  });
});
