import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { worlds } from '../src/levels/worlds.js';
import { tuning } from '../src/config/tuning.js';
import { DT, makeApp } from './helpers.js';

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fuzz(sceneName, params, seed) {
  const rand = rng(seed);
  const app = makeApp(900, 600);
  app.scenes.go(sceneName, params);
  let down = false;
  let pausedFor = 0;
  let deaths = 0;
  for (let i = 0; i < 120 * 30; i++) {
    const name = app.scenes.name;
    if (name !== 'Level' && name !== 'Boss' && name !== 'Pause') break;
    if (pausedFor > 0) {
      pausedFor--;
      if (pausedFor === 0) app.scenes.resume();
    } else if (rand() < 0.0008) {
      if (app.scenes.pause('Pause')) pausedFor = 1 + Math.floor(rand() * 40);
    }
    if (rand() < 0.02) {
      down = !down;
      app.input.setSource('fuzz', down);
    }
    if (rand() < 0.002) app.settings.set('assist', !app.settings.assist);
    if (rand() < 0.002) app.settings.set('motion', ['system', 'reduce', 'full'][Math.floor(rand() * 3)]);
    if (rand() < 0.002) app.settings.set('quality', ['auto', 'high', 'low'][Math.floor(rand() * 3)]);
    if (rand() < 0.002) {
      app.width = 360 + Math.floor(rand() * 1400);
      app.height = 320 + Math.floor(rand() * 700);
    }
    app.input.update(DT * 1000);
    app.scenes.update(DT);
    if (i % 5 === 0) app.scenes.render(rand());
    const cur = app.scenes.under || app.scenes.current;
    if (cur && cur.runtime) {
      const rt = cur.runtime;
      expect(Number.isFinite(rt.distance)).toBe(true);
      expect(Number.isFinite(cur.player.y)).toBe(true);
      expect(Number.isFinite(cur.mode.getHitbox().x)).toBe(true);
      expect(['running', 'dead', 'won']).toContain(rt.state);
      expect(rt.pool.count).toBeLessThanOrEqual(tuning.level.poolSize);
      expect(cur.particles.pool.count).toBeLessThanOrEqual(tuning.fx.maxParticles);
      deaths = rt.deaths;
    }
  }
  return deaths;
}

beforeEach(() => {
  tuning.debug.invincible = false;
});

afterEach(() => {
  tuning.debug.invincible = false;
});

describe('fuzzing with random input, resizes and pauses', () => {
  for (let wi = 0; wi < worlds.length; wi++) {
    const w = worlds[wi];
    for (let li = 0; li < w.levels.length; li++) {
      it(w.levels[li].id + ' stays consistent', () => {
        expect(() => fuzz('Level', { world: wi, index: li }, 1000 + wi * 10 + li)).not.toThrow();
      });
    }
    if (w.boss) {
      it(w.boss.title + ' stays consistent', () => {
        expect(() => fuzz('Boss', { world: wi }, 5000 + wi)).not.toThrow();
      });
    }
  }

  it('actually exercises deaths and restarts', () => {
    let total = 0;
    for (let wi = 0; wi < worlds.length; wi++) {
      if (worlds[wi].levels.length) total += fuzz('Level', { world: wi, index: 0 }, 77 + wi);
    }
    expect(total).toBeGreaterThan(3);
  });
});
