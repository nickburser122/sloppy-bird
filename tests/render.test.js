import { describe, it, expect, afterEach } from 'vitest';
import { drawBackdrop, drawGround, drawPlayer, drawObstacle, drawToken, drawOrb, drawShield } from '../src/levels/draw.js';
import { bossLayout } from '../src/entities/bosses/shared.js';
import { worlds } from '../src/levels/worlds.js';
import { OBSTACLES, createObstacle } from '../src/entities/obstacles/types.js';
import { themes, applyTheme, motion, quality } from '../src/config/tokens.js';
import { tuning } from '../src/config/tuning.js';

function fakeCtx() {
  const calls = [];
  const store = {};
  const ctx = new Proxy(store, {
    get(t, k) {
      if (k === 'measureText') return () => ({ width: 40 });
      if (k === '__calls') return calls;
      if (k in t) return t[k];
      return (...a) => {
        calls.push(k);
        return undefined;
      };
    },
    set(t, k, v) {
      t[k] = v;
      return true;
    }
  });
  return ctx;
}

const fakeRoot = { style: { setProperty: () => {} } };

afterEach(() => {
  motion.reduced = false;
  quality.shadows = true;
  applyTheme('landing', fakeRoot);
});

describe('every drawing routine runs in every theme and state', () => {
  for (const theme of Object.keys(themes)) {
    for (const reduced of [false, true]) {
      for (const shadows of [true, false]) {
        it(theme + (reduced ? ' reduced-motion' : '') + (shadows ? '' : ' low-quality') + ': scenery, obstacles, player', () => {
          applyTheme(theme, fakeRoot);
          motion.reduced = reduced;
          quality.shadows = shadows;
          const ctx = fakeCtx();
          drawBackdrop(ctx, 1000, 500, 1234);
          for (const mode of ['run', 'flap', 'flip', 'mixed']) drawGround(ctx, 1000, 500, 77, mode);
          for (const type of Object.keys(OBSTACLES)) {
            const o = createObstacle({ type, at: 0, lift: 40, h: type === 'card' ? 120 : undefined, from: type === 'card' ? 'top' : undefined }, 0, 320);
            expect(() => drawObstacle(ctx, o, 300, 500, 1.3, 500)).not.toThrow();
          }
          expect(() => {
            drawToken(ctx, 10, 10, 12);
            drawOrb(ctx, 10, 10, 20, 1);
            drawShield(ctx, 5, 5, 40, 0.5);
            drawPlayer(ctx, 100, 100, 40, 1, 0.3);
            drawPlayer(ctx, 100, 100, 40, 0.5, 0);
          }).not.toThrow();
          expect(ctx.__calls.length).toBeGreaterThan(50);
        });
      }
    }
  }
});

describe('boss artwork', () => {
  for (const w of worlds.filter((x) => x.boss)) {
    for (const flash of [-1, 0, 350, 700]) {
      for (const phase of [0, 1, 2, 3]) {
        it(w.boss.title + ' draws at flash ' + flash + ' phase ' + phase, () => {
          applyTheme(w.theme, fakeRoot);
          const ctx = fakeCtx();
          const L = bossLayout(1000, 500, w.boss.tall ? tuning.flap.fieldH : 0);
          expect(() => w.boss.draw(ctx, L, { flash, flinch: flash > 0 ? 0.5 : 0, phase, label: 'Test attack', time: 3.2 })).not.toThrow();
          expect(ctx.__calls.length).toBeGreaterThan(20);
        });
      }
    }
  }

  it('the layout stays on screen for tiny and huge viewports', () => {
    for (const [w, gy] of [[320, 200], [800, 280], [1920, 800], [4000, 1200]]) {
      for (const tall of [0, 360]) {
        const L = bossLayout(w, gy, tall);
        expect(L.x).toBeGreaterThanOrEqual(0);
        expect(L.x + L.w).toBeLessThanOrEqual(w);
        expect(L.w).toBeGreaterThan(100);
        expect(L.h).toBeGreaterThan(0);
      }
    }
  });
});
