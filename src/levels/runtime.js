import { tuning } from '../config/tuning.js';

const R = tuning.run;
const W = tuning.stage.w;

const OWNER = {};
for (const t of ['pit', 'ceil', 'saw', 'log', 'crumble', 'mover', 'pad', 'ring']) OWNER[t] = 'run';
for (const t of ['gap', 'laser', 'crusher', 'orb', 'force']) OWNER[t] = 'flip';
for (const t of ['thorn', 'mgap', 'spider', 'plant', 'wind']) OWNER[t] = 'flap';
for (const t of ['rock', 'buoy', 'beam', 'shark', 'reef', 'whirl', 'ramp']) OWNER[t] = 'surf';

export const modeOfEvent = (e) => OWNER[e.type] || e.m || 'run';

export function segmentAt(segs, beat) {
  let i = 0;
  for (let k = 0; k < segs.length; k++) if (segs[k].beat <= beat) i = k;
  return i;
}

function compileMix(level) {
  const beatSec = 60 / level.bpm;
  const scale = level.scale || 1;
  const speeds = tuning.mix.speeds;
  const ports = level.events.filter((e) => e.type === 'portal').sort((a, b) => a.beat - b.beat);
  const segs = [{ mode: level.start, beat: 0, tb: 0, speed: speeds[level.start] * scale }];
  for (const p of ports) segs.push({ mode: p.mode, beat: p.beat, tb: p.beat * beatSec, speed: speeds[p.mode] * scale });
  const base = segs[0].speed;
  const speedEvents = segs.slice(1).map((s) => ({ beat: s.beat, type: 'speed', mul: s.speed / base }));
  const subs = {};
  for (const sg of segs) {
    if (subs[sg.mode]) continue;
    const events = level.events.filter((e) => e.type !== 'portal' && modeOfEvent(e) === sg.mode);
    const own = level.shard && segs[segmentAt(segs, level.shard.beat)].mode === sg.mode ? level.shard : undefined;
    subs[sg.mode] = compile({ ...level, mode: sg.mode, speed: base, shard: own, events: [...events, ...speedEvents] });
  }
  const first = subs[segs[0].mode];
  const reactables = Object.values(subs).flatMap((s) => s.reactables).sort((a, b) => a.tb - b.tb);
  const mixPortals = segs.slice(1).map((s) => ({ mode: s.mode, tb: s.tb, ox: first.X(s.tb) }));
  const shard = level.shard ? { ox: first.X(level.shard.beat * beatSec), y: level.shard.y } : null;
  return { id: level.id, level, shard, beatSec, duration: level.beats * beatSec, segs, X: first.X, T: first.T, subs, reactables, mixPortals };
}

