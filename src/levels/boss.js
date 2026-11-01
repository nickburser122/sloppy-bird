import { tuning } from '../config/tuning.js';
import { OBSTACLES, createObstacle } from '../entities/obstacles/types.js';
import { Terrain } from './terrain.js';
import { chunks as chunks3 } from './chunks/world3.js';
import { flip } from './chunks/world4.js';

const b = (at) => ({ type: 'button', at });
const m = (at) => ({ type: 'modal', at });
const e = (at) => ({ type: 'errorbar', at });

export const PATTERNS = [
  { name: 'Accept all', obstacles: [b(0), b(420)] },
  { name: 'Manage preferences', obstacles: [m(0), b(520)] },
  { name: 'Legitimate interest', obstacles: [e(0), m(600)] },
  { name: 'Share with 412 partners', obstacles: [b(0), b(400), b(800)] },
  { name: 'Reject all (hidden)', obstacles: [e(0), b(520)] },
  { name: 'Essential cookies', obstacles: [m(0), m(560)] },
  { name: 'Remember my choice', obstacles: [b(0), e(450), m(1100)] },
  { name: 'Cookie settings', obstacles: [m(0), b(600), e(1050)] },
  { name: 'Accept all (again)', obstacles: [b(0), b(400), m(900), e(1450)] }
];

function gate(at, center, gap) {
  const H = tuning.flap.fieldH;
  const out = [];
  if (center - gap / 2 > 0) out.push({ type: 'card', at, h: center - gap / 2 });
  if (center + gap / 2 < H) out.push({ type: 'card', at, h: H - (center + gap / 2), from: 'top' });
  return out;
}
const bub = (at, lift) => [{ type: 'bubble', at, lift }];
const like = (at, lift, phase) => [{ type: 'like', at, lift, phase }];

export const ALGORITHM_PATTERNS = [
  { name: 'Trending now', obstacles: [...gate(0, 180, 210), ...gate(480, 160, 210)] },
  { name: 'Suggested for you', obstacles: [...bub(0, 170), ...gate(520, 200, 200)] },
  { name: 'Because you watched', obstacles: [...like(0, 180, 0), ...like(460, 160, 300)] },
  { name: 'People you may know', obstacles: [...gate(0, 200, 200), ...gate(460, 120, 200), ...gate(920, 230, 200)] },
  { name: 'Sponsored', obstacles: [...bub(0, 230), ...bub(420, 110), ...gate(900, 170, 200)] },
  { name: 'Up next in 3, 2, 1', obstacles: [...like(0, 200, 100), ...gate(500, 160, 200), ...like(1000, 200, 0)] },
  { name: 'Your daily streak', obstacles: [...gate(0, 150, 190), ...bub(480, 230), ...gate(960, 200, 190), ...like(1440, 150, 0)] },
  { name: 'Hot takes', obstacles: [...like(0, 200, 0), ...bub(450, 120), ...like(900, 200, 200), ...gate(1400, 180, 190)] },
  { name: 'Engagement bait', obstacles: [...gate(0, 200, 190), ...gate(440, 130, 190), ...like(900, 200, 0), ...bub(1300, 140), ...gate(1700, 220, 190)] }
];

export const SURF_PATTERNS = [
  { name: 'Revenue dip', ...chunks3.gapOne },
  { name: 'Churn spike', ...chunks3.kpiCrest },
  { name: 'Burn rate', ...chunks3.bubbleValley },
  { name: 'Missed forecast', ...chunks3.kpiPair },
  { name: 'Down round', ...chunks3.gapKpi },
  { name: 'Hockey stick', ...chunks3.tickerKpi },
  { name: 'Layoffs announced', ...chunks3.gapBubble },
  { name: 'Flash crash', ...chunks3.combo },
  { name: 'Market correction', ...chunks3.finale }
];

const fp = (name, parts) => ({ name, obstacles: flip(0, parts).obstacles });

