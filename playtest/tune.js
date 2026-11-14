import { writeFileSync } from 'node:fs';
import { validate, GATES } from '../src/levels/validator.js';
import { mulberry32 } from './bot.js';
import { modeOfEvent, segmentAt } from '../src/levels/runtime.js';

const META = {
  'w1-l1': { world: 1, name: 'First Light', bpm: 140, speed: 540, beats: 48, kinds: ['S', 'S', 'S2', 'P'] },
  'w1-l2': { world: 1, name: 'Low Branches', bpm: 140, speed: 540, beats: 48, kinds: ['S', 'S2', 'P', 'C', 'C'] },
  'w1-l3': { world: 1, name: 'Rotten Bridge', bpm: 144, speed: 560, beats: 52, kinds: ['S', 'P', 'C', 'B', 'B', 'M'] },
  'w2-l1': { world: 2, name: 'Lantern Reeds', bpm: 120, speed: 300, beats: 40, mode: 'flap', kinds: ['TH', 'TH', 'TH', 'TN'] },
  'w2-l2': { world: 2, name: 'Silk Road', bpm: 120, speed: 300, beats: 40, mode: 'flap', kinds: ['TH', 'MG', 'SP', 'SP'] },
  'w2-l3': { world: 2, name: 'Snapjaw Pond', bpm: 124, speed: 300, beats: 42, mode: 'flap', dark: [[22, 34]], kinds: ['TH', 'SP', 'PL', 'PL', 'WN'] },
  'w2-l4': { world: 2, name: 'Blackwater', bpm: 124, speed: 310, beats: 44, mode: 'flap', dark: [[0, 44]], kinds: ['TH', 'MG', 'SP', 'PL', 'WN', 'TN'] },
  'w3-l1': { world: 3, name: 'Gull Cove', bpm: 128, speed: 420, beats: 40, mode: 'surf', waves: [{ a: 22, l: 420, v: 60, p: 0 }, { a: 12, l: 210, v: 90, p: 1 }], kinds: ['R', 'R', 'R'] },
  'w3-l2': { world: 3, name: 'Pier Pressure', bpm: 128, speed: 420, beats: 40, mode: 'surf', waves: [{ a: 22, l: 420, v: 60, p: 0 }, { a: 12, l: 210, v: 90, p: 1 }], kinds: ['R', 'B', 'B', 'BM', 'BM'] },
  'w3-l3': { world: 3, name: 'Reef Run', bpm: 128, speed: 420, beats: 42, mode: 'surf', waves: [{ a: 22, l: 420, v: 60, p: 0 }, { a: 12, l: 210, v: 90, p: 1 }], kinds: ['R', 'B', 'SH', 'SH', 'RF', 'RF'] },
  'w3-l4': { world: 3, name: 'Riptide', bpm: 132, speed: 420, beats: 44, mode: 'surf', waves: [{ a: 44, l: 420, v: 70, p: 0 }, { a: 24, l: 210, v: 100, p: 1 }], kinds: ['R', 'B', 'BM', 'SH', 'RF', 'WH', 'RP'] },
  'w5-l1': { world: 5, name: 'Handshake', bpm: 140, speed: 540, beats: 40, mode: 'mix', start: 'run', portals: [['flip', 14], ['flap', 27]], waves: [{ a: 22, l: 420, v: 60, p: 0 }, { a: 12, l: 210, v: 90, p: 1 }], kinds: ['S'] },
  'w5-l2': { world: 5, name: 'Switchback', bpm: 140, speed: 540, beats: 46, mode: 'mix', start: 'run', portals: [['flap', 11], ['surf', 22], ['flip', 34]], waves: [{ a: 22, l: 420, v: 60, p: 0 }, { a: 12, l: 210, v: 90, p: 1 }], kinds: ['S'] },
  'w5-boss': { world: 5, name: 'Nerve', bpm: 144, speed: 540, beats: 64, mode: 'mix', start: 'run', portals: [['flip', 9], ['flap', 18], ['surf', 27], ['run', 36], ['flip', 45], ['surf', 54]], waves: [{ a: 22, l: 420, v: 60, p: 0 }, { a: 12, l: 210, v: 90, p: 1 }], kinds: ['S'] },
  'w4-l1': { world: 4, name: 'Docking Bay', bpm: 132, speed: 500, beats: 40, mode: 'flip', kinds: ['FS', 'FS', 'FS', 'FG'] },
  'w4-l2': { world: 4, name: 'Laser Hall', bpm: 132, speed: 500, beats: 40, mode: 'flip', kinds: ['FS', 'FG', 'FL', 'FL'] },
  'w4-l3': { world: 4, name: 'Compactor', bpm: 136, speed: 500, beats: 42, mode: 'flip', kinds: ['FS', 'FG', 'FL', 'FK', 'FK'] },
  'w4-l4': { world: 4, name: 'Zero G', bpm: 136, speed: 500, beats: 44, mode: 'flip', kinds: ['FS', 'FG', 'FL', 'FK', 'FO', 'FO', 'FV'] },
  'w1-l4': { world: 1, name: 'Wildfire', bpm: 148, speed: 560, beats: 56, wall: true, kinds: ['S', 'P', 'C', 'B', 'M', 'R', 'R', 'V'] }
};

