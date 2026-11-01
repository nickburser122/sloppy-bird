export const levels4 = [
  {
    id: 'w4l1',
    name: 'Hello, World',
    mode: 'flip',
    blurb: ['Tap to flip gravity', 'Code blocks grow from both sides', 'Halfway checkpoint'],
    speedMul: 0.94,
    ramp: 0.12,
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
    speedMul: 1.06,
    ramp: 0.2,
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
      'cursorPair',
      'mixB',
      'floatBlock',
      'cursorBlocks',
      'errMix',
      'tightZig'
    ]
  },
  {
    id: 'w4l3',
    name: 'Production Hotfix',
    mode: 'flip',
    blurb: ['Fast and tight', 'Cursor pairs and mixed hazards', 'Power-ups decide the gauntlets'],
    speedMul: 1.2,
    ramp: 0.28,
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
      'errMix',
      'gauntlet',
      'errFloor',
      'fast',
      'adMixB',
      'zigzag',
      'cursorPair',
      'errCeil',
      'tightZig',
      'errMix',
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
