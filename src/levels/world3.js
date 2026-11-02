export const levels3 = [
  {
    id: 'w3l1',
    name: 'Hello, World',
    mode: 'flip',
    blurb: ['Tap to flip gravity', 'Blocks grow from both sides', 'Thirty seconds, no checkpoints'],
    speedMul: 1.2,
    ramp: 0.3,
    chunks: ['helloWorld']
  },
  {
    id: 'w3l2',
    name: 'Production Hotfix',
    mode: 'flip',
    blurb: ['Cursors and error bars on both sides', 'Floating blocks to thread', 'Thirty seconds, no checkpoints'],
    speedMul: 1.3,
    ramp: 0.3,
    chunks: ['productionHotfix']
  }
];

export const world3 = {
  id: 'w3',
  name: 'Terminal',
  theme: 'terminal',
  mode: 'flip',
  order: ['w3l1', 'w3l2']
};
