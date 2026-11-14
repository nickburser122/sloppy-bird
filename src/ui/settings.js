import { Scene } from '../engine/scenes.js';
import { tuning } from '../config/tuning.js';
import { defaultSettings } from '../engine/save.js';

export class SettingsScene extends Scene {
  enter(params = {}) {
    this.under = params.under || null;
    this.build();
  }

  build() {
    if (this.el) this.el.remove();
    const s = this.app.save.settings();
    const on = (v) => (v ? 'on' : 'off');
    this.el = this.mount(
      `<div class="ui"><div class="panel"><h2>settings</h2>
<div class="setrow"><span>sound</span><button class="btn small" data-k="muted">${s.muted ? 'off' : 'on'}</button></div>
<div class="setrow"><span>volume</span><input type="range" min="0" max="100" value="${Math.round(s.volume * 100)}" data-vol></div>
<div class="setrow"><span>slow mode ×0.75<small>clears here don't count toward medals</small></span><button class="btn small" data-k="slow">${on(s.slow)}</button></div>
<div class="setrow"><span>reduced motion<small>no shake, flashes or pulses</small></span><button class="btn small" data-k="reducedMotion">${on(s.reducedMotion)}</button></div>
<div class="setrow"><span>bold outlines<small>thicker hazard outlines</small></span><button class="btn small" data-k="outline">${on(s.outline)}</button></div>
<div class="setrow"><span>ghost marker<small>a ring where your best attempt is</small></span><button class="btn small" data-k="ghost">${on(s.ghost)}</button></div>
<div class="setrow"><span>reset progress</span><button class="btn small" data-reset>reset</button></div>
<div class="row"><button class="btn" data-act="back">back</button></div></div></div>`,
      'layer'
    );
    this.el.addEventListener('click', (e) => {
      this.app.sound.play('click');
      const k = e.target.closest('[data-k]');
      const back = e.target.closest('[data-act="back"]');
      const reset = e.target.closest('[data-reset]');
      if (k) {
        const key = k.dataset.k;
        const cur = this.app.save.settings()[key];
        this.app.save.setSetting(key, key === 'muted' ? !cur : !cur);
        this.app.applySettings();
        this.build();
      } else if (reset) {
        if (reset.dataset.armed) {
          this.app.save.reset();
          this.app.applySettings();
          this.build();
        } else {
          reset.dataset.armed = '1';
          reset.textContent = 'confirm';
        }
      } else if (back) this.close();
    });
    this.el.addEventListener('input', (e) => {
      if (e.target.matches('[data-vol]')) {
        this.app.save.setSetting('volume', Number(e.target.value) / 100);
        this.app.applySettings();
      }
    });
  }

  close() {
    if (this.under) this.app.scenes.resume();
    else this.app.scenes.go('title');
  }

  render() {
    const { ctx } = this.app;
    const { w, h } = tuning.stage;
    if (this.under) {
      this.under.render(0);
      ctx.fillStyle = 'rgba(8,10,16,0.7)';
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.fillStyle = '#0b0d18';
      ctx.fillRect(0, 0, w, h);
    }
  }
}

export { defaultSettings };
