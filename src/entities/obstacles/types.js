import { tuning } from '../../config/tuning.js';
import { shrink, aabb, circleAabb } from '../../engine/collision.js';

export const OBSTACLES = {
  button: { kind: 'solid', dims: 'button', shape: 'rect' },
  modal: { kind: 'solid', dims: 'modal', shape: 'rect' },
  errorbar: { kind: 'hazard', dims: 'errorbar', shape: 'rect' },
  card: { kind: 'solid', dims: 'card', shape: 'rect' },
  bubble: { kind: 'solid', dims: 'bubble', shape: 'circle' },
  like: { kind: 'solid', dims: 'like', shape: 'circle', moving: true },
  kpi: { kind: 'solid', dims: 'kpi', shape: 'rect' },
  ticker: { kind: 'solid', dims: 'ticker', shape: 'rect', moving: true, rel: true },
  nodata: { kind: 'hazard', dims: 'nodata', shape: 'rect', lift: -480 },
  block: { kind: 'solid', dims: 'block', shape: 'rect' },
  float: { kind: 'solid', dims: 'float', shape: 'rect' },
  cursor: { kind: 'hazard', dims: 'cursor', shape: 'rect', lift: 60 }
};

export function createObstacle(o, originX, fieldH) {
  const spec = OBSTACLES[o.type];
  const dims = tuning[spec.dims];
  const h = o.h !== undefined ? o.h : dims.h;
  const w = o.w !== undefined ? o.w : dims.w;
  let lift = o.lift !== undefined ? o.lift : spec.lift || 0;
  let edge = 'floor';
  if (o.from === 'top') {
    lift = (fieldH || tuning.flap.fieldH) - h;
    edge = 'top';
  }
  return {
    type: o.type,
    kind: spec.kind,
    shape: spec.shape,
    edge,
    x: originX + o.at,
    w,
    h,
    lift,
    bobAmp: spec.moving ? dims.amp : 0,
    bobPeriod: spec.moving ? dims.period : 1,
    bobPhase: o.phase || 0,
    bobRel: !!spec.rel,
    destructible: spec.kind === 'solid' && !!o.destructible,
    destroyed: false
  };
}

export function obstacleLift(o, d) {
  if (!o.bobAmp) return o.lift;
  const arg = o.bobRel ? d - o.x + o.bobPhase : d + o.bobPhase;
  return o.lift + o.bobAmp * Math.sin((arg / o.bobPeriod) * Math.PI * 2);
}

export function obstacleHitbox(out, o, screenX, groundY, d) {
  out.x = screenX;
  out.y = groundY - obstacleLift(o, d || 0) - o.h;
  out.w = o.w;
  out.h = o.h;
  return shrink(out, out, tuning.obstacle.hitScale);
}

export function obstacleHits(hb, o, screenX, groundY, d, box, circle) {
  obstacleHitbox(box, o, screenX, groundY, d);
  if (o.shape === 'circle') {
    circle.x = box.x + box.w / 2;
    circle.y = box.y + box.h / 2;
    circle.r = box.w / 2;
    return circleAabb(circle, hb);
  }
  return aabb(hb, box);
}