export const FLIP_PATTERNS = [
  fp('NULL pointer', [{ block: [0, 110, 'f'] }, { block: [450, 110, 'c'] }]),
  fp('Buffer overflow', [{ block: [0, 110, 'f'] }, { block: [300, 110, 'f'] }]),
  fp('Stack smash', [{ cursor: [0] }, { block: [450, 110, 'c'] }]),
  fp('Use after free', [{ float: [0, 140] }, { block: [450, 120, 'f'] }]),
  fp('Double free', [{ block: [0, 120, 'f'] }, { block: [400, 120, 'c'] }, { block: [800, 120, 'f'] }]),
  fp('Dangling pointer', [{ err: [0, 'f'] }, { cursor: [450] }]),
  fp('Off-by-one', [{ block: [0, 120, 'c'] }, { cursor: [400] }, { block: [850, 130, 'f'] }]),
  fp('Heap corruption', [{ block: [0, 130, 'f'] }, { float: [450, 140] }, { block: [850, 130, 'c'] }, { block: [1250, 130, 'f'] }]),
  fp('Core dumped', [
    { block: [0, 120, 'f'] },
    { block: [380, 120, 'c'] },
    { cursor: [780] },
    { block: [1150, 120, 'f'] },
    { block: [1550, 120, 'c'] }
  ])
];

export const PAYWALL_PATTERNS = [
  { ...PATTERNS[3], name: 'Subscribe to read', mode: 'run' },
  { ...PATTERNS[6], name: 'Free trial ends', mode: 'run', pickup: { rel: -500, lift: 26, kind: 'shield' } },
  { ...ALGORITHM_PATTERNS[3], name: 'Cancel anytime*', mode: 'flap', orbLift: 180, orbGap: 640 },
  { ...ALGORITHM_PATTERNS[6], name: 'Premium members only', mode: 'flap', orbLift: 180, orbGap: 640, pickup: { rel: -500, lift: 180, kind: 'shield' } },
  { ...SURF_PATTERNS[4], name: 'Metered: 3 of 3', mode: 'surf', orbGap: 350, pickup: { rel: -500, lift: 'ride', kind: 'slowmo' } },
  { ...SURF_PATTERNS[7], name: 'Annual plan -20%', mode: 'surf', orbGap: 350, pickup: { rel: -300, lift: 'ride', kind: 'shield' } },
  { ...FLIP_PATTERNS[4], name: 'Verify you are human', mode: 'flip', pickup: { rel: -500, lift: 22, kind: 'slowmo' } },
  { ...FLIP_PATTERNS[7], name: 'Final notice', mode: 'flip', pickup: { rel: -500, lift: 22, kind: 'shield' } }
];

export function telegraphBoost(mode) {
  return mode === 'surf' ? 1 + tuning.surf.boostMax : 1;
}

export function fieldFor(mode) {
  return mode === 'flip' ? tuning.flip.fieldH : tuning.flap.fieldH;
}

export function appendSurfPattern(terrain, pattern, origin, prevEnd, orbGap) {
  const rest = origin - prevEnd;
  if (rest > 800) terrain.addPoint(prevEnd + rest / 2, 110);
  for (const pt of pattern.terrain) terrain.addPoint(origin + pt[0], pt[1]);
  for (const o of pattern.obstacles) {
    if (o.type === 'nodata') terrain.addGap(origin + o.at, origin + o.at + (o.w || tuning.nodata.w));
  }
  const end = origin + pattern.length;
  const orbX = end + orbGap;
  terrain.addPoint(orbX, 110);
  terrain.addPoint(orbX + 500, 50);
  return { orbX, terrainEnd: orbX + 500 };
}

export function createBossLevel(opts) {
  const o = opts || {};
  const level = {
    id: o.id || 'w1boss',
    name: o.name || 'Cookie Consent Monster',
    mode: o.mode || 'run',
    obstacles: [],
    items: [],
    length: Infinity,
    checkpoint: 0,
    tokenTotal: 0,
    phase: 0,
    terrain: null,
    fieldH: o.mode === 'flip' ? tuning.flip.fieldH : tuning.flap.fieldH
  };
  if (level.mode === 'surf' || o.mixed) {
    level.terrain = new Terrain();
    level.terrain.addPoint(0, 50);
  }
  const mul = o.speedMul || 1;
  level.speedAt = () => tuning.world.speed * mul * tuning.debug.speedScale * (1 + tuning.boss.speedStep * level.phase);
  return level;
}

