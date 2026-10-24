import { tuning } from '../../config/tuning.js';

export function flip(length, parts, extra) {
  const H = tuning.flip.fieldH;
  const lane = (side) => (side === 'c' ? H - 22 : 22);
  const opposite = (side) => (side === 'c' ? 'f' : 'c');
  const obstacles = [];
  const items = extra ? extra.slice() : [];
  for (const p of parts || []) {
    if (p.block) {
      const [at, h, side] = p.block;
      const dd = !!p.d;
      obstacles.push(side === 'c' ? { type: 'block', at, h, from: 'top', destructible: dd } : { type: 'block', at, h, destructible: dd });
      const l = lane(opposite(side));
      items.push({ at: at - 30, lift: l }, { at: at + 45, lift: l }, { at: at + 120, lift: l });
    } else if (p.float) {
      const [at, lift] = p.float;
      obstacles.push({ type: 'float', at, lift });
      items.push({ at: at + 55, lift: lane('f') }, { at: at + 55, lift: lane('c') });
    } else if (p.cursor) {
      const [at] = p.cursor;
      obstacles.push({ type: 'cursor', at });
      items.push({ at: at - 40, lift: lane('f') }, { at: at + 60, lift: lane('c') });
    } else if (p.err) {
      const [at, side] = p.err;
      obstacles.push(side === 'c' ? { type: 'errorbar', at, from: 'top' } : { type: 'errorbar', at });
      const l = lane(opposite(side));
      items.push({ at: at + 40, lift: l }, { at: at + 140, lift: l });
    }
  }
  return { length, obstacles, items };
}

export const chunks = {
  runway: flip(900, [], [
    { at: 400, lift: 22 },
    { at: 460, lift: 22 },
    { at: 520, lift: 22 }
  ]),
  blocksEasy: flip(1800, [{ block: [500, 100, 'f'] }, { block: [1000, 100, 'c'] }, { block: [1450, 100, 'f'] }]),
  blocksTall: flip(2000, [{ block: [500, 150, 'f'] }, { block: [1050, 150, 'c'] }, { block: [1600, 150, 'f'] }]),
  pairSame: flip(1500, [{ block: [500, 110, 'f'] }, { block: [800, 110, 'f'] }]),
  zigzag: flip(2400, [
    { block: [500, 120, 'f'] },
    { block: [900, 120, 'c'] },
    { block: [1300, 120, 'f'] },
    { block: [1700, 120, 'c'] },
    { block: [2100, 120, 'f'] }
  ]),
  floatOne: flip(1500, [{ float: [700, 140] }]),
  floatBlock: flip(1900, [{ block: [500, 110, 'f'] }, { float: [1000, 150] }, { block: [1500, 110, 'c'] }]),
  cursorOne: flip(1500, [{ cursor: [700] }]),
  cursorBlocks: flip(2200, [{ block: [500, 100, 'f'] }, { cursor: [1000] }, { block: [1500, 100, 'c'] }]),
  errFloor: flip(1700, [{ err: [500, 'f'] }, { block: [1100, 100, 'c'] }]),
  errCeil: flip(1700, [{ err: [500, 'c'] }, { block: [1100, 110, 'f'] }]),
  mixA: flip(2600, [
    { cursor: [500] },
    { block: [1000, 120, 'f'] },
    { float: [1400, 130] },
    { block: [1800, 120, 'c'] }
  ]),
  mixB: flip(2800, [
    { err: [500, 'f'] },
    { cursor: [900] },
    { block: [1300, 130, 'c'] },
    { block: [1700, 130, 'f'] },
    { float: [2100, 150] }
  ]),
  gauntlet: flip(3000, [
    { block: [500, 120, 'f'] },
    { block: [860, 120, 'c'] },
    { block: [1220, 120, 'f'] },
    { cursor: [1580] },
    { block: [1900, 120, 'c'] },
    { block: [2300, 130, 'f'] }
  ]),
  adBlocksTall: flip(2000, [
    { block: [500, 150, 'f'], d: true },
    { block: [1050, 150, 'c'], d: true },
    { block: [1600, 150, 'f'], d: true }
  ]),
  adCursorBlocks: flip(2200, [{ block: [500, 100, 'f'], d: true }, { cursor: [1000] }, { block: [1500, 100, 'c'], d: true }]),
  adMixB: flip(2800, [
    { err: [500, 'f'] },
    { cursor: [900] },
    { block: [1300, 130, 'c'], d: true },
    { block: [1700, 130, 'f'], d: true },
    { float: [2100, 150] }
  ]),
  fast: flip(2200, [
    { block: [500, 110, 'f'] },
    { block: [850, 110, 'c'] },
    { block: [1200, 110, 'f'] },
    { block: [1550, 110, 'c'] }
  ])
};
