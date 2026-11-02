import { describe, it, expect } from 'vitest';
import { compileLevel } from '../src/levels/compile.js';
import { validateLevel } from '../src/levels/validator.js';
import { levels } from '../src/levels/world1.js';
import { chunks } from '../src/levels/chunks/world1.js';
import { tuning, defaults } from '../src/config/tuning.js';
import { validateBoss } from '../src/levels/bossValidator.js';

describe('level validator', () => {
  for (const def of levels) {
    it('accepts ' + def.id, () => {
      const result = validateLevel(compileLevel(def, chunks));
      expect(result.errors).toEqual([]);
      expect(result.ok).toBe(true);
    });
  }

  it('accepts every final-boss pattern and keeps orbs outside a full jump', () => {
    const result = validateBoss();
    expect(result.errors).toEqual([]);
  });

  it('rejects an obstacle that is too tall to jump', () => {
    tuning.modal.h = 400;
    tuning.validator.maxSims = 4000;
    try {
      const result = validateLevel(compileLevel(levels[0], chunks));
      expect(result.ok).toBe(false);
      expect(result.errors.join(' ')).toMatch(/unreachable|search budget/);
    } finally {
      Object.assign(tuning.modal, defaults.modal);
      Object.assign(tuning.validator, defaults.validator);
    }
  }, 30000);

  it('rejects obstacles packed closer than a jump allows', () => {
    const lib = {
      runway: { length: 900, obstacles: [], items: [] },
      wall: {
        length: 30000,
        obstacles: [
          { type: 'modal', at: 700 },
          { type: 'modal', at: 790 },
          { type: 'modal', at: 880 },
          { type: 'modal', at: 970 },
          { type: 'modal', at: 1060 }
        ]
      }
    };
    const level = compileLevel({ id: 't', name: 't', chunks: ['runway', 'wall'] }, lib);
    expect(validateLevel(level).ok).toBe(false);
  });

  it('rejects a level outside the duration window', () => {
    const level = compileLevel({ id: 't', name: 't', chunks: ['runway', 'runway'] }, { runway: { length: 900, obstacles: [], items: [] } });
    expect(validateLevel(level).errors.join(' ')).toMatch(/duration/);
  });
});
