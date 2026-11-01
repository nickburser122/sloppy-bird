import { tuning } from '../config/tuning.js';
import { createMode } from '../modes/index.js';
import { createPlayer } from '../entities/player.js';
import { obstacleHits } from '../entities/obstacles/types.js';

const NEVER = 1e9;

function makeSim(level) {
  const v = tuning.validator;
  const player = createPlayer();
  const env = {
    width: () => v.refWidth,
    groundY: () => v.refGround,
    terrain: (d) => (level.terrain ? level.terrain.height(d) : 0)
  };
  const mode = createMode(level.mode || 'run', player, env);
  return {
    player,
    env,
    mode,
    box: { x: 0, y: 0, w: 0, h: 0 },
    circle: { x: 0, y: 0, r: 0 },
    probe: { x: 0, y: 0, w: 0, h: 0 }
  };
}

function collides(sim, level, d, from, to, margin) {
  const hb = sim.mode.getHitbox();
  let box = hb;
  if (margin) {
    box = sim.probe;
    box.x = hb.x - margin;
    box.y = hb.y - margin;
    box.w = hb.w + margin * 2;
    box.h = hb.h + margin * 2;
  }
  const px = sim.player.x;
  const obs = level.obstacles;
  const limit = Math.min(obs.length, to);
  for (let i = from; i < limit; i++) {
    const o = obs[i];
    const sx = px + o.x - d;
    if (sx > px + sim.player.size * 2) {
      if (!margin) break;
      continue;
    }
    if (sx + o.w < px - 10) continue;
    if (obstacleHits(box, o, sx, sim.env.groundY(), d, sim.box, sim.circle)) return true;
  }
  return false;
}

function stepMode(sim, level, d, dt) {
  const mul = sim.mode.speedMul ? sim.mode.speedMul() : 1;
  const step = level.speedAt(d) * mul * dt;
  sim.mode.d = d + step;
  sim.mode.dx = step;
  sim.mode.update(dt);
  return d + step;
}

function run(sim, level, d0, from, pressAt, holdMs) {
  sim.mode.reset();
  const dt = 1 / tuning.sim.hz;
  const limit = Math.ceil(10 / dt);
  let d = d0;
  let t = 0;
  let pressedAt = -1;
  let released = false;
  for (let n = 0; n < limit; n++) {
    if (pressedAt < 0 && d >= pressAt) {
      sim.mode.onPress();
      pressedAt = t;
    }
    if (pressedAt >= 0 && !released && (t - pressedAt) * 1000 >= holdMs) {
      sim.mode.onRelease();
      released = true;
    }
    d = stepMode(sim, level, d, dt);
    t += dt;
    if (collides(sim, level, d, from, Infinity, 0)) return -1;
    if (pressedAt >= 0 && sim.mode.grounded) return d;
    if (d >= level.length) return d;
  }
  return -1;
}

function advance(level, i, d) {
  const obs = level.obstacles;
  while (i < obs.length && obs[i].x + obs[i].w <= d) i++;
  return i;
}

function robust(ctx, d, i, pressAt, hold) {
  const half = (ctx.level.speedAt(d) * tuning.validator.minWindowMs) / 2000;
  const early = Math.max(d, pressAt - half);
  if (run(ctx.sim, ctx.level, d, i, early, hold) < 0) return false;
  return run(ctx.sim, ctx.level, d, i, pressAt + half, hold) >= 0;
}

function solve(ctx, from, d) {
  const i = advance(ctx.level, from, d);
  if (i >= ctx.level.obstacles.length) return true;
  if (i > ctx.deepest) ctx.deepest = i;
  const key = i + ':' + Math.round(d / 4);
  if (ctx.failed.has(key)) return false;
  const v = tuning.validator;
  const contact = ctx.level.obstacles[i].x - ctx.size;
  for (let h = 0; h < ctx.holds.length; h++) {
    const hold = ctx.holds[h];
    for (let lead = ctx.maxLead; lead >= 0; lead -= v.leadStepPx) {
      const pressAt = contact - lead;
      if (pressAt < d) continue;
      if (ctx.sims++ > v.maxSims) {
        ctx.exhausted = true;
        return false;
      }
      const land = run(ctx.sim, ctx.level, d, i, pressAt, hold);
      if (land < 0) continue;
      if (!robust(ctx, d, i, pressAt, hold)) continue;
      if (solve(ctx, i, land)) return true;
      if (ctx.exhausted) return false;
    }
  }
  ctx.failed.add(key);
  return false;
}

