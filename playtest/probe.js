import { compile } from '../src/levels/runtime.js';
import { search, centered, DT } from './bot.js';

const mk = (events, beats = 10, bpm = 140, speed = 540) => ({ id: 'p', world: 1, name: 'p', mode: 'run', bpm, speed, beats, events });

export function probe(label, events, beats) {
  const c = compile(mk(events, beats));
  const ev = search(c, { width: 160 });
  if (!ev) return console.log(label, 'UNBEATABLE');
  const { pairs, windows } = centered(c, ev);
  console.log(label.padEnd(26), pairs.map((p, k) => `${(p[0] * DT).toFixed(2)}s hold${Math.round((p[1] - p[0]) * DT * 1000)} w${Math.round((windows[k].hi - windows[k].lo + 1) * DT * 1000)}`).join(' | '));
}

const S = (beat, n = 1) => ({ beat, type: 'spike', n });
const P = (beat, w) => ({ beat, type: 'pit', w });
probe('single spike', [S(4)]);
for (const g of [1, 1.25, 1.5, 1.75, 2]) probe(`spike pair gap ${g}`, [S(4), S(4 + g)]);
for (const g of [1, 1.25, 1.5]) probe(`spike trio gap ${g}`, [S(4), S(4 + g), S(4 + 2 * g)]);
for (const w of [160, 200, 240, 280, 320]) probe(`pit ${w}`, [P(4, w)]);
for (const g of [2.5, 3, 3.5]) probe(`pit 260 + spike +${g}`, [P(4, 260), S(4 + g)]);
for (const g of [2.5, 3, 3.5]) probe(`spike + pit 260 +${g}`, [S(4), P(4 + g, 260)]);
probe('spike2', [S(4, 2)]);
probe('spike3', [S(4, 3)]);
