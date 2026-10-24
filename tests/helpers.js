import { vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { SceneManager } from '../src/engine/scenes.js';
import { Input } from '../src/engine/input.js';
import { SaveStore } from '../src/save.js';
import { Settings } from '../src/settings.js';
import { SettingsScene } from '../src/ui/menus/settings.js';
import { LevelScene } from '../src/levels/levelScene.js';
import { BossScene } from '../src/levels/bossScene.js';
import { BootScene } from '../src/ui/menus/boot.js';
import { MenuScene } from '../src/ui/menus/menu.js';
import { PauseScene } from '../src/ui/menus/pause.js';
import { ResultsScene } from '../src/ui/menus/results.js';
import { WorldSelectScene } from '../src/ui/menus/worldSelect.js';
import { tuning } from '../src/config/tuning.js';

export const DT = 1 / tuning.sim.hz;

function fakeCtx() {
  const store = {};
  return new Proxy(store, {
    get(t, k) {
      if (k === 'measureText') return () => ({ width: 40 });
      if (k in t) return t[k];
      return () => {};
    },
    set(t, k, v) {
      t[k] = v;
      return true;
    }
  });
}

export function makeApp(width, height) {
  const dom = new JSDOM('<!doctype html><html><body><div id="overlay"></div></body></html>');
  vi.stubGlobal('window', dom.window);
  vi.stubGlobal('document', dom.window.document);
  const map = new Map();
  const storage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v))
  };
  const played = [];
  const announced = [];
  const app = {
    ctx: fakeCtx(),
    overlay: dom.window.document.getElementById('overlay'),
    width,
    height,
    input: new Input(),
    audio: { play: (n) => played.push(n) },
    save: new SaveStore(storage),
    settings: null,
    installPrompt: null,
    announce: (t) => announced.push(t),
    announced,
    scenes: new SceneManager(),
    played,
    storage: map
  };
  app.settings = new Settings(app.save, { systemReduced: () => false });
  app.scenes.register('Boot', new BootScene(app));
  app.scenes.register('Settings', new SettingsScene(app));
  app.scenes.register('Menu', new MenuScene(app));
  app.scenes.register('Level', new LevelScene(app));
  app.scenes.register('Boss', new BossScene(app));
  app.scenes.register('Pause', new PauseScene(app));
  app.scenes.register('Results', new ResultsScene(app));
  app.scenes.register('WorldSelect', new WorldSelectScene(app));
  return app;
}

export function hover(app, state) {
  const sc = app.scenes.current;
  if (!sc || !sc.mode || !sc.director) return;
  if (sc.modeKind === 'flip') {
    if (sc.mode.dir < 0 && sc.mode.since >= tuning.flip.cooldownMs + 10) {
      app.input.setSource('bot', true);
      app.input.setSource('bot', false);
    }
    return;
  }
  if (sc.modeKind !== 'flap') return;
  const p = sc.player;
  const orbLift = sc.director.cur ? sc.director.cur.orb.lift : sc.cfg.orbLift;
  const target = sc.env.groundY() - orbLift - p.size / 2 + 28;
  state.since += DT * 1000;
  if (p.y > target && sc.mode.vy >= 0 && state.since > 160) {
    app.input.setSource('bot', true);
    app.input.setSource('bot', false);
    state.since = 0;
  }
}

export function drive(app, steps, renderEvery) {
  const state = { since: 1000 };
  for (let i = 0; i < steps; i++) {
    hover(app, state);
    app.input.update(DT * 1000);
    app.scenes.update(DT);
    if (i % renderEvery === 0) app.scenes.render(0.5);
  }
}