const id = process.argv[2];
const iters = Number(process.argv[3] || 150);
const seed = Number(process.argv[4] || 1);
const meta = META[id];
const rand = mulberry32(seed * 7919 + id.length);
const pick = (a) => a[Math.floor(rand() * a.length)];
let FLIPS = meta.mode === 'flip';
let FLAPS = meta.mode === 'flap';
let SURFS = meta.mode === 'surf';
const MIX = meta.mode === 'mix';
const useMode = (m) => {
  FLIPS = m === 'flip';
  FLAPS = m === 'flap';
  SURFS = m === 'surf';
};

function schunk(kind, b) {
  const sp = pick([1.5, 1.75, 2, 2.25]);
  const r = (lo, hi, st) => lo + Math.round(rand() * ((hi - lo) / st)) * st;
  switch (kind) {
    case 'R': return { len: 0, gap: sp, ev: [{ beat: b, type: 'rock', w: r(60, 100, 10), top: r(40, 130, 10), bot: r(15, 40, 5) }] };
    case 'B': return { len: 0, gap: sp, ev: [{ beat: b, type: 'buoy', chain: r(70, 110, 10) }] };
    case 'BM': return { len: 0, gap: sp + 0.5, ev: [{ beat: b, type: 'beam', w: r(100, 180, 20), bottom: pick([-50, -40, 30, 40, 50]) }] };
    case 'SH': return { len: 0, gap: sp, ev: [{ beat: b, type: 'shark', y: r(50, 110, 10), amp: pick([0, 0, 20, 30]), period: pick([3, 4, 6]) }] };
    case 'RF': return { len: 0, gap: sp + 0.5, ev: [{ beat: b, type: 'reef', gy: r(70, 110, 10), gap: r(56, 80, 4), w: 70 }] };
    case 'WH': return { len: 0, gap: sp + 0.5, ev: [{ beat: b, type: 'whirl', w: r(120, 200, 20) }] };
    case 'RP': return { len: 0, gap: sp + 1, ev: [{ beat: b, type: 'ramp', len: r(120, 200, 20), h: r(50, 90, 10) }] };
  }
}
let lastGy = 270;

