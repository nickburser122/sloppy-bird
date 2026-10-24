import { tuning } from '../config/tuning.js';
import { shrink } from '../engine/collision.js';
import { motion } from '../config/tokens.js';

export class FlapMode {
  constructor(player, env) {
    this.player = player;
    this.env = env;
    this.vy = 0;
    this.held = false;
    this.heldMs = 0;
    this.glideLeft = 0;
    this.gliding = false;
    this.visual = { x: 0, y: 0, w: 0, h: 0 };
    this.hitbox = { x: 0, y: 0, w: 0, h: 0 };
    this.reset();
  }

  reset() {
    const p = this.player;
    const t = tuning.flap;
    p.size = t.size;
    p.x = this.env.width() * t.startX;
    p.y = this.env.groundY() - t.fieldH / 2 - p.size / 2;
    p.prevY = p.y;
    this.vy = 0;
    this.held = false;
    this.heldMs = 0;
    this.glideLeft = t.glideMs;
    this.gliding = false;
  }

  onPress() {
    this.vy = -tuning.flap.impulse;
    this.glideLeft = tuning.flap.glideMs;
    this.held = true;
    this.heldMs = 0;
    return true;
  }

  onHold(ms) {
    this.heldMs = ms;
  }

  onRelease() {
    this.held = false;
    this.heldMs = 0;
  }

  update(dt) {
    const p = this.player;
    const t = tuning.flap;
    p.x = this.env.width() * t.startX;
    p.prevY = p.y;
    let g = t.gravity;
    this.gliding = false;
    if (this.held && this.heldMs >= t.glideDelayMs && this.vy > 0 && this.glideLeft > 0) {
      g *= t.glideScale;
      this.glideLeft = Math.max(0, this.glideLeft - dt * 1000);
      this.gliding = true;
    }
    this.vy += g * dt;
    const cap = this.gliding ? t.glideMaxFall : t.maxFall;
    if (this.vy > cap) this.vy = cap;
    p.y += this.vy * dt;
    const floor = this.env.groundY() - p.size;
    const ceil = this.env.groundY() - t.fieldH;
    if (p.y > floor) {
      p.y = floor;
      if (this.vy > 0) this.vy = 0;
    } else if (p.y < ceil) {
      p.y = ceil;
      if (this.vy < 0) this.vy = 0;
    }
  }

  tilt() {
    if (motion.reduced) return 0;
    return Math.max(-0.35, Math.min(0.45, this.vy / 1400));
  }

  saveState(out) {
    out.y = this.player.y;
    out.vy = this.vy;
    out.held = this.held;
    out.heldMs = this.heldMs;
    out.glideLeft = this.glideLeft;
    return out;
  }

  loadState(s) {
    this.player.y = s.y;
    this.player.prevY = s.y;
    this.vy = s.vy;
    this.held = s.held;
    this.heldMs = s.heldMs;
    this.glideLeft = s.glideLeft;
    this.gliding = false;
  }

  getHitbox() {
    const p = this.player;
    const v = this.visual;
    v.x = p.x;
    v.y = p.y;
    v.w = p.size;
    v.h = p.size;
    return shrink(this.hitbox, v, tuning.flap.hitboxScale);
  }
}