export function compile(level) {
  if (level.mode === 'mix') return compileMix(level);
  const beatSec = 60 / level.bpm;
  const ports = level.events.filter((e) => e.type === 'speed').sort((a, b) => a.beat - b.beat);
  const segs = [{ t: 0, x: 0, v: level.speed }];
  for (const p of ports) {
    const t = p.beat * beatSec;
    const s = segs[segs.length - 1];
    segs.push({ t, x: s.x + s.v * (t - s.t), v: level.speed * p.mul });
  }
  const X = (t) => {
    let i = segs.length - 1;
    while (i > 0 && segs[i].t > t) i--;
    const s = segs[i];
    return s.x + s.v * (t - s.t);
  };
  const T = (x) => {
    if (x <= 0) return 0;
    let i = segs.length - 1;
    while (i > 0 && segs[i].x > x) i--;
    const s = segs[i];
    return s.t + (x - s.x) / s.v;
  };
  const c = {
    id: level.id,
    level,
    shard: null,
    beatSec,
    duration: level.beats * beatSec,
    segs,
    X,
    T,
    spikes: [],
    pits: [],
    ceils: [],
    saws: [],
    logs: [],
    plats: [],
    pads: [],
    rings: [],
    portals: [],
    gaps: [],
    lasers: [],
    crushers: [],
    orbs: [],
    forces: [],
    thorns: [],
    spiders: [],
    plants: [],
    winds: [],
    rocks: [],
    buoys: [],
    beams: [],
    sharks: [],
    reefs: [],
    whirls: [],
    ramps: [],
    waves: level.waves || [],
    dark: (level.dark || []).map(([a, b]) => [a * beatSec, b * beatSec]),
    reactables: []
  };
  for (const e of level.events) {
    const tb = e.beat * beatSec;
    const ox = X(tb);
    const vis = T(ox + R.px - W);
    const o = { kind: e.type, ox, tb, vis };
    switch (e.type) {
      case 'spike':
        o.n = e.n || 1;
        o.side = e.side || 0;
        o.w = R.spikeW * o.n;
        c.spikes.push(o);
        break;
      case 'pit':
        o.w = e.w;
        c.pits.push(o);
        break;
      case 'ceil':
        o.w = e.w;
        o.h = e.h;
        c.ceils.push(o);
        break;
      case 'saw':
        o.r = e.r || R.sawR;
        o.cy = R.ground - e.y;
        o.cy2 = R.ground - e.y2;
        o.period = e.period * beatSec;
        c.saws.push(o);
        break;
      case 'log':
        o.w = R.logW;
        o.h = R.logH;
        o.tFall = tb - R.logLead - R.logFall;
        o.tLand = tb - R.logLead;
        o.vis = Math.max(0, Math.min(vis, o.tFall));
        c.logs.push(o);
        break;
      case 'crumble':
      case 'mover':
        o.w = e.w;
        o.top0 = R.ground - e.y;
        o.amp = e.amp || 0;
        o.period = (e.period || 4) * beatSec;
        o.phase = e.phase || 0;
        o.id = c.plats.length;
        c.plats.push(o);
        break;
      case 'pad':
        o.w = R.padW;
        c.pads.push(o);
        break;
      case 'ring':
        o.cy = R.ground - e.y;
        o.id = c.rings.length;
        c.rings.push(o);
        break;
      case 'gap':
        o.side = e.side;
        o.w = e.w;
        c.gaps.push(o);
        break;
      case 'laser':
        o.side = e.side;
        o.w = tuning.flip.laserW;
        c.lasers.push(o);
        break;
      case 'crusher':
        o.side = e.side;
        o.w = e.w;
        o.depth = e.depth || tuning.flip.crushDepth;
        o.period = (e.period || 2) * beatSec;
        c.crushers.push(o);
        break;
      case 'orb':
        o.cy = e.y === undefined ? 270 : e.y;
        o.id = c.orbs.length;
        c.orbs.push(o);
        break;
      case 'force':
        c.forces.push(o);
        break;
      case 'thorn':
      case 'mgap':
        o.w = e.w || 60;
        o.gy = e.gy;
        o.gap = e.gap;
        o.amp = e.amp || 0;
        o.period = (e.period || 4) * beatSec;
        o.phase = e.phase || 0;
        c.thorns.push(o);
        break;
      case 'spider':
        o.len = e.len;
        o.period = 2 * beatSec;
        o.w = 30;
        c.spiders.push(o);
        break;
      case 'plant':
        o.w = e.w || 90;
        o.depth = tuning.flap.plantDepth;
        o.period = 2 * beatSec;
        c.plants.push(o);
        break;
      case 'wind':
        o.w = e.w;
        o.dir = e.dir;
        c.winds.push(o);
        break;
      case 'rock':
        o.w = e.w;
        o.top = e.top;
        o.bot = e.bot;
        c.rocks.push(o);
        break;
      case 'buoy':
        o.w = 30;
        o.chain = e.chain || 90;
        c.buoys.push(o);
        break;
      case 'beam':
        o.w = e.w;
        o.bottom = e.bottom;
        c.beams.push(o);
        break;
      case 'shark':
        o.w = 80;
        o.y0 = e.y;
        o.amp = e.amp || 0;
        o.period = (e.period || 4) * beatSec;
        c.sharks.push(o);
        break;
      case 'reef':
        o.w = e.w || 70;
        o.gy = e.gy;
        o.gap = e.gap;
        c.reefs.push(o);
        break;
      case 'whirl':
        o.w = e.w;
        c.whirls.push(o);
        break;
      case 'ramp':
        o.len = e.len;
        o.h = e.h;
        o.w = e.len + 30;
        c.ramps.push(o);
        break;
      case 'speed':
        o.mul = e.mul;
        c.portals.push(o);
        break;
    }
    o.te = o.w ? T(ox + o.w) : tb;
    if (e.type !== 'pad' && e.type !== 'speed' && e.type !== 'force' && e.type !== 'whirl' && e.type !== 'ramp') c.reactables.push(o);
  }
  c.reactables.sort((a, b) => a.tb - b.tb);
  if (level.shard) c.shard = { ox: X(level.shard.beat * beatSec), y: level.shard.y };
  return c;
}
