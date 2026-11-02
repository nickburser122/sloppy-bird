import { tuning } from '../../config/tuning.js';

const ARC = {
  button: { n: 3, gap: 26, base: 40, peak: 22 },
  modal: { n: 3, gap: 28, base: 112, peak: 30 },
  errorbar: { n: 5, gap: 38, base: 44, peak: 26 },
  float: { n: 3, gap: 34, base: 22, peak: 0 }
};

function arc(center, spec) {
  const out = [];
  const mid = (spec.n - 1) / 2;
  for (let i = 0; i < spec.n; i++) {
    const t = mid === 0 ? 0 : (i - mid) / mid;
    out.push({ at: center + (i - mid) * spec.gap, lift: spec.base + spec.peak * (1 - t * t) });
  }
  return out;
}

function make(length, obstacles) {
  const items = [];
  for (const o of obstacles) {
    const w = tuning[o.type].w;
    for (const t of arc(o.at + w / 2, ARC[o.type])) items.push(t);
  }
  return { length, obstacles, items };
}

const b = (at) => ({ type: 'button', at });
const m = (at) => ({ type: 'modal', at });
const e = (at) => ({ type: 'errorbar', at });
const hd = (at) => ({ type: 'float', at, lift: 60 });

export const chunks = {
  aboveTheFold: make(17350, [
    m(1100), e(1515), m(1981), e(2298), b(2676), e(2890),
    b(3200), e(3521), b(3813), b(3970), b(4126), e(4452),
    m(4770), b(5127), m(5286), e(5485), m(5954), m(6231),
    m(6567), e(6785), e(7083), b(7381), e(7544), b(7843),
    m(8007), b(8379), e(8543), b(8845), b(9010), m(9208),
    b(9402), b(9569), b(9736), b(10087), e(10255), m(10632),
    e(10840), m(11334), m(11616), e(12005), m(12336), b(12536),
    b(12708), b(12881), e(13054), e(13364), e(13674), m(14088),
    e(14320), m(14655), b(14860), m(15132), e(15365), e(15678),
    e(15993), m(16447), e(16670)
  ]),
  stickyHeader: make(18700, [
    e(1100), e(1650), e(2139), e(2749), e(3113), e(3436),
    hd(3736), hd(3966), b(4197), m(4362), m(4640), b(4834),
    e(5000), hd(5303), hd(5536), e(5770), b(6074), hd(6243),
    b(6478), m(6647), e(6857), b(7163), hd(7334), b(7762),
    hd(7933), e(8171), e(8480), b(8789), b(8963), e(9137),
    m(9471), m(9870), hd(10074), hd(10316), e(10559), hd(10872),
    b(11115), e(11293), m(11639), hd(11862), e(12107), hd(12423),
    m(12694), e(13107), hd(13425), m(13697), b(13908), e(14091),
    b(14410), e(14594), hd(14914), e(15165), e(15699), hd(16021),
    hd(16274), b(16528), e(16715), m(17063), m(17412), hd(17847),
    m(18128)
  ])
};
