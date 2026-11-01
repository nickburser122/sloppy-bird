import { describe, it, expect } from 'vitest';
import { worlds } from '../src/levels/worlds.js';
import { DT, makeApp } from './helpers.js';

const surfBosses = worlds.map((w, i) => ({ w, i })).filter(({ w }) => w.mode === 'surf');

describe('the first pit of the surf boss', () => {
  for (const { w, i } of surfBosses) {
    it(w.boss.title + ': is cleared by just riding, with no input, from a standing start', () => {
      const app = makeApp(1000, 700);
      app.scenes.go('Boss', { world: i });
      const sc = app.scenes.current;
      const pit = sc.level.obstacles.find((o) => o.type === 'nodata');
      const limit = Math.ceil(60 / DT);
      for (let n = 0; n < limit && sc.runtime.distance < pit.x + pit.w + 400 && sc.runtime.deaths === 0; n++) {
        app.input.update(DT * 1000);
        app.scenes.update(DT);
      }
      expect(sc.runtime.distance).toBeGreaterThan(pit.x + pit.w);
      expect(sc.runtime.deaths).toBe(0);
    }, 60000);
  }
});