function makeContext(level) {
  const sim = makeSim(level);
  const probe = { obstacles: [], length: Infinity, speedAt: level.speedAt, mode: 'run' };
  const airDistance = run(sim, probe, 0, 0, 0, NEVER);
  const apexMs = (tuning.run.jumpVelocity / tuning.run.gravity) * 1000;
  const holds = [];
  for (let h = 0; h <= apexMs; h += tuning.validator.holdStepMs) holds.push(h);
  holds.push(NEVER);
  return {
    level,
    sim,
    size: tuning.run.size,
    maxLead: Math.ceil(airDistance),
    holds,
    failed: new Set(),
    sims: 0,
    deepest: 0,
    exhausted: false
  };
}

function flapKey(s) {
  const t = tuning.flap;
  return (
    Math.round(s.y / 6) +
    '|' +
    Math.round(s.vy / 60) +
    '|' +
    (s.held ? 1 : 0) +
    '|' +
    Math.min(3, Math.floor(s.heldMs / Math.max(1, t.glideDelayMs / 2))) +
    '|' +
    Math.round(s.glideLeft / 150) +
    '|' +
    Math.min(3, Math.floor(s.tap / Math.max(1, tuning.validator.flapMinTapMs / 2)))
  );
}

function flapReach(level) {
  const v = tuning.validator;
  const t = tuning.flap;
  const obs = level.obstacles;
  const sim = makeSim(level);
  const mode = sim.mode;
  const dt = 1 / tuning.sim.hz;
  const floorY = sim.env.groundY() - t.size;
  const ceilY = sim.env.groundY() - t.fieldH;
  const clusters = [];
  let i = 0;
  while (i < obs.length) {
    let j = i;
    let end = obs[i].x + obs[i].w;
    while (j + 1 < obs.length && obs[j + 1].x - end < (level.speedAt(end) * v.flapSettleMs) / 1000) {
      j++;
      end = Math.max(end, obs[j].x + obs[j].w);
    }
    clusters.push({ a: i, b: j + 1, end });
    i = j + 1;
  }
  let sims = 0;
  for (let c = 0; c < clusters.length; c++) {
    const cl = clusters[c];
    const first = obs[cl.a];
    const d0 = Math.max(0, first.x - t.size - (level.speedAt(first.x) * v.flapLeadMs) / 1000);
    const dEnd = cl.end + t.size + 40;
    let layer = [];
    for (let y = ceilY; y <= floorY; y += v.flapSeedStep) {
      layer.push({ y, vy: 0, held: false, heldMs: 0, glideLeft: t.glideMs, tap: NEVER });
    }
    let d = d0;
    while (d < dEnd && layer.length > 0) {
      const next = [];
      const seen = new Set();
      let dNext = d;
      for (let n = 0; n < layer.length; n++) {
        for (let act = 0; act < 3; act++) {
          const from = layer[n];
          const presses = act === 1 || (act === 2 && !from.held);
          if (presses && from.tap < v.flapMinTapMs) continue;
          sims++;
          mode.loadState(from);
          let tap = from.tap;
          if (act === 0) {
            if (mode.held) mode.onRelease();
          } else if (act === 1) {
            mode.onPress();
            mode.onRelease();
            tap = 0;
          } else if (!mode.held) {
            mode.onPress();
            tap = 0;
          }
          let d2 = d;
          let ok = true;
          for (let k = 0; k < v.flapSteps; k++) {
            if (mode.held) mode.onHold(mode.heldMs);
            d2 = stepMode(sim, level, d2, dt);
            tap += dt * 1000;
            if (mode.held) mode.heldMs += dt * 1000;
            if (collides(sim, level, d2, cl.a, cl.b, v.flapMargin)) {
              ok = false;
              break;
            }
          }
          dNext = d2;
          if (!ok) continue;
          const st = mode.saveState({});
          st.tap = tap;
          const key = flapKey(st);
          if (seen.has(key)) continue;
          seen.add(key);
          next.push(st);
        }
      }
      if (next.length > v.flapBeam) {
        next.sort((p, q) => p.y - q.y);
        const keep = [];
        const stride = next.length / v.flapBeam;
        for (let k = 0; k < v.flapBeam; k++) keep.push(next[Math.floor(k * stride)]);
        layer = keep;
      } else {
        layer = next;
      }
      d = dNext;
    }
    if (layer.length === 0) return { ok: false, deepest: cl.a, exhausted: false, sims, airDistance: 0 };
  }
  return { ok: true, deepest: obs.length - 1, exhausted: false, sims, airDistance: 0 };
}

