import { tuning } from '../config/tuning.js';
import { shrink } from '../engine/collision.js';
import { motion } from '../config/tokens.js';

export class SurfMode {
  constructor(player, env) {
    this.player = player;
    this.env = env;
    this.d = 0;
    this.dx = 0;
    this.lift = 0;
    this.vUp = 0;
    this.riding = true;
    this.held = false;
    this.boost = 0;
    this.slope = 0;
    this.visual = { x: 0, y: 0, w: 0, h: 0 };
    this.hitbox = { x: 0, y: 0, w: 0, h: 0 };
    this.reset();
  }

  reset() {
    const p = this.player;
    const t = tuning.surf;
    p.size = t.size;
    p.x = this.env.width() * t.startX;
    this.lift = this.env.terrain(this.d);
    this.vUp = 0;
    this.riding = true;
    this.held = false;
    this.boost = 0;
    this.slope = 0;
    this.place();
    p.prevY = p.y;
  }

  place() {
    this.player.y = this.env.groundY() - this.lift - this.player.size;
  }

  speedMul() {
    return 1 + this.boost;
  }

  onPress() {
    this.held = true;
    return true;
  }

  onHold() {}

  onRelease() {
    if (!this.held) return;
    this.held = false;
    if (!this.riding) return;
    const t = tuning.surf;
    const speed = this.dx > 0 ? this.dx / (1 / tuning.sim.hz) : 1;
    const slope = this.vUp / speed;
    this.riding = false;
    if (slope > -0.05) {
      this.vUp += t.launchKick;
      if (Math.abs(slope) < t.crestSlope) this.boost = Math.min(t.boostMax, this.boost + t.crestBonus);
    }
  }

  update(dt) {
    const p = this.player;
    const t = tuning.surf;
    p.x = this.env.width() * t.startX;
    p.prevY = p.y;
    const ground = this.env.terrain(this.d);
    const g = this.held ? t.gravity * t.diveScale : t.gravity;
    if (this.riding) {
      const ballistic = this.lift + this.vUp * dt - 0.5 * g * dt * dt;
      if (ballistic > ground + t.stickEps) {
        this.riding = false;
        this.lift = ballistic;
        this.vUp -= g * dt;
      } else {
        const rise = ground - this.lift;
        const drop = rise < 0 ? -rise : 0;
        const climb = rise > 0 ? rise : 0;
        if (this.held) this.boost += t.diveGain * drop - t.climbLoss * climb;
        else this.boost += t.passiveGain * drop - t.passiveLoss * climb;
        this.vUp = climb > t.snapRise ? 0 : Math.max(-t.maxVy, Math.min(t.maxVy, rise / dt));
        this.lift = ground;
      }
    } else {
      this.vUp -= g * dt;
      this.lift += this.vUp * dt;
      if (this.lift <= ground && this.vUp <= 0) {
        this.lift = ground;
        this.riding = true;
        if (this.held) this.boost += t.landBoost;
        this.vUp = 0;
      }
    }
    this.boost = Math.min(t.boostMax, Math.max(0, this.boost - t.boostDecay * dt));
    const speed = this.dx > 0 ? this.dx / dt : 1;
    this.slope = this.vUp / speed;
    this.place();
  }

  tilt() {
    if (motion.reduced) return 0;
    return -Math.max(-0.7, Math.min(0.7, Math.atan(this.slope)));
  }

  saveState(out) {
    out.lift = this.lift;
    out.vUp = this.vUp;
    out.riding = this.riding;
    out.held = this.held;
    out.boost = this.boost;
    return out;
  }

  loadState(s) {
    this.lift = s.lift;
    this.vUp = s.vUp;
    this.riding = s.riding;
    this.held = s.held;
    this.boost = s.boost;
    this.place();
    this.player.prevY = this.player.y;
  }

  getHitbox() {
    const p = this.player;
    const v = this.visual;
    v.x = p.x;
    v.y = p.y;
    v.w = p.size;
    v.h = p.size;
    return shrink(this.hitbox, v, tuning.surf.hitboxScale);
  }
}
