import { describe, it, expect, afterEach } from 'vitest';
import { SurfMode } from '../src/modes/surf.js';
import { createPlayer } from '../src/entities/player.js';
import { Terrain, hills } from '../src/levels/terrain.js';
import { compileLevel } from '../src/levels/compile.js';
import { validateLevel, validateReachability } from '../src/levels/validator.js';
import { validateBoss } from '../src/levels/bossValidator.js';
import { surf, chunks } from '../src/levels/chunks/world3.js';
import { createObstacle, obstacleLift } from '../src/entities/obstacles/types.js';
import { worlds } from '../src/levels/worlds.js';
import { tuning, defaults } from '../src/config/tuning.js';

const DT = 1 / tuning.sim.hz;
const BASE_SPEED = 420;

function makeTerrain(crest) {
  const t = new Terrain();
  for (const [x, y] of hills(6000, [crest, crest, crest, crest, crest, crest, crest, crest], 50)) t.addPoint(x, y);
  t.seal();
  return t;
}

function setup(terrain) {
  const player = createPlayer();
  const env = { width: () => 1000, groundY: () => 600, terrain: (d) => terrain.height(d) };
  const mode = new SurfMode(player, env);
  return { player, mode, terrain, d: 0 };
}

function advance(ctx, steps, policy) {
  let air = 0;
  for (let i = 0; i < steps; i++) {
    const step = BASE_SPEED * ctx.mode.speedMul() * DT;
    ctx.d += step;
    ctx.mode.d = ctx.d;
    ctx.mode.dx = step;
    if (policy) policy(ctx.mode, ctx.d);
    ctx.mode.update(DT);
    if (!ctx.mode.riding) air++;
  }
  return air;
}

afterEach(() => {
  Object.assign(tuning.surf, defaults.surf);
});

describe('Terrain', () => {
  it('passes through its key points and eases between them', () => {
    const t = new Terrain();
    t.addPoint(0, 50);
    t.addPoint(100, 150);
    t.seal();
    expect(t.height(0)).toBeCloseTo(50);
    expect(t.height(100)).toBeCloseTo(150);
    expect(t.height(50)).toBeCloseTo(100);
    expect(t.height(25)).toBeLessThan(75);
  });

  it('drops to the gap level inside a gap and returns after it', () => {
    const t = makeTerrain(150);
    t.addGap(1000, 1200);
    expect(t.height(1100)).toBe(tuning.surf.gapLift);
    expect(t.height(1300)).toBeGreaterThan(0);
    expect(t.height(900)).toBeGreaterThan(0);
  });

  it('hills start and end in a valley', () => {
    const pts = hills(2000, [150, 120], 50);
    expect(pts[0][1]).toBe(50);
    expect(pts[pts.length - 1][1]).toBe(50);
    expect(pts[pts.length - 1][0]).toBe(2000);
  });
});

