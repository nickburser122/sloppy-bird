import { describe, it, expect, afterEach } from 'vitest';
import { Camera } from '../src/engine/camera.js';
import { Particles } from '../src/entities/particles.js';
import { SOUNDS, Sound } from '../src/engine/audio.js';
import { tokens, themes, colors, applyTheme, motion, shadowColor } from '../src/config/tokens.js';
import { tuning } from '../src/config/tuning.js';

afterEach(() => {
  motion.reduced = false;
});

describe('camera', () => {
  it('never shakes more than the configured maximum', () => {
    const cam = new Camera();
    cam.shake(100);
    let max = 0;
    for (let i = 0; i < 100; i++) {
      cam.update(1 / 120);
      max = Math.max(max, Math.abs(cam.x), Math.abs(cam.y));
    }
    expect(max).toBeLessThanOrEqual(tuning.fx.shakeMax);
    expect(max).toBeGreaterThan(0);
  });

  it('settles to zero', () => {
    const cam = new Camera();
    cam.shake(3);
    for (let i = 0; i < 200; i++) cam.update(1 / 120);
    expect(cam.x).toBe(0);
    expect(cam.y).toBe(0);
  });

  it('does not shake with reduced motion', () => {
    motion.reduced = true;
    const cam = new Camera();
    cam.shake(4);
    cam.update(1 / 120);
    expect(cam.x).toBe(0);
    expect(cam.y).toBe(0);
  });
});

describe('failure feedback timing', () => {
  it('hit-stop plus retry stays under 300 ms', () => {
    expect(tuning.fx.hitStopMs + tuning.level.retryMs + 1000 / tuning.sim.hz).toBeLessThan(300);
  });
});

describe('particles', () => {
  it('stays within its pool and expires', () => {
    const p = new Particles();
    for (let i = 0; i < 20; i++) p.burst(0, 0, 50, 200, 0.5, 6, 'accent', true, 0);
    expect(p.pool.count).toBeLessThanOrEqual(tuning.fx.maxParticles);
    for (let i = 0; i < 240; i++) p.update(1 / 120);
    expect(p.pool.count).toBe(0);
  });
});

describe('audio', () => {
  it('defines every voice and tolerates play before unlock', () => {
    for (const name of ['jump', 'land', 'death', 'checkpoint', 'win', 'click']) {
      expect(SOUNDS[name].length).toBeGreaterThan(0);
    }
    expect(() => new Sound().play('jump')).not.toThrow();
  });
});

describe('tokens', () => {
  it('mirrors every theme colour and token into CSS variables', () => {
    const vars = {};
    applyTheme('landing', { style: { setProperty: (k, v) => (vars[k] = v) } });
    for (const key of Object.keys(themes.landing)) {
      const name = '--' + key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
      expect(vars[name]).toBe(themes.landing[key]);
      expect(colors[key]).toBe(themes.landing[key]);
    }
    expect(vars['--radius-s']).toBe('8px');
    expect(vars['--radius-m']).toBe('12px');
    expect(vars['--radius-l']).toBe('20px');
    expect(Object.keys(tokens.shadow).every((k) => vars['--shadow-' + k])).toBe(true);
    expect(vars['--ease-out']).toBe(tokens.ease.out);
    expect(shadowColor(2)).toMatch(/^rgba\(/);
  });
});
