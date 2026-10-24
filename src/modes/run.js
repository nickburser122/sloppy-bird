import { tuning } from '../config/tuning.js';
import { shrink } from '../engine/collision.js';

export class RunMode {
  constructor(player, env) {
    this.player = player;
    this.env = env;
    this.vy = 0;
    this.grounded = true;
    this.coyote = 0;
    this.jumping = false;
    this.visual = { x: 0, y: 0, w: 0, h: 0 };
    this.hitbox = { x: 0, y: 0, w: 0, h: 0 };
    this.reset();
  }

  reset() {
    const p = this.player;
    const t = tuning.run;
    p.size = t.size;
    p.x = this.env.width() * t.startX;
    p.y = this.env.groundY() - p.size;
    p.prevY = p.y;
    this.vy = 0;
    this.grounded = true;
    this.coyote = t.coyoteMs;
    this.jumping = false;
  }

  onPress() {
    if (!this.grounded && this.coyote <= 0) return false;
    this.vy = -tuning.run.jumpVelocity;
    this.grounded = false;
    this.coyote = 0;
    this.jumping = true;
    return true;
  }

  onHold() {}

  onRelease() {
    if (!this.jumping) return;
    this.jumping = false;
    if (this.vy < 0) this.vy *= tuning.run.releaseCut;
  }

  update(dt) {
    const p = this.player;
    const t = tuning.run;
    p.x = this.env.width() * t.startX;
    p.prevY = p.y;
    const floor = this.env.groundY() - p.size;
    if (this.grounded) {
      p.y = floor;
      this.vy = 0;
      this.coyote = t.coyoteMs;
      return;
    }
    this.coyote = Math.max(0, this.coyote - dt * 1000);
    const g = t.gravity * (this.vy > 0 ? t.fallGravityScale : 1);
    this.vy = Math.min(this.vy + g * dt, t.maxFall);
    p.y += this.vy * dt;
    if (p.y >= floor && this.vy >= 0) {
      p.y = floor;
      this.vy = 0;
      this.grounded = true;
      this.jumping = false;
      this.coyote = t.coyoteMs;
    }
  }

  getHitbox() {
    const p = this.player;
    const v = this.visual;
    v.x = p.x;
    v.y = p.y;
    v.w = p.size;
    v.h = p.size;
    return shrink(this.hitbox, v, tuning.run.hitboxScale);
  }
}
