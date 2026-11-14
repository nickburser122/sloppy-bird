import { describe, it, expect } from 'vitest';
import { createSave } from '../src/engine/save.js';
import { worldUnlocked, endlessUnlocked, worldComplete, gauntletUnlocked, levelUnlocked, medalsOf, isClean, totals, worldLevels, clearedCount } from '../src/engine/progress.js';
import { levels } from '../src/levels/index.js';

const memStore = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) };
};

const clear = (save, ids) => {
  for (const id of ids) save.level(id).clear = true;
};

describe('progress', () => {
  it('has the expected world sizes', () => {
    expect([1, 2, 3, 4, 5].map((w) => worldLevels(w).length)).toEqual([4, 4, 4, 4, 3]);
  });

  it('lets you start in any world from the beginning', () => {
    const save = createSave(memStore());
    for (const w of [1, 2, 3, 4, 5]) expect(worldUnlocked(save, w)).toBe(true);
    expect(levelUnlocked(save, 'w5-boss')).toBe(true);
    expect(levelUnlocked(save, 'nope')).toBe(false);
  });

  it('unlocks endless only once that whole world is cleared', () => {
    const save = createSave(memStore());
    clear(save, ['w3-l1', 'w3-l2', 'w3-l3']);
    expect(endlessUnlocked(save, 3)).toBe(false);
    clear(save, ['w3-l4']);
    expect(endlessUnlocked(save, 3)).toBe(true);
    expect(endlessUnlocked(save, 4)).toBe(false);
  });

  it('unlocks a gauntlet only when its whole world is cleared', () => {
    const save = createSave(memStore());
    clear(save, ['w1-l1', 'w1-l2', 'w1-l3']);
    expect(clearedCount(save, 1)).toBe(3);
    expect(gauntletUnlocked(save, 1)).toBe(false);
    clear(save, ['w1-l4']);
    expect(worldComplete(save, 1)).toBe(true);
    expect(gauntletUnlocked(save, 1)).toBe(true);
  });

  it('keeps slow-mode clears out of the clear medal and endless unlock', () => {
    const save = createSave(memStore());
    for (const id of ['w1-l1', 'w1-l2', 'w1-l3', 'w1-l4']) save.level(id).clearSlow = true;
    expect(endlessUnlocked(save, 1)).toBe(false);
    expect(medalsOf(save.level('w1-l1'))).toEqual({ clear: false, slow: true, clean: false, shard: false });
  });

  it('awards clean for up to ten attempts or a first-try re-clear', () => {
    expect(isClean(10, false)).toBe(true);
    expect(isClean(11, false)).toBe(false);
    expect(isClean(1, true)).toBe(true);
    expect(isClean(2, true)).toBe(true);
    expect(isClean(11, true)).toBe(false);
  });

  it('totals medals across levels', () => {
    const save = createSave(memStore());
    save.level('w1-l1').clear = true;
    save.level('w1-l1').clean = true;
    save.level('w1-l2').clear = true;
    save.level('w1-l2').shard = true;
    expect(totals(save)).toMatchObject({ clear: 2, clean: 1, shard: 1, levels: levels.length });
  });
});

describe('save', () => {
  it('persists settings, gauntlets and level records', () => {
    const store = memStore();
    const a = createSave(store);
    a.setSetting('slow', true);
    a.setSetting('volume', 0.2);
    a.setGauntlet(1);
    a.level('w1-l1').shard = true;
    a.persist();
    const b = createSave(store);
    expect(b.settings().slow).toBe(true);
    expect(b.settings().volume).toBe(0.2);
    expect(b.settings().outline).toBe(false);
    expect(b.settings().ghost).toBe(false);
    b.setEndlessBest(2, 3.4);
    expect(b.setEndlessBest(2, 1)).toBe(false);
    expect(b.endlessBest(2)).toBe(3.4);
    expect(b.gauntlet(1)).toBe(true);
    expect(b.level('w1-l1').shard).toBe(true);
  });

  it('resets everything and tolerates old saves without settings', () => {
    const store = memStore();
    store.setItem('nerve.save.v1', JSON.stringify({ v: 1, levels: { x: { attempts: 3 } } }));
    const a = createSave(store);
    expect(a.settings().muted).toBe(false);
    expect(a.data().levels.x.attempts).toBe(3);
    a.reset();
    expect(Object.keys(a.data().levels)).toEqual([]);
  });
});
