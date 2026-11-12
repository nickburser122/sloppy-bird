import { Scene } from '../engine/scenes.js';
import { tuning } from '../config/tuning.js';
import { drawFox } from '../chars/fox.js';
import { drawZzt } from '../chars/zzt.js';
import { drawOtter } from '../chars/otter.js';
import { drawBolt } from '../chars/robot.js';
import { totals } from '../engine/progress.js';

export class TitleScene extends Scene {
  enter() {
    this.t = 0;
    const el = this.mount(
      `<div class="ui"><h1>NERVE</h1><p class="sub">four modes · four characters · one button</p><div class="col"><button class="btn" data-act="play">Play</button><button class="btn ghost" data-act="settings">Settings</button></div><p class="sub" id="tt"></p></div>`,
      'layer'
    );
    const tt = totals(this.app.save);
    el.querySelector('#tt').textContent = `${tt.clear}/${tt.levels} cleared · ${tt.clean} clean · ${tt.shard} shards`;
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
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0b0d18');
    g.addColorStop(1, '#1b1630');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const pulse = 0.5 + 0.5 * Math.sin(this.t * 4);
    ctx.fillStyle = `rgba(255,122,61,${0.05 + 0.05 * pulse})`;
    ctx.beginPath();
    ctx.arc(w / 2, 150, 210 + pulse * 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c2236';
    ctx.fillRect(0, 470, w, 70);
    const bob = (o) => Math.abs(Math.sin(this.t * 3 + o)) * 16;
    drawFox(ctx, 170, 470 - bob(0), { t: this.t, vy: 0, grounded: bob(0) < 2, landT: 0 });
    drawZzt(ctx, 380, 420 - bob(1) * 0.8, { t: this.t, vy: 0, flapT: 1 });
    drawOtter(ctx, 590, 460 - bob(2) * 0.5, { t: this.t, vy: 0, air: false, depth: 0, slope: Math.sin(this.t * 2) * 0.2, hold: false });
    drawBolt(ctx, 780, 450 - bob(3) * 0.4, { t: this.t, vy: 0, grounded: true, landT: 0, gd: 1 });
  }
}
