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
    name: 'Scroll Depth',
    blurb: ['Everything at once', 'Longer combos', 'Slightly quicker'],
    speedMul: 1.06,
    powerups: [
      { chunk: 1, at: 250, lift: 26, kind: 'blaster' },
      { chunk: 5, at: 200, lift: 26, kind: 'shield' },
      { chunk: 11, at: 250, lift: 26, kind: 'magnet' },
      { chunk: 15, at: 200, lift: 26, kind: 'slowmo' }
    ],
    chunks: [
      'runway',
      'doubleButton',
      'adPair',
      'errorButton',
      'modalError',
      'tripleButton',
      'stagger',
      'soloError',
      'modalHop',
      'errorModal',
      'buttonError',
      'mixedA',
      'modalModal',
      'mixedB',
      'stagger',
      'tripleButton',
      'finale'
    ]
  },
  {
    id: 'w1l3',
    name: 'Time to Interactive',
    blurb: ['Tested at speed', 'Tighter spacing', 'No new obstacles'],
    speedMul: 1.18,
    powerups: [
      { chunk: 2, at: 300, lift: 26, kind: 'shield' },
      { chunk: 4, at: 200, lift: 26, kind: 'slowmo' },
      { chunk: 7, at: 250, lift: 26, kind: 'blaster' },
      { chunk: 11, at: 250, lift: 26, kind: 'magnet' }
    ],
    chunks: [
      'runway',
      'fastPair',
      'soloModal',
      'errorButton',
      'fastTriple',
      'modalHop',
      'buttonError',
      'stagger',
      'adFastPair',
      'modalError',
      'gauntlet',
      'fastTriple',
      'errorModal',
      'mixedB',
      'gauntlet',
      'fastPair',
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
