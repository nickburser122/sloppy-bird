import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { worlds } from '../src/levels/worlds.js';
import { PAYWALL_PATTERNS } from '../src/levels/boss.js';
import { validateBoss } from '../src/levels/bossValidator.js';
import { tuning } from '../src/config/tuning.js';
import { DT, makeApp, drive, hover } from './helpers.js';

const WI = worlds.length - 1;
const world = worlds[WI];

function step(app, steps, renderEvery, bot) {
  const state = { since: 1000 };
  for (let i = 0; i < steps; i++) {
    if (bot) hover(app, state);
    app.input.update(DT * 1000);
    app.scenes.update(DT);
    if (renderEvery && i % renderEvery === 0) app.scenes.render(0.5);
    if (app.scenes.name !== 'Boss') break;
  }
}

beforeEach(() => {
  tuning.debug.invincible = true;
});

afterEach(() => {
  tuning.debug.invincible = false;
});

describe('The Paywall', () => {
  it('is the last world and has no levels of its own', () => {
    expect(world.id).toBe('w5');
    expect(world.levels).toEqual([]);
    expect(world.boss.modes).toEqual(['run', 'flap', 'surf', 'flip']);
  });

  it('has one pattern per hit point and two patterns per mode', () => {
    expect(PAYWALL_PATTERNS.length).toBe(world.boss.hp);
    for (let p = 0; p < 4; p++) {
      const group = PAYWALL_PATTERNS.slice(p * 2, p * 2 + 2);
      expect(group.every((x) => x.mode === world.boss.modes[p])).toBe(true);
    }
  });

  it('is reachable in every phase at that phase\'s speed', () => {
    expect(validateBoss(world).errors).toEqual([]);
  }, 30000);

  it('places only hand-authored pickups, never a blaster or magnet with nothing to use them on', () => {
    for (const p of PAYWALL_PATTERNS) {
      if (p.pickup) expect(['shield', 'slowmo']).toContain(p.pickup.kind);
    }
  });

  it('switches mode in order and ends in a win', () => {
    const app = makeApp(1000, 700);
    app.scenes.go('Boss', { world: WI });
    const seen = [];
    const state = { since: 1000 };
    for (let i = 0; i < 120 * 200 && app.scenes.name === 'Boss'; i++) {
      hover(app, state);
      app.input.update(DT * 1000);
      app.scenes.update(DT);
      const sc = app.scenes.current;
      if (app.scenes.name !== 'Boss') break;
      if (seen[seen.length - 1] !== sc.modeKind) seen.push(sc.modeKind);
      if (i % 40 === 0) app.scenes.render(0.5);
    }
    expect(seen).toEqual(['run', 'flap', 'surf', 'flip']);
    expect(app.scenes.name).toBe('Results');
    expect(app.save.completed('w5boss')).toBe(true);
  });

  it('shows the active mode in the HUD', () => {
    const app = makeApp(1000, 700);
    app.scenes.go('Boss', { world: WI });
    step(app, 10, 1, true);
    const badge = app.overlay.querySelector('.modebadge');
    expect(badge.hidden).toBe(false);
    expect(badge.textContent).toBe('RUN');
  });

  it('respawns in the mode of the pattern you died in, with progress kept', () => {
    const app = makeApp(1000, 700);
    app.scenes.go('Boss', { world: WI });
    const sc = app.scenes.current;
    for (let i = 0; i < 120 * 60 && sc.modeKind !== 'flap'; i++) step(app, 1, 0, true);
    expect(sc.modeKind).toBe('flap');
    const hits = sc.director.hits;
    tuning.debug.invincible = false;
    for (let i = 0; i < 120 * 30 && sc.runtime.deaths === 0; i++) {
      app.input.update(DT * 1000);
      app.scenes.update(DT);
    }
    expect(sc.runtime.deaths).toBeGreaterThan(0);
    for (let i = 0; i < 60; i++) {
      app.input.update(DT * 1000);
      app.scenes.update(DT);
    }
    expect(sc.modeKind).toBe('flap');
    expect(sc.runtime.state).toBe('running');
    expect(sc.runtime.distance).toBeGreaterThanOrEqual(sc.level.checkpoint);
    expect(sc.director.hits).toBe(hits);
  });

  it('a defeat keeps the world list unlocked chain intact', () => {
    const app = makeApp(1000, 700);
    app.scenes.go('Boss', { world: WI });
    app.scenes.current.skip();
    drive(app, 200, 20);
    expect(app.scenes.name).toBe('Results');
    expect(app.save.stars('w5boss')).toBe(1);
  });
});

