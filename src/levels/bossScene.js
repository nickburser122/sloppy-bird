import { LevelScene } from './levelScene.js';
import { Pool } from '../engine/pool.js';
import { tuning } from '../config/tuning.js';
import { colors } from '../config/tokens.js';
import { LevelRuntime } from './runtime.js';
import { createMode } from '../modes/index.js';
import { BossDirector, createBossLevel, telegraphBoost } from './boss.js';
import { computeStars } from './scoring.js';
import { bossLayout } from '../entities/bosses/shared.js';

export class BossScene extends LevelScene {
  setup() {
    const cfg = this.world.boss;
    this.cfg = cfg;
    this.index = this.world.levels.length;
    this.def = { id: this.world.bossId };
    this.level = createBossLevel({ id: this.world.bossId, name: cfg.title, mode: this.modeKind, speedMul: cfg.speedMul, mixed: !!cfg.modes });
    this.runtime = new LevelRuntime(this.level, this.mode, this.env, { assist: this.assistOn() });
    this.director = new BossDirector(this.level, this.runtime, () => this.gap(), cfg.patterns, cfg.orbLift, cfg.orbGap, cfg.restPx, cfg.phaseSize);
    this.director.onHit = (dead) => this.fireBug(dead);
    this.seenRestart = this.runtime.restartCount;
    this.showCheckpoint = false;
    this.bugs = new Pool(4, () => ({ x: 0, y: 0, last: false }));
    this.telegraphT = -1;
    this.label = '';
    this.flinch = 0;
    this.victory = -1;
    this.bugStep = this.bugStep.bind(this);
    this.bugDt = 0;
  }

  intro() {
    return this.cfg.title + ' boss fight.';
  }

  layout() {
    return bossLayout(this.env.width(), this.env.groundY(), this.cfg.tall ? this.fieldH() : 0);
  }

  gap() {
    return this.layout().x + 10 - this.player.x;
  }

  hudConfig() {
    return { world: this.world.name, title: 'Boss', checkpointPct: null, countLabel: 'Bugs filed' };
  }

  progress() {
    const d = this.director;
    return {
      value: d.hp / d.total,
      text: d.hp + '/' + d.total,
      count: String(d.hits),
      mode: this.cfg.modes ? this.modeKind.toUpperCase() : ''
    };
  }

  skip() {
    this.runtime.cheated = true;
    this.director.forceDefeat();
    this.victory = 0;
  }

  switchMode(kind) {
    const rt = this.runtime;
    const p = this.player;
    this.particles.burst(p.x + p.size / 2, p.y + p.size / 2, 16, 280, 0.6, 7, 'accent', false, 0);
    const mode = createMode(kind, this.player, this.env);
    mode.d = rt.distance;
    mode.dx = 0;
    mode.reset();
    this.mode = mode;
    rt.mode = mode;
    this.modeKind = kind;
    this.app.audio.play('switch');
    this.announce(kind + ' mode');
    this.camera.shake(tuning.fx.landShake);
    this.app.input.consume();
    this.particles.burst(p.x + p.size / 2, p.y + p.size / 2, 16, 280, 0.6, 7, 'accent', true, 0);
  }

  fireBug(dead) {
    const b = this.bugs.acquire();
    if (!b) return;
    b.x = this.player.x + this.player.size;
    b.y = this.player.y + this.player.size / 2;
    b.last = dead;
  }

  bugStep(b) {
    const target = this.layout().x + 10;
    b.x += tuning.boss.bugSpeed * this.bugDt;
    if (b.x < target) return true;
    const L = this.layout();
    const cy = L.y + L.h * 0.45;
    this.flinch = 1;
    this.app.audio.play('hit');
    this.camera.shake(tuning.fx.deathShake);
    this.particles.burst(target, cy, 12, 240, 0.7, 7, 'accent', false, 0);
    this.particles.burst(target, cy, 6, 200, 0.7, 7, 'solid', false, 0);
    if (b.last) {
      this.particles.burst(L.x + L.w / 2, cy, 40, 360, 1, 9, 'accent', true, 0);
      this.victory = 0;
    }
    return false;
  }

  afterUpdate(dt) {
    const d = this.director;
    const rt = this.runtime;
    if (rt.restartCount !== this.seenRestart) {
      this.seenRestart = rt.restartCount;
      if (d.cur) d.cur.telegraphed = false;
      this.telegraphT = -1;
    }
    d.update();

    const cur = d.cur;
    if (cur && cur.mode !== this.modeKind && rt.state === 'running' && rt.distance >= this.level.checkpoint) {
      this.switchMode(cur.mode);
    }
    if (cur && !cur.telegraphed && !cur.done && !d.defeated) {
      const first = this.level.obstacles[cur.firstIdx];
      const lead = (this.level.speedAt(rt.distance) * telegraphBoost(cur.mode) * tuning.boss.telegraphMs) / 1000;
      if (first.x - rt.distance - this.gap() <= lead) {
        cur.telegraphed = true;
        this.telegraphT = 0;
        this.label = this.cfg.patterns[cur.index].name;
        this.app.audio.play('telegraph');
        this.announce('Incoming: ' + this.label);
      }
    }
    if (this.telegraphT >= 0) {
      this.telegraphT += dt * 1000;
      if (this.telegraphT > tuning.boss.telegraphMs) this.telegraphT = -1;
    }

    this.bugDt = dt;
    this.bugs.update(this.bugStep);
    this.flinch = Math.max(0, this.flinch - (dt * 1000) / tuning.boss.flinchMs);

    if (this.victory >= 0) {
      this.victory += dt * 1000;
      if (this.victory >= tuning.fx.victoryMs && !this.finished) {
        this.finished = true;
        this.finishBoss();
      }
    }
  }

  update(dt) {
    if (this.victory >= 0 && this.finished) return;
    super.update(dt);
  }

  finishBoss() {
    const rt = this.runtime;
    const d = this.director;
    const stars = computeStars({ collected: d.hits, total: d.offered, retries: rt.deaths, cheated: rt.cheated });
    const rec = this.app.save.record(this.def.id, { stars, time: rt.time, retries: rt.deaths });
    this.app.audio.play('win');
    this.app.scenes.go('Results', {
      kind: 'boss',
      world: this.worldIndex,
      index: this.index,
      stars,
      deaths: rt.deaths,
      time: rt.time,
      collected: d.hits,
      total: d.offered,
      improved: rec.improved,
      cheated: rt.cheated
    });
  }

  drawObstacles(ctx, s, gy) {
    const L = this.layout();
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, L.x + 10, 4000);
    ctx.clip();
    super.drawObstacles(ctx, s, gy);
    ctx.restore();
  }

  drawItems(ctx, s, gy) {
    const L = this.layout();
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, L.x + 10, 4000);
    ctx.clip();
    super.drawItems(ctx, s, gy);
    ctx.restore();
  }

  drawExtras(ctx) {
    const L = this.layout();
    if (this.victory < 0) {
      this.cfg.draw(ctx, L, {
        flash: this.telegraphT,
        flinch: this.flinch,
        phase: this.level.phase,
        label: this.label,
        time: this.runtime.time
      });
    }
    const pool = this.bugs;
    ctx.fillStyle = colors.accent;
    for (let i = 0; i < pool.count; i++) {
      const b = pool.active[i];
      ctx.beginPath();
      ctx.roundRect(b.x - 7, b.y - 5, 14, 10, 4);
      ctx.fill();
    }
  }
}
