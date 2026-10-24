export const levels3 = [
  {
    id: 'w3l1',
    name: 'Quarterly Report',
    mode: 'surf',
    blurb: ['Hold to dive, release to fly', 'Release at the crest for a boost', 'Halfway checkpoint'],
    speedMul: 0.95,
    powerups: [
      { chunk: 1, at: 600, lift: 'ride', kind: 'shield' },
      { chunk: 3, at: 700, lift: 'ride', kind: 'blaster' },
      { chunk: 6, at: 600, lift: 'ride', kind: 'magnet' },
      { chunk: 9, at: 600, lift: 'ride', kind: 'slowmo' }
    ],
    chunks: [
      'rolling',
      'rollingTall',
      'gapOne',
      'rolling',
      'adKpi',
      'gapOne',
      'rollingTall',
      'kpiCrest',
      'gapTwo',
      'rolling',
      'kpiPair',
      'gapOne',
      'rolling',
      'kpiCrest',
      'gapTwo'
    ]
  },
  {
    id: 'w3l2',
    name: 'Live Metrics',
    mode: 'surf',
    blurb: ['Floating KPI cards', 'Moving tickers', 'Longer gaps'],
    speedMul: 1.0,
    powerups: [
      { chunk: 0, at: 700, lift: 'ride', kind: 'shield' },
      { chunk: 3, at: 600, lift: 'ride', kind: 'blaster' },
      { chunk: 7, at: 700, lift: 'ride', kind: 'magnet' },
      { chunk: 9, at: 700, lift: 'ride', kind: 'slowmo' }
    ],
    chunks: [
      'rolling',
      'tickerOne',
      'gapKpi',
      'bubbleValley',
      'adKpiPair',
      'gapTwo',
      'tickerKpi',
      'rollingTall',
      'gapBubble',
      'tickerOne',
      'combo',
      'kpiPair',
      'gapKpi',
      'tickerKpi',
      'gapBubble'
    ]
  },
  {
    id: 'w3l3',
    name: 'Real-Time Everything',
    mode: 'surf',
    blurb: ['Tested at speed', 'Tighter combos', 'No new obstacles'],
    speedMul: 1.1,
    powerups: [
      { chunk: 0, at: 700, lift: 'ride', kind: 'shield' },
      { chunk: 2, at: 120, lift: 'ride', kind: 'slowmo' },
      { chunk: 4, at: 1500, lift: 'ride', kind: 'blaster' },
      { chunk: 7, at: 300, lift: 'ride', kind: 'magnet' }
    ],
    chunks: [
      'rolling',
      'gapKpi',
      'tickerKpi',
      'combo',
      'gapTwo',
      'adKpiPair',
      'gapBubble',
      'finale',
      'tickerKpi',
      'combo',
      'gapKpi',
      'finale',
      'tickerKpi',
      'gapBubble'
    ]
  }
];

export const world3 = {
  id: 'w3',
  name: 'Dashboard',
  theme: 'dashboard',
  mode: 'surf',
  bossId: 'w3boss',
  order: ['w3l1', 'w3l2', 'w3l3', 'w3boss']
};
