import { Scene } from '../../engine/scenes.js';
import { tuning } from '../../config/tuning.js';
import { drawBackdrop, drawGround } from '../../levels/draw.js';
import { worlds } from '../../levels/worlds.js';
import { applyTheme } from '../../config/tokens.js';
import { rating, clock, criterion } from './parts.js';

export class ResultsScene extends Scene {
  enter(params) {
    this.scroll = 0;
    const wi = params.world || 0;
    const world = worlds[wi];
    applyTheme(world.theme);
    const levelCount = world.levels.length;
    const boss = params.kind === 'boss';
    const noun = boss ? 'Bugs filed' : 'Tokens';
    const hasNext = !boss || wi < worlds.length - 1;
    const title = boss ? world.name + ' cleared' : 'Level ' + (params.index + 1) + ' complete';
    const ratio = params.total > 0 ? params.collected / params.total : 0;
    const el = this.mount(
      '<h2>' +
        title +
        '</h2>' +
        rating(params.stars) +
        '<ul class="criteria">' +
        criterion(true, 'Finished') +
        criterion(!params.cheated && ratio >= tuning.scoring.collectRatio, boss ? 'Filed bugs without a miss' : 'Collected 80% of tokens') +
        criterion(!params.cheated && params.deaths === 0, 'No retries') +
        '</ul><dl class="stats"><div><dt>' +
        noun +
        '</dt><dd class="mono">' +
        params.collected +
        '/' +
        params.total +
        '</dd></div><div><dt>Retries</dt><dd class="mono">' +
        params.deaths +
        '</dd></div><div><dt>Time</dt><dd class="mono">' +
        clock(params.time) +
        '</dd></div></dl>' +
        (params.cheated ? '<p class="note">Debug tools were used, so this run counts as one star.</p>' : '') +
        (boss && wi === worlds.length - 1 ? '<p class="note">That was every world. Thanks for playing.</p>' : '') +
        '<div class="actions">' +
        (hasNext ? '<button type="button" class="cta" data-act="next">' + (boss ? 'Next world' : params.index >= levelCount - 1 ? 'Face the boss' : 'Next level') + '</button>' : '') +
        '<button type="button" class="cta ghost" data-act="again">Replay</button>' +
        '<button type="button" class="cta ghost" data-act="levels">Level select</button></div>',
      'card results'
    );
    el.addEventListener('click', (ev) => {
      const t = ev.target.closest('button');
      if (!t) return;
      const act = t.getAttribute('data-act');
      this.app.audio.play('click');
      if (act === 'levels') this.app.scenes.go('WorldSelect', { world: wi });
      else if (act === 'again') this.app.scenes.go(boss ? 'Boss' : 'Level', { world: wi, index: params.index });
      else if (boss) this.app.scenes.go('Level', { world: wi + 1, index: 0 });
      else if (params.index >= levelCount - 1) this.app.scenes.go('Boss', { world: wi });
      else this.app.scenes.go('Level', { world: wi, index: params.index + 1 });
    });
    const first = el.querySelector('button');
    if (first) first.focus();
    this.app.input.reset();
    this.listen(window, 'keydown', (ev) => {
      if (ev.code === 'Escape') this.app.scenes.go('WorldSelect', { world: wi });
    });
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
