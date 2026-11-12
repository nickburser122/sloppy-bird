import { tuning } from '../config/tuning.js';
import { FLAG } from './run.js';

const F = tuning.flip;
const R = tuning.run;
const HB = F.sprite * F.hitbox;
const CX = F.px + F.sprite / 2;
const HX = F.px + (F.sprite - HB) / 2;
const H2 = F.sprite / 2;
const MID = (F.floor + F.ceil) / 2;
const W = tuning.stage.w;
const TAU = Math.PI * 2;
const FLOOR_Y = F.floor - H2;
const CEIL_Y = F.ceil + H2;

const ov = (ax, ay, aw, ah, bx, by, bw, bh) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

export class FlipSim {
  constructor(c) {
    this.c = c;
    this.dt = 1 / tuning.sim.hz;
    this.used = new Uint8Array(c.orbs.length);
    this.reset();
  }

  reset() {
    this.tick = 0;
    this.t = 0;
    this.xt = 0;
    this.y = FLOOR_Y;
    this.vy = 0;
    this.gd = 1;
    this.coyote = 0;
    this.grounded = true;
    this.used.fill(0);
    this.dead = false;
    this.won = false;
    this.cause = '';
    this.flags = 0;
    this.shardGot = false;
  }

  enterAt(tick) {
    this.reset();
    this.tick = tick;
    this.t = tick * this.dt;
  }

  get pct() {
    return Math.min(1, this.t / this.c.duration);
  }

  gapAt(side, xt) {
    const gaps = this.c.gaps;
    for (let i = 0; i < gaps.length; i++) {
      if (gaps[i].side !== side) continue;
      const sx = gaps[i].ox - xt + F.px;
      if (CX >= sx && CX < sx + gaps[i].w) return true;
    }
    return false;
  }

  orbAt(xt) {
    const orbs = this.c.orbs;
    const hy = this.y - HB / 2;
    for (let i = 0; i < orbs.length; i++) {
      if (this.used[i]) continue;
      const sx = orbs[i].ox - xt + F.px;
      const nx = Math.max(HX, Math.min(sx, HX + HB));
      const ny = Math.max(hy, Math.min(orbs[i].cy, hy + HB));
      const dx = sx - nx;
      const dy = orbs[i].cy - ny;
      if (dx * dx + dy * dy < F.orbR * F.orbR) return i;
    }
    return -1;
  }

  crushDepth(k, t) {
    return k.depth * (0.5 - 0.5 * Math.cos((TAU * (t - k.tb)) / k.period));
  }

  laserSide(l, t) {
    const n = Math.floor((t - l.tb) / this.c.beatSec + 0.5);
    return n & 1 ? 1 - l.side : l.side;
  }

  die(cause) {
    this.dead = true;
    this.cause = cause;
    this.flags |= FLAG.DEATH;
  }

  flip() {
    this.gd = -this.gd;
    this.vy = 0;
    this.grounded = false;
    this.coyote = 0;
  }

  update(dt, input) {
    if (this.dead || this.won) return;
    const c = this.c;
    const dtMs = dt * 1000;
    this.flags = 0;
    this.tick++;
    const t = this.tick * dt;
    this.t = t;
    const xt = c.X(t);
    this.xt = xt;
    for (let i = 0; i < c.forces.length; i++) {
      if (t - dt < c.forces[i].tb && t >= c.forces[i].tb) this.flip();
    }
    this.coyote = this.grounded ? F.coyoteMs : Math.max(0, this.coyote - dtMs);
    if (input.buffered) {
      if (this.coyote > 0) {
        this.flip();
        input.consume();
        this.flags |= FLAG.JUMP;
      } else {
        const oi = this.orbAt(xt);
        if (oi >= 0) {
          this.used[oi] = 1;
          this.flip();
          input.consume();
          this.flags |= FLAG.RING;
        }
      }
    }
    this.vy = Math.max(-F.maxFall, Math.min(F.maxFall, this.vy + this.gd * F.gravity * dt));
    this.y += this.vy * dt;
    let landed = false;
    if (this.gd === 1 && this.vy >= 0 && this.y >= FLOOR_Y && !this.gapAt(0, xt)) {
      this.y = FLOOR_Y;
      landed = true;
    } else if (this.gd === -1 && this.vy <= 0 && this.y <= CEIL_Y && !this.gapAt(1, xt)) {
      this.y = CEIL_Y;
      landed = true;
    }
    if (landed) {
      this.vy = 0;
      if (!this.grounded) this.flags |= FLAG.LAND;
      this.grounded = true;
    } else {
      this.grounded = false;
    }
    if (this.y > F.floor + F.fall || this.y < F.ceil - F.fall) return this.die('gap');
    const hy = this.y - HB / 2;
    for (let i = 0; i < c.spikes.length; i++) {
      const s = c.spikes[i];
      const sx = s.ox - xt + F.px;
      if (sx > W || sx + s.w < 0) continue;
      for (let k = 0; k < s.n; k++) {
        const lx = sx + k * R.spikeW + (R.spikeW - R.spikeHitW) / 2;
        const ty = s.side === 0 ? F.floor - R.spikeHitH : F.ceil;
        if (ov(HX, hy, HB, HB, lx, ty, R.spikeHitW, R.spikeHitH)) return this.die('spike');
      }
    }
    for (let i = 0; i < c.lasers.length; i++) {
      const l = c.lasers[i];
      const sx = l.ox - xt + F.px;
      if (sx > W || sx + l.w < 0) continue;
      const bs = this.laserSide(l, t);
      const ty = bs === 0 ? MID : F.ceil;
      if (ov(HX, hy, HB, HB, sx, ty, l.w, MID - F.ceil)) return this.die('laser');
    }
    for (let i = 0; i < c.crushers.length; i++) {
      const k = c.crushers[i];
      const sx = k.ox - xt + F.px;
      if (sx > W || sx + k.w < 0) continue;
      const d = this.crushDepth(k, t);
      const ty = k.side === 0 ? F.floor - d : F.ceil;
      if (ov(HX, hy, HB, HB, sx, ty, k.w, d)) return this.die('crusher');
    }
    if (c.shard && !this.shardGot) {
      const sdx = CX - (c.shard.ox - xt + CX);
      const sdy = this.y - c.shard.y;
      if (sdx * sdx + sdy * sdy < 900) this.shardGot = true;
    }
    if (t >= c.duration) this.won = true;
  }

  key(want, buf) {
    return `${Math.round(this.y / 4)}|${Math.round(this.vy / 60)}|${want}|${buf}|${this.gd}|${this.grounded ? 1 : 0}|${Math.round(this.coyote / 10)}|${this.used.join('')}`;
  }

  snap() {
    return {
      shardGot: this.shardGot,
      tick: this.tick, y: this.y, vy: this.vy, gd: this.gd, coyote: this.coyote, grounded: this.grounded, dead: this.dead, won: this.won, used: this.used.slice() };
  }

  restore(s) {
    this.shardGot = s.shardGot;
    this.tick = s.tick;
    this.t = s.tick * this.dt;
    this.y = s.y;
    this.vy = s.vy;
    this.gd = s.gd;
    this.coyote = s.coyote;
    this.grounded = s.grounded;
    this.dead = s.dead;
    this.won = s.won;
    this.used.set(s.used);
    this.flags = 0;
  }
}
