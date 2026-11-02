import { describe, it, expect } from 'vitest';
import { worlds } from '../src/levels/worlds.js';
import { DT, makeApp } from '../tests/helpers.js';
import { makeBot } from './bot.js';

function playScene(sceneName, params, maxSeconds) {
  const app = makeApp(1000, 700);
  app.scenes.go(sceneName, params);
  const sc = app.scenes.current;
  sc.app = app;
  const act = makeBot(sc, app);
  const steps = Math.round(maxSeconds / DT);
  for (let i = 0; i < steps; i++) {
    if (app.scenes.name !== sceneName) break;
    act();
    app.input.update(DT * 1000);
    app.scenes.update(DT);
  }
  return { scene: app.scenes.name, deaths: sc.runtime.deaths, time: sc.runtime.time };
}

describe('a bot playing without invincibility', () => {
  for (let wi = 0; wi < worlds.length; wi++) {
    const w = worlds[wi];
    for (let li = 0; li < w.levels.length; li++) {
      it('clears ' + w.levels[li].id, () => {
        const r = playScene('Level', { world: wi, index: li }, 200);
        expect(r.scene).toBe('Results');
        expect(r.deaths).toBe(0);
      }, 900000);
    }
    if (w.boss) {
      it('beats ' + w.boss.title, () => {
        const r = playScene('Boss', { world: wi }, 240);
        expect(r.scene).toBe('Results');
        expect(r.deaths).toBe(0);
      }, 900000);
    }
  }
});
