import { Scene } from '../../engine/scenes.js';
import { tuning } from '../../config/tuning.js';
import { applyTheme } from '../../config/tokens.js';
import { drawBackdrop, drawGround, drawPlayer } from '../../levels/draw.js';
import { BRAND_MARK } from '../hud.js';

export class MenuScene extends Scene {
  enter() {
    applyTheme('landing');
    this.armed = false;
    this.t = 0;
    this.scroll = 0;
    const el = this.mount(
      '<header class="nav"><span class="brand">' +
        BRAND_MARK +
        '<b>Above the Fold</b></span><span class="nav-right"><span class="mono tag">v1.0</span><button type="button" class="cta ghost small" data-settings>Settings</button></span></header>' +
        '<div class="hero"><h1>Above the Fold</h1>' +
        '<p>A one-button runner through the web\u2019s most avoidable interface decisions.</p>' +
        '<div class="cta"><span class="btn">Start running</span>' +
        '<span class="hint"><kbd>Space</kbd><kbd>Click</kbd><kbd>Tap</kbd></span></div></div>',
      'screen menu'
    );
    this.el = el;
    el.addEventListener('click', (ev) => {
      const t = ev.target.closest('button');
      if (t && t.hasAttribute('data-settings')) {
        this.app.audio.play('click');
        this.app.scenes.go('Settings', { from: 'Menu' });
      }
    });
    this.app.input.reset();
    this.later(tuning.ui.armMs, () => {
      this.armed = true;
    });
  }

  update(dt) {
    this.t += dt;
    this.scroll += tuning.world.speed * 0.5 * dt;
    if (this.armed && this.app.input.pressed) {
      this.app.audio.play('click');
      this.app.scenes.go('WorldSelect');
    }
  }

  render() {
    const { ctx, width, height } = this.app;
    this.clear();
    const gy = height * tuning.world.groundRatio;
    drawBackdrop(ctx, width, gy, this.scroll);
    drawGround(ctx, width, gy, this.scroll);
    const size = tuning.run.size;
    const hop = Math.abs(Math.sin(this.t * 2.4)) * tuning.run.size * 1.1;
    drawPlayer(ctx, width * tuning.run.startX, gy - size - hop, size, 1);
  }
}
