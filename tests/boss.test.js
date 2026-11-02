import { describe, it, expect, afterEach } from 'vitest';
import { LevelRuntime } from '../src/levels/runtime.js';
import { RunMode } from '../src/modes/run.js';
import { createPlayer } from '../src/entities/player.js';
import { BossDirector, PAYWALL_PATTERNS, createBossLevel } from '../src/levels/boss.js';
import { bossLayout } from '../src/entities/bosses/shared.js';
import { validateBoss } from '../src/levels/bossValidator.js';
import { worlds } from '../src/levels/worlds.js';
import { tuning } from '../src/config/tuning.js';
import { DT, makeApp, drive } from './helpers.js';

const WIDTH = 1000;
const GROUND = 500;

function setup() {
  const player = createPlayer();
  const env = { width: () => WIDTH, groundY: () => GROUND };
  const mode = new RunMode(player, env);
  const level = createBossLevel({ speedMul: 1.2 });
  const rt = new LevelRuntime(level, mode, env);
  const gap = () => bossLayout(WIDTH, GROUND).x + 10 - player.x;
  const director = new BossDirector(level, rt, gap);
  return { player, mode, level, rt, director, gap };
}

function playThrough(ctx, seconds) {
  tuning.debug.invincible = true;
  const modes = [];
  const steps = Math.ceil(seconds / DT);
  for (let i = 0; i < steps && !ctx.director.defeated; i++) {
    ctx.rt.update(DT);
    const cur = ctx.director.cur;
    if (cur && !cur.done && ctx.rt.distance >= cur.orb.x - 4) {
      if (modes[modes.length - 1] !== cur.mode || modes.length < ctx.director.hits + 1) modes.push(cur.mode);
      cur.orb.got = true;
    }
    ctx.director.update();
  }
  return modes;
}

afterEach(() => {
  tuning.debug.invincible = false;
});

describe('the final boss design', () => {
  it('has five hit points and exactly five attacks', () => {
    expect(tuning.boss.hp).toBe(5);
    expect(PAYWALL_PATTERNS.length).toBe(5);
  });

  it('changes mode between attacks and uses run, flap and flip', () => {
    const modes = PAYWALL_PATTERNS.map((p) => p.mode);
    expect(new Set(modes)).toEqual(new Set(['run', 'flap', 'flip']));
    for (let i = 1; i < modes.length; i++) expect(modes[i]).not.toBe(modes[i - 1]);
    expect(modes[0]).toBe('run');
  });

  it('every attack is reachable and no orb sits inside a full jump', () => {
    expect(validateBoss(worlds[3]).errors).toEqual([]);
  }, 60000);

  it('is the only boss in the game', () => {
    expect(worlds.filter((w) => w.boss).length).toBe(1);
    expect(worlds[worlds.length - 1].boss.patterns).toBe(PAYWALL_PATTERNS);
  });
});

describe('BossDirector', () => {
  it('places the first obstacle far enough away to telegraph and react', () => {
    const ctx = setup();
    const first = ctx.level.obstacles[0];
    const lead = ((first.x - ctx.gap()) / ctx.level.speedAt(0)) * 1000;
    expect(lead).toBeGreaterThanOrEqual(tuning.boss.telegraphMs + tuning.boss.reactMs - 1);
  });

  it('is beaten in five hits and takes under 45 seconds without a miss', () => {
    const ctx = setup();
    let hits = 0;
    ctx.director.onHit = () => hits++;
    playThrough(ctx, 90);
    expect(ctx.director.defeated).toBe(true);
    expect(hits).toBe(5);
    expect(ctx.rt.time).toBeLessThan(45);
    expect(ctx.rt.time).toBeGreaterThan(12);
  });

  it('speeds up after every hit', () => {
    const ctx = setup();
    const speeds = [];
    for (let phase = 0; phase < 5; phase++) {
      ctx.level.phase = phase;
      speeds.push(ctx.level.speedAt(0));
    }
    for (let i = 1; i < speeds.length; i++) expect(speeds[i]).toBeGreaterThan(speeds[i - 1]);
  });

  it('repeats an attack when the orb is missed instead of advancing', () => {
    const ctx = setup();
    tuning.debug.invincible = true;
    const before = ctx.director.step;
    const firstOrb = ctx.director.cur.orb;
    firstOrb.lift = 400;
    for (let i = 0; i < 120 * 40 && ctx.director.cur.orb === firstOrb; i++) {
      ctx.rt.update(DT);
      ctx.director.update();
    }
    expect(ctx.director.step).toBe(before);
    expect(ctx.director.offered).toBeGreaterThan(1);
    expect(ctx.director.hits).toBe(0);
  });

  it('reset starts the whole fight again from the first attack', () => {
    const ctx = setup();
    playThrough(ctx, 15);
    expect(ctx.director.hits).toBeGreaterThan(0);
    ctx.rt.restart();
    ctx.director.reset();
    expect(ctx.director.hits).toBe(0);
    expect(ctx.director.hp).toBe(5);
    expect(ctx.director.step).toBe(0);
    expect(ctx.level.phase).toBe(0);
    expect(ctx.level.obstacles.length).toBe(PAYWALL_PATTERNS[0].obstacles.length);
    expect(ctx.level.items.length).toBe(1);
  });
});

describe('Boss scene', () => {
  it('has no checkpoint at all', () => {
    const app = makeApp(1000, 700);
    app.scenes.go('Boss', { world: 3 });
    expect(app.scenes.current.level.checkpoint).toBeUndefined();
    expect(app.overlay.querySelector('.cp')).toBe(null);
  });

  it('starts in run mode and switches to flap after the first hit', () => {
    const app = makeApp(1000, 700);
    tuning.debug.invincible = true;
    app.scenes.go('Boss', { world: 3 });
    const sc = app.scenes.current;
    expect(sc.modeKind).toBe('run');
    sc.director.cur.orb.lift = 400;
    drive(app, 120 * 6, 60);
    sc.director.cur.orb.got = true;
    drive(app, 120 * 4, 60);
    expect(sc.director.hits).toBeGreaterThanOrEqual(1);
    expect(sc.modeKind).toBe('flap');
    expect(app.announced).toContain('flap mode');
  });

  it('dying sends the player back to run mode and the first attack with every hit lost', () => {
    const app = makeApp(1000, 700);
    app.scenes.go('Boss', { world: 3 });
    const sc = app.scenes.current;
    sc.director.cur.orb.got = true;
    sc.director.update();
    sc.director.cur.orb.got = true;
    sc.director.update();
    sc.switchMode('flip');
    expect(sc.director.hits).toBe(2);
    sc.runtime.state = 'dead';
    sc.runtime.deathTimer = 0;
    sc.runtime.update(DT);
    expect(sc.runtime.state).toBe('running');
    expect(sc.runtime.distance).toBe(0);
    expect(sc.director.hits).toBe(0);
    expect(sc.director.step).toBe(0);
    expect(sc.modeKind).toBe('run');
    expect(sc.runtime.deaths).toBe(0);
  });

  it('records the win and offers no next world', () => {
    const app = makeApp(1000, 700);
    tuning.debug.invincible = true;
    app.scenes.go('Boss', { world: 3 });
    const sc = app.scenes.current;
    sc.skip();
    drive(app, 120 * 3, 60);
    expect(app.scenes.name).toBe('Results');
    expect(app.save.completed('w4boss')).toBe(true);
    expect(app.save.stars('w4boss')).toBe(1);
  });
});
