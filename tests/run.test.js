import { describe, it, expect } from 'vitest';
import { compile } from '../src/levels/runtime.js';
import { RunSim, FLAG } from '../src/modes/run.js';
import { Input } from '../src/engine/input.js';
import { runEvents, DT, DT_MS } from '../playtest/bot.js';
import { sp, pit, ring, pad } from '../src/levels/schema.js';

const mk = (events, extra = {}) => ({ id: 't', world: 1, name: 't', mode: 'run', bpm: 140, speed: 540, beats: 12, events, ...extra });

describe('run sim', () => {
  it('dies on an unjumped spike and survives an empty level', () => {
    expect(runEvents(compile(mk([sp(4)])), []).dead).toBe(true);
    expect(runEvents(compile(mk([])), []).won).toBe(true);
  });

  it('is deterministic for identical input logs', () => {
    const c = compile(mk([sp(4), sp(6), pit(8, 200)]));
    const log = [[60, true], [90, false], [130, true], [170, false]];
    const a = runEvents(c, log);
    const b = runEvents(c, log);
    expect([a.tick, a.cause, a.sim.y]).toEqual([b.tick, b.cause, b.sim.y]);
  });

  it('jumps over a single spike with a held press', () => {
    const c = compile(mk([sp(4)]));
    const ticks = Math.round((4 * c.beatSec - 0.2) / DT);
    expect(runEvents(c, [[ticks, true], [ticks + 40, false]]).won).toBe(true);
  });

  it('applies coyote time and input buffering', () => {
    const c = compile(mk([]));
    const sim = new RunSim(c);
    const inp = new Input();
    inp.setSource('b', true);
    inp.update(DT_MS);
    sim.update(DT, inp);
    expect(sim.flags & FLAG.JUMP).toBeTruthy();
  });

  it('uses a ring once and launches from a pad', () => {
    const r = compile(mk([ring(4, 20)]));
    const sim = new RunSim(r);
    const inp = new Input();
    for (let i = 0; i < 20; i++) {
      inp.update(DT_MS);
      sim.update(DT, inp);
    }
    expect(sim.used[0]).toBe(0);
    const p = compile(mk([pad(2)]));
    const out = runEvents(p, [], 0);
    expect(out.sim.cause).not.toBe('spike');
  });

  it('keeps music-synced obstacle positions across speed portals', () => {
    const c = compile(mk([{ beat: 2, type: 'speed', mul: 1.4 }, sp(6)]));
    expect(c.X(2 * c.beatSec)).toBeCloseTo(540 * 2 * c.beatSec, 5);
    expect(c.spikes[0].ox).toBeGreaterThan(540 * 6 * c.beatSec);
  });
});
