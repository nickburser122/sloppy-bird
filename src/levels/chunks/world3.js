import { tuning } from '../../config/tuning.js';
import { hills } from '../terrain.js';

const VALLEY = 50;

export function surf(length, crests, parts) {
  const n = crests.length;
  const step = length / (2 * n);
  const cx = (k) => (2 * k - 1) * step;
  const vx = (i) => 2 * i * step;
  const obstacles = [];
  for (const p of parts || []) {
    if (p.kpi) obstacles.push({ type: 'kpi', at: cx(p.kpi[0]) - tuning.kpi.w / 2, lift: p.kpi[1], destructible: !!p.d });
    else if (p.ticker) obstacles.push({ type: 'ticker', at: cx(p.ticker[0]) - tuning.ticker.w / 2, lift: p.ticker[1], phase: p.ticker[2] });
    else if (p.gap) obstacles.push({ type: 'nodata', at: vx(p.gap[0]) - tuning.nodata.w / 2 });
    else if (p.bubble) obstacles.push({ type: 'bubble', at: vx(p.bubble[0]) - tuning.bubble.w / 2, lift: p.bubble[1] });
  }
  return { length, terrain: hills(length, crests, VALLEY), obstacles, items: [] };
}

export const chunks = {
  rolling: surf(1500, [130, 130]),
  rollingTall: surf(1800, [160, 160, 160]),
  kpiCrest: surf(1500, [150, 150], [{ kpi: [1, 215] }]),
  kpiPair: surf(2250, [150, 150, 150], [{ kpi: [1, 215] }, { kpi: [3, 215] }]),
  gapOne: surf(1500, [150, 150], [{ gap: [1] }]),
  gapTwo: surf(3000, [150, 150, 150, 150], [{ gap: [1] }, { gap: [3] }]),
  tickerOne: surf(1500, [150, 150], [{ ticker: [2, 205, 100] }]),
  tickerKpi: surf(2250, [150, 150, 150], [{ ticker: [1, 205, 100] }, { kpi: [3, 215] }]),
  bubbleValley: surf(1500, [140, 140], [{ bubble: [1, 100] }]),
  gapKpi: surf(2250, [150, 150, 150], [{ gap: [1] }, { kpi: [3, 215] }]),
  gapBubble: surf(2250, [150, 150, 150], [{ gap: [1] }, { bubble: [2, 100] }]),
  combo: surf(3000, [150, 150, 150, 150], [{ kpi: [1, 215] }, { gap: [2] }, { ticker: [4, 205, 100] }]),
  adKpi: surf(1500, [150, 150], [{ kpi: [1, 215], d: true }]),
  adKpiPair: surf(2250, [150, 150, 150], [{ kpi: [1, 215], d: true }, { kpi: [3, 215], d: true }]),
  finale: surf(3000, [150, 150, 150, 150], [{ gap: [1] }, { kpi: [3, 215] }, { gap: [3] }])
};