function pchunk(kind, b, p = 0.5) {
  const g = ++gid;
  const gap = Math.round((190 - p * 60 + (rand() - 0.5) * 20) / 10) * 10;
  const gy = Math.max(130, Math.min(390, Math.round((lastGy + (rand() - 0.5) * 220) / 10) * 10));
  lastGy = gy;
  const sp = pick([1.5, 1.75, 2, 2.25]);
  switch (kind) {
    case 'TH': return { len: 0, gap: sp, ev: [{ beat: b, type: 'thorn', gy, gap, w: 60 }] };
    case 'TN': return { len: 0, gap: sp + 1.5, ev: [{ beat: b, type: 'thorn', gy, gap: gap + 10, w: 200 + Math.round(rand() * 3) * 40 }] };
    case 'MG': return { len: 0, gap: sp + 0.5, ev: [{ beat: b, type: 'mgap', gy, gap: gap + 10, amp: 40 + Math.round(rand() * 3) * 20, period: pick([3, 4, 6]), w: 60, phase: 0 }] };
    case 'SP': return { len: 0, gap: sp, ev: [{ beat: b, type: 'spider', len: 200 + Math.round(rand() * 6) * 20 }] };
    case 'PL': return { len: 0, gap: sp, ev: [{ beat: b, type: 'plant', w: 80 + Math.round(rand() * 3) * 10 }] };
    case 'WN': return { len: 0, gap: sp + 1, ev: [{ beat: b, type: 'wind', w: 180 + Math.round(rand() * 4) * 40, dir: pick([-1, 1]) }] };
  }
}
const q = (v) => Math.round(v * (FLIPS ? 8 : 4)) / (FLIPS ? 8 : 4);
let lastSide = 1;

function fchunk(kind, b) {
  const g = ++gid;
  const side = rand() < 0.85 ? 1 - lastSide : lastSide;
  lastSide = side;
  const gap = pick([0.625, 0.75, 0.75, 1, 1.25]);
  switch (kind) {
    case 'FS': return { len: 0, gap, ev: [{ beat: b, type: 'spike', side, n: pick([1, 1, 2]) }] };
    case 'FG': return { len: 0, gap, ev: [{ beat: b, type: 'gap', side, w: 120 + Math.round(rand() * 5) * 20 }] };
    case 'FL': return { len: 0, gap: gap + 0.25, ev: [{ beat: b, type: 'laser', side }] };
    case 'FK': return { len: 0, gap: gap + 0.5, ev: [{ beat: b, type: 'crusher', side, w: 160 + Math.round(rand() * 3) * 20, depth: 190, period: 2 }] };
    case 'FO': return { len: 0, gap: 1.5, ev: [{ beat: b, type: 'spike', side: 0, n: 1, g }, { beat: b + 0.4, type: 'orb', y: 270, g }, { beat: b + 0.5, type: 'spike', side: 1, n: 1, g }] };
    case 'FF': return { len: 0, gap: 1.5, ev: [{ beat: b, type: 'force' }] };
    case 'FV': return { len: 0, gap: 1, ev: [{ beat: b, type: 'speed', mul: pick([1.2, 1.4]) }] };
  }
}
let gid = 0;

function chunk(kind, b) {
  if (FLIPS) return fchunk(kind, b);
  if (FLAPS) return pchunk(kind, b, b / meta.beats);
  if (SURFS) return schunk(kind, b);
  const g = ++gid;
  switch (kind) {
    case 'S': return { len: 0, gap: 1 + rand() * 0.75, ev: [{ beat: b, type: 'spike', n: 1 }] };
    case 'S2': return { len: 0, gap: 1.25 + rand() * 0.75, ev: [{ beat: b, type: 'spike', n: 2 }] };
    case 'P': return { len: 0, gap: 2.25 + rand() * 0.75, ev: [{ beat: b, type: 'pit', w: 180 + Math.round(rand() * 3) * 20 }] };
    case 'C': return { len: 0, gap: 1.75 + rand(), ev: [{ beat: b, type: 'ceil', w: 200, h: 300, g }, { beat: b + 0.5, type: 'spike', n: 1, g }] };
    case 'B': return { len: 0, gap: 3.25 + rand() * 0.75, ev: [{ beat: b, type: 'pit', w: 380, g }, { beat: b + 0.5, type: 'crumble', w: 120, y: 55, g }] };
    case 'M': return { len: 0, gap: 3.25 + rand() * 0.75, ev: [{ beat: b, type: 'pit', w: 380, g }, { beat: b + 0.75, type: 'mover', w: 120, y: 60, amp: 40, period: 4, phase: 0, g }] };
    case 'R': return { len: 0, gap: 3.75 + rand() * 0.5, ev: [{ beat: b, type: 'pit', w: 480, g }, { beat: b + 1, type: 'ring', y: 130, g }] };
    case 'V': return { len: 0, gap: 1.5, ev: [{ beat: b, type: 'speed', mul: pick([0.8, 1.2, 1.4]) }] };
  }
}