function flipKey(s) {
  return Math.round(s.y / 6) + '|' + Math.round(s.vy / 100) + '|' + s.dir + '|' + Math.min(3, Math.floor(s.since / 60));
}

function flipReach(level) {
  const v = tuning.validator;
  const t = tuning.flip;
  const obs = level.obstacles;
  const sim = makeSim(level);
  const mode = sim.mode;
  const dt = 1 / tuning.sim.hz;
  const floorY = sim.env.groundY() - t.size;
  const ceilY = sim.env.groundY() - t.fieldH;
  const clusters = clusterize(level, v.flipSettleMs);
  let sims = 0;
  for (let c = 0; c < clusters.length; c++) {
    const cl = clusters[c];
    const first = obs[cl.a];
    const d0 = Math.max(0, first.x - t.size - (level.speedAt(first.x) * v.flipLeadMs) / 1000);
    const dEnd = cl.end + t.size + 40;
    let layer = [
      { y: floorY, vy: 0, dir: 1, since: 1e9 },
      { y: ceilY, vy: 0, dir: -1, since: 1e9 }
    ];
    let d = d0;
    while (d < dEnd && layer.length > 0) {
      const next = [];
      const seen = new Set();
      let dNext = d;
      for (let n = 0; n < layer.length; n++) {
        const from = layer[n];
        for (let act = 0; act < 2; act++) {
          if (act === 1 && from.since < v.flipMinFlipMs) continue;
          sims++;
          mode.loadState(from);
          if (act === 1 && !mode.onPress()) continue;
          let d2 = d;
          let ok = true;
          for (let k = 0; k < v.flipSteps; k++) {
            d2 = stepMode(sim, level, d2, dt);
            if (collides(sim, level, d2, cl.a, cl.b, v.flipMargin)) {
              ok = false;
              break;
            }
          }
          dNext = d2;
          if (!ok) continue;
          const st = mode.saveState({});
          const key = flipKey(st);
          if (seen.has(key)) continue;
          seen.add(key);
          next.push(st);
        }
      }
      if (next.length > v.flipBeam) {
        next.sort((p, q) => p.y - q.y);
        const keep = [];
        const stride = next.length / v.flipBeam;
        for (let k = 0; k < v.flipBeam; k++) keep.push(next[Math.floor(k * stride)]);
        layer = keep;
      } else {
        layer = next;
      }
      d = dNext;
    }
    if (layer.length === 0) return { ok: false, deepest: cl.a, exhausted: false, sims, airDistance: 0 };
  }
  return { ok: true, deepest: obs.length - 1, exhausted: false, sims, airDistance: 0 };
}

function surfKey(s) {
  const v = tuning.validator;
  return (
    Math.round(s.d / 10) +
    '|' +
    Math.round(s.lift / 6) +
    '|' +
    Math.round(s.vUp / 80) +
    '|' +
    (s.riding ? 1 : 0) +
    '|' +
    Math.round(s.boost * 40) +
    '|' +
    (s.held ? 1 : 0) +
    '|' +
    Math.min(3, Math.floor(s.tog / Math.max(1, v.surfMinToggleMs / 2)))
  );
}

function clusterize(level, settleMs) {
  const obs = level.obstacles;
  const clusters = [];
  let i = 0;
  while (i < obs.length) {
    let j = i;
    let end = obs[i].x + obs[i].w;
    while (j + 1 < obs.length && obs[j + 1].x - end < (level.speedAt(end) * settleMs) / 1000) {
      j++;
      end = Math.max(end, obs[j].x + obs[j].w);
    }
    clusters.push({ a: i, b: j + 1, end });
    i = j + 1;
  }
  return clusters;
}

