import { describe, it, expect, afterEach } from 'vitest';
import { PowerState, POWERS } from '../src/engine/powerups.js';
import { LevelRuntime } from '../src/levels/runtime.js';
import { RunMode } from '../src/modes/run.js';
import { createPlayer } from '../src/entities/player.js';
import { createObstacle } from '../src/entities/obstacles/types.js';
import { tuning, defaults } from '../src/config/tuning.js';

const DT = 1 / tuning.sim.hz;

function make(obstacles, items) {
  const player = createPlayer();
  const env = { width: () => 1000, groundY: () => 500 };
  const mode = new RunMode(player, env);
  const level = {
    mode: 'run',
    obstacles: obstacles.map((o) => createObstacle(o, 0)),
    items: (items || []).map((i) => ({ got: false, ...i })),
    length: 1e6,
    checkpoint: 0,
    tokenTotal: 0,
    speedAt: () => tuning.world.speed
  };
  const rt = new LevelRuntime(level, mode, env);
  return { rt, level, mode, player };
}

function run(rt, steps) {
  for (let i = 0; i < steps; i++) rt.update(DT);
}

function runUntil(rt, pred, limit = 4000) {
  let n = 0;
  while (!pred() && n < limit) {
    rt.update(DT);
    n++;
  }
  return n;
}

afterEach(() => {
  tuning.debug.invincible = false;
  Object.assign(tuning.blaster, defaults.blaster);
  Object.assign(tuning.magnet, defaults.magnet);
  Object.assign(tuning.shield, defaults.shield);
});

describe('PowerState', () => {
  it('knows all four powers', () => {
    expect(POWERS.sort()).toEqual(['blaster', 'magnet', 'shield', 'slowmo']);
  });

  it('allows only one active power, the newest replacing the old', () => {
    const p = new PowerState();
    p.activate('blaster');
    p.activate('magnet');
    expect(p.kind).toBe('magnet');
    expect(p.is('blaster')).toBe(false);
  });

  it('timed powers drain and expire at their configured length', () => {
    const p = new PowerState();
    p.activate('blaster');
    expect(p.fraction()).toBe(1);
    p.update(tuning.blaster.ms / 2);
    expect(p.fraction()).toBeCloseTo(0.5);
    p.update(tuning.blaster.ms / 2 + 1);
    expect(p.kind).toBe(null);
    expect(p.fraction()).toBe(0);
  });

  it('uses the lengths from tuning for each timed power', () => {
    for (const kind of ['blaster', 'magnet', 'slowmo']) {
      const p = new PowerState();
      p.activate(kind);
      expect(p.left).toBe(tuning[kind].ms);
    }
    expect(tuning.blaster.ms).toBe(6000);
    expect(tuning.magnet.ms).toBe(8000);
    expect(tuning.slowmo.ms).toBe(4000);
  });

  it('a shield never drains and breaks once', () => {
    const p = new PowerState();
    p.activate('shield');
    p.update(1e7);
    expect(p.is('shield')).toBe(true);
    expect(p.breakShield()).toBe(true);
    expect(p.kind).toBe(null);
    expect(p.breakShield()).toBe(false);
  });

  it('slow-mo scales the world to 0.6 and nothing else does', () => {
    const p = new PowerState();
    expect(p.speedMul()).toBe(1);
    p.activate('slowmo');
    expect(p.speedMul()).toBe(0.6);
    p.activate('magnet');
    expect(p.speedMul()).toBe(1);
  });
});

describe('slow-mo in the runtime', () => {
  it('covers 0.6 of the distance in the same time', () => {
    const a = make([], []);
    const b = make([], []);
    b.rt.power.activate('slowmo');
    run(a.rt, 120);
    run(b.rt, 120);
    expect(b.rt.distance / a.rt.distance).toBeCloseTo(0.6, 3);
  });

  it('ends after its duration and speed returns to normal', () => {
    const a = make([], []);
    a.rt.power.activate('slowmo');
    run(a.rt, Math.ceil(tuning.slowmo.ms / 1000 / DT) + 2);
    expect(a.rt.power.kind).toBe(null);
    const before = a.rt.distance;
    run(a.rt, 120);
    expect((a.rt.distance - before) / 1).toBeCloseTo(tuning.world.speed, 0);
  });
});

describe('shield in the runtime', () => {
  const button = { type: 'button', at: 600 };

  it('without a shield a solid hit kills', () => {
    const { rt } = make([button]);
    runUntil(rt, () => rt.state === 'dead');
    expect(rt.state).toBe('dead');
  });

  it('absorbs exactly one solid hit and then grants brief immunity', () => {
    const { rt } = make([button, { type: 'button', at: 640 }]);
    rt.power.activate('shield');
    let breaks = 0;
    rt.onShieldBreak = () => breaks++;
    runUntil(rt, () => breaks > 0);
    expect(breaks).toBe(1);
    expect(rt.state).toBe('running');
    expect(rt.power.kind).toBe(null);
    expect(rt.iframes).toBeGreaterThan(0);
    run(rt, 20);
    expect(rt.state).toBe('running');
  });

  it('a later hit after the immunity ends is fatal', () => {
    const { rt } = make([button, { type: 'button', at: 2200 }]);
    rt.power.activate('shield');
    runUntil(rt, () => rt.state === 'dead');
    expect(rt.state).toBe('dead');
    expect(rt.deaths).toBe(1);
  });

  it('does not protect against hazard zones', () => {
    const { rt } = make([{ type: 'errorbar', at: 600 }]);
    rt.power.activate('shield');
    runUntil(rt, () => rt.state === 'dead');
    expect(rt.state).toBe('dead');
  });

  it('is cleared by dying', () => {
    const { rt } = make([button]);
    runUntil(rt, () => rt.state === 'dead');
    rt.power.activate('shield');
    run(rt, Math.ceil(tuning.level.retryMs / 1000 / DT) + 3);
    expect(rt.state).toBe('running');
    expect(rt.power.kind).toBe(null);
  });
});

