import { createMode } from '../src/modes/index.js';
import { createPlayer } from '../src/entities/player.js';
import { obstacleHits } from '../src/entities/obstacles/types.js';
import { circleAabb } from '../src/engine/collision.js';
import { tuning } from '../src/config/tuning.js';
import { DT } from '../tests/helpers.js';

const FIELDS = {
  run: ['vy', 'grounded', 'coyote', 'jumping'],
  flap: ['vy', 'held', 'heldMs', 'glideLeft', 'gliding'],
  flip: ['vy', 'dir', 'since', 'rot']
};

function plansFor(kind) {
  const out = [{ s0: false, ev: [] }];
  if (kind === 'run') {
    for (let t = 0; t <= 240; t += 20) for (let h = 0; h <= 400; h += 20) out.push({ s0: false, ev: [{ t, e: 'press' }, { t: t + h, e: 'release' }] });
    out.push({ s0: true, ev: [] });
    for (let r = 0; r <= 400; r += 20) out.push({ s0: true, ev: [{ t: r, e: 'release' }] });
    for (let t = 0; t <= 240; t += 40) {
      for (const h of [0, 60, 120, 200, 400]) {
        for (let g = 250; g <= 700; g += 50) {
          for (const h2 of [0, 100, 200, 400]) {
            const a = t + h;
            const b = a + g;
            out.push({ s0: false, ev: [{ t, e: 'press' }, { t: a, e: 'release' }, { t: b, e: 'press' }, { t: b + h2, e: 'release' }] });
          }
        }
      }
    }
    for (let r = 0; r <= 400; r += 40) {
      for (let g = 250; g <= 700; g += 50) {
        for (const h2 of [0, 100, 200, 400]) out.push({ s0: true, ev: [{ t: r, e: 'release' }, { t: r + g, e: 'press' }, { t: r + g + h2, e: 'release' }] });
      }
    }
  } else if (kind === 'flap') {
    for (const per of [150, 170, 190, 210, 240, 280, 340, 420, 600]) {
      for (const off of [0, 40, 80, 120]) {
        const ev = [];
        for (let t = off; t < 1500; t += per) ev.push({ t, e: 'tap' });
        out.push({ s0: false, ev });
      }
    }
    for (const a of [150, 200, 260, 340]) for (const b of [200, 300, 450, 700]) for (const sw of [200, 400, 600, 800]) {
      const ev = [];
      let t = 0;
      while (t < sw) { ev.push({ t, e: 'tap' }); t += a; }
      t = Math.max(t, sw);
      while (t < 1500) { ev.push({ t, e: 'tap' }); t += b; }
      out.push({ s0: false, ev });
    }
    for (const a of [0, 100, 300]) for (const b of [400, 700]) out.push({ s0: false, ev: [{ t: a, e: 'tap' }, { t: a + b, e: 'tap' }] });
    for (let t = 0; t <= 300; t += 60) out.push({ s0: false, ev: [{ t, e: 'tap' }] });
  } else if (kind === 'flip') {
    const g = [];
    for (let t = 0; t <= 700; t += 25) g.push(t);
    for (const a of g) out.push({ s0: false, ev: [{ t: a, e: 'tap' }] });
    for (const a of g) for (const b of g) if (b >= a + 100) out.push({ s0: false, ev: [{ t: a, e: 'tap' }, { t: b, e: 'tap' }] });
  }
  return out;
}

const PLANS = {};
function plans(kind) {
  if (!PLANS[kind]) PLANS[kind] = plansFor(kind);
  return PLANS[kind];
}

