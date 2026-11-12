import { createSim } from '../src/modes/sims.js';
import { Input } from '../src/engine/input.js';
import { tuning } from '../src/config/tuning.js';

export const DT = 1 / tuning.sim.hz;
export const DT_MS = DT * 1000;

export function stepOnce(sim, inp, want) {
  if (want !== inp.sources.size > 0) inp.setSource('b', want);
  inp.update(DT_MS);
  sim.update(DT, inp);
}

function snapInp(inp) {
  return { d: inp.sources.size > 0, b: inp.bufferLeft, h: inp.heldMs, p: inp.pressed, r: inp.released, dn: inp.down };
}

function restoreInp(inp, s) {
  inp.sources.clear();
  if (s.d) inp.sources.add('b');
  inp.bufferLeft = s.b;
  inp.heldMs = s.h;
  inp.pressed = s.p;
  inp.released = s.r;
  inp.down = s.dn;
  inp.pendingPress = false;
  inp.pendingRelease = false;
}

export function runEvents(c, events, extra = 0) {
  const sim = createSim(c);
  const inp = new Input();
  const sorted = events.slice().sort((a, b) => a[0] - b[0] || (a[1] ? 1 : -1));
  const total = Math.ceil(c.duration / DT) + 2 + extra;
  let idx = 0;
  let want = false;
  for (let i = 0; i < total && !sim.dead && !sim.won; i++) {
    while (idx < sorted.length && sorted[idx][0] <= sim.tick) want = sorted[idx++][1];
    stepOnce(sim, inp, want);
  }
  return { got: sim.shardGot, won: sim.won, dead: sim.dead, cause: sim.cause, tick: sim.tick, pct: sim.won ? 1 : Math.min(1, sim.t / c.duration), sim };
}

export const reach = { v: 0 };

export function search(c, { width = 320, decide = 2, slack = 3, needShard = false } = {}) {
  reach.v = 0;
  if (c.level.mode === 'flap') slack = Math.max(slack, 40);
  const sim = createSim(c);
  const inp = new Input();
  const total = Math.ceil(c.duration / DT) + 2;
  const steps = Math.ceil(total / decide);
  let heurOn = typeof sim.heur === 'function' && !sim.useHeur;
  let layer = [{ s: sim.snap(), i: snapInp(inp), want: false, presses: 0, parent: null }];
  const finish = (node, step) => {
    const wants = [];
    for (let n = node; n.parent; n = n.parent) wants.push(n.want);
    wants.reverse();
    const events = [];
    let prev = false;
    for (let k = 0; k < wants.length; k++) {
      if (wants[k] !== prev) events.push([k * decide, wants[k]]);
      prev = wants[k];
    }
    if (prev) events.push([wants.length * decide, false]);
    return events;
  };
  for (let step = 0; step < steps; step++) {
    const next = new Map();
    let won = null;
    let layerHeur = heurOn;
    for (const n of layer) {
      for (let o = 0; o < 2; o++) {
        const want = o === 1;
        sim.restore(n.s);
        restoreInp(inp, n.i);
        for (let k = 0; k < decide && !sim.dead && !sim.won; k++) stepOnce(sim, inp, want);
        if (sim.dead) continue;
        const presses = n.presses + (want && !n.want ? 1 : 0);
        if (sim.useHeur) layerHeur = sim.useHeur();
        if (sim.won) {
          if (needShard && !sim.shardGot) continue;
          if (!won || presses < won.presses) won = { s: null, i: null, want, presses, parent: n };
          continue;
        }
        const key = sim.key(want ? 1 : 0, inp.bufferLeft > 0 ? 1 : 0);
        const old = next.get(key);
        if (!old || presses < old.presses) next.set(key, { s: sim.snap(), i: snapInp(inp), want, presses, parent: n, h: layerHeur || heurOn ? sim.heur() : 0 });
      }
    }
    if (won) return finish(won, step);
    let arr = Array.from(next.entries());
    if (!arr.length) {
      reach.v = step / steps;
      return null;
    }
    const minP = Math.min(...arr.map((e) => e[1].presses));
    arr = arr.filter((e) => e[1].presses <= minP + slack);
    if (arr.length > width && (heurOn || layerHeur)) {
      for (const e of arr) e[2] = e[1].h;
      arr.sort((a, b) => a[2] - b[2]);
      const top = Math.ceil(width * 0.7);
      const rest = arr.slice(top);
      const stride = rest.length / (width - top);
      const pick = arr.slice(0, top);
      for (let k = 0; k < width - top; k++) pick.push(rest[Math.floor(k * stride)]);
      arr = pick;
    } else if (arr.length > width) {
      arr.sort((a, b) => (a[0] < b[0] ? -1 : 1));
      const stride = arr.length / width;
      const pick = [];
      for (let k = 0; k < width; k++) pick.push(arr[Math.floor(k * stride)]);
      arr = pick;
    }
    layer = arr.map((e) => e[1]);
  }
  return null;
}

export function toPairs(events) {
  const pairs = [];
  for (let i = 0; i < events.length; i += 2) pairs.push([events[i][0], events[i + 1] ? events[i + 1][0] : events[i][0] + 1]);
  return pairs;
}

export function fromPairs(pairs) {
  const ev = [];
  for (const [a, b] of pairs) {
    ev.push([a, true]);
    ev.push([Math.max(b, a + 1), false]);
  }
  return ev;
}

function shifted(pairs, k, s) {
  const out = pairs.map((p) => p.slice());
  out[k][0] += s;
  out[k][1] += s;
  return out;
}

const clears = (c, pairs) => runEvents(c, fromPairs(pairs)).won;

export function windowOf(c, pairs, k, cap = 90) {
  if (!clears(c, pairs)) return { lo: 0, hi: -1 };
  let lo = 0;
  while (lo > -cap && clears(c, shifted(pairs, k, lo - 1))) lo--;
  let hi = 0;
  while (hi < cap && clears(c, shifted(pairs, k, hi + 1))) hi++;
  return { lo, hi };
}

export function prune(c, pairs) {
  let cur = pairs;
  for (let k = cur.length - 1; k >= 0; k--) {
    const cand = cur.filter((_, i) => i !== k);
    if (clears(c, cand)) cur = cand;
  }
  return cur;
}

export function centered(c, events) {
  let pairs = prune(c, toPairs(events));
  for (let pass = 0; pass < 2; pass++) {
    for (let k = 0; k < pairs.length; k++) {
      const w = windowOf(c, pairs, k);
      const mid = Math.round((w.lo + w.hi) / 2);
      if (mid !== 0) {
        const cand = shifted(pairs, k, mid);
        if (clears(c, cand)) pairs = cand;
      }
    }
  }
  const windows = pairs.map((_, k) => windowOf(c, pairs, k));
  return { pairs, windows };
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
