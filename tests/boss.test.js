import { describe, it, expect } from 'vitest';
import { LevelRuntime } from '../src/levels/runtime.js';
import { RunMode } from '../src/modes/run.js';
import { createPlayer } from '../src/entities/player.js';
import { BossDirector, PATTERNS, createBossLevel } from '../src/levels/boss.js';
import { bossLayout } from '../src/entities/bosses/cookie.js';
import { compileLevel } from '../src/levels/compile.js';
import { levels } from '../src/levels/world1.js';
import { chunks } from '../src/levels/chunks/world1.js';
import { tuning } from '../src/config/tuning.js';

const DT = 1 / tuning.sim.hz;
const WIDTH = 1000;
const GROUND = 500;

function setup() {
  const player = createPlayer();
  const env = { width: () => WIDTH, groundY: () => GROUND };
  const mode = new RunMode(player, env);
  const level = createBossLevel();
  const rt = new LevelRuntime(level, mode, env);
  const gap = () => bossLayout(WIDTH, GROUND).x + 10 - player.x;
  const director = new BossDirector(level, rt, gap);
  return { player, mode, level, rt, director, gap };
}

function run(ctx, seconds, cb) {
  const steps = Math.ceil(seconds / DT);
  for (let i = 0; i < steps && !ctx.director.defeated; i++) {
    ctx.rt.update(DT);
    ctx.director.update();
    if (cb) cb(i);
  }
}

describe('boss design constants', () => {
  it('announces every attack at least 600 ms ahead', () => {
    expect(tuning.boss.telegraphMs).toBeGreaterThanOrEqual(600);
  });

  it('has one pattern per hit point, three phases', () => {
    expect(PATTERNS.length).toBe(tuning.boss.hp);
    expect(tuning.boss.hp / tuning.boss.phaseSize).toBe(3);
  });
});

describe('BossDirector', () => {
  it('places the first obstacle far enough away to telegraph and react', () => {
    const ctx = setup();
    const first = ctx.level.obstacles[0];
    const lead = ((first.x - ctx.gap()) / ctx.level.speedAt(0)) * 1000;
    expect(lead).toBeGreaterThanOrEqual(tuning.boss.telegraphMs + tuning.boss.reactMs - 1);
  });

  it('finishes in 60 to 90 seconds when played without a miss', () => {
    const ctx = setup();
    tuning.debug.invincible = true;
    try {
      run(ctx, 200);
      expect(ctx.director.defeated).toBe(true);
      expect(ctx.director.hits).toBe(tuning.boss.hp);
      expect(ctx.rt.time).toBeGreaterThanOrEqual(60);
      expect(ctx.rt.time).toBeLessThanOrEqual(90);
    } finally {
      tuning.debug.invincible = false;
    }
  });

  it('repeats a pattern when its orb is missed', () => {
    const ctx = setup();
    const orb = ctx.director.cur.orb;
    ctx.rt.distance = orb.x + tuning.boss.orbGapPx;
    ctx.director.update();
    expect(ctx.director.step).toBe(0);
    expect(ctx.director.hp).toBe(tuning.boss.hp);
    expect(ctx.director.offered).toBe(2);
    expect(ctx.director.cur.index).toBe(0);
    expect(ctx.level.obstacles.length).toBe(PATTERNS[0].obstacles.length * 2);
  });

  it('damages the boss and advances when the orb is collected', () => {
    const ctx = setup();
    let hitCalls = 0;
    ctx.director.onHit = () => hitCalls++;
    ctx.director.cur.orb.got = true;
    ctx.director.update();
    expect(ctx.director.hp).toBe(tuning.boss.hp - 1);
    expect(ctx.director.step).toBe(1);
    expect(ctx.director.cur.index).toBe(1);
    expect(hitCalls).toBe(1);
  });

  it('speeds up in later phases', () => {
    const ctx = setup();
    const slow = ctx.level.speedAt(0);
    ctx.level.phase = 2;
    expect(ctx.level.speedAt(0)).toBeGreaterThan(slow);
  });

  it('respawns at the start of the current pattern and keeps earlier damage', () => {
    const ctx = setup();
    ctx.director.cur.orb.got = true;
    ctx.director.update();
    const checkpoint = ctx.level.checkpoint;
    ctx.rt.distance = checkpoint + 50;
    ctx.rt.state = 'dead';
    ctx.rt.deathTimer = 0;
    ctx.rt.update(DT);
    expect(ctx.rt.state).toBe('running');
    expect(ctx.rt.distance).toBe(checkpoint);
    expect(ctx.director.hp).toBe(tuning.boss.hp - 1);
  });
});

describe('collectibles', () => {
  it('collects a token the player runs through and counts it once', () => {
    const player = createPlayer();
    const env = { width: () => 1000, groundY: () => 500 };
    const mode = new RunMode(player, env);
    const level = compileLevel(levels[0], chunks);
    const rt = new LevelRuntime(level, mode, env);
    let calls = 0;
    rt.onCollect = (it) => {
      if (it.kind === 'token') calls++;
    };
    tuning.debug.invincible = true;
    try {
      for (let i = 0; i < 2400; i++) rt.update(DT);
      expect(rt.collected).toBeGreaterThan(0);
      expect(calls).toBe(rt.collected);
    } finally {
      tuning.debug.invincible = false;
    }
  });

  it('keeps tokens collected before the checkpoint and resets later ones on respawn', () => {
    const player = createPlayer();
    const env = { width: () => 1000, groundY: () => 500 };
    const mode = new RunMode(player, env);
    const level = compileLevel(levels[0], chunks);
    const rt = new LevelRuntime(level, mode, env);
    const before = level.items.find((i) => i.x < level.checkpoint);
    const after = level.items.find((i) => i.x > level.checkpoint + 100);
    before.got = true;
    after.got = true;
    rt.checkpointed = true;
    rt.restart();
    expect(before.got).toBe(true);
    expect(after.got).toBe(false);
    expect(rt.collected).toBeGreaterThanOrEqual(1);
  });

  it('gives every level enough tokens for the 80% star to mean something', () => {
    for (const def of levels) {
      const level = compileLevel(def, chunks);
      expect(level.tokenTotal).toBeGreaterThan(40);
      expect(level.items.every((i) => i.lift <= tuning.run.size * 4)).toBe(true);
    }
  });
});
