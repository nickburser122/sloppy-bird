import { tuning } from '../config/tuning.js';
import { Pool } from '../engine/pool.js';
import { circleAabb } from '../engine/collision.js';
import { obstacleHits } from '../entities/obstacles/types.js';

export class LevelRuntime {
  constructor(level, mode, env, opts) {
    this.assist = !!(opts && opts.assist);
    this.level = level;
    this.mode = mode;
    this.env = env;
    this.pool = new Pool(tuning.level.poolSize, () => ({
      type: '',
      kind: '',
      shape: 'rect',
      edge: 'floor',
      x: 0,
      w: 0,
      h: 0,
      lift: 0,
      bobAmp: 0,
      bobPeriod: 1,
      bobPhase: 0,
      bobRel: false,
      hit: { x: 0, y: 0, w: 0, h: 0 }
    }));
    this.shield = false;
    this.iframes = 0;
    this.onShieldBreak = null;
    this.onRestart = null;
    this.circle = { x: 0, y: 0, r: 0 };
    this.ocircle = { x: 0, y: 0, r: 0 };
    this.obox = { x: 0, y: 0, w: 0, h: 0 };
    this.distance = 0;
    this.prevDistance = 0;
    this.state = 'running';
    this.deathTimer = 0;
    this.deaths = 0;
    this.cheated = false;
    this.next = 0;
    this.itemLo = 0;
    this.collected = 0;
    this.restartCount = 0;
    this.time = 0;
    this.onCollect = null;
    this.hitHb = null;
    this.hitPx = 0;
    this.hitGy = 0;
    this.hitFlag = false;
    this.visit = this.visit.bind(this);
    this.restart();
  }

  restart() {
    this.distance = 0;
    this.prevDistance = 0;
    if (this.onRestart) this.onRestart();
    this.mode.d = 0;
    this.mode.dx = 0;
    this.mode.reset();
    this.pool.releaseAll();
    this.next = 0;
    const items = this.level.items;
    for (let k = 0; k < items.length; k++) items[k].got = false;
    this.collected = 0;
    this.itemLo = 0;
    this.shield = this.assist;
    this.iframes = 0;
    this.state = 'running';
    this.restartCount++;
    this.spawn();
  }

  spawn() {
    const obs = this.level.obstacles;
    const ahead = this.env.width() + tuning.level.spawnMargin;
    while (this.next < obs.length && obs[this.next].x - this.distance < ahead) {
      const e = this.pool.acquire();
      if (!e) break;
      const o = obs[this.next++];
      e.type = o.type;
      e.kind = o.kind;
      e.shape = o.shape;
      e.edge = o.edge;
      e.x = o.x;
      e.w = o.w;
      e.h = o.h;
      e.lift = o.lift;
      e.bobAmp = o.bobAmp;
      e.bobPeriod = o.bobPeriod;
      e.bobPhase = o.bobPhase;
      e.bobRel = o.bobRel;
    }
  }

  visit(o) {
    const sx = this.hitPx + o.x - this.distance;
    if (sx + o.w < -tuning.level.despawnMargin) return false;
    const hit = obstacleHits(this.hitHb, o, sx, this.hitGy, this.distance, this.obox, this.ocircle);
    o.hit.x = this.obox.x;
    o.hit.y = this.obox.y;
    o.hit.w = this.obox.w;
    o.hit.h = this.obox.h;
    if (hit) this.hitFlag = true;
    return true;
  }

  collectItems() {
    const items = this.level.items;
    const reach = this.env.width() + tuning.level.spawnMargin;
    const margin = tuning.level.despawnMargin;
    const hb = this.hitHb;
    for (let i = this.itemLo; i < items.length; i++) {
      const it = items[i];
      const sx = this.hitPx + it.x - this.distance;
      if (sx < -margin) {
        if (i === this.itemLo) this.itemLo++;
        continue;
      }
      if (sx > reach) break;
      if (it.got) continue;
      const c = this.circle;
      c.x = sx;
      c.y = this.hitGy - it.lift;
      c.r = it.kind === 'orb' ? tuning.orb.r : tuning.token.r;
      if (circleAabb(c, hb)) this.take(it, c.x, c.y);
    }
  }

  take(it, x, y) {
    it.got = true;
    if (it.kind === 'token') this.collected++;
    if (this.onCollect) this.onCollect(it, x, y);
  }

  update(dt) {
    this.time += dt;
    if (this.state === 'dead') {
      this.deathTimer -= dt * 1000;
      if (this.deathTimer <= 0) this.restart();
      return;
    }
    if (this.state === 'won') return;
    if (tuning.debug.invincible) this.cheated = true;
    this.prevDistance = this.distance;
    if (this.iframes > 0) this.iframes -= dt * 1000;
    const mul = this.mode.speedMul ? this.mode.speedMul() : 1;
    const step = this.level.speedAt(this.distance) * mul * dt;
    this.mode.d = this.distance + step;
    this.mode.dx = step;
    this.mode.update(dt);
    this.distance += step;
    this.spawn();
    this.hitHb = this.mode.getHitbox();
    this.hitPx = this.mode.player.x;
    this.hitGy = this.env.groundY();
    this.hitFlag = false;
    this.pool.update(this.visit);
    if (this.hitFlag && !tuning.debug.invincible && this.iframes <= 0) {
      if (this.shield) {
        this.shield = false;
        this.iframes = tuning.shield.iframeMs;
        if (this.onShieldBreak) this.onShieldBreak();
      } else {
        this.state = 'dead';
        this.deaths++;
        this.deathTimer = tuning.level.retryMs;
        return;
      }
    }
    this.collectItems();
    if (this.distance >= this.level.length) this.state = 'won';
  }
}