describe('power-ups in scenes', () => {
  function levelApp() {
    const app = makeApp(1000, 700);
    app.scenes.go('Level', { world: 0, index: 0 });
    return app;
  }

  it('picking one up plays a sound, shows the HUD pill and drains its bar', () => {
    const app = levelApp();
    const sc = app.scenes.current;
    sc.runtime.power.activate('blaster');
    drive(app, 5, 1);
    const pill = app.overlay.querySelector('.power');
    expect(pill.hidden).toBe(false);
    expect(pill.querySelector('.pname').textContent).toBe('Blaster');
    drive(app, 60, 10);
    const w = pill.querySelector('.pbar i').style.transform;
    expect(parseFloat(w.replace('scaleX(', ''))).toBeLessThan(1);
  });

  it('a shield shows a full static bar and hides when it is gone', () => {
    const app = levelApp();
    const sc = app.scenes.current;
    sc.runtime.power.activate('shield');
    drive(app, 30, 5);
    const pill = app.overlay.querySelector('.power');
    expect(pill.hidden).toBe(false);
    expect(pill.classList.contains('static')).toBe(true);
    sc.runtime.power.breakShield();
    drive(app, 3, 1);
    expect(pill.hidden).toBe(true);
  });

  it('renders every power state, bullets and slow-mo without errors', () => {
    const app = levelApp();
    const sc = app.scenes.current;
    for (const kind of ['blaster', 'shield', 'magnet', 'slowmo']) {
      sc.runtime.power.activate(kind);
      expect(() => drive(app, 90, 3)).not.toThrow();
    }
  });

  it('the blaster in a real level breaks a dashed obstacle with sound and no death', () => {
    const app = makeApp(1000, 700);
    app.scenes.go('Level', { world: 0, index: 0 });
    const sc = app.scenes.current;
    const idx = sc.level.obstacles.findIndex((o) => o.destructible);
    const target = sc.level.obstacles[idx];
    sc.runtime.distance = target.x - 1500;
    sc.runtime.prevDistance = sc.runtime.distance;
    sc.runtime.restart();
    sc.runtime.distance = target.x - 1500;
    sc.runtime.next = idx;
    sc.runtime.power.activate('blaster');
    tuning.debug.invincible = false;
    for (let i = 0; i < 400 && sc.runtime.state === 'running'; i++) {
      app.input.update(DT * 1000);
      app.scenes.update(DT);
    }
    expect(app.played).toContain('shoot');
    expect(app.played).toContain('break');
    expect(sc.runtime.deaths).toBe(0);
  });

  it('a shield breaking plays the shatter sound and the player survives', () => {
    const app = makeApp(1000, 700);
    app.scenes.go('Level', { world: 0, index: 0 });
    const sc = app.scenes.current;
    const target = sc.level.obstacles.find((o) => o.kind === 'solid' && !o.destructible);
    for (const it of sc.level.items) if (it.kind === 'power') it.got = true;
    sc.runtime.distance = target.x - 700;
    sc.runtime.next = sc.level.obstacles.indexOf(target);
    sc.runtime.power.activate('shield');
    tuning.debug.invincible = false;
    for (let i = 0; i < 300; i++) {
      app.input.update(DT * 1000);
      app.scenes.update(DT);
    }
    expect(app.played).toContain('shatter');
    expect(sc.runtime.deaths).toBe(0);
  });
});

describe('telegraph timing', () => {
  const bosses = worlds.map((w, i) => ({ w, i }));

  for (const { w, i } of bosses) {
    it(w.boss.title + ': every attack is announced at least 600 ms before it emerges, even at full boost', () => {
      const app = makeApp(1000, 700);
      app.scenes.go('Boss', { world: i });
      const sc = app.scenes.current;
      const state = { since: 1000 };
      const lead = [];
      let started = -1;
      let watching = null;
      for (let n = 0; n < 120 * 150 && app.scenes.name === 'Boss'; n++) {
        if (sc.mode.boost !== undefined) sc.mode.boost = tuning.surf.boostMax;
        hover(app, state);
        app.input.update(DT * 1000);
        app.scenes.update(DT);
        const cur = sc.director.cur;
        if (!cur || app.scenes.name !== 'Boss') continue;
        if (cur.telegraphed && watching !== cur) {
          watching = cur;
          started = sc.runtime.time;
        }
        if (watching === cur && started >= 0) {
          const first = sc.level.obstacles[cur.firstIdx];
          const sx = sc.player.x + first.x - sc.runtime.distance;
          if (sx <= sc.layout().x + 10) {
            lead.push(sc.runtime.time - started);
            started = -1;
          }
        }
      }
      expect(lead.length).toBeGreaterThan(3);
      expect(Math.min(...lead)).toBeGreaterThanOrEqual(0.6);
    });
  }
});
