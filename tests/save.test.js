import { describe, it, expect } from 'vitest';
import { SaveStore, SAVE_KEY, SAVE_VERSION, DEFAULT_SETTINGS } from '../src/save.js';
import { computeStars } from '../src/levels/scoring.js';
import { world1 } from '../src/levels/world1.js';

function memory(initial) {
  const map = new Map();
  if (initial !== undefined) map.set(SAVE_KEY, initial);
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    map
  };
}

describe('SaveStore', () => {
  it('starts empty', () => {
    const save = new SaveStore(memory());
    expect(save.stars('w1l1')).toBe(0);
    expect(save.completed('w1l1')).toBe(false);
  });

  it('persists a result and reloads it', () => {
    const storage = memory();
    new SaveStore(storage).record('w1l1', { stars: 2, time: 61, retries: 3 });
    const again = new SaveStore(storage);
    expect(again.stars('w1l1')).toBe(2);
    expect(again.get('w1l1').bestTime).toBe(61);
    expect(JSON.parse(storage.map.get(SAVE_KEY)).version).toBe(SAVE_VERSION);
  });

  it('keeps the best stars, time and retries across runs', () => {
    const save = new SaveStore(memory());
    save.record('w1l1', { stars: 3, time: 70, retries: 0 });
    const r = save.record('w1l1', { stars: 1, time: 55, retries: 4 });
    expect(r.improved).toBe(false);
    expect(save.stars('w1l1')).toBe(3);
    expect(save.get('w1l1').bestTime).toBe(55);
    expect(save.get('w1l1').bestRetries).toBe(0);
  });

  it('discards corrupt, foreign or old-version data instead of crashing', () => {
    expect(new SaveStore(memory('{not json')).stars('w1l1')).toBe(0);
    expect(new SaveStore(memory(JSON.stringify({ version: 99, levels: { w1l1: { stars: 3 } } }))).stars('w1l1')).toBe(0);
    expect(new SaveStore(memory(JSON.stringify({ version: SAVE_VERSION, levels: null }))).stars('w1l1')).toBe(0);
  });

  it('clamps and filters malformed entries', () => {
    const raw = JSON.stringify({
      version: SAVE_VERSION,
      levels: { a: { stars: 9, bestTime: 'x' }, b: { stars: 0 }, c: 5, d: { stars: 2, bestTime: -4 } }
    });
    const save = new SaveStore(memory(raw));
    expect(save.stars('a')).toBe(3);
    expect(save.get('a').bestTime).toBe(null);
    expect(save.get('b')).toBe(null);
    expect(save.get('c')).toBe(null);
    expect(save.get('d').bestTime).toBe(null);
  });

  it('survives storage that throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      }
    };
    const save = new SaveStore(broken);
    expect(() => save.record('w1l1', { stars: 1, time: 1, retries: 0 })).not.toThrow();
    expect(save.stars('w1l1')).toBe(1);
  });

  it('unlocks a level only after finishing the previous one', () => {
    const save = new SaveStore(memory());
    const order = world1.order;
    expect(save.isUnlocked(order, 'w1l1')).toBe(true);
    expect(save.isUnlocked(order, 'w1l2')).toBe(false);
    save.record('w1l1', { stars: 1, time: 60, retries: 9 });
    expect(save.isUnlocked(order, 'w1l2')).toBe(true);
    expect(save.isUnlocked(order, 'w1boss')).toBe(false);
    save.record('w1l2', { stars: 1, time: 60, retries: 9 });
    save.record('w1l3', { stars: 1, time: 60, retries: 9 });
    expect(save.isUnlocked(order, 'w1boss')).toBe(true);
  });

  it('reset clears progress', () => {
    const save = new SaveStore(memory());
    save.record('w1l1', { stars: 2, time: 1, retries: 1 });
    save.reset();
    expect(save.stars('w1l1')).toBe(0);
  });
});

describe('computeStars', () => {
  it('awards one star for finishing', () => {
    expect(computeStars({ collected: 0, total: 100, retries: 5 })).toBe(1);
  });

  it('awards a star at 80% collected and not below it', () => {
    expect(computeStars({ collected: 80, total: 100, retries: 2 })).toBe(2);
    expect(computeStars({ collected: 79, total: 100, retries: 2 })).toBe(1);
  });

  it('awards a star for a run without retries', () => {
    expect(computeStars({ collected: 0, total: 100, retries: 0 })).toBe(2);
    expect(computeStars({ collected: 100, total: 100, retries: 0 })).toBe(3);
  });

  it('caps debug-assisted runs at one star', () => {
    expect(computeStars({ collected: 100, total: 100, retries: 0, cheated: true })).toBe(1);
  });
});

describe('settings and migration', () => {
  it('migrates a version 1 save, keeping progress and adding default settings', () => {
    const old = JSON.stringify({ version: 1, levels: { w1l1: { stars: 3, bestTime: 50, bestRetries: 0 } } });
    const save = new SaveStore(memory(old));
    expect(save.stars('w1l1')).toBe(3);
    expect(save.settings()).toEqual(DEFAULT_SETTINGS);
    save.write();
    expect(JSON.parse(save.storage.getItem(SAVE_KEY)).version).toBe(SAVE_VERSION);
  });

  it('starts with sensible defaults', () => {
    const s = new SaveStore(memory()).settings();
    expect(s).toEqual({ sound: true, volume: 0.5, motion: 'system', assist: false, quality: 'auto' });
  });

  it('persists a changed setting', () => {
    const storage = memory();
    const a = new SaveStore(storage);
    expect(a.setSetting('assist', true)).toBe(true);
    expect(a.setSetting('volume', 0.2)).toBe(true);
    const b = new SaveStore(storage);
    expect(b.settings().assist).toBe(true);
    expect(b.settings().volume).toBe(0.2);
  });

  it('rejects unknown keys and invalid values', () => {
    const save = new SaveStore(memory());
    expect(save.setSetting('nope', 1)).toBe(false);
    expect(save.setSetting('motion', 'sideways')).toBe(false);
    expect(save.setSetting('assist', 'yes')).toBe(false);
    expect(save.setSetting('quality', 'ultra')).toBe(false);
    expect(save.settings()).toEqual(DEFAULT_SETTINGS);
  });

  it('clamps volume and repairs corrupt settings on load', () => {
    const raw = JSON.stringify({
      version: SAVE_VERSION,
      levels: {},
      settings: { sound: 'x', volume: 7, motion: 'bad', assist: 1, quality: null }
    });
    const s = new SaveStore(memory(raw)).settings();
    expect(s.volume).toBe(1);
    expect(s.sound).toBe(true);
    expect(s.motion).toBe('system');
    expect(s.assist).toBe(false);
    expect(s.quality).toBe('auto');
  });

  it('resetting progress keeps the settings', () => {
    const save = new SaveStore(memory());
    save.setSetting('assist', true);
    save.record('w1l1', { stars: 2, time: 1, retries: 1 });
    save.reset();
    expect(save.stars('w1l1')).toBe(0);
    expect(save.settings().assist).toBe(true);
  });
});
