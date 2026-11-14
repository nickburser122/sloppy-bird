import { Scene } from '../engine/scenes.js';
import { Session } from '../engine/session.js';
import { Particles } from '../engine/particles.js';
import { Input } from '../engine/input.js';
import { FLAG } from '../modes/run.js';
import { modes } from '../modes/index.js';
import { compile } from '../levels/runtime.js';
import { levels, byId } from '../levels/index.js';
import { worldLevels, isClean } from '../engine/progress.js';
import { newEndless } from '../ui/worldmap.js';
import { worlds } from '../config/worlds.js';
import { tuning } from '../config/tuning.js';
import { colors, fonts } from '../config/tokens.js';
import { drawHud } from '../ui/hud.js';
import { drawDeath } from '../ui/deathflash.js';
import { drawDebug } from '../ui/debug.js';

const W = tuning.stage.w;
const H = tuning.stage.h;
const CENTER_X = 220;

export class PlayScene extends Scene {
  constructor(app) {
    super(app);
    this.particles = new Particles();
    this.ghostInput = new Input();
    this.onKey = this.onKey.bind(this);
  }

  enter(params = {}) {
    this.gauntlet = params.gauntlet || null;
    this.endless = params.endless || null;
    this.chain = this.gauntlet || this.endless;
    this.app.input.attach(this.app.stage);
    this.listen(window, 'keydown', this.onKey);
    this.hud = this.mount('<div class="hudbtns"><button class="btn small" data-act="map">map</button><button class="btn small" data-act="settings">settings</button></div>', 'layer');
    this.hud.style.pointerEvents = 'none';
    this.hud.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]');
      if (!a) return;
      if (a.dataset.act === 'map') this.toMap();
      if (a.dataset.act === 'settings') this.app.scenes.pause('settings');
    });
    const id = this.chain ? this.chain.ids[this.chain.i] : params.levelId || this.app.levelId;
    this.load(id);
  }

  exit() {
    this.app.input.detachAll();
    this.app.music.stop();
  }

  suspend() {
    this.app.music.stop();
  }

  resume() {
    this.app.input.reset();
    if (this.slow !== this.app.save.settings().slow) this.load(this.level.id);
    else this.app.music.start({ ...this.world, bpm: this.level.bpm * this.timeScale });
  }

  toMap() {
    this.app.scenes.go('worldmap');
  }

  load(id) {
    if (this.results) {
      this.results.remove();
      this.results = null;
    }
    this.level = byId(id) || levels[0];
    this.compiled = compile(this.level);
    this.mode = modes[this.level.mode];
    this.sim = new this.mode.Sim(this.compiled);
    this.rec = this.app.save.level(this.level.id);
    this.world = worlds[this.level.world];
    const st = this.app.save.settings();
    this.slow = this.chain ? false : st.slow;
    this.timeScale = (this.slow ? 0.75 : 1) * (this.endless ? Math.min(1.5, 1 + 0.05 * this.endless.lap) : 1);
    this.acc = 0;
    this.sessionDeaths = 0;
    this.failed = false;
    this.shard = this.compiled.shard;
    const g = this.rec.ghost;
    this.ghostEv = st.ghost && !this.slow && !this.chain && g && g.ev ? g.ev : null;
    this.ghostSim = this.ghostEv ? new this.mode.Sim(this.compiled) : null;
    this.session = new Session({ reset: () => this.reset(), onDeath: (pct) => this.onDeath(pct) });
    this.session.best = this.rec.bestPct;
    this.session.attempt = this.rec.attempts + 1;
    this.app.music.start({ ...this.world, bpm: this.level.bpm * this.timeScale });
    this.reset();
  }

  reset() {
    this.sim.reset();
    this.prevY = this.sim.y;
    this.foxT = 0;
    this.landT = 0;
    this.flapT = 0;
    this.winT = -1;
    this.punch = 0;
    this.log = [];
    this.gi = 0;
    if (this.ghostSim) {
      this.ghostSim.reset();
      this.ghostInput.reset();
    }
    this.particles.clear();
    this.app.music.sync();
  }

  saveGhost(pct) {
    if (this.slow || this.chain) return;
    const cur = this.rec.ghost ? this.rec.ghost.pct : 0;
    if (pct > cur) this.rec.ghost = { pct, ev: this.log.slice(0, 700) };
  }

  onDeath(pct) {
    this.rec.attempts++;
    this.sessionDeaths++;
    if (pct > this.rec.bestPct) this.rec.bestPct = pct;
    this.saveGhost(pct);
    this.app.save.persist();
    if (this.gauntlet) {
      this.failed = true;
      this.showGauntletFail();
    } else if (this.endless) {
      this.failed = true;
      this.showEndlessOver(pct);
    }
  }

  nextLevelId() {
    const list = worldLevels(this.level.world);
    const i = list.findIndex((l) => l.id === this.level.id);
    return list[i + 1] ? list[i + 1].id : null;
  }

  onClear() {
    const s = this.app.save;
    this.rec.attempts++;
    const wasCleared = this.rec.clear;
    if (this.chain) {
      this.winT = 0;
      this.app.sound.play('win');
      s.persist();
      this.advanceChain();
      return;
    }
    if (this.slow) this.rec.clearSlow = true;
    else {
      this.rec.clear = true;
      this.rec.bestPct = 1;
      if (isClean(this.sessionDeaths + 1, wasCleared)) this.rec.clean = true;
      this.saveGhost(1);
      if (this.sim.shardGot) this.rec.shard = true;
    }
    s.persist();
    this.session.best = Math.max(this.session.best, this.slow ? 0 : 1);
    this.winT = 0;
    this.app.sound.play('win');
    const ctr = this.mode.center(this.sim);
    this.particles.burst(ctr.x + 80, ctr.y - 40, 46, ['#ffd24a', '#ffffff', ...(this.mode.colorsFor ? this.mode.colorsFor(this.sim) : this.mode.colors)], { speed: 420, life: 1.1, size: 5, g: 700, kind: 1, up: 260 });
    this.app.announce('Level clear');
    this.showResults();
  }

  showResults() {
    const r = this.rec;
    const next = this.nextLevelId();
    const shardBtn = this.shard && !r.shard ? 'retry for shard' : 'retry';
    const got = this.sim.shardGot && !this.slow;
    const medals = `<span class="${r.clear ? 'on' : 'slow'}">● clear${this.slow ? ' (slow)' : ''}</span>  <span class="${r.clean ? 'on' : 'off'}">★ clean</span>  <span class="${r.shard ? 'on' : 'off'}">◆ shard${got ? ' +' : ''}</span>`;
    this.results = this.mount(
      `<div class="ui"><div class="panel"><h2>clear</h2><p>${this.level.name} · ${this.sessionDeaths + 1} attempt${this.sessionDeaths ? 's' : ''}</p><p>${medals}</p><div class="row"><button class="btn" data-act="next">${next ? 'next' : 'map'}</button><button class="btn" data-act="retry">${shardBtn}</button>${next ? '<button class="btn" data-act="map">map</button>' : ''}</div></div></div>`,
      'layer'
    );
    this.results.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]');
      if (!a) return;
      if (a.dataset.act === 'next') {
        if (next) this.load(next);
        else this.toMap();
      }
      if (a.dataset.act === 'retry') this.load(this.level.id);
      if (a.dataset.act === 'map') this.toMap();
    });
  }

  advanceChain() {
    const g = this.chain;
    if (this.endless) {
      g.cleared++;
      if (g.i + 1 < g.ids.length) g.i++;
      else {
        const fresh = newEndless(g.world);
        if (fresh.ids[0] === this.level.id && fresh.ids.length > 1) fresh.ids.push(fresh.ids.shift());
        g.ids = fresh.ids;
        g.i = 0;
        g.lap++;
      }
      this.later(600, () => this.load(g.ids[g.i]));
      return;
    }
    if (g.i + 1 < g.ids.length) {
      g.i++;
      this.later(700, () => this.load(g.ids[g.i]));
      return;
    }
    this.app.save.setGauntlet(g.world);
    this.results = this.mount(
      `<div class="ui"><div class="panel"><h2>gauntlet cleared</h2><p>${worlds[g.world].name} · zero deaths</p><div class="row"><button class="btn" data-act="map">map</button></div></div></div>`,
      'layer'
    );
    this.results.addEventListener('click', (e) => {
      if (e.target.closest('[data-act="map"]')) this.toMap();
    });
  }

  showEndlessOver(pct) {
    const g = this.endless;
    const score = g.cleared + pct;
    const isBest = this.app.save.setEndlessBest(g.world, score);
    const best = this.app.save.endlessBest(g.world);
    this.results = this.mount(
      `<div class="ui"><div class="panel"><h2>${worlds[g.world].name.toLowerCase()} · endless</h2><p>${g.cleared} cleared · lap ${g.lap + 1} · ${Math.floor(pct * 100)}% of ${this.level.name.toLowerCase()}</p><p>${score.toFixed(2)}${isBest ? ' · new best' : ` · best ${best.toFixed(2)}`}</p><div class="row"><button class="btn" data-act="again">again</button><button class="btn" data-act="map">map</button></div></div></div>`,
      'layer'
    );
    this.results.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]');
      if (!a) return;
      if (a.dataset.act === 'again') {
        const fresh = newEndless(g.world);
        g.ids = fresh.ids;
        g.i = 0;
        g.lap = 0;
        g.cleared = 0;
        this.load(g.ids[0]);
      }
      if (a.dataset.act === 'map') this.toMap();
    });
  }

  showGauntletFail() {
    const g = this.gauntlet;
    this.results = this.mount(
      `<div class="ui"><div class="panel"><h2>gauntlet failed</h2><p>${this.level.name} · ${Math.floor(this.session.lastPct * 100)}% · level ${g.i + 1}/${g.ids.length}</p><div class="row"><button class="btn" data-act="retry">retry</button><button class="btn" data-act="map">map</button></div></div></div>`,
      'layer'
    );
    this.results.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]');
      if (!a) return;
      if (a.dataset.act === 'retry') {
        g.i = 0;
        this.load(g.ids[0]);
      }
      if (a.dataset.act === 'map') this.toMap();
    });
  }

  onKey(e) {
    if (e.code === 'Escape') this.toMap();
    if (e.code === 'KeyM') this.app.sound.setMuted(!this.app.sound.muted);
    const n = Number(e.key);
    if (this.app.debug.on && n >= 1 && n <= levels.length) this.load(levels[n - 1].id);
  }

  fx(flags) {
    const sim = this.sim;
    const ctr = this.mode.center(sim);
    const fx = ctr.x;
    const fy = ctr.y + 20;
    const dust = (this.mode.dustFor ? this.mode.dustFor(sim) : this.mode.dust) || '#e8c9a0';
    if (flags & FLAG.JUMP) {
      this.flapT = 0.18;
      this.app.sound.play('pop');
      this.particles.burst(fx, fy, 5, [dust], { speed: 90, life: 0.3, size: 3, g: 200, up: 40 });
    }
    if (flags & FLAG.LAND) {
      this.landT = 0.12;
      this.app.sound.play('land');
      this.particles.burst(fx, fy, 6, [dust], { speed: 110, life: 0.3, size: 3, g: 200, up: 30 });
    }
    if (flags & FLAG.RING) {
      this.app.sound.play('ring');
      this.particles.burst(fx, fy - 20, 10, ['#ffd24a'], { speed: 200, life: 0.4, size: 3, g: 0 });
    }
    if (flags & FLAG.PORTAL) {
      this.punch = 1;
      this.prevY = sim.y;
      this.app.sound.play('portal');
    }
    if (flags & FLAG.PAD) this.app.sound.play('pad');
    if (flags & FLAG.CRUMBLE) this.app.sound.play('crumble');
  }

  record(input) {
    const t = this.sim.tick;
    if (input.pressed && input.released) {
      if (input.down) this.log.push([t, false], [t, true]);
      else this.log.push([t, true], [t, false]);
    } else if (input.pressed) this.log.push([t, true]);
    else if (input.released) this.log.push([t, false]);
  }

  stepGhost(dt) {
    const gs = this.ghostSim;
    if (!gs || gs.dead || gs.won) return;
    const ev = this.ghostEv;
    while (this.gi < ev.length && ev[this.gi][0] <= gs.tick) {
      this.ghostInput.setSource('g', ev[this.gi][1]);
      this.gi++;
    }
    this.ghostInput.update(dt * 1000);
    gs.update(dt, this.ghostInput);
  }

  update(dt) {
    this.acc += this.timeScale;
    if (this.acc < 1) {
      this.app.music.update();
      return;
    }
    let n = 0;
    while (this.acc >= 1 && n < 3) {
      this.acc -= 1;
      n++;
      this.tick(dt);
    }
  }

  tick(dt) {
    const { input, sound, music } = this.app;
    const dtMs = dt * 1000;
    input.update(dtMs);
    if (input.pressed) sound.unlock();
    music.update();
    const s = this.session;
    if (this.winT >= 0) {
      this.winT += dtMs;
      if (!this.results && !this.chain && input.pressed && this.winT > 500) this.showResults();
      this.particles.update(dt);
      return;
    }
    if (this.failed) {
      this.particles.update(dt);
      return;
    }
    if (!s.alive) {
      if (!s.frozen) this.particles.update(dt);
      s.update(dtMs, input);
      return;
    }
    const sim = this.sim;
    this.prevY = sim.y;
    this.record(input);
    this.stepGhost(dt);
    sim.update(dt, input);
    this.foxT += dt;
    this.landT = Math.max(0, this.landT - dt);
    this.flapT = Math.max(0, this.flapT - dt);
    this.punch = Math.max(0, this.punch - dt * 6);
    this.fx(sim.flags);
    if (sim.dead) {
      sound.play('death');
      music.duck(380);
      const ctr = this.mode.center(sim);
      this.particles.burst(ctr.x, ctr.y, 34, this.mode.colorsFor ? this.mode.colorsFor(sim) : this.mode.colors, { speed: 380, life: 0.7, size: 5, g: 900, kind: 1, up: 120 });
      s.die(sim.pct);
      return;
    }
    if (sim.won) this.onClear();
    this.particles.update(dt);
  }

  drawShard(ctx, sim) {
    const sh = this.shard;
    if (!sh) return;
    const sx = sh.ox - sim.xt + CENTER_X;
    if (sx < -30 || sx > W + 30) return;
    const got = sim.shardGot;
    const pulse = 0.5 + 0.5 * Math.sin(sim.t * 6);
    ctx.save();
    ctx.translate(sx, sh.y);
    ctx.globalAlpha = got ? 0.15 : this.rec.shard ? 0.55 : 1;
    ctx.shadowColor = '#7df9ff';
    ctx.shadowBlur = 14 + pulse * 8;
    ctx.fillStyle = '#b8fcff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.lineTo(12, 0);
    ctx.lineTo(0, 17);
    ctx.lineTo(-12, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  render(alpha) {
    const { ctx, debug } = this.app;
    const sim = this.sim;
    const s = this.session;
    const pal = this.world.pal;
    ctx.save();
    if (this.punch > 0 && !this.app.reducedMotion) {
      const k = 1 + 0.025 * this.punch;
      ctx.translate(W / 2, H / 2);
      ctx.scale(k, k);
      ctx.translate(-W / 2, -H / 2);
    }
    if (s.state === 'dying' && !s.frozen && !this.app.reducedMotion) {
      const k = 1 - Math.min(1, s.t / tuning.restart.deathMs);
      const amp = tuning.restart.shakePx * k;
      ctx.translate((Math.random() - 0.5) * 2 * amp, (Math.random() - 0.5) * 2 * amp);
    }
    this.mode.drawWorld(ctx, sim, pal, { motion: this.app.reducedMotion });
    this.drawShard(ctx, sim);
    const y = this.prevY + (sim.y - this.prevY) * alpha;
    const gs = this.ghostSim;
    if (gs && !gs.dead && s.alive) {
      const gc = this.mode.center(gs);
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = '#7df9ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(gc.x, gc.y, 17, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (s.alive) this.mode.drawChar(ctx, y, { t: this.foxT, vy: sim.vy, grounded: sim.grounded, landT: this.landT, gd: sim.gd, modeName: sim.modeName, flapT: this.flapT, air: sim.air, depth: sim.depth, slope: sim.slope, hold: this.app.input.down });
    this.particles.draw(ctx);
    if (debug.on && debug.hitboxes) {
      const hr = this.mode.hitRect(y, sim);
      ctx.strokeStyle = colors.hitbox;
      ctx.lineWidth = 1;
      ctx.strokeRect(hr.x, hr.y, hr.w, hr.h);
    }
    ctx.restore();
    const beatF = (sim.t / this.compiled.beatSec) % 1;
    drawHud(ctx, W, { pct: sim.pct, best: s.best, attempt: s.attempt, pulse: this.app.reducedMotion ? 0 : (1 - beatF) * (1 - beatF) });
    if (this.shard) {
      ctx.fillStyle = sim.shardGot ? '#b8fcff' : this.rec.shard ? '#7a8fa6' : '#3a4560';
      ctx.font = `700 16px ${fonts.mono}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(sim.shardGot ? '◆ shard' : '◇ shard', 16, 42);
    }
    if (this.slow) {
      ctx.fillStyle = '#6ec3ff';
      ctx.font = `700 14px ${fonts.mono}`;
      ctx.textAlign = 'left';
      ctx.fillText('SLOW ×0.75', 16, 64);
    }
    if (this.endless) {
      ctx.fillStyle = '#c9ced8';
      ctx.font = `300 14px ${fonts.mono}`;
      ctx.textAlign = 'center';
      ctx.fillText(`endless · lap ${this.endless.lap + 1} · ${this.endless.cleared} cleared · ×${this.timeScale.toFixed(2)}`, W / 2, 20);
    }
    if (this.gauntlet) {
      ctx.fillStyle = '#ffd24a';
      ctx.font = `700 14px ${fonts.mono}`;
      ctx.textAlign = 'center';
      ctx.fillText(`GAUNTLET ${this.gauntlet.i + 1}/${this.gauntlet.ids.length} · zero deaths`, W / 2, 20);
    }
    if (sim.t < 2.2 && !this.chain) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, 2.2 - sim.t));
      ctx.fillStyle = colors.fg;
      ctx.font = `700 22px ${fonts.mono}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`${this.level.world}-${/\d$/.test(this.level.id) ? this.level.id.slice(-1) : '★'}  ${this.level.name}`, W / 2, 20);
      ctx.restore();
    }
    if (!this.failed) drawDeath(ctx, W, H, s);
    if (this.winT >= 0 && !this.results) {
      ctx.fillStyle = 'rgba(8,10,16,0.3)';
      ctx.fillRect(0, 0, W, H);
    }
    drawDebug(ctx, W, debug, [`t ${sim.t.toFixed(2)}s`, `level ${this.level.id}`, `best ${(s.best * 100).toFixed(0)}%`]);
  }
}
