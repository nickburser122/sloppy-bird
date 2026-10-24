import { tuning } from '../../config/tuning.js';

function build(length, parts, extra) {
  const H = tuning.flap.fieldH;
  const obstacles = [];
  const items = extra ? extra.slice() : [];
  for (const p of parts) {
    if (p.gate) {
      const [at, center, gap] = p.gate;
      const lo = center - gap / 2;
      const hi = center + gap / 2;
      const dd = !!p.d;
      if (lo > 0) obstacles.push({ type: 'card', at, h: lo, destructible: dd });
      if (hi < H) obstacles.push({ type: 'card', at, h: H - hi, from: 'top', destructible: dd });
      items.push({ at: at - 70, lift: center }, { at: at + 38, lift: center }, { at: at + 146, lift: center });
    } else if (p.bubble) {
      const [at, lift] = p.bubble;
      obstacles.push({ type: 'bubble', at, lift, destructible: !!p.d });
      items.push({ at: at - 60, lift: lift + 28 }, { at: at + 116, lift: lift + 28 });
    } else if (p.like) {
      const [at, lift, phase] = p.like;
      obstacles.push({ type: 'like', at, lift, phase, destructible: !!p.d });
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
  runway: build(900, [], [
    { at: 400, lift: 180 },
    { at: 460, lift: 180 },
    { at: 520, lift: 180 }
  ]),
  gatesEasy: build(1900, [{ gate: [500, 190, 210] }, { gate: [980, 170, 210] }, { gate: [1460, 200, 210] }]),
  gatesWide: build(1900, [{ gate: [500, 180, 200] }, { gate: [1000, 230, 200] }, { gate: [1500, 130, 200] }]),
  gatesZig: build(2400, [
    { gate: [500, 120, 190] },
    { gate: [960, 250, 190] },
    { gate: [1420, 130, 190] },
    { gate: [1880, 250, 190] }
  ]),
  bubbleOne: build(1300, [{ bubble: [700, 170] }]),
  bubblePair: build(1500, [{ bubble: [500, 230] }, { bubble: [900, 110] }]),
  bubbleGate: build(2000, [{ gate: [500, 180, 200] }, { bubble: [1050, 110] }, { gate: [1500, 200, 200] }]),
  likeOne: build(1400, [{ like: [700, 180, 0] }]),
  likePair: build(1600, [{ like: [500, 200, 0] }, { like: [950, 160, 300] }]),
  likeGate: build(2000, [{ gate: [500, 170, 200] }, { like: [1000, 200, 100] }, { gate: [1500, 180, 200] }]),
  floorGate: build(1700, [{ err: [500] }, { gate: [1000, 170, 200] }]),
  floorBubble: build(1700, [{ err: [500] }, { bubble: [1050, 170] }]),
  mixA: build(2400, [
    { gate: [500, 200, 200] },
    { like: [980, 150, 0] },
    { bubble: [1400, 220] },
    { gate: [1850, 160, 200] }
  ]),
  mixB: build(2600, [
    { bubble: [500, 120] },
    { gate: [950, 220, 190] },
    { like: [1450, 170, 200] },
    { gate: [1950, 150, 190] }
  ]),
  gauntlet: build(2700, [
    { gate: [500, 200, 190] },
    { gate: [940, 130, 190] },
    { like: [1400, 200, 0] },
    { bubble: [1800, 140] },
    { gate: [2200, 220, 190] }
  ]),
  adBubble: build(1500, [{ bubble: [500, 230], d: true }, { bubble: [900, 110] }]),
  adLike: build(1600, [{ like: [500, 200, 0], d: true }, { like: [950, 160, 300], d: true }]),
  adFast: build(2200, [
    { gate: [500, 180, 180], d: true },
    { gate: [900, 130, 180], d: true },
    { gate: [1300, 230, 180] },
    { gate: [1700, 160, 180] }
  ]),
  fastGates: build(2200, [
    { gate: [500, 180, 180] },
    { gate: [900, 130, 180] },
    { gate: [1300, 230, 180] },
    { gate: [1700, 160, 180] }
  ])
};
