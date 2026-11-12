import { Scene } from '../engine/scenes.js';
import { tuning } from '../config/tuning.js';
import { worlds } from '../config/worlds.js';
import { worldLevels, worldUnlocked, worldComplete, gauntletUnlocked, medalsOf, totals, WORLD_IDS } from '../engine/progress.js';

const CAST = { 1: 'Kit · RUN', 2: 'Zzt · FLAP', 3: 'Pip · SURF', 4: 'Bolt · FLIP', 5: 'all four · MIX' };

export class WorldMapScene extends Scene {
  enter() {
    const save = this.app.save;
    const tt = totals(save);
    const cards = WORLD_IDS.map((w) => {
      const open = worldUnlocked(save, w);
      const list = worldLevels(w);
      const nodes = list
        .map((l, i) => {
          const r = save.data().levels[l.id] || {};
          const m = medalsOf(r);
          const best = Math.floor((r.bestPct || 0) * 100);
          const label = /\d$/.test(l.id) ? `${w}-${i + 1}` : '★';
          return `<button class="node" data-level="${l.id}" ${open ? '' : 'disabled'}><b>${label} ${l.name}</b><span class="meta"><span><span class="${m.clear ? 'm-on' : m.slow ? 'm-slow' : 'm-off'}">●</span> <span class="${m.clean ? 'm-on' : 'm-off'}">★</span> <span class="${m.shard ? 'm-on' : 'm-off'}">◆</span></span><span>${best}% · ${r.attempts || 0}</span></span></button>`;
        })
        .join('');
      const gUnlocked = gauntletUnlocked(save, w);
      const gDone = save.gauntlet(w);
      const gl = gDone ? 'Gauntlet ✔' : 'Gauntlet';
      return `<div class="world ${open ? '' : 'locked'}"><h3>${worlds[w].name}</h3><div class="who">${CAST[w]}${open ? '' : ' · locked'}</div>${nodes}<button class="btn small" data-gauntlet="${w}" ${gUnlocked ? '' : 'disabled'}>${gl}</button></div>`;
    }).join('');
    const el = this.mount(
      `<div class="ui map"><div class="maphead"><h2>Worlds</h2><span class="sub">${tt.clear}/${tt.levels} ● · ${tt.clean} ★ · ${tt.shard} ◆</span><span class="row" style="margin:0"><button class="btn small ghost" data-act="settings">Settings</button><button class="btn small ghost" data-act="title">Title</button></span></div><div class="worlds">${cards}</div></div>`,
      'layer'
    );
    el.addEventListener('click', (e) => {
      const lvl = e.target.closest('[data-level]');
      const g = e.target.closest('[data-gauntlet]');
      const act = e.target.closest('[data-act]');
      this.app.sound.unlock();
      this.app.sound.play('click');
      if (lvl && !lvl.disabled) this.app.scenes.go('play', { levelId: lvl.dataset.level });
      else if (g && !g.disabled) {
        const w = Number(g.dataset.gauntlet);
        this.app.scenes.go('play', { gauntlet: { world: w, ids: worldLevels(w).map((l) => l.id), i: 0 } });
      } else if (act && act.dataset.act === 'settings') this.app.scenes.pause('settings');
      else if (act && act.dataset.act === 'title') this.app.scenes.go('title');
    });
    this.t = 0;
  }

  update(dt) {
    this.t += dt;
  }

  render() {
    const { ctx } = this.app;
    const { w, h } = tuning.stage;
    ctx.fillStyle = '#0b0d18';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let x = -((this.t * 20) % 80); x < w; x += 80) ctx.fillRect(x, 0, 2, h);
  }
}
