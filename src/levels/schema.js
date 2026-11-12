export const sp = (beat, n = 1) => ({ beat, type: 'spike', n });
export const pit = (beat, w) => ({ beat, type: 'pit', w });
export const ceil = (beat, w, h) => ({ beat, type: 'ceil', w, h });
export const saw = (beat, y, y2 = y, period = 4) => ({ beat, type: 'saw', y, y2, period });
export const log = (beat) => ({ beat, type: 'log' });
export const crumble = (beat, w, y) => ({ beat, type: 'crumble', w, y });
export const mover = (beat, w, y, amp, period = 4, phase = 0) => ({ beat, type: 'mover', w, y, amp, period, phase });
export const pad = (beat) => ({ beat, type: 'pad' });
export const ring = (beat, y) => ({ beat, type: 'ring', y });
export const fsp = (beat, side, n = 1) => ({ beat, type: 'spike', side, n });
export const gap = (beat, side, w) => ({ beat, type: 'gap', side, w });
export const laser = (beat, side) => ({ beat, type: 'laser', side });
export const crusher = (beat, side, w, depth = 190, period = 2) => ({ beat, type: 'crusher', side, w, depth, period });
export const orb = (beat, y = 270) => ({ beat, type: 'orb', y });
export const force = (beat) => ({ beat, type: 'force' });
export const thorn = (beat, gy, gap, w = 60) => ({ beat, type: 'thorn', gy, gap, w });
export const mgap = (beat, gy, gap, amp, period = 4, w = 60, phase = 0) => ({ beat, type: 'mgap', gy, gap, amp, period, w, phase });
export const spider = (beat, len) => ({ beat, type: 'spider', len });
export const plant = (beat, w = 90) => ({ beat, type: 'plant', w });
export const wind = (beat, w, dir) => ({ beat, type: 'wind', w, dir });
export const rock = (beat, w, top, bot) => ({ beat, type: 'rock', w, top, bot });
export const buoy = (beat, chain = 90) => ({ beat, type: 'buoy', chain });
export const beam = (beat, w, bottom) => ({ beat, type: 'beam', w, bottom });
export const shark = (beat, y, amp = 0, period = 4) => ({ beat, type: 'shark', y, amp, period });
export const reef = (beat, gy, gap, w = 70) => ({ beat, type: 'reef', gy, gap, w });
export const whirl = (beat, w) => ({ beat, type: 'whirl', w });
export const ramp = (beat, len, h) => ({ beat, type: 'ramp', len, h });
export const portal = (beat, mode) => ({ beat, type: 'portal', mode });
export const speed = (beat, mul) => ({ beat, type: 'speed', mul });

const TYPES = new Set(['spike', 'pit', 'ceil', 'saw', 'log', 'crumble', 'mover', 'pad', 'ring', 'speed', 'gap', 'laser', 'crusher', 'orb', 'force', 'thorn', 'mgap', 'spider', 'plant', 'wind', 'rock', 'buoy', 'beam', 'shark', 'reef', 'whirl', 'ramp', 'portal']);

export function checkLevel(level) {
  const errors = [];
  for (const k of ['id', 'world', 'name', 'mode', 'bpm', 'speed', 'beats', 'events']) {
    if (level[k] === undefined) errors.push(`missing ${k}`);
  }
  for (const e of level.events || []) {
    if (!TYPES.has(e.type)) errors.push(`bad type ${e.type}`);
    if (typeof e.beat !== 'number' || e.beat < 0 || e.beat > level.beats) errors.push(`bad beat ${e.beat}`);
  }
  if (errors.length) throw new Error(`${level.id}: ${errors.join(', ')}`);
  return level;
}
