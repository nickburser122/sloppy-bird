import { Scene } from '../engine/scenes.js';
import { tuning } from '../config/tuning.js';
import { totals } from '../engine/progress.js';

export class TitleScene extends Scene {
  enter() {
    this.t = 0;
    const el = this.mount(
      `<div class="ui"><div class="word">nerve</div><nav class="links"><button class="link" data-act="play">play</button><button class="link" data-act="settings">settings</button></nav><div class="foot" id="tt"></div></div>`,
      'layer'
    );
    const tt = totals(this.app.save);
    el.querySelector('#tt').textContent = `${tt.clear} / ${tt.levels}`;
    el.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]');
      if (!act) return;
      this.app.sound.unlock();
      this.app.sound.play('click');
      if (act.dataset.act === 'play') this.app.scenes.go('worldmap');
      if (act.dataset.act === 'settings') this.app.scenes.pause('settings');
    });
    this.listen(window, 'keydown', (e) => {
      if (e.code === 'Enter' && document.activeElement === document.body) {
        this.app.sound.unlock();
        this.app.scenes.go('worldmap');
      }
    });
  }

  update(dt) {
    this.t += dt;
  }

  render() {
    const { ctx } = this.app;
    const { w, h } = tuning.stage;
    ctx.fillStyle = '#0b0c10';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#171a22';
    ctx.fillRect(0, 372, w, 1);
    const x = ((this.t * 36) % (w + 80)) - 40;
    ctx.fillStyle = `rgba(201,206,216,${0.1 + 0.08 * Math.sin(this.t * 0.9)})`;
    ctx.fillRect(x, 369, 4, 4);
  }
}
