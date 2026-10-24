import { Scene } from '../../engine/scenes.js';
import { drawBackdrop, drawGround } from '../../levels/draw.js';
import { worlds, allOrder } from '../../levels/worlds.js';
import { tuning } from '../../config/tuning.js';
import { applyTheme } from '../../config/tokens.js';
import { BRAND_MARK } from '../hud.js';
import { rating, clock } from './parts.js';

function entriesFor(wi) {
  const w = worlds[wi];
  const list = w.levels.map((d, i) => ({
    id: d.id,
    title: 'Level ' + (i + 1),
    name: d.name,
    blurb: d.blurb,
    scene: 'Level',
    params: { world: wi, index: i }
  }));
  list.push({
    id: w.bossId,
    title: 'Boss',
    name: w.boss.title,
    blurb: w.boss.blurb,
    scene: 'Boss',
    params: { world: wi }
  });
  return list;
}

export class WorldSelectScene extends Scene {
  enter(params) {
    applyTheme('landing');
    const save = this.app.save;
    this.titles = {};
    for (let wi = 0; wi < worlds.length; wi++) {
      for (const e of entriesFor(wi)) this.titles[e.id] = worlds[wi].name + ' ' + e.title.toLowerCase();
    }
    let start = params && params.world !== undefined ? params.world : -1;
    if (start < 0) {
      start = 0;
      for (let wi = 0; wi < worlds.length; wi++) {
        if (entriesFor(wi).some((e) => save.isUnlocked(allOrder, e.id) && !save.completed(e.id))) {
          start = wi;
          break;
        }
        start = wi;
      }
    }
    this.wi = start;
    const tabs = worlds
      .map((w, i) => '<button type="button" class="tab" data-tab="' + i + '">' + w.name + '</button>')
      .join('');
    const el = this.mount(
      '<header class="nav"><span class="brand">' +
        BRAND_MARK +
        '<b>Above the Fold</b></span><span class="nav-right"><button type="button" class="cta ghost small" data-settings>Settings</button><button type="button" class="cta ghost small" data-back>Back</button></span></header>' +
        '<div class="select-body" data-ui><div class="tabs" role="tablist">' +
        tabs +
        '</div><h2></h2><p class="lede"></p><div class="plans"></div></div>',
      'screen select'
    );
    this.el = el;
    el.addEventListener('click', (ev) => {
      const t = ev.target.closest('button');
      if (!t || t.disabled) return;
      this.app.audio.play('click');
      if (t.hasAttribute('data-back')) {
        this.app.scenes.go('Menu');
        return;
      }
      if (t.hasAttribute('data-settings')) {
        this.app.scenes.go('Settings', { from: 'WorldSelect' });
        return;
      }
      if (t.hasAttribute('data-tab')) {
        this.wi = Number(t.getAttribute('data-tab'));
        this.fill(false);
        return;
      }
      const e = this.entries[Number(t.getAttribute('data-i'))];
      this.app.scenes.go(e.scene, e.params);
    });
    this.fill(true);
    document.documentElement.classList.add('allow-scroll');
    this.cleanups.push(() => document.documentElement.classList.remove('allow-scroll'));
    this.listen(window, 'keydown', (ev) => {
      if (ev.code === 'Escape') {
        this.app.scenes.go('Menu');
        return;
      }
      if (ev.code !== 'ArrowRight' && ev.code !== 'ArrowLeft') return;
      const buttons = Array.from(this.el.querySelectorAll('.plan .cta:not([disabled])'));
      if (!buttons.length) return;
      const at = buttons.indexOf(document.activeElement);
      const step = ev.code === 'ArrowRight' ? 1 : -1;
      buttons[(at + step + buttons.length) % buttons.length].focus();
    });
    this.scroll = 0;
  }

  fill(focus) {
    const save = this.app.save;
    const w = worlds[this.wi];
    const entries = entriesFor(this.wi);
    this.entries = entries;
    let upNext = -1;
    for (let i = 0; i < entries.length; i++) {
      if (save.isUnlocked(allOrder, entries[i].id) && !save.completed(entries[i].id)) {
        upNext = i;
        break;
      }
    }
    let cards = '';
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      const unlocked = save.isUnlocked(allOrder, e.id);
      const rec = save.get(e.id);
      const prev = this.titles[allOrder[allOrder.indexOf(e.id) - 1]];
      const label = !unlocked ? 'Finish ' + prev + ' first' : rec ? 'Replay' : 'Play';
      cards +=
        '<article class="plan' +
        (unlocked ? '' : ' locked') +
        (i === upNext ? ' up-next' : '') +
        '">' +
        (i === upNext ? '<span class="badge">Up next</span>' : '') +
        '<h3>' +
        e.title +
        '</h3><p class="name">' +
        e.name +
        '</p>' +
        rating(rec ? rec.stars : 0) +
        '<ul class="features">' +
        e.blurb.map((b) => '<li>' + b + '</li>').join('') +
        '</ul><dl class="best"><div><dt>Best time</dt><dd class="mono">' +
        (rec && rec.bestTime !== null ? clock(rec.bestTime) : '\u2013') +
        '</dd></div><div><dt>Fewest retries</dt><dd class="mono">' +
        (rec && rec.bestRetries !== null ? rec.bestRetries : '\u2013') +
        '</dd></div></dl><button type="button" class="cta' +
        (i === upNext ? '' : ' ghost') +
        '" data-i="' +
        i +
        '"' +
        (unlocked ? '' : ' disabled') +
        '>' +
        label +
        '</button></article>';
    }
    const el = this.el;
    el.querySelector('h2').textContent = w.name;
    el.querySelector('.lede').textContent =
      w.mode === 'mixed'
        ? 'The last boss. Every mode, one after another.'
        : w.mode === 'flap'
          ? 'Tap to flap, hold to glide. Four stops through the feed.'
          : w.mode === 'surf'
            ? 'Hold to dive, release to fly. Ride the chart.'
            : w.mode === 'flip'
              ? 'Tap to flip gravity. Code blocks grow from both sides.'
              : 'Four stops from hero section to cookie wall. Finish one to unlock the next.';
    el.querySelector('.plans').innerHTML = cards;
    el.querySelectorAll('.plans button').forEach((b) => b.setAttribute('data-ui', ''));
    el.querySelectorAll('.tab').forEach((t) => {
      const on = Number(t.getAttribute('data-tab')) === this.wi;
      t.classList.toggle('on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (focus) {
      const target = upNext >= 0 ? el.querySelector('.cta[data-i="' + upNext + '"]') : el.querySelector('.plan .cta:not([disabled])');
      if (target) target.focus();
    }
  }

  update(dt) {
    this.scroll += tuning.world.speed * 0.25 * dt;
  }

  render() {
    const { ctx, width, height } = this.app;
    this.clear();
    const gy = height * tuning.world.groundRatio;
    drawBackdrop(ctx, width, gy, this.scroll);
    drawGround(ctx, width, gy, this.scroll);
  }
}