export function patternSpan(pattern) {
  if (pattern.length) return pattern.length;
  let end = 0;
  for (const o of pattern.obstacles) end = Math.max(end, o.at + tuning[OBSTACLES[o.type].dims].w);
  return end;
}

export class BossDirector {
  constructor(level, rt, getGap, patterns, orbLift, orbGap, restPx, phaseSize) {
    this.level = level;
    this.rt = rt;
    this.getGap = getGap;
    this.patterns = patterns || PATTERNS;
    this.orbLift = orbLift === undefined ? 22 : orbLift;
    this.orbGap = orbGap || tuning.boss.orbGapPx;
    this.restPx = restPx || tuning.boss.restPx;
    this.phaseSize = phaseSize || tuning.boss.phaseSize;
    this.terrainEnd = 0;
    this.hp = this.patterns.length;
    this.total = this.patterns.length;
    this.step = 0;
    this.offered = 0;
    this.hits = 0;
    this.endX = 0;
    this.cur = null;
    this.defeated = false;
    this.onHit = null;
    rt.checkpointed = true;
    this.append();
  }

  runway(mode) {
    const b = tuning.boss;
    return this.getGap() + (this.level.speedAt(0) * telegraphBoost(mode || this.level.mode) * (b.telegraphMs + b.reactMs)) / 1000;
  }

  append() {
    const b = tuning.boss;
    const level = this.level;
    const pattern = this.patterns[this.step];
    const pmode = pattern.mode || level.mode;
    const surf = pmode === 'surf';
    const orbGap = pattern.orbGap || this.orbGap;
    const orbLift = pattern.orbLift !== undefined ? pattern.orbLift : this.orbLift;
    const need = this.runway(pmode);
    let minAt = Infinity;
    for (const o of pattern.obstacles) minAt = Math.min(minAt, o.at);
    const first = Math.max(this.endX + this.restPx, this.rt.distance + need);
    const origin = first - minAt;
    const firstIdx = level.obstacles.length;
    let end = origin;
    for (const o of pattern.obstacles) {
      const ob = createObstacle(o, origin, fieldFor(pmode));
      level.obstacles.push(ob);
      end = Math.max(end, ob.x + ob.w);
    }
    let orb;
    if (surf) {
      const flatStart = Math.max(this.terrainEnd, origin - 1200);
      if (flatStart > this.terrainEnd) level.terrain.addPoint(flatStart, 50);
      const r = appendSurfPattern(level.terrain, pattern, origin, flatStart, orbGap);
      this.terrainEnd = r.terrainEnd;
      if (pattern.pickup) this.addPickup(pattern.pickup, first);
      orb = { x: r.orbX, lift: level.terrain.base(r.orbX) + 22, kind: 'orb', got: false };
    } else {
      if (pattern.pickup) this.addPickup(pattern.pickup, first);
      orb = { x: end + orbGap, lift: orbLift, kind: 'orb', got: false };
    }
    level.items.push(orb);
    level.checkpoint = first - need;
    this.endX = orb.x;
    this.offered++;
    this.cur = { index: this.step, firstIdx, orb, mode: pmode, orbGap, telegraphed: false, done: false };
  }

  addPickup(pk, first) {
    const x = first + pk.rel;
    const lift = pk.lift === 'ride' && this.level.terrain ? this.level.terrain.base(x) + 30 : pk.lift;
    this.level.items.push({ x, lift, kind: 'power', power: pk.kind, got: false });
  }

  forceDefeat() {
    this.hp = 0;
    this.defeated = true;
  }

  update() {
    const cur = this.cur;
    if (!cur || cur.done || this.defeated) return;
    if (cur.orb.got) {
      cur.done = true;
      cur.orb.locked = true;
      this.hits++;
      this.hp--;
      const dead = this.hp <= 0;
      if (this.onHit) this.onHit(dead);
      if (dead) {
        this.defeated = true;
        return;
      }
      this.step++;
      this.level.phase = Math.floor(this.step / this.phaseSize);
      this.append();
    } else if (this.rt.distance > cur.orb.x + cur.orbGap * 0.25) {
      cur.done = true;
      this.append();
    }
  }
}
