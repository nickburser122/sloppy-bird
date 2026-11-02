import { describe, it, expect } from 'vitest';
import { worlds } from '../src/levels/worlds.js';
import { compileLevel } from '../src/levels/compile.js';
import { validateLevel } from '../src/levels/validator.js';
import { tuning } from '../src/config/tuning.js';

const allLevels = [];
for (const w of worlds) for (const def of w.levels) allLevels.push({ w, def, level: compileLevel(def, w.chunks) });

describe('level content', () => {
  it('ships two short levels per play world and one final boss', () => {
    expect(allLevels.length).toBe(6);
    expect(worlds.map((w) => w.levels.length)).toEqual([2, 2, 2, 0]);
    expect(worlds.filter((w) => w.boss).length).toBe(1);
    expect(worlds[worlds.length - 1].boss.title).toBe('The Paywall');
  });

  for (const { def, level } of allLevels) {
    it(def.id + ' passes the validator and fits in thirty seconds', () => {
      const r = validateLevel(level);
      expect(r.errors).toEqual([]);
      expect(r.seconds).toBeLessThanOrEqual(30);
      expect(r.seconds).toBeGreaterThanOrEqual(20);
    });

    it(def.id + ' has no pickups, no checkpoint and honest token counts', () => {
      expect(level.checkpoint).toBeUndefined();
      expect(level.items.every((i) => i.kind === 'token')).toBe(true);
      expect(level.tokenTotal).toBe(level.items.length);
    });

    it(def.id + ' keeps items in order and inside the field', () => {
      for (let i = 1; i < level.items.length; i++) expect(level.items[i].x).toBeGreaterThanOrEqual(level.items[i - 1].x);
      for (const it of level.items) {
        expect(it.x).toBeGreaterThan(0);
        expect(it.x).toBeLessThan(level.length);
        expect(it.lift).toBeGreaterThan(0);
      }
    });

    it(def.id + ' is dense: at least two obstacles per second on average', () => {
      const r = validateLevel(level);
      expect(level.obstacles.length / r.seconds).toBeGreaterThanOrEqual(1.6);
    });
  }

  it('gets faster from the first level to the second in every world', () => {
    for (const w of worlds.filter((x) => x.levels.length)) {
      expect(w.levels[1].speedMul).toBeGreaterThan(w.levels[0].speedMul);
    }
  });

  it('starts with at least a second of runway before the first obstacle', () => {
    for (const { level } of allLevels) {
      const first = level.obstacles[0];
      expect((first.x / level.speedAt(0)) * 1000).toBeGreaterThanOrEqual(tuning.validator.minReactMs);
    }
  });
});
