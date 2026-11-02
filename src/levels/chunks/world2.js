import { tuning } from '../../config/tuning.js';

function build(length, parts) {
  const H = tuning.flap.fieldH;
  const obstacles = [];
  const items = [];
  for (const p of parts) {
    if (p.gate) {
      const [at, center, gap] = p.gate;
      const lo = center - gap / 2;
      const hi = center + gap / 2;
      if (lo > 0) obstacles.push({ type: 'card', at, h: lo });
      if (hi < H) obstacles.push({ type: 'card', at, h: H - hi, from: 'top' });
      items.push({ at: at - 70, lift: center }, { at: at + 38, lift: center }, { at: at + 146, lift: center });
    } else if (p.bubble) {
      const [at, lift] = p.bubble;
      obstacles.push({ type: 'bubble', at, lift });
      items.push({ at: at - 60, lift: lift + 28 }, { at: at + 116, lift: lift + 28 });
    } else if (p.like) {
      const [at, lift, phase] = p.like;
      obstacles.push({ type: 'like', at, lift, phase });
      items.push({ at: at - 70, lift }, { at: at + 114, lift });
    } else if (p.err) {
      const [at] = p.err;
      obstacles.push({ type: 'errorbar', at });
      items.push({ at: at + 70, lift: 80 }, { at: at + 110, lift: 80 });
    }
  }
  return { length, obstacles, items };
}

export const chunks = {
  infiniteScroll: build(16585, [
    { bubble: [1100, 97] }, { gate: [1502, 125, 190] }, { gate: [1884, 178, 190] }, { gate: [2230, 187, 190] },
    { gate: [2542, 208, 190] }, { bubble: [2825, 248] }, { gate: [3062, 152, 190] }, { gate: [3298, 223, 190] },
    { gate: [3535, 229, 190] }, { bubble: [3772, 228] }, { bubble: [3989, 118] }, { bubble: [4370, 90] },
    { gate: [4589, 227, 190] }, { gate: [4829, 217, 190] }, { gate: [5070, 124, 190] }, { gate: [5311, 224, 190] },
    { gate: [5553, 180, 190] }, { bubble: [5796, 244] }, { gate: [6019, 205, 190] }, { gate: [6263, 242, 190] },
    { bubble: [6508, 212] }, { bubble: [6902, 100] }, { gate: [7129, 228, 190] }, { gate: [7376, 153, 190] },
    { gate: [7623, 190, 190] }, { bubble: [7872, 121] }, { gate: [8101, 213, 190] }, { gate: [8350, 169, 190] },
    { gate: [8601, 216, 190] }, { bubble: [8852, 268] }, { gate: [9083, 230, 190] }, { bubble: [9336, 147] },
    { bubble: [9569, 160] }, { gate: [9802, 197, 190] }, { gate: [10235, 230, 190] }, { bubble: [10490, 106] },
    { bubble: [10727, 95] }, { gate: [10963, 152, 190] }, { gate: [11402, 138, 190] }, { gate: [11661, 199, 190] },
    { bubble: [11920, 214] }, { gate: [12161, 140, 190] }, { gate: [12421, 203, 190] }, { bubble: [12683, 147] },
    { gate: [12925, 240, 190] }, { gate: [13188, 180, 190] }, { gate: [13452, 151, 190] }, { gate: [13716, 175, 190] },
    { gate: [13981, 173, 190] }, { bubble: [14437, 104] }, { gate: [14684, 131, 190] }, { bubble: [14951, 241] },
    { gate: [15200, 159, 190] }, { gate: [15469, 132, 190] }, { gate: [15739, 117, 190] }, { gate: [16009, 165, 190] }
  ]),
  notificationStorm: build(18059, [
    { like: [1100, 218, 0] }, { bubble: [1525, 105] }, { like: [1919, 174, 300] }, { like: [2433, 214, 200] },
    { bubble: [2727, 144] }, { gate: [3002, 218, 170] }, { gate: [3269, 108, 170] }, { gate: [3508, 146, 170] },
    { bubble: [3746, 268] }, { gate: [3965, 232, 170] }, { gate: [4204, 253, 170] }, { gate: [4444, 138, 170] },
    { like: [4684, 233, 200] }, { bubble: [4893, 115] }, { bubble: [5115, 147] }, { bubble: [5337, 91] },
    { gate: [5560, 158, 170] }, { gate: [5803, 131, 170] }, { gate: [6227, 255, 170] }, { gate: [6472, 219, 170] },
    { like: [6718, 121, 0] }, { bubble: [6932, 136] }, { gate: [7159, 215, 170] }, { gate: [7406, 185, 170] },
    { like: [7654, 191, 300] }, { bubble: [7871, 110] }, { bubble: [8100, 118] }, { like: [8330, 129, 0] },
    { like: [8735, 200, 100] }, { gate: [8954, 249, 170] }, { like: [9206, 214, 0] }, { err: [9427] },
    { gate: [9784, 159, 170] }, { gate: [10038, 168, 170] }, { gate: [10485, 220, 170] }, { like: [10741, 124, 200] },
    { gate: [11159, 194, 170] }, { gate: [11416, 205, 170] }, { like: [11675, 144, 100] }, { bubble: [11902, 172] },
    { gate: [12141, 198, 170] }, { gate: [12401, 127, 170] }, { gate: [12662, 201, 170] }, { bubble: [12924, 246] },
    { gate: [13166, 115, 170] }, { gate: [13429, 139, 170] }, { bubble: [13692, 98] }, { bubble: [13936, 141] },
    { like: [14181, 246, 0] }, { like: [14414, 148, 100] }, { gate: [14648, 204, 170] }, { gate: [14915, 141, 170] },
    { like: [15182, 189, 200] }, { gate: [15418, 190, 170] }, { gate: [15687, 161, 170] }, { gate: [15956, 196, 170] },
    { bubble: [16226, 159] }, { gate: [16477, 143, 170] }, { bubble: [16748, 209] }, { gate: [17210, 224, 170] },
    { gate: [17483, 208, 170] }
  ])
};
