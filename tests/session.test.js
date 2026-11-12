import { describe, it, expect } from 'vitest';
import { Session } from '../src/engine/session.js';
import { Input } from '../src/engine/input.js';
import { tuning } from '../src/config/tuning.js';

const STEP = 1000 / tuning.sim.hz;

function make() {
  let resets = 0;
  const session = new Session({ reset: () => resets++ });
  const input = new Input();
  return { session, input, resets: () => resets };
}

function stepUntilAlive(session, input, limitMs = 2000) {
  let elapsed = 0;
  while (!session.alive && elapsed < limitMs) {
    input.update(STEP);
    session.update(STEP, input);
    elapsed += STEP;
  }
  return elapsed;
}

describe('restart pipeline', () => {
  it('returns control within the latency budget', () => {
    const { session, input } = make();
    session.die(0.5);
    const elapsed = stepUntilAlive(session, input);
    expect(session.alive).toBe(true);
    expect(elapsed).toBeLessThanOrEqual(tuning.restart.latencyBudgetMs);
  });

  it('queues a press made during the death animation', () => {
    const { session, input } = make();
    session.die(0.4);
    input.setSource('test', true);
    input.update(STEP);
    session.update(STEP, input);
    input.setSource('test', false);
    stepUntilAlive(session, input);
    expect(input.buffered).toBe(true);
  });

  it('respawns once and ignores a second death while dying', () => {
    const { session, input, resets } = make();
    expect(session.die(0.2)).toBe(true);
    expect(session.die(0.9)).toBe(false);
    stepUntilAlive(session, input);
    expect(resets()).toBe(1);
    expect(session.lastPct).toBe(0.2);
    expect(session.attempt).toBe(2);
  });

  it('tracks the best percentage', () => {
    const { session, input } = make();
    session.die(0.3);
    stepUntilAlive(session, input);
    session.die(0.1);
    expect(session.best).toBe(0.3);
  });
});
