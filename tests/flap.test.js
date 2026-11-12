import { describe, it, expect } from 'vitest';
import { compile } from '../src/levels/runtime.js';
import { FlapSim } from '../src/modes/flap.js';
import { Input } from '../src/engine/input.js';
import { runEvents, search, DT, DT_MS } from '../playtest/bot.js';
import { thorn, spider, plant, wind } from '../src/levels/schema.js';

const mk = (events, extra = {}) => ({ id: 't', world: 2, name: 't', mode: 'flap', bpm: 120, speed: 300, beats: 16, events, ...extra });

describe('flap sim', () => {
  it('falls to the floor without input', () => {
    const r = runEvents(compile(mk([])), []);
    expect(r.dead).toBe(true);
    expect(r.cause).toBe('floor');
  });

  it('sets velocity on a flap instead of adding to it', () => {
    const c = compile(mk([]));
    const sim = new FlapSim(c);
    const inp = new Input();
    for (let i = 0; i < 30; i++) {
      inp.update(DT_MS);
      sim.update(DT, inp);
    }
    inp.setSource('b', true);
    inp.update(DT_MS);
    sim.update(DT, inp);
    expect(sim.vy).toBeLessThan(-500);
    expect(sim.vy).toBeGreaterThan(-530);
  });

  it('kills on a thorn column and is beatable through a wide gap', () => {
    const c = compile(mk([thorn(8, 100, 120)]));
    expect(runEvents(c, []).dead).toBe(true);
    const open = compile(mk([thorn(8, 270, 190)]));
    const ev = search(open, { width: 160 });
    expect(ev).not.toBeNull();
    expect(runEvents(open, ev).won).toBe(true);
  });

  it('computes darkness amounts, spiders, plants and wind deterministically', () => {
    const c = compile(mk([spider(4, 250), plant(6), wind(8, 200, -1)], { dark: [[4, 10]] }));
    const sim = new FlapSim(c);
    expect(sim.darkAmt(0)).toBe(0);
    expect(sim.darkAmt(c.dark[0][0] + 1)).toBe(1);
    expect(sim.spiderY(c.spiders[0], c.spiders[0].tb)).toBeCloseTo(250, 5);
    expect(sim.plantH(c.plants[0], c.plants[0].tb)).toBeCloseTo(0, 5);
    expect(c.winds[0].dir).toBe(-1);
  });
});
