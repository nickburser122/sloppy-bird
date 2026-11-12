import '@fontsource-variable/jetbrains-mono';
import { Loop } from './engine/loop.js';
import { Input } from './engine/input.js';
import { SceneManager } from './engine/scenes.js';
import { createSave } from './engine/save.js';
import { fitStage } from './engine/stage.js';
import { createDebug } from './ui/debug.js';
import { PlayScene } from './scenes/play.js';
import { TitleScene } from './ui/title.js';
import { WorldMapScene } from './ui/worldmap.js';
import { SettingsScene } from './ui/settings.js';
import { Sound, Music } from './engine/audio.js';
import { tuning } from './config/tuning.js';

const canvas = document.getElementById('game');
const stage = document.getElementById('stage');
const overlay = document.getElementById('overlay');
const live = document.getElementById('live');
const rotate = document.getElementById('rotate');
const ctx = canvas.getContext('2d');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const params = new URLSearchParams(location.search);

const sound = new Sound();
const app = {
  ctx,
  sound,
  music: new Music(sound),
  levelId: params.get('level'),
  stage,
  overlay,
  width: tuning.stage.w,
  height: tuning.stage.h,
  save: createSave(),
  input: new Input(),
  debug: createDebug(),
  reducedMotion: motion.matches,
  outline: false,
  scenes: null,
  announce: (text) => {
    live.textContent = text;
  }
};

const origStroke = ctx.stroke.bind(ctx);
const origStrokeRect = ctx.strokeRect.bind(ctx);
ctx.stroke = (...a) => {
  if (!app.outline) return origStroke(...a);
  const lw = ctx.lineWidth;
  ctx.lineWidth = lw * 1.8 + 1;
  origStroke(...a);
  ctx.lineWidth = lw;
};
ctx.strokeRect = (...a) => {
  if (!app.outline) return origStrokeRect(...a);
  const lw = ctx.lineWidth;
  ctx.lineWidth = lw * 1.8 + 1;
  origStrokeRect(...a);
  ctx.lineWidth = lw;
};

app.applySettings = () => {
  const s = app.save.settings();
  app.reducedMotion = s.reducedMotion || motion.matches;
  document.body.classList.toggle('reduced', app.reducedMotion);
  app.outline = s.outline;
  sound.setVolume(s.volume);
  sound.setMuted(s.muted);
};
app.applySettings();
motion.addEventListener('change', app.applySettings);

let view = fitStage(canvas, stage);
const refit = () => {
  view = fitStage(canvas, stage);
  rotate.classList.toggle('on', view.portrait);
};
window.addEventListener('resize', refit);
refit();

const scenes = new SceneManager();
app.scenes = scenes;
scenes.register('title', new TitleScene(app));
scenes.register('worldmap', new WorldMapScene(app));
scenes.register('settings', new SettingsScene(app));
scenes.register('play', new PlayScene(app));

const loop = new Loop({
  hz: tuning.sim.hz,
  maxFrameMs: tuning.sim.maxFrameMs,
  update: (dt) => scenes.update(dt),
  render: (alpha) => {
    app.debug.fps = loop.fps;
    ctx.setTransform(view.scale, 0, 0, view.scale, 0, 0);
    scenes.render(alpha);
  }
});

document.addEventListener('visibilitychange', () => {
  if (!sound.ctx) return;
  if (document.hidden) sound.ctx.suspend();
  else sound.ctx.resume();
});
window.addEventListener('blur', () => app.input.reset());

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

if (app.levelId) scenes.go('play', { levelId: app.levelId });
else scenes.go('title');
loop.start();