function surfReach(level) {
  const v = tuning.validator;
  const t = tuning.surf;
  const obs = level.obstacles;
  const sim = makeSim(level);
  const mode = sim.mode;
  const dt = 1 / tuning.sim.hz;
  const clusters = clusterize(level, v.surfSettleMs);
  let sims = 0;
  for (let c = 0; c < clusters.length; c++) {
    const cl = clusters[c];
    const first = obs[cl.a];
    const d0 = Math.max(0, first.x - t.size - (level.speedAt(first.x) * v.surfLeadMs) / 1000);
    const dEnd = cl.end + t.size + 40;
    let layer = [];
    for (const b of [0]) {
      mode.d = d0;
      mode.dx = 0;
      mode.reset();
      const st = mode.saveState({});
      st.boost = b;
      st.d = d0;
      st.dx = level.speedAt(d0) * dt;
      st.tog = 1e9;
      layer.push(st);
    }
    let reached = false;
    while (layer.length > 0 && !reached) {
      const next = [];
      const seen = new Set();
      for (let n = 0; n < layer.length && !reached; n++) {
        const from = layer[n];
        for (let act = 0; act < 2; act++) {
          const wantHeld = act === 1;
          const toggles = wantHeld !== from.held;
          if (toggles && from.tog < v.surfMinToggleMs) continue;
          sims++;
          mode.loadState(from);
          mode.dx = from.dx;
          mode.d = from.d;
          let tog = from.tog;
          if (toggles) {
            if (wantHeld) mode.onPress();
            else mode.onRelease();
            tog = 0;
          }
          let d2 = from.d;
          let ok = true;
          for (let k = 0; k < v.surfSteps; k++) {
            d2 = stepMode(sim, level, d2, dt);
            tog += dt * 1000;
            if (collides(sim, level, d2, cl.a, cl.b, v.surfMargin)) {
              ok = false;
              break;
            }
            if (d2 >= dEnd) break;
          }
          if (!ok) continue;
          if (d2 >= dEnd) {
            reached = true;
            break;
          }
          const st = mode.saveState({});
          st.d = d2;
          st.dx = mode.dx;
          st.tog = tog;
          const key = surfKey(st);
          if (seen.has(key)) continue;
          seen.add(key);
          next.push(st);
        }
      }
      if (reached) break;
      if (next.length > v.surfBeam) {
        next.sort((p, q) => p.d - q.d || p.lift - q.lift);
        const keep = [];
        const stride = next.length / v.surfBeam;
        for (let k = 0; k < v.surfBeam; k++) keep.push(next[Math.floor(k * stride)]);
        layer = keep;
      } else {
        layer = next;
      }
    }
    if (!reached) return { ok: false, deepest: cl.a, exhausted: false, sims, airDistance: 0 };
  }
  return { ok: true, deepest: obs.length - 1, exhausted: false, sims, airDistance: 0 };
}

export function validateReachability(level) {
  if (level.mode === 'surf') return surfReach(level);
  if (level.mode === 'flip') return flipReach(level);
  if (level.mode === 'flap') return flapReach(level);
  const ctx = makeContext(level);
  const ok = solve(ctx, 0, 0);
  return { ok, deepest: ctx.deepest, exhausted: ctx.exhausted, sims: ctx.sims, airDistance: ctx.maxLead };
}

function label(level, i) {
  const o = level.obstacles[i];
  return o ? o.type + ' #' + i + ' at x=' + Math.round(o.x) : 'obstacle #' + i;
}

export function validateLevel(level) {
  const v = tuning.validator;
  const errors = [];
  let seconds = 0;
  for (let d = 0; d < level.length; d += 10) seconds += 10 / level.speedAt(d);
  if (seconds < v.minSeconds || seconds > v.maxSeconds) {
    errors.push('duration ' + seconds.toFixed(1) + 's outside ' + v.minSeconds + '-' + v.maxSeconds + 's');
  }
  const ratio = level.checkpoint / level.length;
  if (level.checkpoint <= 0 || ratio < v.cpMin || ratio > v.cpMax) {
    errors.push('checkpoint at ' + (ratio * 100).toFixed(0) + '% is not near the midpoint');
  }
  const size = tuning[level.mode === 'run' || !level.mode ? 'run' : level.mode].size;
  const reactOk = (from) => {
    const first = level.obstacles.find((o) => o.x - size >= from);
    if (!first) return true;
    return ((first.x - size - from) / level.speedAt(from)) * 1000 >= v.minReactMs;
  };
  if (!reactOk(0)) errors.push('first obstacle leaves under ' + v.minReactMs + ' ms to react after the start');
  if (!reactOk(level.checkpoint)) errors.push('first obstacle after the checkpoint leaves under ' + v.minReactMs + ' ms to react');

  let sims = 0;
  if (level.mode && level.mode !== 'run') {
    const r = validateReachability(level);
    sims = r.sims;
    if (!r.ok) errors.push('unreachable near ' + label(level, r.deepest));
  } else {
    for (const start of [0, level.checkpoint]) {
      const ctx = makeContext(level);
      const ok = solve(ctx, 0, start);
      sims += ctx.sims;
      if (!ok) {
        errors.push(
          (ctx.exhausted ? 'search budget exceeded' : 'unreachable') +
            ' near ' +
            label(level, ctx.deepest) +
            (start > 0 ? ' (from checkpoint)' : '')
        );
      }
    }
  }
  return { ok: errors.length === 0, errors, seconds, sims };
}
