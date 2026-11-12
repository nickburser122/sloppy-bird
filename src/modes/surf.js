import { tuning } from '../config/tuning.js';
import { FLAG } from './run.js';

const P = tuning.surf;
const CX = P.px + P.sprite / 2;
const W = tuning.stage.w;
const H = tuning.stage.h;
const TAU = Math.PI * 2;

const circleRect = (cx, cy, r, rx, ry, rw, rh) => {
  const nx = Math.max(rx, Math.min(cx, rx + rw));
  const ny = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
};

const smooth = (u) => u * u * (3 - 2 * u);

export class SurfSim {
  constructor(c) {
    this.c = c;
    this.dt = 1 / tuning.sim.hz;
    this.reset();
  }

  reset() {
    this.tick = 0;
    this.t = 0;
    this.xt = 0;
    this.sPrev = this.surfaceAt(CX, 0);
    this.y = this.sPrev;
    this.vy = 0;
    this.air = false;
    this.dead = false;
    this.won = false;
    this.cause = '';
    this.flags = 0;
    this.shardGot = false;
    this.grounded = true;
    this.slope = 0;
    this.depth = 0;
  }

  enterAt(tick) {
    this.reset();
    this.tick = tick;
    this.t = tick * this.dt;
    this.sPrev = this.surface(this.t);
    this.y = this.sPrev;
  }

  get pct() {
    return Math.min(1, this.t / this.c.duration);
  }

  surfaceAt(wx, t) {
    const c = this.c;
    let s = P.base;
    for (let i = 0; i < c.waves.length; i++) {
      const w = c.waves[i];
      s += w.a * Math.sin((TAU * (wx - w.v * t)) / w.l + (w.p || 0));
    }
    for (let i = 0; i < c.ramps.length; i++) {
      const r = c.ramps[i];
      const x0 = r.ox + P.px;
      const u = wx - x0;
      if (u <= 0 || u >= r.len + 30) continue;
      s -= u < r.len ? (r.h * u) / r.len : r.h * (1 - smooth((u - r.len) / 30));
    }
    return s;
  }

  surface(t) {
    return this.surfaceAt(this.c.X(t) + CX, t);
  }

  die(cause) {
    this.dead = true;
    this.cause = cause;
    this.flags |= FLAG.DEATH;
  }

  whirlAccel(xt, y, s) {
    const ws = this.c.whirls;
    let a = 0;
    for (let i = 0; i < ws.length; i++) {
      const sx = ws[i].ox - xt + P.px;
      if (CX >= sx && CX < sx + ws[i].w && y > s - 24) a += P.whirl;
    }
    return a;
  }

