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
    const on = (v) => (v ? 'On' : 'Off');
    this.el = this.mount(
      `<div class="ui"><div class="panel"><h2>Settings</h2>
<div class="setrow"><span>Sound</span><button class="btn small" data-k="muted">${s.muted ? 'Off' : 'On'}</button></div>
<div class="setrow"><span>Volume</span><input type="range" min="0" max="100" value="${Math.round(s.volume * 100)}" data-vol></div>
<div class="setrow"><span>Slow mode ×0.75<small>clears here don't count toward unlocks</small></span><button class="btn small" data-k="slow">${on(s.slow)}</button></div>
<div class="setrow"><span>Reduced motion<small>no shake, flashes or pulses</small></span><button class="btn small" data-k="reducedMotion">${on(s.reducedMotion)}</button></div>
<div class="setrow"><span>Bold outlines<small>thicker hazard outlines</small></span><button class="btn small" data-k="outline">${on(s.outline)}</button></div>
<div class="setrow"><span>Reset progress</span><button class="btn small ghost" data-reset>Reset</button></div>
<div class="row"><button class="btn" data-act="back">Back</button></div></div></div>`,
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
          reset.textContent = 'Confirm';
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
