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

function make(length, obstacles, extra) {
  const items = extra ? extra.slice() : [];
  for (const o of obstacles) {
    const w = tuning[o.type].w;
    for (const t of arc(o.at + w / 2, ARC[o.type])) items.push(t);
    items.push({ at: o.at - 300, lift: 24 }, { at: o.at - 360, lift: 24 });
  }
  return { length, obstacles, items };
}

const b = (at) => ({ type: 'button', at });
const m = (at) => ({ type: 'modal', at });
const e = (at) => ({ type: 'errorbar', at });
const bd = (at) => ({ type: 'button', at, destructible: true });
const md = (at) => ({ type: 'modal', at, destructible: true });
const hd = (at) => ({ type: 'float', at, lift: 60 });

export const chunks = {
  runway: make(900, [], [
    { at: 400, lift: 24 },
    { at: 460, lift: 24 },
    { at: 520, lift: 24 }
  ]),
  soloButton: make(1200, [b(700)]),
  doubleButton: make(1500, [b(600), b(1000)]),
  tripleButton: make(1700, [b(500), b(900), b(1300)]),
  soloModal: make(1300, [m(700)]),
  soloError: make(1400, [e(700)]),
  buttonModal: make(1700, [b(600), m(1100)]),
  modalError: make(1700, [m(500), e(1000)]),
  buttonError: make(1600, [b(500), e(950)]),
  modalModal: make(1700, [m(500), m(1050)]),
  errorModal: make(1700, [e(500), m(1100)]),
  mixedA: make(2200, [b(500), e(950), m(1600)]),
  mixedB: make(2200, [m(500), b(1100), e(1550)]),
  finale: make(2000, [b(500), b(900), m(1400)]),
  fastPair: make(1500, [b(500), b(850)]),
  fastTriple: make(1800, [b(500), b(820), b(1140)]),
  errorButton: make(1700, [e(500), b(1000)]),
  modalHop: make(1700, [m(500), b(950)]),
  stagger: make(2200, [b(500), m(1000), b(1500)]),
  gauntlet: make(2500, [b(500), e(900), b(1450), m(1850)]),
  adButton: make(1200, [bd(700)]),
  adPair: make(1500, [bd(600), bd(1000)]),
  adModal: make(1300, [md(700)]),
  adFastPair: make(1500, [bd(500), bd(850)]),
  headerOne: make(1400, [hd(700)]),
  hopHeader: make(1800, [b(500), hd(1000)]),
  headerHop: make(1800, [hd(500), b(1050)]),
  headerModal: make(1900, [hd(500), m(1100)]),
  headerError: make(1800, [hd(500), e(1000)]),
  sandwich: make(2300, [b(500), hd(1000), b(1550)]),
  lowRoad: make(2600, [hd(500), hd(850), b(1350)]),
  fastHeader: make(2000, [b(500), hd(900), b(1300)]),
  adHeader: make(1900, [bd(500), hd(1000)]),
  headerGauntlet: make(3000, [b(500), hd(900), m(1500), hd(1950), e(2450)]),
  errorRun: make(2400, [e(500), e(1000), e(1500)]),
  tightTriple: make(1900, [b(500), b(800), b(1100)])
};
