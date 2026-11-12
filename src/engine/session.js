import { tuning } from '../config/tuning.js';

export class Session {
  constructor({ reset, onDeath }) {
    this.reset = reset;
    this.onDeath = onDeath;
    this.state = 'play';
    this.t = 0;
    this.queued = false;
    this.attempt = 1;
    this.lastPct = 0;
    this.best = 0;
  }

  get alive() {
    return this.state === 'play';
  }

  get frozen() {
    return this.state === 'dying' && this.t < tuning.restart.hitStopMs;
  }

  die(pct) {
    if (this.state !== 'play') return false;
    this.state = 'dying';
    this.t = 0;
    this.queued = false;
    this.lastPct = pct;
    if (pct > this.best) this.best = pct;
    if (this.onDeath) this.onDeath(pct, this.attempt);
    return true;
  }

  update(dtMs, input) {
    if (this.state !== 'dying') return false;
    this.t += dtMs;
    if (input.pressed) this.queued = true;
    if (this.t < tuning.restart.deathMs) return false;
    this.attempt++;
    this.state = 'play';
    this.t = 0;
    this.reset();
    if (this.queued) input.bufferLeft = tuning.input.bufferMs;
    this.queued = false;
    return true;
  }
}