  update(dt, input) {
    if (this.dead || this.won) return;
    const c = this.c;
    this.flags = 0;
    this.tick++;
    const t0 = (this.tick - 1) * dt;
    this.t = this.tick * dt;
    const h = dt / P.substeps;
    const hold = input.down;
    const wasAir = this.air;
    let s = this.sPrev;
    for (let i = 0; i < P.substeps; i++) {
      const ti = t0 + h * (i + 1);
      const xt = c.X(ti);
      s = this.surfaceAt(xt + CX, ti);
      const vs = (s - this.sPrev) / h;
      const d = this.y - s;
      if (!this.air) {
        if (d <= -P.hyst) this.air = true;
      } else if (d >= 0) {
        this.air = false;
      }
      let ay;
      if (this.air) {
        ay = P.gravity + (hold ? P.holdAir : 0);
      } else {
        ay = -P.k * d - P.c * (this.vy - vs) + (hold ? P.hold : 0);
      }
      ay += this.whirlAccel(xt, this.y, s);
      this.vy = Math.max(-P.vmax, Math.min(P.vmax, this.vy + ay * h));
      this.y += this.vy * h;
      if (this.y - s > P.depthMax) {
        this.y = s + P.depthMax;
        if (this.vy > vs) this.vy = vs;
      }
      if (this.y < P.r) {
        this.y = P.r;
        if (this.vy < 0) this.vy = 0;
      }
      if (!Number.isFinite(this.y) || !Number.isFinite(this.vy)) {
        this.y = s;
        this.vy = 0;
      }
      this.sPrev = s;
    }
    const xt = c.X(this.t);
    this.xt = xt;
    this.depth = this.y - s;
    this.grounded = !this.air;
    this.slope = (this.surfaceAt(xt + CX + 4, this.t) - this.surfaceAt(xt + CX - 4, this.t)) / 8;
    if (wasAir && !this.air) this.flags |= FLAG.LAND;
    if (!wasAir && this.air) this.flags |= FLAG.JUMP;
    const y = this.y;
    for (let i = 0; i < c.rocks.length; i++) {
      const o = c.rocks[i];
      const sx = o.ox - xt + P.px;
      if (sx > W || sx + o.w < 0) continue;
      if (circleRect(CX, y, P.r, sx, P.base - o.top, o.w, o.top + o.bot)) return this.die('rock');
    }
    for (let i = 0; i < c.buoys.length; i++) {
      const o = c.buoys[i];
      const sx = o.ox - xt + P.px;
      if (sx > W || sx + o.w < 0) continue;
      const bs = this.surfaceAt(o.ox + P.px, this.t);
      const bx = sx + o.w / 2;
      const dx = CX - bx;
      const dy = y - (bs - 12);
      const rr = P.r + 15;
      if (dx * dx + dy * dy < rr * rr) return this.die('buoy');
      if (circleRect(CX, y, P.r, bx - 3, bs, 6, o.chain)) return this.die('chain');
    }
    for (let i = 0; i < c.beams.length; i++) {
      const o = c.beams[i];
      const sx = o.ox - xt + P.px;
      if (sx > W || sx + o.w < 0) continue;
      if (circleRect(CX, y, P.r, sx, -20, o.w, P.base + o.bottom + 20)) return this.die('beam');
    }
    for (let i = 0; i < c.sharks.length; i++) {
      const o = c.sharks[i];
      const sx = o.ox - xt + P.px;
      if (sx > W || sx + o.w < 0) continue;
      const sy = P.base + o.y0 + (o.amp ? o.amp * Math.sin((TAU * (this.t - o.tb)) / o.period) : 0);
      if (circleRect(CX, y, P.r, sx, sy - 14, o.w, 28)) return this.die('shark');
    }
    for (let i = 0; i < c.reefs.length; i++) {
      const o = c.reefs[i];
      const sx = o.ox - xt + P.px;
      if (sx > W || sx + o.w < 0) continue;
      const top = P.base + o.gy - o.gap / 2;
      if (circleRect(CX, y, P.r, sx, -20, o.w, top + 20) || circleRect(CX, y, P.r, sx, top + o.gap, o.w, H - top - o.gap)) return this.die('reef');
    }
    if (c.shard && !this.shardGot) {
      const sdx = CX - (c.shard.ox - xt + CX);
      const sdy = this.y - c.shard.y;
      if (sdx * sdx + sdy * sdy < 900) this.shardGot = true;
    }
    if (this.t >= c.duration) this.won = true;
  }

  key(want, buf) {
    return `${Math.round(this.y / 4)}|${Math.round(this.vy / 50)}|${this.air ? 1 : 0}|${want}|${buf}`;
  }

  snap() {
    return {
      shardGot: this.shardGot,
      tick: this.tick, y: this.y, vy: this.vy, air: this.air, sPrev: this.sPrev, dead: this.dead, won: this.won };
  }

  restore(s) {
    this.shardGot = s.shardGot;
    this.tick = s.tick;
    this.t = s.tick * this.dt;
    this.y = s.y;
    this.vy = s.vy;
    this.air = s.air;
    this.sPrev = s.sPrev;
    this.dead = s.dead;
    this.won = s.won;
    this.flags = 0;
  }
}
