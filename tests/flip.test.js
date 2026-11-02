import { describe, it, expect, afterEach } from 'vitest';
import { FlipMode } from '../src/modes/flip.js';
import { createPlayer } from '../src/entities/player.js';
import { compileLevel } from '../src/levels/compile.js';
import { validateLevel, validateReachability } from '../src/levels/validator.js';
import { validateBoss } from '../src/levels/bossValidator.js';
import { flip, chunks } from '../src/levels/chunks/world3.js';
import { createObstacle } from '../src/entities/obstacles/types.js';
import { worlds } from '../src/levels/worlds.js';
import { tuning, defaults } from '../src/config/tuning.js';
import { motion, applyTheme, colors } from '../src/config/tokens.js';

const DT = 1 / tuning.sim.hz;
const GROUND = 600;

function setup() {
  const player = createPlayer();
  const env = { width: () => 1000, groundY: () => GROUND };
  return { player, mode: new FlipMode(player, env), env };
}

function step(mode, n) {
  for (let i = 0; i < n; i++) mode.update(DT);
}

afterEach(() => {
  motion.reduced = false;
  Object.assign(tuning.flip, defaults.flip);
  Object.assign(tuning.validator, defaults.validator);
});

describe('FlipMode', () => {
  it('starts on the floor and stays there', () => {
    const { player, mode, env } = setup();
    step(mode, 120);
    expect(player.y + player.size).toBeCloseTo(env.groundY(), 5);
    expect(mode.dir).toBe(1);
  });

  it('a tap sends the player to the ceiling and another back to the floor', () => {
    const { player, mode, env } = setup();
    expect(mode.onPress()).toBe(true);
    step(mode, 120);
    expect(player.y).toBeCloseTo(env.groundY() - tuning.flip.fieldH, 5);
    expect(mode.dir).toBe(-1);
    expect(mode.onPress()).toBe(true);
    step(mode, 120);
    expect(player.y + player.size).toBeCloseTo(env.groundY(), 5);
  });

  it('crossing takes a fixed, short time that matches the physics', () => {
    const { player, mode, env } = setup();
    mode.onPress();
    let steps = 0;
    while (player.y > env.groundY() - tuning.flip.fieldH + 0.001 && steps < 1000) {
      mode.update(DT);
      steps++;
    }
    const travel = tuning.flip.fieldH - tuning.flip.size;
    const expected = Math.sqrt((2 * travel) / tuning.flip.gravity);
    expect(steps * DT).toBeGreaterThan(expected * 0.9);
    expect(steps * DT).toBeLessThan(expected * 1.25);
  });

  it('refuses a flip inside the cooldown but accepts it afterwards', () => {
    const { mode } = setup();
    expect(mode.onPress()).toBe(true);
    expect(mode.onPress()).toBe(false);
    step(mode, Math.ceil(tuning.flip.cooldownMs / 1000 / DT) + 1);
    expect(mode.onPress()).toBe(true);
  });

  it('can flip in mid-air', () => {
    const { mode, player, env } = setup();
    mode.onPress();
    step(mode, 15);
    expect(player.y).toBeGreaterThan(env.groundY() - tuning.flip.fieldH);
    expect(player.y + player.size).toBeLessThan(env.groundY());
    expect(mode.onPress()).toBe(true);
    expect(mode.dir).toBe(1);
  });

  it('turns upside down on the ceiling, snapping with reduced motion', () => {
    const a = setup();
    a.mode.onPress();
    step(a.mode, 200);
    expect(a.mode.tilt()).toBeCloseTo(Math.PI, 1);
    const b = setup();
    motion.reduced = true;
    b.mode.onPress();
    step(b.mode, 1);
    expect(b.mode.tilt()).toBe(Math.PI);
  });

  it('save and load restore the exact state', () => {
    const { mode, player } = setup();
    mode.onPress();
    step(mode, 10);
    const s = mode.saveState({});
    step(mode, 100);
    mode.loadState(s);
    expect(player.y).toBe(s.y);
    expect(mode.dir).toBe(s.dir);
    expect(mode.since).toBe(s.since);
  });
});

describe('flip obstacles', () => {
  it('blocks hang from the ceiling or stand on the floor', () => {
    const top = createObstacle({ type: 'block', at: 0, h: 100, from: 'top' }, 0, tuning.flip.fieldH);
    const floor = createObstacle({ type: 'block', at: 0, h: 100 }, 0, tuning.flip.fieldH);
    expect(top.lift + top.h).toBe(tuning.flip.fieldH);
    expect(floor.lift).toBe(0);
  });

  it('a cursor leaves a free lane at both surfaces', () => {
    const c = createObstacle({ type: 'cursor', at: 0 }, 0, tuning.flip.fieldH);
    expect(c.lift).toBeGreaterThan(tuning.flip.size);
    expect(c.lift + c.h).toBeLessThan(tuning.flip.fieldH - tuning.flip.size);
  });
});

describe('FLIP validator', () => {
  const world4 = worlds[3];

  for (const def of world4.levels) {
    it('accepts ' + def.id, () => {
      expect(validateLevel(compileLevel(def, world4.chunks)).errors).toEqual([]);
    }, 30000);
  }

  it('accepts every flip pattern of the final boss', () => {
    expect(validateBoss(worlds[3]).errors).toEqual([]);
  }, 60000);

  const runway = { length: 900, obstacles: [], items: [] };
  const zigzag = flip(2400, [
    { block: [500, 120, 'f'] },
    { block: [900, 120, 'c'] },
    { block: [1300, 120, 'f'] },
    { block: [1700, 120, 'c'] },
    { block: [2100, 120, 'f'] }
  ]);

  function level(chunk) {
    return compileLevel({ id: 't', name: 't', mode: 'flip', chunks: ['runway', 'c', 'runway'] }, { runway, c: chunk });
  }

  it('rejects a block too tall to pass under on the other side', () => {
    expect(validateReachability(level(flip(1500, [{ block: [500, 300, 'f'] }]))).ok).toBe(false);
  });

  it('rejects blocks packed closer than a flip takes', () => {
    const packed = flip(1500, [{ block: [500, 175, 'f'] }, { block: [590, 175, 'c'] }]);
    expect(validateReachability(level(packed)).ok).toBe(false);
  });

  it('accepts the same blocks with room for the flip', () => {
    const roomy = flip(1900, [{ block: [500, 175, 'f'] }, { block: [1000, 175, 'c'] }]);
    expect(validateReachability(level(roomy)).ok).toBe(true);
  });

  it('rejects a cursor placed on top of a block that forces a mid-air flip', () => {
    const trap = flip(1500, [{ block: [500, 175, 'f'] }, { cursor: [620] }, { block: [740, 175, 'c'] }]);
    expect(validateReachability(level(trap)).ok).toBe(false);
  });

  it('rejects when flips are only allowed very rarely', () => {
    tuning.validator.flipMinFlipMs = 3000;
    expect(validateReachability(level(zigzag)).ok).toBe(false);
  });
});

describe('terminal theme', () => {
  it('uses the monospace face for the UI and keeps solid blocks readable', () => {
    const vars = {};
    applyTheme('terminal', { style: { setProperty: (k, v) => (vars[k] = v) } });
    expect(vars['--font-ui']).toBe(vars['--font-mono']);
    expect(colors.backdrop).toBe('terminal');
    applyTheme('landing', { style: { setProperty: () => {} } });
  });
});
