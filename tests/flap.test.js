import { describe, it, expect, afterEach } from 'vitest';
import { FlapMode } from '../src/modes/flap.js';
import { createPlayer } from '../src/entities/player.js';
import { createObstacle, obstacleHits, obstacleLift } from '../src/entities/obstacles/types.js';
import { compileLevel } from '../src/levels/compile.js';
import { validateLevel, validateReachability } from '../src/levels/validator.js';
import { validateBoss } from '../src/levels/bossValidator.js';
import { worlds } from '../src/levels/worlds.js';
import { tuning, defaults } from '../src/config/tuning.js';
import { motion } from '../src/config/tokens.js';

const DT = 1 / tuning.sim.hz;
const GROUND = 600;

function setup() {
  const player = createPlayer();
  const env = { width: () => 1000, groundY: () => GROUND };
  return { player, mode: new FlapMode(player, env), env };
}

function step(mode, n) {
  for (let i = 0; i < n; i++) mode.update(DT);
}

afterEach(() => {
  motion.reduced = false;
  Object.assign(tuning.flap, defaults.flap);
});

describe('FlapMode', () => {
  it('starts mid-field and falls under gravity', () => {
    const { player, mode } = setup();
    const y0 = player.y;
    step(mode, 30);
    expect(player.y).toBeGreaterThan(y0);
  });

  it('a tap gives an upward impulse that rises about the expected height', () => {
    const { player, mode } = setup();
    const y0 = player.y;
    mode.onPress();
    mode.onRelease();
    let top = y0;
    for (let i = 0; i < 120; i++) {
      mode.update(DT);
      top = Math.min(top, player.y);
    }
    const rise = y0 - top;
    const expected = (tuning.flap.impulse * tuning.flap.impulse) / (2 * tuning.flap.gravity);
    expect(rise).toBeGreaterThan(expected * 0.9);
    expect(rise).toBeLessThan(expected * 1.1);
  });

  it('holding glides: falls slower than letting go', () => {
    const a = setup();
    const b = setup();
    a.mode.onPress();
    b.mode.onPress();
    b.mode.onRelease();
    let ms = 0;
    for (let i = 0; i < 90; i++) {
      ms += DT * 1000;
      a.mode.onHold(ms);
      a.mode.update(DT);
      b.mode.update(DT);
    }
    expect(a.player.y).toBeLessThan(b.player.y);
    expect(a.mode.vy).toBeLessThanOrEqual(tuning.flap.glideMaxFall);
  });

  it('glide runs out after its limit', () => {
    const { mode } = setup();
    mode.onPress();
    let ms = 0;
    for (let i = 0; i < 400; i++) {
      ms += DT * 1000;
      mode.onHold(ms);
      mode.update(DT);
    }
    expect(mode.glideLeft).toBe(0);
    expect(mode.gliding).toBe(false);
  });

  it('a new tap refills the glide budget', () => {
    const { mode } = setup();
    mode.glideLeft = 0;
    mode.onPress();
    expect(mode.glideLeft).toBe(tuning.flap.glideMs);
  });

  it('stays inside the field without dying', () => {
    const { player, mode, env } = setup();
    step(mode, 600);
    expect(player.y + player.size).toBeCloseTo(env.groundY(), 5);
    for (let i = 0; i < 100; i++) {
      mode.onPress();
      mode.update(DT);
    }
    expect(player.y).toBeGreaterThanOrEqual(env.groundY() - tuning.flap.fieldH);
  });

  it('save and load restore the exact state', () => {
    const { mode, player } = setup();
    mode.onPress();
    step(mode, 20);
    const s = mode.saveState({});
    step(mode, 50);
    mode.loadState(s);
    expect(player.y).toBe(s.y);
    expect(mode.vy).toBe(s.vy);
    expect(mode.glideLeft).toBe(s.glideLeft);
  });

  it('does not tilt with reduced motion', () => {
    const { mode } = setup();
    mode.vy = 600;
    expect(mode.tilt()).not.toBe(0);
    motion.reduced = true;
    expect(mode.tilt()).toBe(0);
  });
});

describe('moving and round obstacles', () => {
  const box = { x: 0, y: 0, w: 0, h: 0 };
  const circle = { x: 0, y: 0, r: 0 };

  it('a like bobs deterministically with distance', () => {
    const o = createObstacle({ type: 'like', at: 0, lift: 180, phase: 0 }, 0);
    const a = obstacleLift(o, 0);
    const b = obstacleLift(o, o.bobPeriod / 4);
    expect(a).toBeCloseTo(180);
    expect(b).toBeCloseTo(180 + o.bobAmp);
    expect(obstacleLift(o, 100)).toBe(obstacleLift(o, 100));
  });

  it('round obstacles use circle collision, so corners are safe', () => {
    const o = createObstacle({ type: 'bubble', at: 0, lift: 100 }, 0);
    const cy = GROUND - 100 - o.h / 2;
    const center = { x: o.w / 2 - 3, y: cy - 3, w: 6, h: 6 };
    expect(obstacleHits(center, o, 0, GROUND, 0, box, circle)).toBe(true);
    const corner = { x: -6, y: cy - o.h / 2 - 6, w: 8, h: 8 };
    expect(obstacleHits(corner, o, 0, GROUND, 0, box, circle)).toBe(false);
  });

  it('top cards hang from the ceiling', () => {
    const o = createObstacle({ type: 'card', at: 0, h: 100, from: 'top' }, 0);
    expect(o.lift + o.h).toBe(tuning.flap.fieldH);
    expect(o.edge).toBe('top');
  });
});

describe('FLAP validator', () => {
  const world2 = worlds[1];

  for (const def of world2.levels) {
    it('accepts ' + def.id, () => {
      const r = validateLevel(compileLevel(def, world2.chunks));
      expect(r.errors).toEqual([]);
    }, 30000);
  }

  it('accepts every Algorithm boss phase', () => {
    expect(validateBoss(world2).errors).toEqual([]);
  }, 30000);

  function level(parts) {
    const lib = { a: { length: 8000, obstacles: parts, items: [] } };
    return compileLevel({ id: 't', name: 't', mode: 'flap', chunks: ['a'] }, lib);
  }

  const H = () => tuning.flap.fieldH;
  const gate = (at, c, g) => [
    { type: 'card', at, h: c - g / 2 },
    { type: 'card', at, h: H() - (c + g / 2), from: 'top' }
  ];

  it('rejects a full-height wall', () => {
    expect(validateReachability(level([{ type: 'card', at: 1000, h: H() - 0.01 }])).ok).toBe(false);
  });

  it('rejects a gap narrower than the player', () => {
    expect(validateReachability(level(gate(1000, 180, 30))).ok).toBe(false);
  });

  it('rejects a swing no tapping rate can make in time', () => {
    expect(validateReachability(level([...gate(1000, 60, 130), ...gate(1260, 300, 130)])).ok).toBe(false);
  });

  it('accepts the same swing with room to do it', () => {
    expect(validateReachability(level([...gate(1000, 60, 130), ...gate(1700, 300, 130)])).ok).toBe(true);
  });

  it('rejects when taps are not allowed more often than a human can', () => {
    tuning.validator.flapMinTapMs = 1000;
    try {
      expect(validateReachability(level([...gate(1000, 60, 130), ...gate(1700, 300, 130)])).ok).toBe(false);
    } finally {
      Object.assign(tuning.validator, defaults.validator);
    }
  });
});