describe('SurfMode', () => {
  it('rides the surface when left alone', () => {
    const ctx = setup(makeTerrain(110));
    advance(ctx, 600);
    expect(ctx.mode.riding).toBe(true);
    expect(ctx.mode.lift).toBeCloseTo(ctx.terrain.height(ctx.d), 5);
  });

  it('diving down slopes builds boost and climbing with hold bleeds it', () => {
    const ctx = setup(makeTerrain(150));
    const diveOnly = (m, d) => {
      const down = ctx.terrain.height(d + 5) < ctx.terrain.height(d);
      if (down && !m.held) m.onPress();
      if (!down && m.held) m.onRelease();
    };
    let peak = 0;
    for (let i = 0; i < 600; i++) {
      advance(ctx, 1, diveOnly);
      peak = Math.max(peak, ctx.mode.boost);
    }
    expect(peak).toBeGreaterThan(0.1);
    const idle = setup(makeTerrain(150));
    let idlePeak = 0;
    for (let i = 0; i < 600; i++) {
      advance(idle, 1);
      idlePeak = Math.max(idlePeak, idle.mode.boost);
    }
    expect(peak).toBeGreaterThan(idlePeak * 3);
  });

  it('releasing on an upslope launches and a crest release adds boost', () => {
    const ctx = setup(makeTerrain(150));
    let released = false;
    let before = 0;
    const policy = (m, d) => {
      if (released) return;
      const up = ctx.terrain.height(d + 5) > ctx.terrain.height(d);
      if (!m.held && !up) m.onPress();
      if (m.held && ctx.terrain.height(d) > 140) {
        before = m.boost;
        m.onRelease();
        released = true;
      }
    };
    for (let i = 0; i < 1200 && !released; i++) advance(ctx, 1, policy);
    expect(released).toBe(true);
    expect(ctx.mode.riding).toBe(false);
    expect(ctx.mode.boost).toBeGreaterThan(before);
    const air = advance(ctx, 60);
    expect(air).toBeGreaterThan(5);
  });

  it('holding sticks to the surface where letting go would take off', () => {
    tuning.surf.gravity = 500;
    const free = setup(makeTerrain(150));
    const stuck = setup(makeTerrain(150));
    stuck.mode.onPress();
    const airFree = advance(free, 900);
    const airStuck = advance(stuck, 900, (m) => {
      if (!m.held) m.onPress();
    });
    expect(airFree).toBeGreaterThan(0);
    expect(airStuck).toBe(0);
  });

  it('never gains absurd speed when the surface jumps', () => {
    const t = makeTerrain(110);
    t.addGap(1500, 1700);
    t.seal();
    const ctx = setup(t);
    let maxLift = 0;
    for (let i = 0; i < 1500; i++) {
      advance(ctx, 1);
      maxLift = Math.max(maxLift, ctx.mode.lift);
    }
    expect(maxLift).toBeLessThan(400);
    expect(Math.abs(ctx.mode.vUp)).toBeLessThanOrEqual(tuning.surf.maxVy + 1);
  });

  it('save and load restore the exact state', () => {
    const ctx = setup(makeTerrain(150));
    advance(ctx, 120, (m) => {
      if (!m.held) m.onPress();
    });
    const s = ctx.mode.saveState({});
    advance(ctx, 200);
    ctx.mode.loadState(s);
    expect(ctx.mode.lift).toBe(s.lift);
    expect(ctx.mode.boost).toBe(s.boost);
    expect(ctx.mode.held).toBe(s.held);
  });

  it('boost multiplies world speed and is capped', () => {
    const ctx = setup(makeTerrain(150));
    ctx.mode.boost = 10;
    advance(ctx, 1);
    expect(ctx.mode.speedMul()).toBeLessThanOrEqual(1 + tuning.surf.boostMax + 1e-9);
  });
});

describe('moving cards', () => {
  it('a ticker bobs relative to its own position so every copy behaves alike', () => {
    const a = createObstacle({ type: 'ticker', at: 0, lift: 200, phase: 100 }, 1000);
    const b = createObstacle({ type: 'ticker', at: 0, lift: 200, phase: 100 }, 5000);
    expect(obstacleLift(a, 1000 + 123)).toBeCloseTo(obstacleLift(b, 5000 + 123));
  });
});

describe('SURF validator', () => {
  const world3 = worlds[2];

  for (const def of world3.levels) {
    it('accepts ' + def.id, () => {
      expect(validateLevel(compileLevel(def, world3.chunks)).errors).toEqual([]);
    }, 30000);
  }

  it('accepts every Quarterly Crash phase', () => {
    expect(validateBoss(world3).errors).toEqual([]);
  }, 30000);

  function level(chunk) {
    return compileLevel({ id: 't', name: 't', mode: 'surf', chunks: ['pad', 'c', 'pad'] }, { pad: chunks.rolling, c: chunk });
  }

  it('compiles terrain, gaps and tokens along the wave', () => {
    const l = compileLevel({ id: 't', name: 't', mode: 'surf', chunks: ['gapOne'] }, chunks);
    expect(l.terrain).toBeTruthy();
    expect(l.terrain.height(l.obstacles[0].x + 50)).toBe(tuning.surf.gapLift);
    expect(l.tokenTotal).toBeGreaterThan(0);
    expect(l.items.every((i) => i.x >= 0 && i.lift > 0)).toBe(true);
  });

  it('rejects a gap wider than any flight can cross', () => {
    const wide = { ...surf(3000, [150, 150, 150, 150]), obstacles: [{ type: 'nodata', at: 1000, w: 1100 }] };
    expect(validateReachability(level(wide)).ok).toBe(false);
  });

  it('rejects a floating card that sits right on the crest', () => {
    const low = surf(1500, [150, 150], [{ kpi: [1, 160] }]);
    expect(validateReachability(level(low)).ok).toBe(false);
  });

  it('accepts the same card with room to ride under it', () => {
    expect(validateReachability(level(surf(1500, [150, 150], [{ kpi: [1, 215] }]))).ok).toBe(true);
  });

  it('rejects when toggling faster than a human can is the only way through', () => {
    tuning.validator.surfMinToggleMs = 2000;
    try {
      expect(validateReachability(level(chunks.gapKpi)).ok).toBe(false);
    } finally {
      Object.assign(tuning.validator, defaults.validator);
    }
  });
});
