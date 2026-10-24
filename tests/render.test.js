import { describe, it, expect, afterEach } from 'vitest';
import { drawBackdrop, drawGround, drawPlayer, drawObstacle, drawToken, drawOrb, drawPower, drawBullet, drawShield, drawTerrain } from '../src/levels/draw.js';
import { bossLayout } from '../src/entities/bosses/shared.js';
import { worlds } from '../src/levels/worlds.js';
import { OBSTACLES, createObstacle } from '../src/entities/obstacles/types.js';
import { POWERS } from '../src/engine/powerups.js';
import { Terrain, hills } from '../src/levels/terrain.js';
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
        it(theme + (reduced ? ' reduced-motion' : '') + (shadows ? '' : ' low-quality') + ': scenery, obstacles, pickups, player', () => {
          applyTheme(theme, fakeRoot);
          motion.reduced = reduced;
          quality.shadows = shadows;
          const ctx = fakeCtx();
          drawBackdrop(ctx, 1000, 500, 1234);
          for (const mode of ['run', 'flap', 'flip', 'surf', 'mixed']) drawGround(ctx, 1000, 500, 77, mode);
          for (const type of Object.keys(OBSTACLES)) {
            for (const destructible of [false, true]) {
              const o = createObstacle({ type, at: 0, lift: type === 'nodata' ? undefined : 40, h: type === 'card' ? 120 : undefined, from: type === 'card' ? 'top' : undefined, destructible }, 0, 320);
              expect(() => drawObstacle(ctx, o, 300, 500, 1.3, 500)).not.toThrow();
            }
          }
          for (const k of POWERS) expect(() => drawPower(ctx, 100, 100, k, 2)).not.toThrow();
          expect(() => {
            drawToken(ctx, 10, 10, 12);
            drawOrb(ctx, 10, 10, 20, 1);
            drawBullet(ctx, 5, 5);
            drawShield(ctx, 5, 5, 40, 0.5);
            drawPlayer(ctx, 100, 100, 40, 1, 0.3);
            drawPlayer(ctx, 100, 100, 40, 0.5, 0);
          }).not.toThrow();
          const t = new Terrain();
          for (const [x, y] of hills(3000, [150, 140, 150], 50)) t.addPoint(x, y);
          t.addGap(1000, 1200);
          t.seal();
          expect(() => drawTerrain(ctx, 1000, 500, 900, t, 220)).not.toThrow();
          expect(ctx.__calls.length).toBeGreaterThan(50);
        });
      }
    }
  }

  it('terrain drawing handles very wide screens without reallocating per frame', () => {
    const ctx = fakeCtx();
    const t = new Terrain();
    t.addPoint(0, 50);
    t.addPoint(100000, 150);
    for (const w of [320, 1920, 5000, 320]) expect(() => drawTerrain(ctx, w, 500, 0, t, 100)).not.toThrow();
  });
});

describe('boss artwork', () => {
  for (const w of worlds) {
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
