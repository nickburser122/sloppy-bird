import { describe, it, expect } from 'vitest';
import { RunMode } from '../src/modes/run.js';
import { createPlayer } from '../src/entities/player.js';
import { tuning } from '../src/config/tuning.js';

const DT = 1 / tuning.sim.hz;

function setup() {
  const player = createPlayer();
  const env = { width: () => 800, groundY: () => 500 };
  const mode = new RunMode(player, env);
  return { player, mode };
}

function apex(mode, player, { tap }) {
  let top = player.y;
  mode.onPress();
  if (tap) mode.onRelease();
  for (let i = 0; i < 2000; i++) {
    mode.update(DT);
    top = Math.min(top, player.y);
    if (mode.grounded) break;
  }
  return top;
}

describe('RunMode', () => {
  it('starts on the ground', () => {
    const { player, mode } = setup();
    expect(mode.grounded).toBe(true);
    expect(player.y + player.size).toBe(500);
  });

  it('holding jumps higher than tapping', () => {
    const a = setup();
    const b = setup();
    const startY = a.player.y;
    const held = startY - apex(a.mode, a.player, { tap: false });
    const tapped = startY - apex(b.mode, b.player, { tap: true });
    expect(held).toBeGreaterThan(tapped * 2);
    expect(tapped).toBeGreaterThan(0);
  });

  it('lands back on the ground', () => {
    const { player, mode } = setup();
    apex(mode, player, { tap: false });
    expect(mode.grounded).toBe(true);
    expect(player.y + player.size).toBe(500);
  });

  it('refuses a double jump', () => {
    const { mode } = setup();
    expect(mode.onPress()).toBe(true);
    mode.update(DT);
    expect(mode.onPress()).toBe(false);
  });

  it('allows a jump inside coyote time and refuses after it', () => {
    const { mode } = setup();
    mode.grounded = false;
    mode.coyote = tuning.run.coyoteMs;
    expect(mode.onPress()).toBe(true);
    const other = setup().mode;
    other.grounded = false;
    other.coyote = 0;
    expect(other.onPress()).toBe(false);
  });

  it('coyote time expires while airborne', () => {
    const { player, mode } = setup();
    player.y -= 200;
    player.prevY = player.y;
    mode.grounded = false;
    mode.coyote = tuning.run.coyoteMs;
    const steps = Math.ceil(tuning.run.coyoteMs / 1000 / DT) + 1;
    for (let i = 0; i < steps; i++) mode.update(DT);
    expect(mode.coyote).toBe(0);
  });

  it('hitbox is the configured fraction of the visual and centered', () => {
    const { player, mode } = setup();
    const h = mode.getHitbox();
    expect(h.w).toBeCloseTo(player.size * tuning.run.hitboxScale);
    expect(h.x + h.w / 2).toBeCloseTo(player.x + player.size / 2);
    expect(h.y + h.h / 2).toBeCloseTo(player.y + player.size / 2);
  });
});
