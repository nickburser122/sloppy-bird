import { describe, it, expect } from 'vitest';
import { compileLevel } from '../src/levels/compile.js';
import { LevelRuntime } from '../src/levels/runtime.js';
import { RunMode } from '../src/modes/run.js';
import { createPlayer } from '../src/entities/player.js';
import { levels } from '../src/levels/world1.js';
import { chunks } from '../src/levels/chunks/world1.js';
import { tuning } from '../src/config/tuning.js';

const DT = 1 / tuning.sim.hz;

function setup() {
  const player = createPlayer();
  const env = { width: () => 1000, groundY: () => 500 };
  const mode = new RunMode(player, env);
  const level = compileLevel(levels[0], chunks);
  const rt = new LevelRuntime(level, mode, env);
  return { rt, level, mode };
}

function stepUntil(rt, state, limit = 20000) {
  let n = 0;
  while (rt.state !== state && n < limit) {
    rt.update(DT);
    n++;
  }
  return n;
}

describe('LevelRuntime', () => {
  it('retry delay is under 300 ms by configuration', () => {
    expect(tuning.level.retryMs + DT * 1000).toBeLessThan(300);
  });

  it('dies on an obstacle and is running again in under 300 ms', () => {
    const { rt } = setup();
    stepUntil(rt, 'dead');
    expect(rt.state).toBe('dead');
    expect(rt.deaths).toBe(1);
    const steps = stepUntil(rt, 'running');
    expect(steps * DT * 1000).toBeLessThan(300);
    expect(rt.distance).toBe(0);
  });

  it('respawns at the checkpoint once it has been passed', () => {
    const { rt, level } = setup();
    rt.checkpointed = true;
    rt.restart();
    expect(rt.distance).toBe(level.checkpoint);
    stepUntil(rt, 'dead');
    stepUntil(rt, 'running');
    expect(rt.distance).toBe(level.checkpoint);
  });

  it('marks the checkpoint when it is crossed', () => {
    const { rt, level } = setup();
    rt.distance = level.checkpoint - 1;
    rt.next = level.obstacles.length;
    rt.update(DT);
    expect(rt.checkpointed).toBe(true);
  });

  it('invincibility prevents death', () => {
    const { rt } = setup();
    tuning.debug.invincible = true;
    try {
      stepUntil(rt, 'dead', 3000);
      expect(rt.state).toBe('running');
    } finally {
      tuning.debug.invincible = false;
    }
  });

  it('never needs more pooled obstacles than are allocated', () => {
    const { rt } = setup();
    tuning.debug.invincible = true;
    try {
      let max = 0;
      for (let i = 0; i < 60000 && rt.state !== 'won'; i++) {
        rt.update(DT);
        max = Math.max(max, rt.pool.count);
      }
      expect(rt.state).toBe('won');
      expect(max).toBeLessThan(tuning.level.poolSize);
    } finally {
      tuning.debug.invincible = false;
    }
  });
});
