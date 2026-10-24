import { tuning } from '../config/tuning.js';
import { Pool } from '../engine/pool.js';
import { PowerState } from '../engine/powerups.js';
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
      destructible: false,
      destroyed: false,
      hit: { x: 0, y: 0, w: 0, h: 0 }
    }));
    this.power = new PowerState();
    this.bullets = new Pool(tuning.blaster.max, () => ({ x: 0, y: 0 }));
    this.fireLeft = 0;
    this.iframes = 0;
    this.bulletDt = 0;
    this.onPower = null;
    this.onShieldBreak = null;
    this.onDestroy = null;
    this.onFire = null;
    this.hitSolid = false;
    this.hitHazard = false;
    this.bulletStep = this.bulletStep.bind(this);
    this.circle = { x: 0, y: 0, r: 0 };
    this.ocircle = { x: 0, y: 0, r: 0 };
    this.obox = { x: 0, y: 0, w: 0, h: 0 };
    this.distance = 0;
    this.prevDistance = 0;
    this.state = 'running';
    this.deathTimer = 0;
    this.deaths = 0;
    this.checkpointed = false;
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
    this.distance = this.checkpointed ? this.level.checkpoint : 0;
    this.prevDistance = this.distance;
    this.mode.d = this.distance;
    this.mode.dx = 0;
    this.mode.reset();
    this.pool.releaseAll();
    const obs = this.level.obstacles;
    let i = 0;
    while (i < obs.length && obs[i].x + obs[i].w < this.distance) i++;
    this.next = i;
    const items = this.level.items;
    let got = 0;
    for (let k = 0; k < items.length; k++) {
      if (items[k].x >= this.distance && !items[k].locked) items[k].got = false;
      items[k].pull = 0;
      if (items[k].got && items[k].kind === 'token') got++;
    }
    this.collected = got;
    this.itemLo = 0;
    this.power.clear();
    if (this.assist) this.power.activate('shield');
    this.bullets.releaseAll();
    this.fireLeft = 0;
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
      e.destructible = o.destructible;
      e.destroyed = false;
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
    if (hit && !o.destroyed) {
      this.hitFlag = true;
      if (o.kind === 'hazard') this.hitHazard = true;
      else this.hitSolid = true;
    }
    return true;
  }

  collectItems(dt) {
    const items = this.level.items;
    const reach = this.env.width() + tuning.level.spawnMargin;
    const margin = tuning.level.despawnMargin;
    const magnet = this.power.is('magnet');
    const hb = this.hitHb;
    const cx = hb.x + hb.w / 2;
    const cy = hb.y + hb.h / 2;
    for (let i = this.itemLo; i < items.length; i++) {
      const it = items[i];
      const sx = this.hitPx + it.x - this.distance;
      if (sx < -margin) {
        if (i === this.itemLo) this.itemLo++;
        continue;
      }
      if (sx > reach) break;
      if (it.got) continue;
      if (!magnet && it.pull > 0) it.pull = 0;
      const c = this.circle;
      c.x = sx;
      c.y = this.hitGy - it.lift;
      c.r = it.kind === 'orb' ? tuning.orb.r : it.kind === 'power' ? tuning.pickup.r : tuning.token.r;
      if (magnet && it.kind === 'token') {
        const dx = cx - sx;
        const dy = cy - c.y;
        if (dx * dx + dy * dy < tuning.magnet.radius * tuning.magnet.radius) {
          it.pull = Math.min(1, (it.pull || 0) + dt * tuning.magnet.pull);
          if (it.pull >= 1) this.take(it, c.x, c.y);
          continue;
        }
      }
      if (circleAabb(c, hb)) this.take(it, c.x, c.y);
    }
  }

  take(it, x, y) {
    it.got = true;
    if (it.kind === 'token') this.collected++;
    else if (it.kind === 'power') {
      this.power.activate(it.power);
      this.fireLeft = 0;
      if (this.onPower) this.onPower(it.power, x, y);
    }
    if (this.onCollect) this.onCollect(it, x, y);
  }

  bulletStep(b) {
    b.x += tuning.blaster.speed * this.bulletDt;
    if (b.x > this.env.width() + 40) return false;
    const pool = this.pool;
    for (let i = 0; i < pool.count; i++) {
      const o = pool.active[i];
      if (!o.destructible || o.destroyed) continue;
      const h = o.hit;
      if (b.x + tuning.blaster.w > h.x && b.x < h.x + h.w && b.y + tuning.blaster.h > h.y && b.y < h.y + h.h) {
        o.destroyed = true;
        if (this.onDestroy) this.onDestroy(o, h.x + h.w / 2, h.y + h.h / 2);
        return false;
      }
    }
    return true;
  }

  updateBlaster(dt) {
    if (this.power.is('blaster')) {
      this.fireLeft -= dt * 1000;
      if (this.fireLeft <= 0) {
        this.fireLeft += tuning.blaster.interval;
        const b = this.bullets.acquire();
        if (b) {
          b.x = this.hitPx + this.mode.player.size;
          b.y = this.mode.player.y + this.mode.player.size / 2 - tuning.blaster.h / 2;
          if (this.onFire) this.onFire();
        }
      }
    }
    this.bulletDt = dt;
    this.bullets.update(this.bulletStep);
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
    this.power.update(dt * 1000);
    if (this.iframes > 0) this.iframes -= dt * 1000;
    const mul = (this.mode.speedMul ? this.mode.speedMul() : 1) * this.power.speedMul();
    const step = this.level.speedAt(this.distance) * mul * dt;
    this.mode.d = this.distance + step;
    this.mode.dx = step;
    this.mode.update(dt);
    this.distance += step;
    this.spawn();
    if (!this.checkpointed && this.distance >= this.level.checkpoint) this.checkpointed = true;
    this.hitHb = this.mode.getHitbox();
    this.hitPx = this.mode.player.x;
    this.hitGy = this.env.groundY();
    this.hitFlag = false;
    this.hitSolid = false;
    this.hitHazard = false;
    this.pool.update(this.visit);
    this.updateBlaster(dt);
    if (this.hitFlag && !tuning.debug.invincible) {
      let dies = this.hitHazard;
      if (!dies && this.hitSolid && this.iframes <= 0) {
        if (this.power.breakShield()) {
          this.iframes = tuning.shield.iframeMs;
          if (this.onShieldBreak) this.onShieldBreak();
        } else dies = true;
      }
      if (dies) {
        this.state = 'dead';
        this.deaths++;
        this.deathTimer = tuning.level.retryMs;
        return;
      }
    }
    this.collectItems(dt);
    if (this.distance >= this.level.length) this.state = 'won';
  }
}
