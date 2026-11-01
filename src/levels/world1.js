export const levels = [
  {
    id: 'w1l1',
    name: 'Above the Fold',
    blurb: ['Learn to jump', 'Tap hops, hold flies', 'Halfway checkpoint'],
    speedMul: 1,
    powerups: [
      { chunk: 1, at: 300, lift: 26, kind: 'blaster' },
      { chunk: 3, at: 250, lift: 26, kind: 'shield' },
      { chunk: 10, at: 200, lift: 26, kind: 'magnet' },
      { chunk: 16, at: 250, lift: 26, kind: 'slowmo' }
    ],
    chunks: [
      'runway',
      'soloButton',
      'adButton',
      'doubleButton',
      'soloModal',
      'soloModal',
      'buttonModal',
      'soloError',
      'soloError',
      'modalError',
      'tripleButton',
      'buttonError',
      'modalModal',
      'errorModal',
      'mixedA',
      'soloButton',
      'mixedB',
      'finale'
    ]
  },
  {
    id: 'w1l2',
    name: 'Sticky Header',
    blurb: ['Headers hang low', 'Stay on the ground under them', 'Shoot what you cannot clear'],
    speedMul: 1.1,
    ramp: 0.18,
    powerups: [
      { chunk: 1, at: 250, lift: 26, kind: 'shield' },
      { chunk: 4, at: 250, lift: 26, kind: 'blaster' },
      { chunk: 8, at: 250, lift: 26, kind: 'magnet' },
      { chunk: 11, at: 250, lift: 26, kind: 'slowmo' }
    ],
    chunks: [
      'runway',
      'headerOne',
      'soloButton',
      'hopHeader',
      'adHeader',
      'adPair',
      'headerHop',
      'errorButton',
      'soloModal',
      'headerModal',
      'sandwich',
      'buttonError',
      'headerError',
      'mixedA',
      'lowRoad',
      'finale'
    ]
  },
  {
    id: 'w1l3',
    name: 'Time to Interactive',
    blurb: ['Fast and crowded', 'Headers and hazards together', 'Power-ups decide the gauntlets'],
    speedMul: 1.2,
    ramp: 0.26,
    powerups: [
      { chunk: 2, at: 250, lift: 26, kind: 'slowmo' },
      { chunk: 5, at: 250, lift: 26, kind: 'shield' },
      { chunk: 8, at: 250, lift: 26, kind: 'blaster' },
      { chunk: 11, at: 250, lift: 26, kind: 'magnet' }
    ],
    chunks: [
      'runway',
      'fastPair',
      'headerHop',
      'fastHeader',
      'errorModal',
      'fastTriple',
      'sandwich',
      'headerGauntlet',
      'adFastPair',
      'adHeader',
      'errorRun',
      'gauntlet',
      'headerError',
      'tightTriple',
      'lowRoad',
      'headerGauntlet',
      'finale'
    ]
  }
];

export const world1 = {
  id: 'w1',
  name: 'Landing Page',
  bossId: 'w1boss',
  order: ['w1l1', 'w1l2', 'w1l3', 'w1boss']
};
