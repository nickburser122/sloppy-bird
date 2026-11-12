import { describe, it, expect } from 'vitest';
import { compile } from '../src/levels/runtime.js';
import { MixSim } from '../src/modes/mix.js';
import { FLAG } from '../src/modes/run.js';
import { Input } from '../src/engine/input.js';
import { runEvents, DT, DT_MS } from '../playtest/bot.js';
import { levels } from '../src/levels/index.js';

const mk = (events, extra = {}) => ({
  id: 't',
  world: 5,
  name: 't',
  mode: 'mix',
  start: 'run',
  bpm: 140,
  beats: 20,
  waves: [{ a: 22, l: 420, v: 60, p: 0 }],
  events,
  ...extra
});

describe('mix sim', () => {
  it('builds one sub-sim per mode and a shared clock', () => {
    const c = compile(mk([{ beat: 6, type: 'portal', mode: 'flip' }, { beat: 12, type: 'portal', mode: 'flap' }]));
    expect(Object.keys(c.subs).sort()).toEqual(['flap', 'flip', 'run']);
    expect(c.segs.map((s) => s.mode)).toEqual(['run', 'flip', 'flap']);
    expect(c.subs.flip.X(3)).toBeCloseTo(c.subs.run.X(3), 6);
  });

  it('switches mode at the portal beat and raises the portal flag once', () => {
    const c = compile(mk([{ beat: 6, type: 'portal', mode: 'flip' }]));
    const sim = new MixSim(c);
    const inp = new Input();
    let flags = 0;
    let count = 0;
    for (let i = 0; i < 20 * 120 && !sim.dead && !sim.won; i++) {
      inp.update(DT_MS);
      sim.update(DT, inp);
      if (sim.flags & FLAG.PORTAL) count++;
      flags |= sim.flags;
      if (i === 100) expect(sim.modeName).toBe('run');
      if (i === Math.ceil((6 * c.beatSec) / DT) + 5) expect(sim.modeName).toBe('flip');
    }
    expect(count).toBe(1);
    expect(flags & FLAG.PORTAL).toBeTruthy();
  });

  it('is deterministic across a portal', () => {
    const c = compile(mk([{ beat: 6, type: 'portal', mode: 'flap' }, { beat: 9, type: 'thorn', gy: 100, gap: 120, w: 60 }]));
    const log = [[300, true], [304, false]];
    const a = runEvents(c, log);
    const b = runEvents(c, log);
    expect([a.tick, a.cause, a.sim.y]).toEqual([b.tick, b.cause, b.sim.y]);
  });

  for (const level of levels.filter((l) => l.mode === 'mix')) {
    it(`${level.id}: switches modes at most 6 times and stays within 30 s`, () => {
      const c = compile(level);
      expect(c.segs.length - 1).toBeLessThanOrEqual(6);
      expect(c.duration).toBeLessThanOrEqual(30);
    });
  }
});
