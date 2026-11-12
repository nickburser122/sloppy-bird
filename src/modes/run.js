import { tuning } from '../config/tuning.js';

const R = tuning.run;
const HB = R.sprite * R.hitbox;
const CX = R.px + R.sprite / 2;
const HX = R.px + (R.sprite - HB) / 2;
const HOFF = R.sprite - (R.sprite - HB) / 2;
const TAU = Math.PI * 2;
const W = tuning.stage.w;

export const FLAG = { JUMP: 1, LAND: 2, RING: 4, PAD: 8, CRUMBLE: 16, DEATH: 32, PORTAL: 64 };

const ov = (ax, ay, aw, ah, bx, by, bw, bh) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

export class RunSim {
  constructor(c) {
    this.c = c;
    this.dt = 1 / tuning.sim.hz;
    this.used = new Uint8Array(c.rings.length);
    this.crumT = new Float32Array(c.plats.length);
    this.broken = new Uint8Array(c.plats.length);
    this.reset();
  }

  reset() {
    this.tick = 0;
    this.t = 0;
    this.xt = 0;
    this.y = R.ground;
    this.vy = 0;
    this.coyote = 0;
    this.grounded = true;
    this.plat = -1;
    this.cuttable = false;
    this.used.fill(0);
    this.crumT.fill(-1);
    this.broken.fill(0);
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

  top(p, t) {
    return p.kind === 'mover' ? p.top0 + p.amp * Math.sin((TAU * (t - p.tb)) / p.period + p.phase) : p.top0;
  }

  inPit(xt) {
    const pits = this.c.pits;
    for (let i = 0; i < pits.length; i++) {
      const sx = pits[i].ox - xt + R.px;
      if (CX >= sx && CX < sx + pits[i].w) return true;
    }
    return false;
  }

  ringAt(xt) {
    const rings = this.c.rings;
    const hy = this.y - HOFF;
    for (let i = 0; i < rings.length; i++) {
      if (this.used[i]) continue;
      const sx = rings[i].ox - xt + R.px;
      const nx = Math.max(HX, Math.min(sx, HX + HB));
      const ny = Math.max(hy, Math.min(rings[i].cy, hy + HB));
      const dx = sx - nx;
      const dy = rings[i].cy - ny;
      if (dx * dx + dy * dy < R.ringR * R.ringR) return i;
    }
    return -1;
  }

  die(cause) {
    this.dead = true;
    this.cause = cause;
    this.flags |= FLAG.DEATH;
  }

  sawY(s, t) {
    return s.cy + (s.cy2 - s.cy) * (0.5 - 0.5 * Math.cos((TAU * (t - s.tb)) / s.period));
  }

  logY(l, t) {
    const land = R.ground - l.h;
    if (t < l.tFall) return -200;
    if (t >= l.tLand) return land;
    return -l.h + (land + l.h) * ((t - l.tFall) / R.logFall);
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
    if (this.grounded) {
      if (this.plat >= 0) {
        if (this.broken[this.plat]) {
          this.grounded = false;
          this.plat = -1;
        } else {
          this.y = this.top(c.plats[this.plat], t);
          this.vy = 0;
        }
      } else if (this.inPit(xt)) {
        this.grounded = false;
      }
    }
    const wasGrounded = this.grounded;
    this.coyote = this.grounded ? R.coyoteMs : Math.max(0, this.coyote - dtMs);
    if (input.buffered) {
      if (this.coyote > 0) {
        this.vy = -R.jump;
        this.coyote = 0;
        this.grounded = false;
        this.plat = -1;
        this.cuttable = true;
        input.consume();
        this.flags |= FLAG.JUMP;
      } else {
        const ri = this.ringAt(xt);
        if (ri >= 0) {
          this.used[ri] = 1;
          this.vy = -R.jump;
          this.cuttable = true;
          input.consume();
          this.flags |= FLAG.RING;
        }
      }
    }
    if (input.released && this.vy < 0 && this.cuttable) {
      this.vy *= R.cut;
      this.cuttable = false;
    }
    const g = this.vy > 0 ? R.gravity * R.fallMul : R.gravity;
    this.vy = Math.min(R.maxFall, this.vy + g * dt);
    const prev = this.y;
    this.y += this.vy * dt;
    let landed = false;
    let landPlat = -1;
    if (this.vy >= 0) {
      if (this.y >= R.ground && !this.inPit(xt)) {
        this.y = R.ground;
        landed = true;
      } else {
        const plats = c.plats;
        for (let i = 0; i < plats.length; i++) {
          if (this.broken[i]) continue;
          const p = plats[i];
          const sx = p.ox - xt + R.px;
          if (CX < sx || CX > sx + p.w) continue;
          const tp = this.top(p, t);
          if (prev <= this.top(p, t - dt) + R.tol && this.y >= tp) {
            this.y = tp;
            landed = true;
            landPlat = i;
            break;
          }
        }
      }
    }
    if (landed) {
      this.vy = 0;
      this.grounded = true;
      this.plat = landPlat;
      if (!wasGrounded) this.flags |= FLAG.LAND;
      if (landPlat >= 0 && c.plats[landPlat].kind === 'crumble' && this.crumT[landPlat] < 0) {
        this.crumT[landPlat] = t;
        this.flags |= FLAG.CRUMBLE;
      }
    } else {
      this.grounded = false;
      this.plat = -1;
    }
    for (let i = 0; i < this.crumT.length; i++) {
      if (this.crumT[i] >= 0 && !this.broken[i] && t - this.crumT[i] >= R.crumbleMs / 1000) this.broken[i] = 1;
    }
    const hy = this.y - HOFF;
    for (let i = 0; i < c.pads.length; i++) {
      const p = c.pads[i];
      const sx = p.ox - xt + R.px;
      if (sx > W || sx + p.w < 0) continue;
      if (this.vy >= 0 && ov(HX, hy, HB, HB, sx, R.ground - 14, p.w, 14)) {
        this.vy = -R.padV;
        this.grounded = false;
        this.plat = -1;
        this.cuttable = false;
        this.flags |= FLAG.PAD;
      }
    }
    if (!this.grounded && this.y > R.ground + R.pitDeath) return this.die('pit');
    const hy2 = this.y - HOFF;
    for (let i = 0; i < c.spikes.length; i++) {
      const s = c.spikes[i];
      const sx = s.ox - xt + R.px;
      if (sx > W || sx + s.w < 0) continue;
      for (let k = 0; k < s.n; k++) {
        const lx = sx + k * R.spikeW + (R.spikeW - R.spikeHitW) / 2;
        if (ov(HX, hy2, HB, HB, lx, R.ground - R.spikeHitH, R.spikeHitW, R.spikeHitH)) return this.die('spike');
      }
    }
    for (let i = 0; i < c.ceils.length; i++) {
      const s = c.ceils[i];
      const sx = s.ox - xt + R.px;
      if (sx > W || sx + s.w < 0) continue;
      if (ov(HX, hy2, HB, HB, sx, 0, s.w, s.h)) return this.die('ceiling');
    }
    for (let i = 0; i < c.saws.length; i++) {
      const s = c.saws[i];
      const sx = s.ox - xt + R.px;
      if (sx > W + s.r || sx < -s.r) continue;
      const cy = this.sawY(s, t);
      const nx = Math.max(HX, Math.min(sx, HX + HB));
      const ny = Math.max(hy2, Math.min(cy, hy2 + HB));
      const rr = s.r * 0.8;
      if ((sx - nx) * (sx - nx) + (cy - ny) * (cy - ny) < rr * rr) return this.die('saw');
    }
    for (let i = 0; i < c.logs.length; i++) {
      const l = c.logs[i];
      const sx = l.ox - xt + R.px;
      if (sx > W || sx + l.w < 0) continue;
      if (ov(HX, hy2, HB, HB, sx, this.logY(l, t), l.w, l.h)) return this.die('log');
    }
    for (let i = 0; i < c.plats.length; i++) {
      if (this.broken[i]) continue;
      const p = c.plats[i];
      const sx = p.ox - xt + R.px;
      if (sx > W || sx + p.w < 0) continue;
      const tp = this.top(p, t);
      if (ov(HX, hy2, HB, HB, sx, tp, p.w, R.platH) && this.y - tp > R.tol) return this.die('platform');
    }
    if (c.shard && !this.shardGot) {
      const sdx = CX - (c.shard.ox - xt + CX);
      const sdy = this.y - 20 - c.shard.y;
      if (sdx * sdx + sdy * sdy < 900) this.shardGot = true;
    }
    if (t >= c.duration) this.won = true;
  }

  key(want, buf) {
    const crum = Array.from(this.crumT, (v) => (v < 0 ? 0 : 1 + Math.floor((this.t - v) * 20)));
    return [Math.round(this.y / 4), Math.round(this.vy / 50), want, buf, Math.round(this.coyote / 15), this.plat, this.used.join(''), crum.join(',')].join('|');
  }

  snap() {
    return {
      shardGot: this.shardGot,
      tick: this.tick,
      y: this.y,
      vy: this.vy,
      coyote: this.coyote,
      grounded: this.grounded,
      plat: this.plat,
      cuttable: this.cuttable,
      dead: this.dead,
      won: this.won,
      used: this.used.slice(),
      crumT: this.crumT.slice(),
      broken: this.broken.slice()
    };
  }

  restore(s) {
    this.shardGot = s.shardGot;
    this.tick = s.tick;
    this.t = s.tick * this.dt;
    this.y = s.y;
    this.vy = s.vy;
    this.coyote = s.coyote;
    this.grounded = s.grounded;
    this.plat = s.plat;
    this.cuttable = s.cuttable;
    this.dead = s.dead;
    this.won = s.won;
    this.used.set(s.used);
    this.crumT.set(s.crumT);
    this.broken.set(s.broken);
    this.flags = 0;
  }
}
