import { tuning } from '../config/tuning.js';
import { createObstacle } from '../entities/obstacles/types.js';
import { validateReachability } from './validator.js';
import { PATTERNS, patternSpan, appendSurfPattern, fieldFor } from './boss.js';
import { Terrain } from './terrain.js';

export function validateBoss(world) {
  const cfg = world && world.boss ? world.boss : { patterns: PATTERNS, speedMul: 1, orbGap: 0 };
  const baseMode = world && world.mode ? world.mode : 'run';
  const patterns = cfg.patterns;
  const orbGapDefault = cfg.orbGap || tuning.boss.orbGapPx;
  const restPx = cfg.restPx || tuning.boss.restPx;
  const phaseSize = cfg.phaseSize || tuning.boss.phaseSize;
  const b = tuning.boss;
  const errors = [];
  const hp = cfg.hp || b.hp;
  if (patterns.length !== hp) errors.push('boss hp (' + hp + ') must equal the pattern count (' + patterns.length + ')');
  const phases = Math.ceil(patterns.length / phaseSize);
  let sims = 0;
  for (let p = 0; p < phases; p++) {
    const mode = cfg.modes ? cfg.modes[p] : baseMode;
    const speed = tuning.world.speed * cfg.speedMul * tuning.debug.speedScale * (1 + b.speedStep * p);
    const obstacles = [];
    const terrain = mode === 'surf' ? new Terrain() : null;
    if (terrain) terrain.addPoint(0, 50);
    let x = 1200;
    let prevEnd = 0;
    for (let i = p * phaseSize; i < Math.min(patterns.length, (p + 1) * phaseSize); i++) {
      const pattern = patterns[i];
      const orbGap = pattern.orbGap || orbGapDefault;
      for (const o of pattern.obstacles) obstacles.push(createObstacle(o, x, fieldFor(mode)));
      if (terrain) {
        const r = appendSurfPattern(terrain, pattern, x, prevEnd, orbGap);
        prevEnd = r.terrainEnd;
        x = r.orbX + restPx;
      } else {
        x += patternSpan(pattern) + orbGap + restPx;
      }
    }
    obstacles.sort((a, c) => a.x - c.x);
    const level = { mode, terrain, obstacles, items: [], length: x + 500, checkpoint: 0, speedAt: () => speed };
    const r = validateReachability(level);
    sims += r.sims;
    if (!r.ok) errors.push('phase ' + (p + 1) + ' (' + mode + ') ' + (r.exhausted ? 'search budget exceeded' : 'unreachable near obstacle #' + r.deepest));
    if (mode === 'run' && r.airDistance > orbGapDefault) errors.push('phase ' + (p + 1) + ' orb sits inside a full jump (' + Math.round(r.airDistance) + 'px)');
  }
  return { ok: errors.length === 0, errors, sims };
}