const LANE = 1.25;
const MIXKINDS = { run: ['S', 'S', 'S2', 'P'], flip: ['FS', 'FS', 'FG'], flap: ['TH'], surf: ['R', 'B'] };
const segsOf = (ev) => [{ mode: meta.start, beat: 0 }, ...ev.filter((e) => e.type === 'portal').sort((a, b) => a.beat - b.beat).map((p) => ({ mode: p.mode, beat: p.beat }))];

function mixChunk(mode, kind, b) {
  useMode(mode);
  const c = chunk(kind, b);
  for (const e of c.ev) if (e.type === 'spike') e.m = mode;
  return c;
}

function mixBounds(segs, i) {
  const lo = i === 0 ? 3 : segs[i].beat + LANE + 0.25;
  const hi = (i + 1 < segs.length ? segs[i + 1].beat : meta.beats) - 1.5;
  return [lo, hi];
}

function mixBase() {
  const ev = meta.portals.map(([m, b]) => ({ beat: b, type: 'portal', mode: m }));
  const segs = segsOf(ev);
  segs.forEach((sg, i) => {
    const [lo, hi] = mixBounds(segs, i);
    let b = lo;
    while (b < hi) {
      const c = mixChunk(sg.mode, pick(MIXKINDS[sg.mode]), q(b));
      ev.push(...c.ev);
      b += c.gap;
    }
  });
  return ev;
}

function structOK(ev) {
  const segs = segsOf(ev);
  for (const e of ev) {
    if (e.type === 'portal') continue;
    const i = segmentAt(segs, e.beat);
    if (modeOfEvent(e) !== segs[i].mode) return false;
    const [lo, hi] = mixBounds(segs, i);
    if (e.beat < lo - 0.25 || e.beat > hi + 0.25) return false;
  }
  return true;
}

function mixInsert(ev) {
  const segs = segsOf(ev);
  const i = Math.floor(rand() * segs.length);
  const [lo, hi] = mixBounds(segs, i);
  if (hi <= lo) return ev;
  return [...ev, ...mixChunk(segs[i].mode, pick(MIXKINDS[segs[i].mode]), q(lo + rand() * (hi - lo))).ev];
}

function base() {
  if (MIX) return mixBase();
  const ev = [];
  let b = 3;
  while (b < meta.beats - 3) {
    const k = pick(meta.kinds);
    const c = chunk(k, q(b));
    ev.push(...c.ev);
    b += c.len + c.gap;
  }
  return ev;
}

const build = (events) => ({
  id,
  mode: meta.mode || 'run',
  start: meta.start,
  dark: meta.dark || [],
  waves: meta.waves || [],
  world: meta.world,
  name: meta.name,
  bpm: meta.bpm,
  speed: meta.speed,
  beats: meta.beats,
  wall: !!meta.wall,
  events: events.slice().sort((a, b) => a.beat - b.beat)
});

function score(res) {
  if (res.fail.includes('unbeatable')) return 500 + (1 - (res.m.reach || 0)) * 500;
  if (res.fail.some((f) => f.startsWith('search log'))) return 1000;
  const m = res.m;
  const g = GATES[meta.world];
  let s = 0;
  if (m.idle >= 0.1) s += 5 + (m.idle - 0.1) * 20;
  if (m.spamMax >= 0.25) s += 5 + (m.spamMax - 0.25) * 20;
  if (m.minWindow < g.window) s += (g.window - m.minWindow) / 15;
  if (m.wide > 0.3) s += (m.wide - 0.3) * 20;
  if (m.hold < 50) s += (50 - m.hold) / 8;
  if (m.reaction < g.reaction) s += (g.reaction - m.reaction) / 60;
  if (m.ips < g.ips[0]) s += (g.ips[0] - m.ips) * 8;
  if (m.ips > g.ips[1]) s += (m.ips - g.ips[1]) * 8;
  if (m.maxGap > g.gap) s += (m.maxGap - g.gap) * 10;
  if (m.jitter < g.jitter[0]) s += (g.jitter[0] - m.jitter) * 20;
  if (m.jitter > g.jitter[1]) s += (m.jitter - g.jitter[1]) * 20;
  return s;
}

