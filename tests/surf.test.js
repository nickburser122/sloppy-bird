import { describe, it, expect } from 'vitest';
import { levels } from '../src/levels/index.js';
import { compile } from '../src/levels/runtime.js';
import { SurfSim } from '../src/modes/surf.js';
import { Input } from '../src/engine/input.js';
import { mulberry32, DT, DT_MS } from '../playtest/bot.js';

const surfLevels = levels.filter((l) => l.mode === 'surf');

describe('surf stability', () => {
  it('has surf levels registered', () => {
    expect(surfLevels.length).toBe(4);
  });

  for (const level of surfLevels) {
    it(`${level.id}: 60 s of random input has no NaN, no tunnelling and no water deaths`, () => {
      const c = compile(level);
      const rand = mulberry32(11);
      let total = 0;
      let maxDy = 0;
      let maxDs = 0;
      while (total < 60) {
        const sim = new SurfSim(c);
        const inp = new Input();
        let down = false;
        while (!sim.dead && !sim.won) {
          if (rand() < 0.04) {
            down = !down;
            inp.setSource('r', down);
          }
          const y0 = sim.y;
          const s0 = sim.surface(sim.t);
          inp.update(DT_MS);
          sim.update(DT, inp);
          expect(Number.isFinite(sim.y)).toBe(true);
          expect(Number.isFinite(sim.vy)).toBe(true);
          expect(Math.abs(sim.vy)).toBeLessThanOrEqual(1400.001);
          maxDy = Math.max(maxDy, Math.abs(sim.y - y0));
          maxDs = Math.max(maxDs, Math.abs(sim.surface(sim.t) - s0));
        }
        expect(sim.cause).not.toBe('water');
        total += sim.t;
      }
      expect(maxDy).toBeLessThan(14);
      expect(maxDs).toBeLessThan(14);
    });
  }
});
