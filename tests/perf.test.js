import { describe, it, expect } from 'vitest';
import { byId } from '../src/levels/index.js';
import { compile } from '../src/levels/runtime.js';
import { createSim } from '../src/modes/sims.js';
import { Input } from '../src/engine/input.js';
import { Particles } from '../src/engine/particles.js';
import { mulberry32, DT, DT_MS } from '../playtest/bot.js';

const IDS = ['w1-l2', 'w2-l3', 'w3-l4', 'w4-l4', 'w5-boss'];

function bench(id, ticks) {
  const c = compile(byId(id));
  const sim = createSim(c);
  const inp = new Input();
  const rand = mulberry32(5);
  let down = false;
  const t0 = performance.now();
  for (let i = 0; i < ticks; i++) {
    if (rand() < 0.05) {
      down = !down;
      inp.setSource('r', down);
    }
    inp.update(DT_MS);
    sim.update(DT, inp);
    if (sim.dead || sim.won) sim.reset();
  }
  return (performance.now() - t0) / ticks;
}

describe('performance budget', () => {
  for (const id of IDS) {
    it(`${id}: one sim tick costs well under the 60 fps budget`, () => {
      bench(id, 500);
      const per = bench(id, 6000);
      expect(per).toBeLessThan(0.25);
    });
  }

  it('reuses particle objects instead of allocating', () => {
    const p = new Particles(64);
    const first = p.items[0];
    for (let r = 0; r < 50; r++) {
      p.burst(0, 0, 30, ['#fff'], {});
      p.update(0.5);
    }
    expect(p.items.length).toBe(64);
    expect(p.items.includes(first)).toBe(true);
    expect(p.count).toBeLessThanOrEqual(64);
  });
});
