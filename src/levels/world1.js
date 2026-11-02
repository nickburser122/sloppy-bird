export const levels = [
  {
    id: 'w1l1',
    name: 'Above the Fold',
    blurb: ['Thirty seconds, no checkpoints', 'Jump buttons, modals and error bars', 'Die and you start over'],
    speedMul: 1.25,
    ramp: 0.3,
    chunks: ['aboveTheFold']
  },
  {
    id: 'w1l2',
    name: 'Sticky Header',
    blurb: ['Headers hang low, stay under them', 'Jump everything else', 'Thirty seconds, no checkpoints'],
    speedMul: 1.35,
    ramp: 0.3,
    chunks: ['stickyHeader']
  }
];

export const world1 = {
  id: 'w1',
  name: 'Landing Page',
  order: ['w1l1', 'w1l2']
};
