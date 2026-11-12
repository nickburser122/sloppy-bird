import { levels, byId } from '../src/levels/index.js';
import { validate } from '../src/levels/validator.js';

const ids = process.argv.slice(2);
const list = ids.length ? ids.map(byId) : levels;
for (const l of list) {
  const t0 = Date.now();
  const r = validate(l);
  const { c, ...rest } = r;
  console.log(l.id, r.ok ? 'PASS' : 'FAIL', `${((Date.now() - t0) / 1000).toFixed(1)}s`);
  const { windows, ...mm } = rest.m; console.log(JSON.stringify(mm)); if (process.env.DETAIL) console.log((windows || []).join("\n"));
  for (const f of rest.fail) console.log('  -', f);
}
