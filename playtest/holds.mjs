import { levels } from '../src/levels/index.js';
import { validate } from '../src/levels/validator.js';
import { runEvents, fromPairs, DT } from './bot.js';

const only = process.argv.slice(2);
for (const l of levels) {
  if (only.length && !only.includes(l.id)) continue;
  const r = validate(l, { variants: [{ width: 160 }] });
  if (!r.pairs) { console.log(l.id, 'no path'); continue; }
  const c = r.c;
  const info = r.pairs.map((p, k) => {
    const base = Math.max(1, p[1] - p[0]);
    const ok = (h) => {
      const pr = r.pairs.map((q) => q.slice());
      pr[k][1] = pr[k][0] + h;
      return runEvents(c, fromPairs(pr)).won;
    };
    if (!ok(base)) return { w: 0, lo: base, hi: base };
    let lo = base;
    while (lo > 1 && ok(lo - 1)) lo--;
    let hi = base;
    while (hi < base + 80 && ok(hi + 1)) hi++;
    return { w: (hi - lo + 1) * DT * 1000, lo: lo * DT * 1000, hi: hi * DT * 1000 };
  });
  const widths = info.map((x) => x.w);
  const tight = info.filter((x) => x.w < 50 && x.hi < 100);
  const sorted = widths.slice().sort((a, b) => a - b);
  console.log(l.id.padEnd(8), 'inputs', widths.length, 'min hold window', Math.round(sorted[0]), 'ms', '| under 40ms:', widths.filter((w) => w < 40).length, '| under 60ms:', widths.filter((w) => w < 60).length, '| human-unreachable (<50ms wide):', tight.length);
}
