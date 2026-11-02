import { tuning } from '../config/tuning.js';
import { OBSTACLES, createObstacle } from '../entities/obstacles/types.js';
import { flip } from './chunks/world3.js';

const b = (at) => ({ type: 'button', at });
const m = (at) => ({ type: 'modal', at });
const e = (at) => ({ type: 'errorbar', at });

function gate(at, center, gap) {
  const H = tuning.flap.fieldH;
  const out = [];
  if (center - gap / 2 > 0) out.push({ type: 'card', at, h: center - gap / 2 });
  if (center + gap / 2 < H) out.push({ type: 'card', at, h: H - (center + gap / 2), from: 'top' });
  return out;
}
const bub = (at, lift) => [{ type: 'bubble', at, lift }];
const like = (at, lift, phase) => [{ type: 'like', at, lift, phase }];
const fp = (parts) => flip(0, parts).obstacles;

export const PAYWALL_PATTERNS = [
  { name: 'Subscribe to read', mode: 'run', orbGap: 480, obstacles: [b(0), b(330), m(690), b(1050)] },
  {
    name: 'Cancel anytime*',
    mode: 'flap',
    orbLift: 180,
    orbGap: 560,
    obstacles: [...gate(0, 180, 190), ...gate(400, 110, 190), ...gate(800, 240, 190), ...gate(1200, 150, 190)]
  },
  {
    name: 'Verify you are human',
    mode: 'flip',
    obstacles: fp([{ block: [0, 120, 'f'] }, { block: [360, 120, 'c'] }, { cursor: [720] }, { block: [1080, 120, 'f'] }])
  },
  { name: 'Final notice', mode: 'run', orbGap: 480, obstacles: [e(0), b(480), m(900), e(1380), b(1800)] },
  {
    name: 'Chargeback',
    mode: 'flip',
    obstacles: fp([
      { block: [0, 120, 'f'] },
      { block: [380, 120, 'c'] },
      { cursor: [780] },
      { block: [1150, 120, 'f'] },
      { block: [1550, 120, 'c'] }
    ])
  }
];

export function fieldFor(mode) {
  return mode === 'flip' ? tuning.flip.fieldH : tuning.flap.fieldH;
}

export function createBossLevel(opts) {
  const o = opts || {};
  const level = {
    id: o.id || 'w4boss',
    name: o.name || 'The Paywall',
    mode: o.mode || 'run',
    obstacles: [],
    items: [],
    length: Infinity,
    switchAt: 0,
    tokenTotal: 0,
    phase: 0,
    fieldH: tuning.flap.fieldH
  };
  const mul = o.speedMul || 1;
  level.speedAt = () => tuning.world.speed * mul * tuning.debug.speedScale * (1 + tuning.boss.speedStep * level.phase);
  return level;
}

export function patternSpan(pattern) {
  let end = 0;
  for (const o of pattern.obstacles) end = Math.max(end, o.at + tuning[OBSTACLES[o.type].dims].w);
  return end;
}

export class BossDirector {
  constructor(level, rt, getGap, patterns, orbLift, orbGap, restPx, phaseSize) {
    this.level = level;
    this.rt = rt;
    this.getGap = getGap;
    this.patterns = patterns || PAYWALL_PATTERNS;
    this.orbLift = orbLift === undefined ? 22 : orbLift;
    this.orbGap = orbGap || tuning.boss.orbGapPx;
    this.restPx = restPx || tuning.boss.restPx;
    this.phaseSize = phaseSize || tuning.boss.phaseSize;
    this.total = this.patterns.length;
    this.onHit = null;
    this.reset();
  }

  reset() {
    this.level.obstacles.length = 0;
    this.level.items.length = 0;
    this.level.phase = 0;
    this.hp = this.total;
    this.step = 0;
    this.offered = 0;
    this.hits = 0;
    this.endX = 0;
    this.cur = null;
    this.defeated = false;
    this.append();
  }

  runway() {
    const b = tuning.boss;
    return this.getGap() + (this.level.speedAt(0) * (b.telegraphMs + b.reactMs)) / 1000;
  }

  append() {
    const level = this.level;
    const pattern = this.patterns[this.step];
    const pmode = pattern.mode || level.mode;
    const orbGap = pattern.orbGap || this.orbGap;
    const orbLift = pattern.orbLift !== undefined ? pattern.orbLift : this.orbLift;
    const need = this.runway();
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
    const orb = { x: end + orbGap, lift: orbLift, kind: 'orb', got: false };
    level.items.push(orb);
    level.switchAt = first - need;
    this.endX = orb.x;
    this.offered++;
    this.cur = { index: this.step, firstIdx, orb, mode: pmode, orbGap, telegraphed: false, done: false };
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
