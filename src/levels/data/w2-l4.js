export default {
  id: 'w2-l4',
  world: 2,
  name: 'Blackwater',
  mode: 'flap',
  bpm: 124,
  speed: 310,
  beats: 44,
  wall: false,
  dark: [[0,44]],
  shard: { beat: 22, y: 414 },
  events: [
    { beat: 2.5, type: 'plant', w: 90 },
    { beat: 5, type: 'thorn', gy: 360, gap: 190, w: 60 },
    { beat: 6.5, type: 'thorn', gy: 220, gap: 190, w: 240 },
    { beat: 10.5, type: 'thorn', gy: 230, gap: 180, w: 60 },
    { beat: 14.75, type: 'plant', w: 100 },
    { beat: 16.25, type: 'thorn', gy: 210, gap: 180, w: 240 },
    { beat: 19.75, type: 'spider', len: 200 },
    { beat: 22, type: 'spider', len: 280 },
    { beat: 24.25, type: 'thorn', gy: 340, gap: 170, w: 60 },
    { beat: 25.75, type: 'spider', len: 300 },
    { beat: 27.75, type: 'mgap', gy: 180, gap: 160, amp: 60, period: 4, w: 60, phase: 0 },
    { beat: 32.75, type: 'thorn', gy: 390, gap: 150, w: 60 },
    { beat: 35.75, type: 'mgap', gy: 120, gap: 150, amp: 40, period: 3, w: 60, phase: 0 },
    { beat: 38, type: 'mgap', gy: 130, gap: 140, amp: 80, period: 4, w: 60, phase: 0 },
    { beat: 40.75, type: 'mgap', gy: 240, gap: 140, amp: 60, period: 3, w: 60, phase: 0 }
  ]
};
