import { Scene } from '../../engine/scenes.js';
import { drawBackdrop, drawGround } from '../../levels/draw.js';
import { tuning } from '../../config/tuning.js';
import { applyTheme } from '../../config/tokens.js';
import { BRAND_MARK } from '../hud.js';
import { settingsHtml, bindSettings } from './settingsForm.js';

export class SettingsScene extends Scene {
  enter(params) {
    applyTheme('landing');
    this.from = (params && params.from) || 'Menu';
    this.scroll = 0;
    const el = this.mount(
      '<header class="nav"><span class="brand">' +
        BRAND_MARK +
        '<b>Above the Fold</b></span><button type="button" class="cta ghost small" data-back>Back</button></header>' +
        '<div class="select-body" data-ui><h2>Settings</h2><p class="lede">Saved on this device. Changes apply straight away.</p>' +
        '<div class="card settings-card">' +
        settingsHtml(this.app) +
        '</div></div>',
      'screen select'
    );
    bindSettings(el, this.app);
    el.addEventListener('click', (ev) => {
      const t = ev.target.closest('button');
      if (t && t.hasAttribute('data-back')) {
        this.app.audio.play('click');
        this.app.scenes.go(this.from);
      }
    });
    const first = el.querySelector('[data-set]');
    if (first) first.focus();
    document.documentElement.classList.add('allow-scroll');
    this.cleanups.push(() => document.documentElement.classList.remove('allow-scroll'));
    this.listen(window, 'keydown', (ev) => {
      if (ev.code === 'Escape') this.app.scenes.go(this.from);
    });
    this.announce('Settings');
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
