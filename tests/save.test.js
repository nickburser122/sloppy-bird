import { describe, it, expect } from 'vitest';
import { createSave } from '../src/engine/save.js';

function fakeStorage(initial) {
  const store = new Map(initial ? [['nerve.save.v1', initial]] : []);
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v)
  };
}

describe('save', () => {
  it('round-trips level records under the nerve key', () => {
    const storage = fakeStorage();
    const a = createSave(storage);
    const rec = a.level('w1-l1');
    rec.attempts = 7;
    rec.bestPct = 0.62;
    a.persist();
    const b = createSave(storage);
    expect(b.level('w1-l1').attempts).toBe(7);
    expect(b.level('w1-l1').bestPct).toBe(0.62);
  });

  it('recovers from corrupt data', () => {
    const s = createSave(fakeStorage('{nope'));
    expect(s.level('x').attempts).toBe(0);
  });

  it('works with no storage', () => {
    const s = createSave(null);
    s.level('x').attempts = 1;
    expect(() => s.persist()).not.toThrow();
  });
});
