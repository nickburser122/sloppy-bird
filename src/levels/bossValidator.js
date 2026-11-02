import { tuning } from '../config/tuning.js';
import { createObstacle } from '../entities/obstacles/types.js';
import { validateReachability } from './validator.js';
import { PAYWALL_PATTERNS, patternSpan, fieldFor } from './boss.js';

export function validateBoss(world) {
  const cfg = world && world.boss ? world.boss : { patterns: PAYWALL_PATTERNS, speedMul: 1, orbGap: 0 };
  const patterns = cfg.patterns;
  const orbGapDefault = cfg.orbGap || tuning.boss.orbGapPx;
  const b = tuning.boss;
  const errors = [];
  if (patterns.length !== b.hp) errors.push('boss hp (' + b.hp + ') must equal the pattern count (' + patterns.length + ')');
  let sims = 0;
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    const mode = pattern.mode || 'run';
    const speed = tuning.world.speed * cfg.speedMul * tuning.debug.speedScale * (1 + b.speedStep * Math.floor(i / b.phaseSize));
    const orbGap = pattern.orbGap || orbGapDefault;
    const obstacles = patterns[i].obstacles.map((o) => createObstacle(o, 1200, fieldFor(mode)));
    obstacles.sort((a, c) => a.x - c.x);
    const length = 1200 + patternSpan(pattern) + orbGap + 500;
    const level = { mode, obstacles, items: [], length, speedAt: () => speed };
    const r = validateReachability(level);
    sims += r.sims;
    if (!r.ok) errors.push('pattern ' + (i + 1) + ' (' + mode + ') ' + (r.exhausted ? 'search budget exceeded' : 'unreachable near obstacle #' + r.deepest));
    if (mode === 'run' && r.airDistance > orbGap) errors.push('pattern ' + (i + 1) + ' orb sits inside a full jump (' + Math.round(r.airDistance) + 'px)');
  }
  return { ok: errors.length === 0, errors, sims };
}
