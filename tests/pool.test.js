import { describe, it, expect } from 'vitest';
import { Pool } from '../src/engine/pool.js';

describe('Pool', () => {
  it('preallocates and reuses objects', () => {
    let created = 0;
    const pool = new Pool(3, () => ({ id: created++, live: false }), (o) => {
      o.live = true;
    });
    expect(created).toBe(3);
    const a = pool.acquire();
    expect(a.live).toBe(true);
    pool.release(a);
    const b = pool.acquire();
    expect(b).toBe(a);
    expect(created).toBe(3);
  });

  it('returns null when exhausted instead of allocating', () => {
    const pool = new Pool(2, () => ({}));
    pool.acquire();
    pool.acquire();
    expect(pool.acquire()).toBe(null);
  });

  it('update releases entries that return false and visits each once', () => {
    const pool = new Pool(5, () => ({ n: 0 }), (o) => {
      o.n = 0;
    });
    const items = [];
    for (let i = 0; i < 5; i++) {
      const o = pool.acquire();
      o.n = i;
      items.push(o);
    }
    const seen = [];
    pool.update((o) => {
      seen.push(o.n);
      return o.n % 2 === 0 ? false : true;
    });
    expect(seen.sort()).toEqual([0, 1, 2, 3, 4]);
    expect(pool.count).toBe(2);
    expect(pool.freeCount).toBe(3);
  });

  it('releaseAll returns everything', () => {
    const pool = new Pool(4, () => ({}));
    pool.acquire();
    pool.acquire();
    pool.releaseAll();
    expect(pool.count).toBe(0);
    expect(pool.freeCount).toBe(4);
  });
});
