import './ui/themes.css';
import { applyTheme } from './config/tokens.js';
import { Sound } from './engine/audio.js';
import { tuning } from './config/tuning.js';
import { Loop } from './engine/loop.js';
import { Input } from './engine/input.js';
import { SceneManager } from './engine/scenes.js';
import { BootScene } from './ui/menus/boot.js';
import { MenuScene } from './ui/menus/menu.js';
import { PauseScene } from './ui/menus/pause.js';
import { ResultsScene } from './ui/menus/results.js';
import { WorldSelectScene } from './ui/menus/worldSelect.js';
import { BossScene } from './levels/bossScene.js';
import { createSave } from './save.js';
import { Settings } from './settings.js';
import { SettingsScene } from './ui/menus/settings.js';
import { LevelScene } from './levels/levelScene.js';
import { createDebug } from './debug.js';

const stage = document.getElementById('stage');
const canvas = document.getElementById('game');
const overlay = document.getElementById('overlay');

const app = {
  canvas,
  ctx: canvas.getContext('2d', { alpha: false }),
  overlay,
  width: 0,
  height: 0,
  dpr: 1,
  input: new Input(),
  audio: new Sound(),
  save: createSave(),
  settings: null,
  installPrompt: null,
  announce: null,
  scenes: new SceneManager(),
  loop: null
};

function resize() {
  const rect = stage.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, tuning.view.maxDpr);
  app.width = rect.width;
  app.height = rect.height;
  app.dpr = dpr;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  app.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

applyTheme('landing');
const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
app.settings = new Settings(app.save, { systemReduced: () => reducedQuery.matches });
reducedQuery.addEventListener('change', () => app.settings.apply());

const live = document.getElementById('live');
let liveFlip = false;
app.announce = (text) => {
  liveFlip = !liveFlip;
  live.textContent = text + (liveFlip ? '' : '\u200b');
};

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  app.installPrompt = e;
});
window.addEventListener('appinstalled', () => {
  app.installPrompt = null;
});

const unlock = () => app.audio.unlock();
window.addEventListener('pointerdown', unlock);
window.addEventListener('keydown', unlock);
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyM' && !e.repeat && !(e.target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName))) {
    app.settings.set('sound', !app.settings.get('sound'));
  }
});

new ResizeObserver(resize).observe(stage);
window.addEventListener('resize', resize);
resize();

app.input.attach(stage);

app.loop = new Loop({
  hz: tuning.sim.hz,
  maxFrameMs: tuning.sim.maxFrameMs,
  update: (dt) => {
    app.input.update(dt * 1000);
    app.scenes.update(dt);
  },
  render: (alpha) => app.scenes.render(alpha)
});

app.scenes.register('Boot', new BootScene(app));
app.scenes.register('Menu', new MenuScene(app));
app.scenes.register('Level', new LevelScene(app));
app.scenes.register('Pause', new PauseScene(app));
app.scenes.register('Results', new ResultsScene(app));
app.scenes.register('WorldSelect', new WorldSelectScene(app));
app.scenes.register('Settings', new SettingsScene(app));
app.scenes.register('Boss', new BossScene(app));

const autoPause = () => {
  if (app.scenes.name === 'Level') app.scenes.pause('Pause');
};
window.addEventListener('blur', autoPause);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) autoPause();
});

let slowChecks = 0;
setInterval(() => {
  const playing = app.scenes.name === 'Level' || app.scenes.name === 'Boss';
  if (!playing || app.settings.get('quality') !== 'auto' || app.loop.fps === 0) {
    slowChecks = 0;
    return;
  }
  slowChecks = app.loop.fps < tuning.view.lowFps ? slowChecks + 1 : 0;
  if (slowChecks >= tuning.view.lowFpsChecks) app.settings.downgrade();
}, 1000);

createDebug(app);

if (import.meta.env.PROD && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

app.scenes.go('Boot');
app.loop.start();