describe('blaster in the runtime', () => {
  it('fires on its interval while active', () => {
    const { rt } = make([]);
    rt.power.activate('blaster');
    let shots = 0;
    rt.onFire = () => shots++;
    run(rt, 120);
    expect(shots).toBeGreaterThanOrEqual(Math.floor(1000 / tuning.blaster.interval));
    expect(shots).toBeLessThanOrEqual(Math.ceil(1000 / tuning.blaster.interval) + 1);
  });

  it('destroys a destructible obstacle before it arrives', () => {
    const { rt } = make([{ type: 'button', at: 1200, destructible: true }]);
    rt.power.activate('blaster');
    let destroyed = 0;
    rt.onDestroy = () => destroyed++;
    run(rt, 360);
    expect(destroyed).toBe(1);
    expect(rt.state).toBe('running');
  });

  it('does not harm solid obstacles that are not dashed', () => {
    const { rt } = make([{ type: 'button', at: 1200 }]);
    rt.power.activate('blaster');
    let destroyed = 0;
    rt.onDestroy = () => destroyed++;
    runUntil(rt, () => rt.state === 'dead');
    expect(destroyed).toBe(0);
    expect(rt.state).toBe('dead');
  });

  it('never makes hazards destructible', () => {
    const o = createObstacle({ type: 'errorbar', at: 0, destructible: true }, 0);
    expect(o.destructible).toBe(false);
  });

  it('stops firing when the power ends and bullets leave the pool', () => {
    const { rt } = make([]);
    rt.power.activate('blaster');
    run(rt, Math.ceil(tuning.blaster.ms / 1000 / DT) + 200);
    expect(rt.power.kind).toBe(null);
    expect(rt.bullets.count).toBe(0);
  });

  it('survives a long burst without exhausting the pool', () => {
    tuning.blaster.interval = 10;
    const { rt } = make([]);
    rt.power.activate('blaster');
    expect(() => run(rt, 600)).not.toThrow();
    expect(rt.bullets.count).toBeLessThanOrEqual(tuning.blaster.max);
  });
});

describe('magnet in the runtime', () => {
  const token = { x: 600, lift: 170, kind: 'token' };

  it('without a magnet an off-path token is missed', () => {
    const { rt } = make([], [token]);
    run(rt, 360);
    expect(rt.collected).toBe(0);
  });

  it('with a magnet the same token is pulled in and counted once', () => {
    const { rt } = make([], [token]);
    rt.power.activate('magnet');
    run(rt, 240);
    expect(rt.collected).toBe(1);
    run(rt, 120);
    expect(rt.collected).toBe(1);
  });

  it('does not pull the boss orb', () => {
    const { rt } = make([], [{ x: 600, lift: 170, kind: 'orb' }]);
    rt.power.activate('magnet');
    run(rt, 360);
    expect(rt.collected).toBe(0);
  });

  it('only the near tokens are pulled', () => {
    const far = { x: 600, lift: 400, kind: 'token' };
    const { rt } = make([], [far]);
    rt.power.activate('magnet');
    run(rt, 360);
    expect(rt.collected).toBe(0);
  });
});

describe('pickups', () => {
  it('are collected on touch, activate the power and are not counted as tokens', () => {
    const { rt } = make([], [{ x: 400, lift: 22, kind: 'power', power: 'shield' }]);
    let got = null;
    rt.onPower = (k) => {
      got = k;
    };
    runUntil(rt, () => rt.power.kind !== null);
    expect(got).toBe('shield');
    expect(rt.collected).toBe(0);
  });

  it('a new pickup replaces the active power', () => {
    const { rt } = make([], [{ x: 400, lift: 22, kind: 'power', power: 'magnet' }]);
    rt.power.activate('blaster');
    runUntil(rt, () => rt.power.kind === 'magnet');
    expect(rt.power.kind).toBe('magnet');
  });

  it('come back after a respawn when they lie beyond the checkpoint', () => {
    const { rt, level } = make([{ type: 'button', at: 900 }], [{ x: 500, lift: 22, kind: 'power', power: 'shield' }]);
    runUntil(rt, () => rt.power.kind === 'shield');
    rt.power.clear();
    runUntil(rt, () => rt.state === 'dead');
    run(rt, Math.ceil(tuning.level.retryMs / 1000 / DT) + 3);
    expect(level.items[0].got).toBe(false);
  });

  it('invincibility ignores hits without consuming a shield', () => {
    tuning.debug.invincible = true;
    const { rt } = make([{ type: 'button', at: 600 }]);
    rt.power.activate('shield');
    run(rt, 360);
    expect(rt.power.is('shield')).toBe(true);
    expect(rt.state).toBe('running');
  });
});
