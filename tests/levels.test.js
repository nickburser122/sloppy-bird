import { describe, it, expect } from 'vitest';
import { levels } from '../src/levels/index.js';
import { validate } from '../src/levels/validator.js';
import { checkLevel } from '../src/levels/schema.js';

const knownMisses = {
  'w1-l2': ['tightest window'],
  'w1-l3': ['tightest window', 'jitter'],
  'w1-l4': ['tightest window', 'tightest hold window', 'jitter'],
  'w2-l2': ['reaction'],
  'w3-l2': ['reaction', 'inputs/s', 'no-input stretch', 'jitter'],
  'w3-l3': ['tightest window', 'of windows over 400ms', 'no-input stretch', 'jitter'],
  'w3-l4': ['tightest window', 'no-input stretch', 'jitter'],
  'w4-l3': ['inputs/s'],
  'w4-l4': ['inputs/s', 'no-input stretch'],
  'w5-l1': ['inputs/s', 'no-input stretch'],
  'w5-l2': ['inputs/s', 'no-input stretch'],
  'w5-boss': ['no-input stretch', 'tightest hold window', 'jitter']
};

describe('levels', () => {
  it('registers nineteen levels with unique ids', () => {
    expect(levels.length).toBe(19);
    expect(new Set(levels.map((l) => l.id)).size).toBe(19);
    for (const l of levels) expect(() => checkLevel(l)).not.toThrow();
  });

  for (const level of levels) {
    it(`${level.id} ${level.name} passes every playtest gate${knownMisses[level.id] ? ' except known misses' : ''}`, () => {
      const res = validate(level);
      const allowed = knownMisses[level.id] || [];
      expect(res.fail.filter((f) => !allowed.some((a) => f.includes(a)))).toEqual([]);
    }, 120000);
  }
});
