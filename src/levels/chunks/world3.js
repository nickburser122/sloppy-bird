import { tuning } from '../../config/tuning.js';

export function flip(length, parts) {
  const H = tuning.flip.fieldH;
  const lane = (side) => (side === 'c' ? H - 22 : 22);
  const opposite = (side) => (side === 'c' ? 'f' : 'c');
  const obstacles = [];
  const items = [];
  for (const p of parts || []) {
    if (p.block) {
      const [at, h, side] = p.block;
      obstacles.push(side === 'c' ? { type: 'block', at, h, from: 'top' } : { type: 'block', at, h });
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
  helloWorld: flip(16166, [
    { cursor: [1100] }, { float: [1471, 140] }, { float: [1887, 150] },
    { cursor: [2263] }, { block: [2524, 110, 'c'] }, { block: [2822, 140, 'f'] },
    { block: [3250, 140, 'f'] }, { block: [3500, 100, 'f'] }, { block: [3752, 120, 'c'] },
    { block: [4166, 140, 'c'] }, { block: [4419, 130, 'c'] }, { block: [4673, 120, 'f'] },
    { block: [4927, 110, 'c'] }, { block: [5348, 130, 'c'] }, { block: [5605, 100, 'c'] },
    { block: [6029, 110, 'f'] }, { float: [6288, 130] }, { block: [6736, 120, 'c'] },
    { block: [6997, 120, 'c'] }, { block: [7258, 130, 'f'] }, { block: [7520, 100, 'f'] },
    { cursor: [7782] }, { block: [7978, 130, 'c'] }, { block: [8241, 100, 'c'] },
    { block: [8681, 130, 'f'] }, { cursor: [8947] }, { block: [9145, 100, 'f'] },
    { float: [9413, 140] }, { block: [9701, 130, 'c'] }, { block: [9969, 120, 'f'] },
    { block: [10239, 120, 'f'] }, { cursor: [10690] }, { float: [10893, 150] },
    { block: [11367, 120, 'c'] }, { block: [11641, 140, 'c'] }, { block: [12099, 100, 'f'] },
    { block: [12375, 120, 'c'] }, { cursor: [12651] }, { block: [12860, 130, 'c'] },
    { block: [13138, 130, 'f'] }, { block: [13417, 120, 'f'] }, { float: [13696, 140] },
    { float: [13996, 150] }, { cursor: [14297] }, { block: [14510, 130, 'f'] },
    { cursor: [14793] }, { block: [15008, 130, 'f'] }, { block: [15292, 110, 'c'] },
    { block: [15576, 130, 'c'] }
  ]),
  productionHotfix: flip(17929, [
    { err: [1100, 'c'] }, { block: [1820, 110, 'c'] }, { block: [2392, 120, 'f'] },
    { err: [2740, 'c'] }, { cursor: [3136] }, { block: [3351, 130, 'c'] },
    { cursor: [3615] }, { block: [3810, 120, 'c'] }, { err: [4075, 'c'] },
    { block: [4430, 110, 'c'] }, { block: [4697, 130, 'c'] }, { block: [5140, 120, 'c'] },
    { block: [5409, 120, 'c'] }, { block: [5678, 140, 'f'] }, { block: [6127, 120, 'c'] },
    { cursor: [6398] }, { cursor: [6601] }, { err: [6805, 'c'] },
    { err: [7168, 'c'] }, { block: [7532, 130, 'f'] }, { block: [7807, 130, 'f'] },
    { block: [8082, 120, 'f'] }, { cursor: [8358] }, { err: [8567, 'c'] },
    { float: [8935, 140] }, { float: [9234, 130] }, { cursor: [9533] },
    { err: [9935, 'f'] }, { block: [10307, 130, 'c'] }, { cursor: [10589] },
    { float: [10804, 150] }, { err: [11108, 'c'] }, { block: [11483, 140, 'f'] },
    { err: [11768, 'c'] }, { block: [12342, 100, 'c'] }, { block: [12629, 100, 'f'] },
    { block: [12918, 140, 'f'] }, { cursor: [13208] }, { block: [13430, 130, 'c'] },
    { block: [13721, 130, 'f'] }, { cursor: [14012] }, { err: [14237, 'c'] },
    { block: [14620, 130, 'f'] }, { block: [14914, 110, 'f'] }, { block: [15209, 140, 'c'] },
    { block: [15505, 130, 'f'] }, { err: [15802, 'c'] }, { block: [16397, 130, 'f'] },
    { err: [16696, 'f'] }, { cursor: [17086] }, { float: [17319, 140] }
  ])
};
