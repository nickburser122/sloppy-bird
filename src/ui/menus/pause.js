import { Scene } from '../../engine/scenes.js';
import { tuning } from '../../config/tuning.js';
import { colors } from '../../config/tokens.js';
import { settingsHtml, bindSettings } from './settingsForm.js';

export class PauseScene extends Scene {
  enter(params) {
    this.under = params.under;
    this.armed = false;
    const el = this.mount(
      '<h2>Paused</h2><p>Press <kbd>Space</kbd>, click or tap to resume.</p>' +
        '<div class="actions"><button type="button" class="cta" data-act="resume">Resume</button>' +
        '<button type="button" class="cta ghost" data-act="levels">Level select</button></div>' +
        '<details class="more"><summary>Settings</summary>' +
        settingsHtml(this.app) +
        '</details>',
      'card pause-card'
    );
    bindSettings(el.querySelector('.more'), this.app);
    const resume = el.querySelector('[data-act="resume"]');
    if (resume) resume.focus();
    this.announce('Paused');
    el.addEventListener('click', (ev) => {
      const t = ev.target.closest('button');
      if (!t) return;
      this.app.audio.play('click');
      if (t.getAttribute('data-act') === 'levels') this.app.scenes.go('WorldSelect', { world: this.under.worldIndex });
      else this.app.scenes.resume();
    });
    this.app.input.reset();
    this.later(tuning.ui.armMs, () => {
      this.armed = true;
    });
    this.listen(window, 'keydown', (e) => {
      if (e.code === 'Escape') this.app.scenes.resume();
    });
  }

  update() {
    if (this.armed && this.app.input.pressed) {
      this.app.audio.play('click');
      this.app.scenes.resume();
    }
  }

  render() {
    const { ctx, width, height } = this.app;
    this.under.render(1);
    ctx.fillStyle = colors.scrim;
    ctx.fillRect(0, 0, width, height);
  }
}