function mutate(events, res) {
  const ev = events.map((e) => ({ ...e }));
  if (MIX && rand() < 0.2) return mixInsert(ev);
  if (res && res.m && res.m.press && rand() < 0.4) {
    const worst = res.m.press.reduce((a, b) => (b.w < a.w ? b : a));
    const tb = worst.t / (60 / meta.bpm);
    const near = ev.filter((e) => Math.abs(e.beat - tb) < 1.5 && e.type !== 'speed');
    if (near.length) {
      const e = pick(near);
      if (rand() < 0.3 && ev.length > 10) {
        const gone = e.g ? ev.filter((x) => x.g === e.g) : [e];
        for (const x of gone) ev.splice(ev.indexOf(x), 1);
      } else {
        const d = pick([-0.5, -0.25, 0.25, 0.5, 0.75, -0.75]);
        for (const x of ev) if (x === e || (e.g && x.g === e.g)) x.beat = q(Math.min(meta.beats - 1.5, Math.max(2.5, x.beat + d)));
      }
      return ev;
    }
  }
  if (!MIX && rand() < 0.25) {
    const bs = [0, ...ev.map((e) => e.beat).sort((a, b) => a - b), meta.beats];
    let bi = 0;
    for (let k = 1; k < bs.length; k++) if (bs[k] - bs[k - 1] > bs[bi + 1] - bs[bi]) bi = k - 1;
    const mid = q((bs[bi] + bs[bi + 1]) / 2);
    ev.push(...chunk(pick(SURFS ? ['R'] : FLAPS ? ['TH'] : FLIPS ? ['FS', 'FS', 'FG'] : ['S', 'S', 'S2']), mid).ev);
    return ev;
  }
  const n = 1 + Math.floor(rand() * 2);
  for (let k = 0; k < n; k++) {
    const op = rand();
    const e = pick(ev);
    if (op < 0.5) {
      const d = pick(FLIPS ? [-0.25, -0.125, 0.125, 0.25, -0.5, 0.5] : [-0.5, -0.25, 0.25, 0.5]);
      for (const x of ev) if (x === e || (e.g && x.g === e.g)) x.beat = q(Math.min(meta.beats - 1.5, Math.max(2.5, x.beat + d)));
    } else if (op < 0.75) {
      if (e.type === 'pit') {
        const [lo, hi] = e.g ? [320, 520] : [180, 240];
        e.w = Math.min(hi, Math.max(lo, e.w + pick([-20, 20])));
      }
      else if (e.type === 'spike') {
        if (e.side !== undefined && rand() < 0.5) e.side = 1 - e.side;
        else e.n = pick([1, 2]);
      } else if (e.type === 'gap') {
        if (rand() < 0.4) e.side = 1 - e.side;
        else e.w = Math.min(240, Math.max(120, e.w + pick([-20, 20])));
      } else if (e.type === 'laser') e.side = 1 - e.side;
      else if (e.type === 'thorn' || e.type === 'mgap') {
        const r = rand();
        if (r < 0.5) e.gy = Math.min(400, Math.max(120, e.gy + pick([-30, -20, 20, 30])));
        else if (r < 0.85) e.gap = Math.min(200, Math.max(110, e.gap + pick([-10, 10])));
        else if (e.type === 'mgap') e.amp = Math.min(100, Math.max(30, e.amp + pick([-20, 20])));
        else e.w = Math.min(320, Math.max(60, e.w + pick([-20, 20])));
      } else if (e.type === 'spider') e.len = Math.min(380, Math.max(160, e.len + pick([-20, 20])));
      else if (e.type === 'plant') e.w = Math.min(120, Math.max(70, e.w + pick([-10, 10])));
      else if (e.type === 'wind') {
        if (rand() < 0.3) e.dir = -e.dir;
        else e.w = Math.min(360, Math.max(160, e.w + pick([-40, 40])));
      } else if (e.type === 'crusher') {
        if (rand() < 0.4) e.side = 1 - e.side;
        else e.w = Math.min(240, Math.max(140, e.w + pick([-20, 20])));
      } else if (e.type === 'orb') e.y = Math.min(340, Math.max(200, e.y + pick([-30, 30])));
      else if (e.type === 'ceil') e.h = Math.min(304, Math.max(296, e.h + pick([-4, 4])));
      else if (e.type === 'crumble' || e.type === 'mover') {
        e.w = Math.min(160, Math.max(80, e.w + pick([-20, 20])));
        e.y = Math.min(80, Math.max(40, e.y + pick([-10, 10])));
      } else if (e.type === 'ring') e.y = Math.min(200, Math.max(80, e.y + pick([-20, 20])));
      else if (e.type === 'speed') e.mul = pick([0.8, 1.2, 1.4]);
    } else if (op < 0.88) {
      if (MIX) return mixInsert(ev);
      const c = chunk(pick(meta.kinds), q(2.5 + rand() * (meta.beats - 5)));
      ev.push(...c.ev);
    } else if (ev.length > 8) {
      const victim = ev.indexOf(e);
      const gone = e.g ? ev.filter((x) => x.g === e.g) : [e];
      for (const x of gone) ev.splice(ev.indexOf(x), 1);
      void victim;
    }
  }
  return ev;
}

