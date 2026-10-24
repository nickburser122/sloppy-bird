import { describe, it, expect } from 'vitest';
import { aabb, circles, circleAabb, shrink } from '../src/engine/collision.js';

describe('collision', () => {
  it('aabb overlaps and separates', () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    expect(aabb(a, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
    expect(aabb(a, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
    expect(aabb(a, { x: 0, y: 11, w: 10, h: 10 })).toBe(false);
  });

  it('circles overlap and separate', () => {
    expect(circles({ x: 0, y: 0, r: 5 }, { x: 8, y: 0, r: 5 })).toBe(true);
    expect(circles({ x: 0, y: 0, r: 5 }, { x: 10, y: 0, r: 5 })).toBe(false);
  });

  it('circle vs aabb', () => {
    const box = { x: 10, y: 10, w: 10, h: 10 };
    expect(circleAabb({ x: 5, y: 15, r: 6 }, box)).toBe(true);
    expect(circleAabb({ x: 5, y: 15, r: 4 }, box)).toBe(false);
    expect(circleAabb({ x: 15, y: 15, r: 1 }, box)).toBe(true);
  });

  it('shrink keeps the box centered', () => {
    const out = { x: 0, y: 0, w: 0, h: 0 };
    shrink(out, { x: 10, y: 20, w: 100, h: 50 }, 0.7);
    expect(out.w).toBeCloseTo(70);
    expect(out.h).toBeCloseTo(35);
    expect(out.x + out.w / 2).toBeCloseTo(60);
    expect(out.y + out.h / 2).toBeCloseTo(45);
  });
});
