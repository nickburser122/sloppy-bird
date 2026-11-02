import { levels, world1 } from './world1.js';
import { levels2, world2 } from './world2.js';
import { levels3, world3 } from './world3.js';
import { world4 } from './world4.js';
import { chunks as chunks1 } from './chunks/world1.js';
import { chunks as chunks2 } from './chunks/world2.js';
import { chunks as chunks3 } from './chunks/world3.js';
import { PAYWALL_PATTERNS } from './boss.js';
import { drawPaywallBoss } from '../entities/bosses/paywall.js';

export const worlds = [
  { ...world1, theme: 'landing', mode: 'run', levels, chunks: chunks1, boss: null },
  { ...world2, levels: levels2, chunks: chunks2, boss: null },
  { ...world3, levels: levels3, chunks: chunks3, boss: null },
  {
    ...world4,
    levels: [],
    chunks: {},
    boss: {
      title: 'The Paywall',
      blurb: ['Five hits, five attacks', 'The mode changes after every hit', 'Die and the fight starts over'],
      patterns: PAYWALL_PATTERNS,
      restPx: 700,
      tall: true,
      speedMul: 1.2,
      draw: drawPaywallBoss
    }
  }
];

export const allOrder = worlds.flatMap((w) => w.order);
