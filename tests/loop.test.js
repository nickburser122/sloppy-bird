import { describe, it, expect } from 'vitest';
import { Loop } from '../src/engine/loop.js';

function make(hz = 100, maxFrameMs = 250) {
  const log = { updates: 0, alphas: [] };
  const loop = new Loop({
    hz,
    maxFrameMs,
    update: () => {
      log.updates++;
    },
    render: (a) => log.alphas.push(a)
  });
  return { loop, log };
}

describe('Loop', () => {
  it('runs whole fixed steps and renders with the remainder as alpha', () => {
    const { loop, log } = make();
    const steps = loop.advance(35);
    expect(steps).toBe(3);
    expect(log.updates).toBe(3);
    expect(log.alphas[0]).toBeCloseTo(0.5);
  });

  it('accumulates partial frames across calls', () => {
    const { loop } = make();
    expect(loop.advance(6)).toBe(0);
    expect(loop.advance(6)).toBe(1);
  });

  it('clamps huge frame deltas so tab switches cannot break physics', () => {
    const { loop } = make();
    expect(loop.advance(60000)).toBe(25);
  });

  it('passes the step in seconds to update', () => {
    const seen = [];
    const loop = new Loop({
      hz: 120,
      maxFrameMs: 250,
      update: (dt) => seen.push(dt),
      render: () => {}
    });
    loop.advance(20);
    expect(seen.length).toBe(2);
    expect(seen.every((dt) => Math.abs(dt - 1 / 120) < 1e-9)).toBe(true);
  });
});
