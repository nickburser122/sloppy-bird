import { tuning } from '../config/tuning.js';

export class Terrain {
  constructor() {
    this.xs = [];
    this.ys = [];
    this.gapStart = [];
    this.gapEnd = [];
  }

  addPoint(x, lift) {
    this.xs.push(x);
    this.ys.push(lift);
  }

  addGap(x0, x1) {
    this.gapStart.push(x0);
    this.gapEnd.push(x1);
  }

  seal() {
    const order = this.xs.map((x, i) => i).sort((a, b) => this.xs[a] - this.xs[b]);
    this.xs = order.map((i) => this.xs[i]);
    this.ys = order.map((i) => this.ys[i]);
    const gorder = this.gapStart.map((x, i) => i).sort((a, b) => this.gapStart[a] - this.gapStart[b]);
    this.gapStart = gorder.map((i) => this.gapStart[i]);
    this.gapEnd = gorder.map((i) => this.gapEnd[i]);
  }

  base(d) {
    const xs = this.xs;
    const n = xs.length;
    if (n === 0) return 0;
    if (d <= xs[0]) return this.ys[0];
    if (d >= xs[n - 1]) return this.ys[n - 1];
    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (xs[mid] <= d) lo = mid;
      else hi = mid;
    }
    const t = (d - xs[lo]) / (xs[hi] - xs[lo]);
    const k = (1 - Math.cos(t * Math.PI)) / 2;
    return this.ys[lo] + (this.ys[hi] - this.ys[lo]) * k;
  }

  height(d) {
    const gs = this.gapStart;
    let lo = 0;
    let hi = gs.length - 1;
    let found = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (gs[mid] <= d) {
        found = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    if (found >= 0 && d < this.gapEnd[found]) return tuning.surf.gapLift;
    return this.base(d);
  }
}

export function hills(length, crests, valley) {
  const pts = [];
  const n = crests.length;
  const step = length / (2 * n);
  pts.push([0, valley]);
  for (let i = 0; i < n; i++) {
    pts.push([(2 * i + 1) * step, crests[i]]);
    pts.push([(2 * i + 2) * step, valley]);
  }
  return pts;
}
