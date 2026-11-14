import { Scene } from '../engine/scenes.js';
import { tuning } from '../config/tuning.js';
import { worlds } from '../config/worlds.js';
import { worldLevels, endlessUnlocked, gauntletUnlocked, medalsOf, totals, WORLD_IDS } from '../engine/progress.js';

const CAST = { 1: 'kit · run', 2: 'zzt · flap', 3: 'pip · surf', 4: 'bolt · flip', 5: 'all four · mix' };

const shuffle = (list) => {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export function newEndless(world) {
  return { world, ids: shuffle(worldLevels(world).map((l) => l.id)), i: 0, lap: 0, cleared: 0 };
}

export class WorldMapScene extends Scene {
  enter() {
    const save = this.app.save;
    const tt = totals(save);
    const rows = WORLD_IDS.map((w) => {
      const list = worldLevels(w);
      const chips = list
        .map((l, i) => {
          const r = save.data().levels[l.id] || {};
          const m = medalsOf(r);
          const label = /\d$/.test(l.id) ? String(i + 1) : '★';
          return `<button class="chip" data-level="${l.id}"><span class="top"><b>${label}</b><span><span class="${m.clear ? 'on' : m.slow ? 'slow' : 'off'}">●</span><span class="${m.clean ? 'on' : 'off'}">★</span><span class="${m.shard ? 'on' : 'off'}">◆</span></span></span><span class="nm">${l.name.toLowerCase()}</span></button>`;
        })
        .join('');
      const eOpen = endlessUnlocked(save, w);
      const best = save.endlessBest(w);
      const eLabel = eOpen ? (best ? `endless ${best.toFixed(2)}` : 'endless') : 'endless —';
      const gOpen = gauntletUnlocked(save, w);
      const gLabel = save.gauntlet(w) ? 'gauntlet ✓' : 'gauntlet';
      return `<section class="wl"><div class="wh"><span class="wn">${worlds[w].name.toLowerCase()}</span><span class="wm">${CAST[w]}</span></div><div class="wlv">${chips}<span class="sp"></span><button class="link small" data-endless="${w}" ${eOpen ? '' : 'disabled title="clear this world first"'}>${eLabel}</button><button class="link small" data-gauntlet="${w}" ${gOpen ? '' : 'disabled title="clear this world first"'}>${gLabel}</button></div></section>`;
    }).join('');
    const el = this.mount(
      `<div class="ui map"><div class="maphead"><button class="link small" data-act="title">‹ back</button><span>${tt.clear} / ${tt.levels} · ${tt.clean} ★ · ${tt.shard} ◆</span><button class="link small" data-act="settings">settings</button></div>${rows}</div>`,
      'layer'
    );
    el.addEventListener('click', (e) => {
      const lvl = e.target.closest('[data-level]');
      const g = e.target.closest('[data-gauntlet]');
      const en = e.target.closest('[data-endless]');
      const act = e.target.closest('[data-act]');
      this.app.sound.unlock();
      if (lvl || (g && !g.disabled) || (en && !en.disabled) || act) this.app.sound.play('click');
      if (lvl) this.app.scenes.go('play', { levelId: lvl.dataset.level });
      else if (en && !en.disabled) this.app.scenes.go('play', { endless: newEndless(Number(en.dataset.endless)) });
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
    ctx.fillStyle = '#0b0c10';
    ctx.fillRect(0, 0, w, h);
  }
}
