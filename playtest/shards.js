import { readFileSync, writeFileSync } from 'node:fs';
import { levels, byId } from '../src/levels/index.js';
import { compile } from '../src/levels/runtime.js';
import { createSim } from '../src/modes/sims.js';
import { modes } from '../src/modes/index.js';
import { Input } from '../src/engine/input.js';
import { search, runEvents, stepOnce, DT } from './bot.js';

const BOUNDS = { run: [230, 400], flip: [135, 405], flap: [60, 460], surf: [70, 460] };

function trace(c, events) {
  const sim = createSim(c);
  const inp = new Input();
  const sorted = events.slice().sort((a, b) => a[0] - b[0] || (a[1] ? 1 : -1));
  let idx = 0;
  let want = false;
  const ys = [];
  const modeAt = [];
  const total = Math.ceil(c.duration / DT) + 2;
  for (let i = 0; i < total && !sim.dead && !sim.won; i++) {
    while (idx < sorted.length && sorted[idx][0] <= sim.tick) want = sorted[idx++][1];
    stepOnce(sim, inp, want);
    const m = sim.modeName || c.level.mode;
    modeAt.push(m);
    ys.push(modes[m].center(sim.sub || sim).y);
  }
  return { ys, modeAt };
}

const id = process.argv[2];
const level = byId(id);
const base = { ...level, shard: undefined };
const c0 = compile(base);
const safe = search(c0, { width: 160 });
if (!safe) {
  console.log(id, 'no safe path');
  process.exit(1);
}
const { ys, modeAt } = trace(c0, safe);
let placed = null;
const tries = [];
const fs = process.env.EXTRA ? [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.88] : [0.35, 0.55, 0.75, 0.9, 0.45, 0.65];
const dys = process.env.EXTRA ? [-60, 60, -140, 140, -170, 170] : [-110, 110, -80, 80];
for (const f of fs) for (const dy of dys) tries.push([f, dy]);
for (const [f, dy] of tries) {
  const tick = Math.floor(f * ys.length);
  const m = modeAt[tick];
  const [lo, hi] = BOUNDS[m];
  const y = Math.round(Math.min(hi, Math.max(lo, ys[tick] + dy)));
  if (Math.abs(y - ys[tick]) < 55) continue;
  const beat = Math.round(((tick * DT) / c0.beatSec) * 4) / 4;
  const lv = { ...level, shard: { beat, y } };
  const c = compile(lv);
  if (runEvents(c, safe).got) continue;
  const ev = search(c, { width: 200, needShard: true });
  if (!ev) continue;
  const r = runEvents(c, ev);
  if (r.won && r.got) {
    placed = { beat, y };
    break;
  }
}
if (!placed) {
  console.log(id, 'no feasible shard');
  process.exit(2);
}
const path = `src/levels/data/${id}.js`;
let text = readFileSync(path, 'utf8').replace(/  shard: \{[^}]*\},\n/, '');
text = text.replace('  events: [', `  shard: { beat: ${placed.beat}, y: ${placed.y} },\n  events: [`);
writeFileSync(path, text);
console.log(id, 'shard', JSON.stringify(placed));
