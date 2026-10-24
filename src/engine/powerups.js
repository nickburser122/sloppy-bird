import { tuning } from '../config/tuning.js';

export const POWERS = ['blaster', 'shield', 'magnet', 'slowmo'];

export class PowerState {
  constructor() {
    this.kind = null;
    this.left = 0;
    this.max = 0;
  }

  activate(kind) {
    this.kind = kind;
    if (kind === 'shield') {
      this.left = 0;
      this.max = 0;
    } else {
      this.max = tuning[kind].ms;
      this.left = this.max;
    }
  }

  clear() {
    this.kind = null;
    this.left = 0;
    this.max = 0;
  }

  is(kind) {
    return this.kind === kind;
  }

  update(dtMs) {
    if (!this.kind || this.kind === 'shield') return;
    this.left -= dtMs;
    if (this.left <= 0) this.clear();
  }

  fraction() {
    if (!this.kind) return 0;
    if (this.kind === 'shield') return 1;
    return Math.max(0, this.left / this.max);
  }

  speedMul() {
    return this.kind === 'slowmo' ? tuning.slowmo.mul : 1;
  }

  breakShield() {
    if (this.kind !== 'shield') return false;
    this.clear();
    return true;
  }
}
