import { tuning } from '../config/tuning.js';
import { createObstacle } from '../entities/obstacles/types.js';

export function compileLevel(def, library) {
  const obstacles = [];
  const items = [];
  const mode = def.mode || 'run';
  const fieldH = mode === 'flip' ? tuning.flip.fieldH : tuning.flap.fieldH;
  let x = 0;
  for (let i = 0; i < def.chunks.length; i++) {
    const chunk = library[def.chunks[i]];
    if (!chunk) throw new Error('Unknown chunk ' + def.chunks[i]);
    for (const o of chunk.obstacles) obstacles.push(createObstacle(o, x, fieldH));
    for (const it of chunk.items || []) items.push({ x: x + it.at, lift: it.lift, kind: 'token', got: false });
    x += chunk.length;
  }
  obstacles.sort((a, b) => a.x - b.x);
  items.sort((a, b) => a.x - b.x);
  const length = x;
  const mul = def.speedMul || 1;
  const ramp = def.ramp !== undefined ? def.ramp : tuning.world.speedRamp;
  const speedAt = (d) => tuning.world.speed * mul * tuning.debug.speedScale * (1 + ramp * Math.min(1, Math.max(0, d) / length));
  return { id: def.id, name: def.name, mode, length, obstacles, items, tokenTotal: items.length, speedAt };
}
