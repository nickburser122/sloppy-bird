import { describe, it, expect } from 'vitest';
import { levels, byId } from '../src/levels/index.js';
import { compile } from '../src/levels/runtime.js';
import { search, runEvents } from '../playtest/bot.js';

describe('shards', () => {
  it('places a shard inside the playfield for every level that has one', () => {
    const withShard = levels.filter((l) => l.shard);
    expect(withShard.length).toBeGreaterThanOrEqual(15);
    for (const l of withShard) {
      expect(l.shard.beat).toBeGreaterThan(0);
      expect(l.shard.beat).toBeLessThan(l.beats);
      expect(l.shard.y).toBeGreaterThan(40);
      expect(l.shard.y).toBeLessThan(500);
    }
  });

  it('keeps the shard off the safe line but reachable by a full clear', () => {
    const level = byId('w1-l1');
    const c = compile(level);
    const safe = search(compile({ ...level, shard: undefined }), { width: 160 });
    expect(runEvents(c, safe).got).toBe(false);
    const ev = search(c, { width: 200, needShard: true });
    expect(ev).not.toBeNull();
    const r = runEvents(c, ev);
    expect(r.won).toBe(true);
    expect(r.got).toBe(true);
  }, 120000);
});
