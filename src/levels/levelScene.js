import { Scene } from '../engine/scenes.js';
import { Camera } from '../engine/camera.js';
import { tuning } from '../config/tuning.js';
import { colors, applyTheme, motion } from '../config/tokens.js';
import { createPlayer } from '../entities/player.js';
import { Particles } from '../entities/particles.js';
import { createMode } from '../modes/index.js';
import { createHud } from '../ui/hud.js';
import { compileLevel } from './compile.js';
import { LevelRuntime } from './runtime.js';
import { computeStars } from './scoring.js';
import { drawBackdrop, drawGround, drawPlayer, drawObstacle, drawToken, drawOrb, drawShield } from './draw.js';
import { worlds } from './worlds.js';

export class LevelScene extends Scene {
  enter(params) {
    const app = this.app;
    this.params = params || {};
    this.worldIndex = this.params.world || 0;
    this.world = worlds[this.worldIndex];
    applyTheme(this.world.theme);
    this.sc = 1;
    this.updateScale();
    this.player = createPlayer();
    this.env = {
      width: () => app.width / this.sc,
      groundY: () => (app.height * tuning.world.groundRatio) / this.sc
    };
    this.modeKind = this.world.startMode || this.world.mode;
    this.mode = createMode(this.modeKind, this.player, this.env);
    this.camera = new Camera();
    this.particles = new Particles();
    this.setup();
    const rt = this.runtime;
    rt.onCollect = (it, x, y) => this.collect(it, x, y);
    rt.onShieldBreak = () => {
      this.announce('Shield broken');
      const p = this.player;
      app.audio.play('shatter');
      this.camera.shake(tuning.fx.deathShake);
      this.particles.burst(p.x + p.size / 2, p.y + p.size / 2, 18, 300, 0.6, 7, 'accent', false, 0);
    };
    this.hud = createHud(this, this.hudConfig());
    this.finished = false;
    this.wasRunning = true;
    this.prevState = 'running';
    this.hitStop = 0;
    app.input.reset();
    this.bind();
    this.announce(this.intro());
  }

  intro() {
    return this.world.name + ', ' + this.world.levels[this.index].name + '. Level ' + (this.index + 1) + '.';
  }

  assistOn() {
    return !!(this.app.settings && this.app.settings.assist);
  }

  fieldH() {
    const m = this.world.mode;
    if (m === 'flap') return tuning.flap.fieldH;
    if (m === 'flip') return tuning.flip.fieldH;
    if (m === 'mixed') return Math.max(tuning.flap.fieldH, tuning.flip.fieldH, tuning.run.field);
    return tuning.run.field;
  }

  updateScale() {
    const a = this.app;
    const need = this.fieldH();
    this.sc = Math.min(1, Math.max(0.5, (a.height * tuning.world.groundRatio - tuning.view.hudH) / need));
  }

  setup() {
    this.index = this.params.index || 0;
    this.def = this.world.levels[this.index];
    this.level = compileLevel(this.def, this.world.chunks);
    this.runtime = new LevelRuntime(this.level, this.mode, this.env, { assist: this.assistOn() });
  }

  hudConfig() {
    return {
      world: this.world.name,
      title: 'Level ' + (this.index + 1),
      countLabel: 'Tokens'
    };
  }

  progress() {
    const p = Math.min(1, this.runtime.distance / this.level.length);
    return { value: p, text: Math.floor(p * 100) + '%', count: this.runtime.collected + '/' + this.level.tokenTotal };
  }

  bind() {
    this.listen(window, 'keydown', (e) => {
      if (e.code === 'Escape') this.app.scenes.pause('Pause');
    });
  }

  suspend() {
    this.dispose();
  }

  resume() {
    this.app.input.reset();
    this.runtime.assist = this.assistOn();
    this.bind();
  }

  skip() {
    this.runtime.cheated = true;
    this.runtime.distance = this.level.length;
    this.runtime.prevDistance = this.level.length;
  }

  feet() {
    const p = this.player;
    return p.y + p.size;
  }

  collect(it, x, y) {
    if (it.kind === 'orb') {
      this.app.audio.play('bug');
      this.particles.burst(x, y, 10, 180, 0.6, 7, 'accent', true, 0);
    } else {
      this.app.audio.play('collect');
      this.particles.burst(x, y, 3, 90, 0.35, 6, 'accent', true, 0);
    }
  }

  onDeath() {
    const p = this.player;
    const fx = tuning.fx;
    this.app.audio.play('death');
    this.camera.shake(fx.deathShake);
    this.hitStop = fx.hitStopMs;
    this.particles.burst(p.x + p.size / 2, p.y + p.size / 2, 14, 260, 0.7, 7, 'accent', true, 0);
    this.particles.burst(p.x + p.size / 2, p.y + p.size / 2, 8, 200, 0.6, 6, 'solid', false, 0);
  }

  afterUpdate() {}

