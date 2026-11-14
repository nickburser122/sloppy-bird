import { writeFileSync } from 'node:fs';
import { validate, GATES } from '../src/levels/validator.js';

const id = process.argv[2];
const rounds = Number(process.argv[3] || 6);
const mod = await import(`../src/levels/data/${id}.js?${Date.now()}`);
const base = mod.default;
const beatSec = 60 / base.bpm;
const FL = base.mode === 'flip';
const FP = base.mode === 'flap';
const FS = base.mode === 'surf';
const qn = FL ? 8 : 4;
const q = (v) => Math.round(v * qn) / qn;
const build = (events) => ({ ...base, events: events.slice().sort((a, b) => a.beat - b.beat) });
const opts = { search: { width: 160 } };

function score(res) {
  if (res.fail.includes('unbeatable') || res.fail.some((f) => f.startsWith('search log'))) return 1000;
  const m = res.m;
  const g = GATES[base.world];
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

function regions(res) {
  const m = res.m;
  const g = GATES[base.world];
  const out = [];
  const times = m.press.map((p) => p.t).sort((a, b) => a - b);
  const all = [0, ...times, res.c.duration];
  if (m.maxGap > g.gap || m.ips < g.ips[0]) {
    let bi = 0;
    for (let i = 1; i < all.length - 1; i++) if (all[i + 1] - all[i] > all[bi + 1] - all[bi]) bi = i;
    out.push([all[bi], all[bi + 1]]);
  }
  if (m.minWindow < g.window) {
    const w = m.press.reduce((a, b) => (b.w < a.w ? b : a));
    out.push([w.t - 0.5, w.t + 0.5]);
  }
  if (m.reaction < g.reaction) {
    const r = m.press.reduce((a, b) => (b.r < a.r ? b : a));
    out.push([r.t - 0.5, r.tb + 0.5]);
  }
  if (!out.length) out.push([0, res.c.duration]);
  return out;
}

function candidates(events, res) {
  const cands = [];
  if (FL && res.m.ips < GATES[base.world].ips[0]) {
    for (const e of events) if (e.side !== undefined) cands.push(events.map((x) => (x === e ? { ...x, side: 1 - x.side } : x)));
  }
  for (const [t1, t2] of regions(res)) {
    const b1 = t1 / beatSec - 1.5;
    const b2 = t2 / beatSec + 1.5;
    for (let b = q(Math.max(2.5, b1)); b <= Math.min(base.beats - 1.5, b2); b += FL ? 0.125 : 0.25) {
      if (events.some((e) => Math.abs(e.beat - b) < 0.5)) continue;
      for (const add of FS ? [{ type: 'rock', w: 70, top: 80, bot: 25 }, { type: 'buoy', chain: 90 }, { type: 'rock', w: 80, top: 120, bot: 25 }] : FP ? [{ type: 'thorn', gy: 270, gap: 150, w: 60 }, { type: 'thorn', gy: 190, gap: 150, w: 60 }, { type: 'thorn', gy: 350, gap: 150, w: 60 }, { type: 'spider', len: 240 }] : FL ? [{ type: 'spike', side: 0, n: 1 }, { type: 'spike', side: 1, n: 1 }, { type: 'gap', side: 0, w: 160 }, { type: 'gap', side: 1, w: 160 }] : [{ type: 'spike', n: 1 }, { type: 'spike', n: 2 }, { type: 'pit', w: 200 }, { type: 'pit', w: 230 }]) cands.push([...events, { beat: b, ...add }]);
    }
    for (const e of events) {
      if (e.beat < b1 || e.beat > b2 || e.type === 'speed') continue;
      const grp = e.g ? events.filter((x) => x.g === e.g) : [e];
      cands.push(events.filter((x) => !grp.includes(x)));
      const mod = (k, v) => cands.push(events.map((x) => (x === e ? { ...x, [k]: v } : x)));
      if (e.type === 'gap') for (const d of [-20, 20]) mod('w', Math.max(120, Math.min(240, e.w + d)));
      if (e.type === 'pit') for (const d of [-40, -20, 20, 40]) mod('w', e.w + d);
      if (e.type === 'crumble' || e.type === 'mover') {
        for (const d of [-20, 20]) mod('w', e.w + d);
        for (const d of [-10, 10]) mod('y', e.y + d);
      }
      if (e.type === 'spike') for (const n of [1, 2, 3]) if (n !== e.n) mod('n', n);
      for (const d of FL ? [-0.25, -0.125, 0.125, 0.25] : [-0.5, -0.25, 0.25, 0.5]) {
        cands.push(events.map((x) => (grp.includes(x) ? { ...x, beat: q(Math.min(base.beats - 1.5, Math.max(2.5, x.beat + d))) } : x)));
      }
    }
  }
  return cands;
}

const f = (e) => {
  const { beat, type, ...rest } = e;
  return `{ beat: ${beat}, type: '${type}'${Object.entries(rest).map(([k, v]) => `, ${k}: ${typeof v === 'string' ? `'${v}'` : v}`).join('')} }`;
};
function save(events) {
  const L = build(events);
  writeFileSync(`src/levels/data/${id}.js`, `export default {
  id: '${L.id}',
  world: ${L.world},
  name: '${L.name}',
  mode: '${L.mode}',${L.start ? `\n  start: '${L.start}',` : ''}
  bpm: ${L.bpm},
  speed: ${L.speed},
  beats: ${L.beats},
  wall: ${!!L.wall},
  dark: ${JSON.stringify(L.dark || [])},
  waves: ${JSON.stringify(L.waves || [])},
  events: [
${L.events.map((e) => '    ' + f(e)).join(',\n')}
  ]
};
`);
}

let cur = base.events.map((e) => ({ ...e }));
let res = validate(build(cur), opts);
let s = score(res);
console.log(id, 'start', s.toFixed(2), res.fail.join(' | '));
for (let r = 0; r < rounds && s > 0; r++) {
  let best = null;
  for (const cand of candidates(cur, res)) {
    const rs = validate(build(cand), opts);
    const sc = score(rs);
    if (!best || sc < best.sc) best = { cand, rs, sc };
    if (sc === 0) break;
  }
  if (!best || best.sc >= s) {
    console.log(id, 'no improving neighbor');
    break;
  }
  cur = best.cand;
  res = best.rs;
  s = best.sc;
  save(cur);
  console.log(id, 'round', r, 'score', s.toFixed(2), res.fail.join(' | '));
}
