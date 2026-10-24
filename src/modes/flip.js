import { tuning } from '../config/tuning.js';
import { shrink } from '../engine/collision.js';
import { motion } from '../config/tokens.js';

export class FlipMode {
  constructor(player, env) {
    this.player = player;
    this.env = env;
    this.vy = 0;
    this.dir = 1;
    this.since = 0;
    this.rot = 0;
    this.visual = { x: 0, y: 0, w: 0, h: 0 };
    this.hitbox = { x: 0, y: 0, w: 0, h: 0 };
    this.reset();
  }

  reset() {
    const p = this.player;
    const t = tuning.flip;
    p.size = t.size;
    p.x = this.env.width() * t.startX;
    p.y = this.env.groundY() - p.size;
    p.prevY = p.y;
    this.vy = 0;
    this.dir = 1;
    this.since = 1e9;
    this.rot = 0;
  }

  onPress() {
    if (this.since < tuning.flip.cooldownMs) return false;
    this.dir = -this.dir;
    this.since = 0;
    return true;
  }

  onHold() {}

  onRelease() {}

  update(dt) {
    const p = this.player;
    const t = tuning.flip;
    p.x = this.env.width() * t.startX;
    p.prevY = p.y;
    this.since += dt * 1000;
    this.vy += this.dir * t.gravity * dt;
    if (this.vy > t.maxFall) this.vy = t.maxFall;
    else if (this.vy < -t.maxFall) this.vy = -t.maxFall;
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
    const target = this.dir > 0 ? 0 : Math.PI;
    this.rot = motion.reduced ? target : this.rot + (target - this.rot) * Math.min(1, dt * 18);
  }

  tilt() {
    return this.rot;
  }

  saveState(out) {
    out.y = this.player.y;
    out.vy = this.vy;
    out.dir = this.dir;
    out.since = this.since;
    return out;
  }

  loadState(s) {
    this.player.y = s.y;
    this.player.prevY = s.y;
    this.vy = s.vy;
    this.dir = s.dir;
    this.since = s.since;
  }

  getHitbox() {
    const p = this.player;
    const v = this.visual;
    v.x = p.x;
    v.y = p.y;
    v.w = p.size;
    v.h = p.size;
    return shrink(this.hitbox, v, tuning.flip.hitboxScale);
  }
}
