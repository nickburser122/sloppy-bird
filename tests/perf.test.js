import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { worlds } from '../src/levels/worlds.js';
import { tuning } from '../src/config/tuning.js';
import { DT, makeApp } from './helpers.js';

beforeAll(() => {
  tuning.debug.invincible = true;
});

afterAll(() => {
  tuning.debug.invincible = false;
});

function timeSteps(app, steps, renderEvery) {
  const t0 = performance.now();
  for (let i = 0; i < steps; i++) {
    app.input.update(DT * 1000);
    app.scenes.update(DT);
    if (renderEvery && i % renderEvery === 0) app.scenes.render(0.5);
  }
  return performance.now() - t0;
}

describe('frame cost guards', () => {
  for (let wi = 0; wi < worlds.length; wi++) {
    const w = worlds[wi];
    it(w.name + ': simulation stays far below a 120 Hz budget', () => {
      const app = makeApp(1000, 700);
      if (w.levels.length) app.scenes.go('Level', { world: wi, index: 0 });
      else app.scenes.go('Boss', { world: wi });
      timeSteps(app, 600, 0);
      const ms = timeSteps(app, 6000, 0);
      expect(ms / 6000).toBeLessThan(0.25);
    });

    it(w.name + ': draw calls per frame stay bounded', () => {
      const app = makeApp(1000, 700);
      let calls = 0;
      const base = app.ctx;
      app.ctx = new Proxy(base, {
        get(t, k) {
          const v = t[k];
          if (typeof v === 'function' && k !== 'measureText') {
            return (...a) => {
              calls++;
              return v(...a);
            };
          }
          return v;
        },
        set(t, k, v) {
          t[k] = v;
          return true;
        }
      });
      if (w.levels.length) app.scenes.go('Level', { world: wi, index: 0 });
      else app.scenes.go('Boss', { world: wi });
      timeSteps(app, 1200, 0);
      calls = 0;
      const frames = 200;
      for (let i = 0; i < frames; i++) {
        app.input.update(DT * 1000);
        app.scenes.update(DT);
        app.scenes.render(0.5);
      }
      expect(calls / frames).toBeLessThan(900);
    });
  }
});
