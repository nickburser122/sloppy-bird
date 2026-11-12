import { tuning } from '../config/tuning.js';
import { FLAG } from './run.js';

const P = tuning.flap;
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

export class FlapSim {
  constructor(c) {
    this.c = c;
    this.dt = 1 / tuning.sim.hz;
    this.reset();
  }

  reset() {
    this.tick = 0;
    this.t = 0;
    this.xt = 0;
    this.y = 270;
    this.vy = 0;
    this.dead = false;
    this.won = false;
    this.cause = '';
    this.flags = 0;
    this.shardGot = false;
    this.grounded = false;
  }

  enterAt(tick) {
    this.reset();
    this.tick = tick;
    this.t = tick * this.dt;
  }

  get pct() {
    return Math.min(1, this.t / this.c.duration);
  }

  gapY(k, t) {
    return k.amp ? k.gy + k.amp * Math.sin((TAU * (t - k.tb)) / k.period + k.phase) : k.gy;
  }

  spiderY(s, t) {
    return s.len * (0.5 + 0.5 * Math.cos((TAU * (t - s.tb)) / s.period));
  }

  plantH(p, t) {
    return p.depth * (0.5 - 0.5 * Math.cos((TAU * (t - p.tb)) / p.period));
  }

  darkAmt(t) {
    const d = this.c.dark;
    let a = 0;
    const fade = this.c.beatSec * 0.5;
    for (let i = 0; i < d.length; i++) {
      const v = Math.min(1, Math.max(0, Math.min(t - d[i][0], d[i][1] - t) / fade + 0.5));
      if (v > a) a = v;
    }
    return a;
  }

  windAccel(xt) {
    let a = 0;
    const ws = this.c.winds;
    for (let i = 0; i < ws.length; i++) {
      const sx = ws[i].ox - xt + P.px;
      if (CX >= sx && CX < sx + ws[i].w) a += ws[i].dir * P.windStr;
    }
    return a;
  }

  die(cause) {
    this.dead = true;
    this.cause = cause;
    this.flags |= FLAG.DEATH;
  }

  update(dt, input) {
    if (this.dead || this.won) return;
    const c = this.c;
    this.flags = 0;
    this.tick++;
    const t = this.tick * dt;
    this.t = t;
    const xt = c.X(t);
    this.xt = xt;
    if (input.pressed) {
      this.vy = -P.flap;
      this.flags |= FLAG.JUMP;
    }
    this.vy = Math.min(P.maxFall, Math.max(-1400, this.vy + (P.gravity + this.windAccel(xt)) * dt));
    this.y += this.vy * dt;
    if (this.y < P.r) {
      this.y = P.r;
      if (this.vy < 0) this.vy = 0;
    }
    if (this.y > P.floor - P.r) return this.die('floor');
    const y = this.y;
    for (let i = 0; i < c.thorns.length; i++) {
      const k = c.thorns[i];
      const sx = k.ox - xt + P.px;
      if (sx > W || sx + k.w < 0) continue;
      const gy = this.gapY(k, t);
      if (circleRect(CX, y, P.r, sx, 0, k.w, gy - k.gap / 2) || circleRect(CX, y, P.r, sx, gy + k.gap / 2, k.w, H - gy - k.gap / 2)) return this.die('thorn');
    }
    for (let i = 0; i < c.spiders.length; i++) {
      const s = c.spiders[i];
      const sx = s.ox - xt + P.px;
      if (sx > W || sx < -30) continue;
      const dx = CX - sx;
      const dy = y - this.spiderY(s, t);
      const rr = P.r + P.spiderR;
      if (dx * dx + dy * dy < rr * rr) return this.die('spider');
    }
    for (let i = 0; i < c.plants.length; i++) {
      const p = c.plants[i];
      const sx = p.ox - xt + P.px;
      if (sx > W || sx + p.w < 0) continue;
      const h = this.plantH(p, t);
      if (circleRect(CX, y, P.r, sx, P.floor - h, p.w, h)) return this.die('plant');
    }
    if (c.shard && !this.shardGot) {
      const sdx = CX - (c.shard.ox - xt + CX);
      const sdy = this.y - c.shard.y;
      if (sdx * sdx + sdy * sdy < 900) this.shardGot = true;
    }
    if (t >= c.duration) this.won = true;
  }

  heur() {
    const c = this.c;
    let target = 270;
    let best = Infinity;
    for (let i = 0; i < c.thorns.length; i++) {
      const k = c.thorns[i];
      const sx = k.ox - this.xt + P.px;
      if (sx + k.w < CX - 30) continue;
      if (sx < best) {
        best = sx;
        target = this.gapY(k, this.t + Math.max(0, sx - CX) / 300);
      }
    }
    return Math.abs(this.y - target) + 0.08 * Math.abs(this.vy);
  }

  key(want, buf) {
    return `${Math.round(this.y / 4)}|${Math.round(this.vy / 50)}|${want}|${buf}`;
  }

  snap() {
    return {
      shardGot: this.shardGot,
      tick: this.tick, y: this.y, vy: this.vy, dead: this.dead, won: this.won };
  }

  restore(s) {
    this.shardGot = s.shardGot;
    this.tick = s.tick;
    this.t = s.tick * this.dt;
    this.y = s.y;
    this.vy = s.vy;
    this.dead = s.dead;
    this.won = s.won;
    this.flags = 0;
  }
}
