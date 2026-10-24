export const levels2 = [
  {
    id: 'w2l1',
    name: 'Infinite Scroll',
    mode: 'flap',
    blurb: ['Tap to flap, hold to glide', 'Feed cards and bubbles', 'Halfway checkpoint'],
    speedMul: 0.9,
    powerups: [
      { chunk: 1, at: 250, lift: 190, kind: 'shield' },
      { chunk: 2, at: 1200, lift: 180, kind: 'blaster' },
      { chunk: 5, at: 250, lift: 170, kind: 'magnet' },
      { chunk: 8, at: 250, lift: 120, kind: 'slowmo' }
    ],
    chunks: [
      'runway',
      'gatesEasy',
      'gatesWide',
      'adBubble',
      'gatesEasy',
      'bubblePair',
      'gatesWide',
      'bubbleGate',
      'gatesZig',
      'likeOne',
      'gatesEasy',
      'bubbleOne',
      'likeOne',
      'bubbleGate',
      'gatesZig'
    ]
  },
  {
    id: 'w2l2',
    name: 'Notification Storm',
    mode: 'flap',
    blurb: ['Everything at once', 'Moving likes', 'Floor hazards'],
    speedMul: 0.98,
    powerups: [
      { chunk: 1, at: 250, lift: 120, kind: 'shield' },
      { chunk: 2, at: 250, lift: 180, kind: 'blaster' },
      { chunk: 9, at: 250, lift: 180, kind: 'magnet' },
      { chunk: 12, at: 250, lift: 120, kind: 'slowmo' }
    ],
    chunks: [
      'runway',
      'gatesZig',
      'bubbleGate',
      'adLike',
      'floorGate',
      'mixA',
      'likeGate',
      'bubblePair',
      'floorBubble',
      'gatesWide',
      'mixB',
      'likeGate',
      'gatesZig',
      'bubbleGate',
      'mixA'
    ]
  },
  {
    id: 'w2l3',
    name: 'Engagement Spike',
    mode: 'flap',
    blurb: ['Tested at speed', 'Tighter gaps', 'No new obstacles'],
    speedMul: 1.08,
    powerups: [
      { chunk: 1, at: 250, lift: 180, kind: 'slowmo' },
      { chunk: 3, at: 250, lift: 200, kind: 'shield' },
      { chunk: 5, at: 250, lift: 170, kind: 'blaster' },
      { chunk: 8, at: 250, lift: 170, kind: 'magnet' }
    ],
    chunks: [
      'runway',
      'fastGates',
      'likePair',
      'mixA',
      'gauntlet',
      'floorGate',
      'adFast',
      'mixB',
      'likeGate',
      'gauntlet',
      'bubblePair',
      'fastGates',
      'mixA',
      'gauntlet'
    ]
  }
];

export const world2 = {
  id: 'w2',
  name: 'Social Feed',
  theme: 'social',
  mode: 'flap',
  bossId: 'w2boss',
  order: ['w2l1', 'w2l2', 'w2l3', 'w2boss']
};