  finish() {
    const rt = this.runtime;
    const total = this.level.tokenTotal;
    const stars = computeStars({ collected: rt.collected, total, retries: rt.deaths, cheated: rt.cheated });
    const rec = this.app.save.record(this.def.id, { stars, time: rt.time, retries: rt.deaths });
    this.app.audio.play('win');
    this.app.scenes.go('Results', {
      kind: 'level',
      world: this.worldIndex,
      index: this.index,
      stars,
      deaths: rt.deaths,
      time: rt.time,
      collected: rt.collected,
      total,
      improved: rec.improved,
      cheated: rt.cheated
    });
  }

  update(dt) {
    this.updateScale();
    const rt = this.runtime;
    const input = this.app.input;
    const mode = this.mode;
    const audio = this.app.audio;
    const p = this.player;

    if (this.hitStop > 0) {
      this.hitStop -= dt * 1000;
      return;
    }

    const sdt = dt * (this.app.settings ? this.app.settings.timeScale() : 1);
    this.sdt = sdt;
    const wasGrounded = mode.grounded;
    if (rt.state === 'running') {
      if (!this.wasRunning) {
        input.consume();
        this.wasRunning = true;
      }
      if (input.buffered && mode.onPress()) {
        input.consume();
        audio.play('jump');
        this.particles.burst(p.x + p.size / 2, this.feet(), 4, 90, 0.35, 4, 'muted', false, -tuning.world.speed * 0.2);
        if (!input.down) mode.onRelease();
      }
      if (input.down) mode.onHold(input.heldMs);
      if (input.released) mode.onRelease();
    } else {
      this.wasRunning = false;
    }

    rt.update(sdt);

    if (rt.state === 'running' && this.prevState === 'running' && !wasGrounded && mode.grounded) {
      audio.play('land');
      this.camera.shake(tuning.fx.landShake);
      this.particles.burst(p.x + p.size / 2, this.feet(), 5, 110, 0.4, 4, 'muted', false, -tuning.world.speed * 0.25);
    }
    if (rt.state === 'dead' && this.prevState !== 'dead') this.onDeath();
    this.prevState = rt.state;

    this.afterUpdate(sdt);
    this.particles.update(dt);
    this.camera.update(dt);

    if (rt.state === 'won' && !this.finished) {
      this.finished = true;
      this.finish();
    }
  }

  drawObstacles(ctx, s, gy) {
    const pool = this.runtime.pool;
    const p = this.player;
    for (let i = 0; i < pool.count; i++) {
      const o = pool.active[i];
      drawObstacle(ctx, o, p.x + o.x - s, gy, this.runtime.time, s);
    }
  }

  drawItems(ctx, s, gy) {
    const rt = this.runtime;
    const items = this.level.items;
    const p = this.player;
    const width = this.env.width();
    for (let i = rt.itemLo; i < items.length; i++) {
      const it = items[i];
      const sx = p.x + it.x - s;
      if (sx > width + tuning.level.spawnMargin) break;
      if (it.got || sx < -tuning.level.despawnMargin) continue;
      const iy = gy - it.lift;
      if (it.kind === 'orb') drawOrb(ctx, sx, iy, tuning.orb.r, rt.time);
      else drawToken(ctx, sx, iy, tuning.token.r);
    }
  }

  drawExtras() {}

  render(alpha) {
    const ctx = this.app.ctx;
    this.updateScale();
    const width = this.env.width();
    const rt = this.runtime;
    const cam = this.camera;
    this.clear();
    const gy = this.env.groundY();
    const s = rt.prevDistance + (rt.distance - rt.prevDistance) * alpha;
    const p = this.player;

    ctx.save();
    ctx.scale(this.sc, this.sc);
    ctx.translate(cam.x, cam.y);

    drawBackdrop(ctx, width, gy, s);
    drawGround(ctx, width, gy, s, this.modeKind);

    this.drawObstacles(ctx, s, gy);
    this.drawItems(ctx, s, gy);
    this.drawExtras(ctx, gy);

    const y = p.prevY + (p.y - p.prevY) * alpha;
    if (rt.state !== 'dead') {
      drawPlayer(ctx, p.x, y, p.size, 1, this.mode.tilt ? this.mode.tilt() : 0);
      if (rt.shield) drawShield(ctx, p.x, y, p.size, 1);
      else if (rt.iframes > 0) drawShield(ctx, p.x, y, p.size, motion.reduced || Math.floor(rt.time * 24) % 2 ? 0.5 : 0.15);
    }
    this.particles.render(ctx);

    if (tuning.debug.showHitboxes) {
      ctx.strokeStyle = colors.debug;
      ctx.lineWidth = 1;
      const h = this.mode.getHitbox();
      ctx.strokeRect(h.x + 0.5, h.y + (y - p.y) + 0.5, h.w, h.h);
      const dx = rt.distance - s;
      const pool = rt.pool;
      for (let i = 0; i < pool.count; i++) {
        const o = pool.active[i].hit;
        ctx.strokeRect(o.x + dx + 0.5, o.y + 0.5, o.w, o.h);
      }
    }
    ctx.restore();

    const pr = this.progress();
    this.hud.update(rt, pr.value, pr.text, pr.count, pr.mode);
  }
}
