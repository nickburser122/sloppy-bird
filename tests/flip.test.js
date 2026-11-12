import { describe, it, expect } from 'vitest';
import { compile } from '../src/levels/runtime.js';
import { FlipSim, } from '../src/modes/flip.js';
import { Input } from '../src/engine/input.js';
import { runEvents, DT, DT_MS } from '../playtest/bot.js';
import { fsp, gap, laser, orb, force } from '../src/levels/schema.js';

const mk = (events) => ({ id: 't', world: 4, name: 't', mode: 'flip', bpm: 132, speed: 500, beats: 14, events });

describe('flip sim', () => {
  it('survives an empty level and dies on an unavoided floor spike', () => {
    expect(runEvents(compile(mk([])), []).won).toBe(true);
    expect(runEvents(compile(mk([fsp(4, 0)])), []).dead).toBe(true);
  });

  it('only flips while touching a surface', () => {
    const c = compile(mk([]));
    const sim = new FlipSim(c);
    const inp = new Input();
    inp.setSource('b', true);
    inp.update(DT_MS);
    sim.update(DT, inp);
    expect(sim.gd).toBe(-1);
    inp.setSource('b', false);
    inp.update(DT_MS);
    sim.update(DT, inp);
    inp.setSource('b', true);
    inp.update(DT_MS);
    sim.update(DT, inp);
    expect(sim.gd).toBe(-1);
  });

  it('dies through a floor gap and clears it from the ceiling', () => {
    const c = compile(mk([gap(4, 0, 160)]));
    expect(runEvents(c, []).dead).toBe(true);
    const t = Math.round((4 * c.beatSec - 0.45) / DT);
    expect(runEvents(c, [[t, true], [t + 2, false]]).won).toBe(true);
  });

  it('lets an orb flip mid-air once', () => {
    const c = compile(mk([orb(4, 270)]));
    const sim = new FlipSim(c);
    expect(sim.used.length).toBe(1);
  });

  it('is deterministic and keeps lasers on the beat', () => {
    const c = compile(mk([laser(4, 0), fsp(6, 1), force(8)]));
    const log = [[120, true], [124, false], [200, true], [204, false]];
    const a = runEvents(c, log);
    const b = runEvents(c, log);
    expect([a.tick, a.cause, a.sim.y]).toEqual([b.tick, b.cause, b.sim.y]);
    const s = new FlipSim(c);
    expect(s.laserSide(c.lasers[0], c.lasers[0].tb)).toBe(0);
    expect(s.laserSide(c.lasers[0], c.lasers[0].tb + c.beatSec)).toBe(1);
  });
});
