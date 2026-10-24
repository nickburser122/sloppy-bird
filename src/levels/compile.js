import { tuning } from '../config/tuning.js';
import { createObstacle } from '../entities/obstacles/types.js';
import { Terrain } from './terrain.js';

export function compileLevel(def, library) {
  const obstacles = [];
  const items = [];
  const starts = [];
  const mode = def.mode || 'run';
  const terrain = mode === 'surf' ? new Terrain() : null;
  const fieldH = mode === 'flip' ? tuning.flip.fieldH : tuning.flap.fieldH;
  let x = 0;
  for (let i = 0; i < def.chunks.length; i++) {
    const chunk = library[def.chunks[i]];
    if (!chunk) throw new Error('Unknown chunk ' + def.chunks[i]);
    starts.push(x);
    for (const o of chunk.obstacles) {
      const ob = createObstacle(o, x, fieldH);
      obstacles.push(ob);
      if (terrain && o.type === 'nodata') terrain.addGap(ob.x, ob.x + ob.w);
    }
    if (terrain) for (const pt of chunk.terrain) terrain.addPoint(x + pt[0], pt[1]);
    for (const it of chunk.items || []) {
      items.push({ x: x + it.at, lift: it.lift, kind: 'token', got: false });
    }
    x += chunk.length;
  }
  obstacles.sort((a, b) => a.x - b.x);
  const length = x;
  if (terrain) {
    terrain.seal();
    for (const it of surfTokens(terrain, obstacles, length)) items.push(it);
  }
  for (const pu of def.powerups || []) {
    const px = starts[pu.chunk] + pu.at;
    const lift = pu.lift === 'ride' && terrain ? terrain.base(px) + 30 : pu.lift;
    items.push({ x: px, lift, kind: 'power', power: pu.kind, got: false });
  }
  items.sort((a, b) => a.x - b.x);
  let checkpoint = 0;
  if (def.checkpointChunk !== undefined) {
    checkpoint = starts[def.checkpointChunk] || 0;
  } else {
    let best = Infinity;
    for (let i = 1; i < starts.length; i++) {
      const gap = Math.abs(starts[i] - length / 2);
      if (gap < best) {
        best = gap;
        checkpoint = starts[i];
      }
    }
  }
  const mul = def.speedMul || 1;
  const speedAt = (d) =>
    tuning.world.speed *
    mul *
    tuning.debug.speedScale *
    (1 + tuning.world.speedRamp * Math.min(1, Math.max(0, d) / length));
  return { id: def.id, name: def.name, mode, terrain, length, checkpoint, obstacles, items, tokenTotal: items.filter((i) => i.kind === 'token').length, speedAt };
}

function surfTokens(terrain, obstacles, length) {
  const out = [];
  const blocked = (x, lift) => {
    for (const o of obstacles) {
      if (x > o.x - 50 && x < o.x + o.w + 50) {
        if (o.type === 'nodata') return false;
        return true;
      }
    }
    return false;
  };
  for (let x = 400; x < length - 300; x += 170) {
    if (blocked(x, 0)) continue;
    out.push({ x, lift: terrain.base(x) + 26, kind: 'token', got: false });
  }
  const xs = terrain.xs;
  const ys = terrain.ys;
  for (let i = 1; i < xs.length - 1; i++) {
    if (ys[i] > ys[i - 1] && ys[i] > ys[i + 1] && xs[i] > 400 && xs[i] < length - 300 && !blocked(xs[i], 0)) {
      out.push({ x: xs[i], lift: ys[i] + 62, kind: 'token', got: false });
    }
  }
  return out;
}
