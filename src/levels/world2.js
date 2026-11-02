export const levels2 = [
  {
    id: 'w2l1',
    name: 'Infinite Scroll',
    mode: 'flap',
    blurb: ['Tap to flap, hold to glide', 'Thread the gates and bubbles', 'Thirty seconds, no checkpoints'],
    speedMul: 1.2,
    ramp: 0.3,
    chunks: ['infiniteScroll']
  },
  {
    id: 'w2l2',
    name: 'Notification Storm',
    mode: 'flap',
    blurb: ['Likes bob, bubbles drift', 'Floor hazards between the gates', 'Thirty seconds, no checkpoints'],
    speedMul: 1.3,
    ramp: 0.3,
    chunks: ['notificationStorm']
  }
];

export const world2 = {
  id: 'w2',
  name: 'Social Feed',
  theme: 'social',
  mode: 'flap',
  order: ['w2l1', 'w2l2']
};
