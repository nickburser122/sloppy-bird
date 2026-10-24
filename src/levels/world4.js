export const levels4 = [
  {
    id: 'w4l1',
    name: 'Hello, World',
    mode: 'flip',
    blurb: ['Tap to flip gravity', 'Code blocks grow from both sides', 'Halfway checkpoint'],
    speedMul: 0.92,
    powerups: [
      { chunk: 1, at: 1170, lift: 22, kind: 'shield' },
      { chunk: 3, at: 1170, lift: 22, kind: 'blaster' },
      { chunk: 6, at: 1170, lift: 22, kind: 'magnet' },
      { chunk: 11, at: 1170, lift: 22, kind: 'slowmo' }
    ],
    chunks: [
      'runway',
      'blocksEasy',
      'pairSame',
      'blocksEasy',
      'adBlocksTall',
      'floatOne',
      'blocksEasy',
      'cursorOne',
      'pairSame',
      'blocksTall',
      'floatBlock',
      'blocksEasy',
      'cursorOne',
      'blocksTall',
      'zigzag'
    ]
  },
  {
    id: 'w4l2',
    name: 'Merge Conflict',
    mode: 'flip',
    blurb: ['Floating blocks and cursors', 'Longer zigzags', 'Hazard strips'],
    speedMul: 1.0,
    powerups: [
      { chunk: 5, at: 1200, lift: 22, kind: 'shield' },
      { chunk: 2, at: 1700, lift: 22, kind: 'blaster' },
      { chunk: 8, at: 1100, lift: 22, kind: 'magnet' },
      { chunk: 12, at: 1700, lift: 22, kind: 'slowmo' }
    ],
    chunks: [
      'runway',
      'zigzag',
      'floatBlock',
      'adCursorBlocks',
      'errFloor',
      'blocksTall',
      'mixA',
      'errCeil',
      'zigzag',
      'cursorOne',
      'mixB',
      'floatBlock',
      'cursorBlocks',
      'mixA',
      'zigzag'
    ]
  },
  {
    id: 'w4l3',
    name: 'Production Hotfix',
    mode: 'flip',
    blurb: ['Tested at speed', 'Tighter flips', 'No new obstacles'],
    speedMul: 1.1,
    powerups: [
      { chunk: 1, at: 1700, lift: 22, kind: 'slowmo' },
      { chunk: 2, at: 1700, lift: 22, kind: 'shield' },
      { chunk: 6, at: 1700, lift: 22, kind: 'blaster' },
      { chunk: 8, at: 1100, lift: 22, kind: 'magnet' }
    ],
    chunks: [
      'runway',
      'fast',
      'cursorBlocks',
      'mixA',
      'gauntlet',
      'errFloor',
      'fast',
      'adMixB',
      'zigzag',
      'gauntlet',
      'errCeil',
      'fast',
      'mixA',
      'gauntlet'
    ]
  }
];

export const world4 = {
  id: 'w4',
  name: 'Terminal',
  theme: 'terminal',
  mode: 'flip',
  bossId: 'w4boss',
  order: ['w4l1', 'w4l2', 'w4l3', 'w4boss']
};
