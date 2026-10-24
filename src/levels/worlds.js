import { levels, world1 } from './world1.js';
import { levels2, world2 } from './world2.js';
import { levels3, world3 } from './world3.js';
import { levels4, world4 } from './world4.js';
import { world5 } from './world5.js';
import { chunks as chunks1 } from './chunks/world1.js';
import { chunks as chunks2 } from './chunks/world2.js';
import { chunks as chunks3 } from './chunks/world3.js';
import { chunks as chunks4 } from './chunks/world4.js';
import { PATTERNS, ALGORITHM_PATTERNS, SURF_PATTERNS, FLIP_PATTERNS, PAYWALL_PATTERNS } from './boss.js';
import { drawCookieBoss } from '../entities/bosses/cookie.js';
import { drawAlgorithmBoss } from '../entities/bosses/algorithm.js';
import { drawCrashBoss } from '../entities/bosses/crash.js';
import { drawSegfaultBoss } from '../entities/bosses/segfault.js';
import { drawPaywallBoss } from '../entities/bosses/paywall.js';

export const worlds = [
  {
    ...world1,
    theme: 'landing',
    mode: 'run',
    levels,
    chunks: chunks1,
    boss: {
      title: 'Cookie Consent Monster',
      blurb: ['Three phases', 'File a bug to deal damage', 'Every attack is announced'],
      patterns: PATTERNS,
      orbLift: 22,
      orbGap: 0,
      tall: false,
      speedMul: 1,
      draw: drawCookieBoss
    }
  },
  {
    ...world2,
    levels: levels2,
    chunks: chunks2,
    boss: {
      title: 'The Algorithm',
      blurb: ['Three phases', 'Fly to the bug to deal damage', 'Every attack is announced'],
      patterns: ALGORITHM_PATTERNS,
      orbLift: 180,
      orbGap: 640,
      tall: true,
      speedMul: 0.95,
      draw: drawAlgorithmBoss
    }
  },
  {
    ...world3,
    levels: levels3,
    chunks: chunks3,
    boss: {
      title: 'Quarterly Crash',
      blurb: ['Three phases', 'Ride to the bug to deal damage', 'Every attack is announced'],
      patterns: SURF_PATTERNS,
      orbLift: 0,
      orbGap: 350,
      restPx: 1200,
      tall: false,
      speedMul: 1,
      draw: drawCrashBoss
    }
  },
  {
    ...world4,
    levels: levels4,
    chunks: chunks4,
    boss: {
      title: 'Segfault',
      blurb: ['Three phases', 'Flip to the bug to deal damage', 'Every attack is announced'],
      patterns: FLIP_PATTERNS,
      orbLift: 22,
      orbGap: 0,
      tall: true,
      speedMul: 0.95,
      draw: drawSegfaultBoss
    }
  },
  {
    ...world5,
    levels: [],
    chunks: {},
    boss: {
      title: 'The Paywall',
      blurb: ['Four phases, one per mode', 'Run, flap, surf, then flip', 'Shields appear between attacks'],
      patterns: PAYWALL_PATTERNS,
      modes: ['run', 'flap', 'surf', 'flip'],
      phaseSize: 2,
      hp: 8,
      orbLift: 22,
      orbGap: 0,
      restPx: 1600,
      tall: true,
      speedMul: 1,
      draw: drawPaywallBoss
    }
  }
];

export const allOrder = worlds.flatMap((w) => w.order);