export function makeBot(sc, app) {
  const kind0 = () => sc.modeKind;
  let cache = null;
  const state = { plan: null, t0: 0, fired: 0, heldBy: false, since: 0 };
  const box = { x: 0, y: 0, w: 0, h: 0 };
  const circle = { x: 0, y: 0, r: 0 };

  function sim(kind, plan, horizonSteps) {
    if (!cache || cache.kind !== kind || cache.env !== sc.env) {
      const pl = createPlayer();
      cache = { kind, env: sc.env, pl, mode: createMode(kind, pl, sc.env) };
    }
    const { pl, mode } = cache;
    const live = sc.mode;
    const rt = sc.runtime;
    for (const f of FIELDS[kind]) mode[f] = live[f];
    pl.x = sc.player.x; pl.y = sc.player.y; pl.prevY = sc.player.prevY; pl.size = sc.player.size;
    const gy = sc.env.groundY();
    let d = rt.distance;
    const level = sc.level;
    const obs = level.obstacles;
    let lo = 0;
    while (lo < obs.length && obs[lo].x + obs[lo].w < d - 300) lo++;
    const orb = sc.director && sc.director.cur && !sc.director.cur.done ? sc.director.cur.orb : null;
    let ei = 0;
    const down = app.input.down;
    let heldMs = down ? app.input.heldMs : 0;
    let held = down;
    const evs = plan.ev;
    if (held && !plan.s0) { mode.onRelease(); held = false; }
    else if (!held && plan.s0) { mode.onPress(); held = true; heldMs = 0; }
    let orbBest = Infinity;
    let gotOrb = false;
    for (let n = 0; n < horizonSteps; n++) {
      const ms = n * DT * 1000;
      while (ei < evs.length && evs[ei].t <= ms) {
        const ev = evs[ei++];
        if (ev.e === 'press' || ev.e === 'tap') {
          if (kind === 'flip') { mode.onPress(); } else { mode.onPress(); held = true; heldMs = 0; }
          if (ev.e === 'tap') { mode.onRelease(); held = false; }
        } else if (ev.e === 'release') { mode.onRelease(); held = false; }
      }
      if (held) { mode.onHold(heldMs); heldMs += DT * 1000; }
      const mul = mode.speedMul ? mode.speedMul() : 1;
      const step = level.speedAt(d) * mul * DT;
      mode.d = d + step;
      mode.dx = step;
      mode.update(DT);
      d += step;
      const hb = mode.getHitbox();
      const px = pl.x;
      for (let i = lo; i < obs.length; i++) {
        const o = obs[i];
        const sx = px + o.x - d;
        if (sx > px + 200) break;
        if (sx + o.w < px - 10) continue;
        if (obstacleHits(hb, o, sx, gy, d, box, circle)) return { alive: false, n };
      }
      if (orb && !orb.got) {
        circle.x = px + orb.x - d;
        circle.y = gy - orb.lift;
        circle.r = tuning.orb.r;
        if (circleAabb(circle, hb)) gotOrb = true;
        const dx = Math.abs(circle.x - (hb.x + hb.w / 2));
        if (dx < 40) {
          const dy = Math.abs(circle.y - (hb.y + hb.h / 2));
          if (dy < orbBest) orbBest = dy;
        }
      }
    }
    return { alive: true, n: horizonSteps, gotOrb, orbBest };
  }

  function replan() {
    const kind = kind0();
    const H = 170;
    let bestPlan = null;
    let bestScore = -Infinity;
    for (const p of plans(kind)) {
      const r = sim(kind, p, H);
      if (!r.alive) continue;
      let score = 1000 - p.ev.length;
      if (r.gotOrb) score += 5000;
      else if (r.orbBest < Infinity) score += 300 - Math.min(300, r.orbBest);
      if (score > bestScore) { bestScore = score; bestPlan = p; }
    }
    if (!bestPlan) {
      let far = -1;
      for (const p of plans(kind)) {
        const r = sim(kind, p, H);
        if (r.n > far) { far = r.n; bestPlan = p; }
      }
    }
    state.plan = bestPlan;
    state.t0 = 0;
    state.fired = 0;
  }

  let frame = 0;
  let lastKind = null;
  let lastRestart = -1;
  return function act() {
    const kind = kind0();
    const rt = sc.runtime;
    if (rt.state !== 'running') { app.input.setSource('bot', false); state.plan = null; return; }
    if (kind !== lastKind || rt.restartCount !== lastRestart) { state.plan = null; lastKind = kind; lastRestart = rt.restartCount; }
    let replanned = false;
    if (!state.plan || frame % 6 === 0) { replan(); replanned = true; }
    frame++;
    if (replanned) {
      const isDown = app.input.sources.has('bot');
      if (isDown && !state.plan.s0) { app.input.setSource('bot', false); state.t0 = -DT * 1000 * 1.5; }
      else if (!isDown && state.plan.s0) app.input.setSource('bot', true);
    }
    const ms = state.t0;
    const ev = state.plan.ev;
    while (state.fired < ev.length && ev[state.fired].t <= ms) {
      const e = ev[state.fired++];
      if (e.e === 'press') app.input.setSource('bot', true);
      else if (e.e === 'release') app.input.setSource('bot', false);
      else if (e.e === 'tap') {
        app.input.setSource('bot', true);
        app.input.setSource('bot', false);
      }
    }
    state.t0 += DT * 1000;
  };
}
