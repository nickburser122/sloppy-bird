import { describe, it, expect } from 'vitest';
import { Input } from '../src/engine/input.js';

describe('Input', () => {
  it('reports a press edge for one step only', () => {
    const input = new Input();
    input.setSource('a', true);
    input.update(8);
    expect(input.pressed).toBe(true);
    expect(input.down).toBe(true);
    input.update(8);
    expect(input.pressed).toBe(false);
    expect(input.down).toBe(true);
  });

  it('does not lose a tap shorter than one step', () => {
    const input = new Input();
    input.setSource('a', true);
    input.setSource('a', false);
    input.update(8);
    expect(input.pressed).toBe(true);
    expect(input.released).toBe(true);
    expect(input.down).toBe(false);
  });

  it('accumulates held time in ms', () => {
    const input = new Input();
    input.setSource('a', true);
    input.update(8);
    expect(input.heldMs).toBe(0);
    input.update(10);
    input.update(10);
    expect(input.heldMs).toBe(20);
  });

  it('buffers a press for 100 ms', () => {
    const input = new Input();
    input.setSource('a', true);
    input.update(8);
    input.setSource('a', false);
    input.update(60);
    expect(input.buffered).toBe(true);
    input.update(60);
    expect(input.buffered).toBe(false);
  });

  it('consume clears the buffer', () => {
    const input = new Input();
    input.setSource('a', true);
    input.update(8);
    expect(input.buffered).toBe(true);
    input.consume();
    expect(input.buffered).toBe(false);
  });

  it('treats overlapping sources as one continuous press', () => {
    const input = new Input();
    input.setSource('a', true);
    input.update(8);
    input.setSource('b', true);
    input.update(8);
    expect(input.pressed).toBe(false);
    input.setSource('a', false);
    input.update(8);
    expect(input.released).toBe(false);
    expect(input.down).toBe(true);
    input.setSource('b', false);
    input.update(8);
    expect(input.released).toBe(true);
    expect(input.down).toBe(false);
  });

  it('reset drops all state', () => {
    const input = new Input();
    input.setSource('a', true);
    input.update(8);
    input.reset();
    input.update(8);
    expect(input.down).toBe(false);
    expect(input.buffered).toBe(false);
    expect(input.pressed).toBe(false);
  });
});
