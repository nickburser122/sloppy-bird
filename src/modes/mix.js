import { tuning } from '../config/tuning.js';
import { FLAG } from './run.js';
import { RunSim } from './run.js';
import { FlipSim } from './flip.js';
import { FlapSim } from './flap.js';
import { SurfSim } from './surf.js';

const CLASSES = { run: RunSim, flip: FlipSim, flap: FlapSim, surf: SurfSim };

export class MixSim {
  constructor(c) {
    this.c = c;
    this.dt = 1 / tuning.sim.hz;
    this.subs = {};
    for (const m of Object.keys(c.subs)) this.subs[m] = new CLASSES[m](c.subs[m]);
    this.reset();
  }

  reset() {
    this.idx = 0;
    this.modeName = this.c.segs[0].mode;
    this.sub = this.subs[this.modeName];
    this.sub.reset();
    this.tick = 0;
    this.t = 0;
    this.xt = 0;
    this.dead = false;
    this.won = false;
    this.cause = '';
    this.flags = 0;
    this.portalT = -1;
    this.shardGot = false;
  }

  get y() {
    return this.sub.y;
  }

  get vy() {
    return this.sub.vy;
  }

  get gd() {
    return this.sub.gd === undefined ? 1 : this.sub.gd;
  }

  get air() {
    return !!this.sub.air;
  }

  get depth() {
    return this.sub.depth || 0;
  }

  get slope() {
    return this.sub.slope || 0;
  }

  get grounded() {
    return this.sub.grounded;
  }

  get pct() {
    return Math.min(1, this.t / this.c.duration);
  }

  useHeur() {
    return this.modeName === 'flap';
  }

  heur() {
    return this.sub.heur ? this.sub.heur() : 0;
  }

  update(dt, input) {
    if (this.dead || this.won) return;
    let portal = 0;
    const next = this.c.segs[this.idx + 1];
    if (next && (this.tick + 1) * dt >= next.tb) {
      this.idx++;
      this.modeName = next.mode;
      this.sub = this.subs[next.mode];
      this.sub.enterAt(this.tick);
      this.portalT = next.tb;
      input.bufferLeft = 0;
      portal = FLAG.PORTAL;
    }
    this.sub.update(dt, input);
    this.tick = this.sub.tick;
    this.t = this.sub.t;
    this.xt = this.sub.xt;
    this.dead = this.sub.dead;
    this.won = this.sub.won;
    this.cause = this.sub.cause;
    if (this.sub.shardGot) this.shardGot = true;
    this.flags = this.sub.flags | portal;
  }

  key(want, buf) {
    return `${this.idx}|${this.sub.key(want, buf)}`;
  }

  snap() {
    return { tick: this.tick, idx: this.idx, sub: this.sub.snap(), portalT: this.portalT, shardGot: this.shardGot };
  }

  restore(s) {
    this.idx = s.idx;
    this.modeName = this.c.segs[s.idx].mode;
    this.sub = this.subs[this.modeName];
    this.sub.restore(s.sub);
    this.tick = s.tick;
    this.t = this.sub.t;
    this.xt = this.sub.xt;
    this.dead = this.sub.dead;
    this.won = this.sub.won;
    this.portalT = s.portalT;
    this.shardGot = s.shardGot;
    this.flags = 0;
  }
}
