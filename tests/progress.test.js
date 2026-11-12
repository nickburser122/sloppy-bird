import { describe, it, expect } from 'vitest';
import { createSave } from '../src/engine/save.js';
import { worldUnlocked, worldComplete, gauntletUnlocked, levelUnlocked, medalsOf, isClean, totals, worldLevels, clearedCount } from '../src/engine/progress.js';
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

  it('opens a world after three clears in the previous one', () => {
    const save = createSave(memStore());
    expect(worldUnlocked(save, 1)).toBe(true);
    expect(worldUnlocked(save, 2)).toBe(false);
    clear(save, ['w1-l1', 'w1-l2']);
    expect(worldUnlocked(save, 2)).toBe(false);
    clear(save, ['w1-l3']);
    expect(worldUnlocked(save, 2)).toBe(true);
    expect(levelUnlocked(save, 'w2-l1')).toBe(true);
    expect(levelUnlocked(save, 'w3-l1')).toBe(false);
  });

  it('opens world 5 only when worlds 1 to 4 are fully cleared', () => {
    const save = createSave(memStore());
    const ids = levels.filter((l) => l.world <= 4).map((l) => l.id);
    clear(save, ids.slice(0, -1));
    expect(worldUnlocked(save, 5)).toBe(false);
    clear(save, ids);
    expect(worldUnlocked(save, 5)).toBe(true);
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

  it('keeps slow-mode clears out of the unlock rules', () => {
    const save = createSave(memStore());
    for (const id of ['w1-l1', 'w1-l2', 'w1-l3']) save.level(id).clearSlow = true;
    expect(worldUnlocked(save, 2)).toBe(false);
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