const opts = { variants: [{ width: 160 }] };
const f = (e) => {
  const extra = e.g ? `, g: ${e.g}` : '';
  const { beat, type, g, ...rest } = e;
  void g;
  return `{ beat: ${beat}, type: '${type}'${Object.entries(rest).map(([k, v]) => `, ${k}: ${typeof v === 'string' ? `'${v}'` : v}`).join('')}${extra} }`;
};
function save() {
const L = build(best.ev);
const out = `export default {
  id: '${L.id}',
  world: ${L.world},
  name: '${L.name}',
  mode: '${meta.mode || 'run'}',${meta.start ? `\n  start: '${meta.start}',` : ''}
  bpm: ${L.bpm},
  speed: ${L.speed},
  beats: ${L.beats},
  wall: ${L.wall},
  dark: ${JSON.stringify(L.dark || [])},
  waves: ${JSON.stringify(L.waves || [])},
  events: [
${L.events.map((e) => '    ' + f(e)).join(',\n')}
  ]
};
`;
writeFileSync(`src/levels/data/${id}.js`, out);
}


let best;
async function main() {
let cur = base();
if (process.env.CONT) {
  const mod = await import(`../src/levels/data/${id}.js?${Date.now()}`);
  cur = mod.default.events.map((e) => ({ ...e }));
  gid = 1000;
}
let curRes = validate(build(cur), opts);
let curScore = score(curRes);
best = { ev: cur, score: curScore, res: curRes };
for (let i = 0; i < iters && best.score > 0; i++) {
  const cand = i % 40 === 39 && !process.env.CONT ? base() : mutate(cur, curRes);
  if (MIX && !structOK(cand)) continue;
  const res = validate(build(cand), opts);
  const s = score(res);
  const temp = 0.5 * (1 - i / iters);
  if (s <= curScore + rand() * temp || (i % 40 === 39 && !process.env.CONT)) {
    cur = cand;
    curRes = res;
    curScore = s;
    if (s < best.score) {
      best = { ev: cand, score: s, res };
      save();
    }
  }
  if (i % 10 === 0) console.log(id, i, 'cur', curScore.toFixed(2), 'best', best.score.toFixed(2));
}


save();
console.log(id, 'final score', best.score.toFixed(2), best.res.fail.join(' | '));
}
main();
