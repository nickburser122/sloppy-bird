import { describe, it, expect, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';

let h;

beforeAll(async () => {
  const dom = new JSDOM('<!doctype html><body><div id="stage"><canvas id="game"></canvas><div id="overlay"></div></div><div id="live"></div></body>', { url: 'http://localhost/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.location = dom.window.location;
  const { SceneManager } = await import('../src/engine/scenes.js');
  const { createSave } = await import('../src/engine/save.js');
  const { Input } = await import('../src/engine/input.js');
  const { Sound, Music } = await import('../src/engine/audio.js');
  const { TitleScene } = await import('../src/ui/title.js');
  const { WorldMapScene } = await import('../src/ui/worldmap.js');
  const { SettingsScene } = await import('../src/ui/settings.js');
  const { PlayScene } = await import('../src/scenes/play.js');
  const { compile } = await import('../src/levels/runtime.js');
  const { search } = await import('../playtest/bot.js');
  const { byId } = await import('../src/levels/index.js');
  const ctx = new Proxy({}, { get: (t, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : typeof k === 'symbol' ? undefined : () => {}), set: () => true });
  const mem = new Map();
  const storage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, v) };
  const sound = new Sound();
  const app = { ctx, sound, music: new Music(sound), levelId: null, stage: document.getElementById('stage'), overlay: document.getElementById('overlay'), save: createSave(storage), input: new Input(), debug: { on: false, hitboxes: true, invincible: false, speed: 1, fps: 60 }, reducedMotion: false, outline: false, announce() {}, applySettings() {} };
  const scenes = new SceneManager();
  app.scenes = scenes;
  scenes.register('title', new TitleScene(app));
  scenes.register('worldmap', new WorldMapScene(app));
  scenes.register('settings', new SettingsScene(app));
  scenes.register('play', new PlayScene(app));
  const click = (sel) => {
    const el = app.overlay.querySelector(sel);
    if (!el) throw new Error(`missing ${sel}`);
    el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  };
  const tick = (n) => {
    for (let i = 0; i < n; i++) {
      scenes.update(1 / 120);
      scenes.render(0.5);
    }
  };
  h = { app, scenes, click, tick, compile, search, byId, dom };
});

describe('menu flow', () => {
  it('goes title to map to a level and shows locks', () => {
    h.scenes.go('title');
    h.tick(3);
    h.click('[data-act="play"]');
    h.tick(2);
    expect(h.scenes.name).toBe('worldmap');
    expect(h.app.overlay.querySelectorAll('.chip').length).toBe(19);
    expect(h.app.overlay.querySelectorAll('.wl').length).toBe(5);
    expect(h.app.overlay.querySelector('[data-endless="1"]').disabled).toBe(true);
    h.click('[data-level="w1-l1"]');
    h.tick(3);
    expect(h.scenes.name).toBe('play');
  });

  it('clears a level, shows the results panel, records medals and a ghost', () => {
    const play = h.scenes.current;
    const ev = h.search(h.compile(h.byId('w1-l1')), { width: 160 });
    const sorted = ev.slice().sort((a, b) => a[0] - b[0] || (a[1] ? 1 : -1));
    let idx = 0;
    let want = false;
    for (let i = 0; i < 4000 && play.winT < 0; i++) {
      while (idx < sorted.length && sorted[idx][0] <= play.sim.tick) want = sorted[idx++][1];
      h.app.input.setSource('k', want);
      h.scenes.update(1 / 120);
      h.scenes.render(0.5);
    }
    expect(play.winT).toBeGreaterThanOrEqual(0);
    expect(h.app.overlay.querySelector('[data-act="next"]')).not.toBeNull();
    expect(play.rec.clear).toBe(true);
    expect(play.rec.clean).toBe(true);
    expect(play.rec.ghost.ev.length).toBeGreaterThan(4);
  });

  it('replays the saved ghost in lockstep with an identical run', () => {
    const play = h.scenes.current;
    h.app.save.setSetting('ghost', true);
    h.click('[data-act="retry"]');
    h.tick(1);
    expect(play.ghostSim).not.toBeNull();
    const ev = h.search(h.compile(h.byId('w1-l1')), { width: 160 });
    const sorted = ev.slice().sort((a, b) => a[0] - b[0] || (a[1] ? 1 : -1));
    let idx = 0;
    let want = false;
    let compared = 0;
    for (let i = 0; i < 4000 && play.winT < 0; i++) {
      while (idx < sorted.length && sorted[idx][0] <= play.sim.tick) want = sorted[idx++][1];
      h.app.input.setSource('k', want);
      h.scenes.update(1 / 120);
      if (!play.ghostSim.dead && !play.sim.dead && play.ghostSim.tick === play.sim.tick) {
        expect(play.ghostSim.y).toBeCloseTo(play.sim.y, 6);
        compared++;
      }
    }
    expect(compared).toBeGreaterThan(1000);
    expect(play.ghostSim.won).toBe(true);
    expect(play.winT).toBeGreaterThanOrEqual(0);
  });

  it('goes next, back to the map and opens and closes settings', () => {
    h.tick(2);
    h.click('[data-act="map"]');
    h.tick(2);
    expect(h.scenes.name).toBe('worldmap');
    h.click('[data-act="settings"]');
    h.tick(2);
    expect(h.scenes.name).toBe('settings');
    h.click('[data-k="slow"]');
    expect(h.app.save.settings().slow).toBe(true);
    h.click('[data-k="slow"]');
    expect(h.app.save.settings().slow).toBe(false);
    h.click('[data-act="back"]');
    h.tick(2);
    expect(h.scenes.name).toBe('worldmap');
  });

  it('fails a gauntlet on the first death', () => {
    h.app.save.level('w1-l1').clear = true;
    h.app.save.level('w1-l2').clear = true;
    h.app.save.level('w1-l3').clear = true;
    h.app.save.level('w1-l4').clear = true;
    h.scenes.go('worldmap');
    h.tick(2);
    h.click('[data-gauntlet="1"]');
    h.tick(2);
    expect(h.scenes.name).toBe('play');
    h.app.input.setSource('k', false);
    for (let i = 0; i < 2000 && !h.scenes.current.failed; i++) h.scenes.update(1 / 120);
    expect(h.scenes.current.failed).toBe(true);
    expect(h.app.overlay.textContent).toContain('gauntlet failed');
  });

  it('plays the six-switch finale through every mode in the real scene', () => {
    h.scenes.go('play', { levelId: 'w5-boss' });
    h.tick(2);
    const play = h.scenes.current;
    const ev = h.search(h.compile(h.byId('w5-boss')), { width: 160 });
    const sorted = ev.slice().sort((a, b) => a[0] - b[0] || (a[1] ? 1 : -1));
    const seen = new Set();
    let idx = 0;
    let want = false;
    for (let i = 0; i < 5000 && play.winT < 0; i++) {
      while (idx < sorted.length && sorted[idx][0] <= play.sim.tick) want = sorted[idx++][1];
      h.app.input.setSource('k', want);
      h.scenes.update(1 / 120);
      h.scenes.render(0.5);
      seen.add(play.sim.modeName);
    }
    expect(play.winT).toBeGreaterThanOrEqual(0);
    expect([...seen].sort()).toEqual(['flap', 'flip', 'run', 'surf']);
  }, 120000);

  it('starts from any world and runs endless once its world is cleared, scoring on death', () => {
    h.scenes.go('worldmap');
    h.tick(2);
    h.click('[data-level="w4-l1"]');
    h.tick(2);
    expect(h.scenes.name).toBe('play');
    expect(h.scenes.current.level.id).toBe('w4-l1');
    for (const id of ['w1-l1', 'w1-l2', 'w1-l3', 'w1-l4']) h.app.save.level(id).clear = true;
    h.scenes.go('worldmap');
    h.tick(2);
    const en = h.app.overlay.querySelector('[data-endless="1"]');
    expect(en.disabled).toBe(false);
    h.click('[data-endless="1"]');
    h.tick(2);
    const play = h.scenes.current;
    expect(play.endless).not.toBeNull();
    h.app.input.setSource('k', false);
    for (let i = 0; i < 2000 && !play.failed; i++) h.scenes.update(1 / 120);
    expect(play.failed).toBe(true);
    expect(h.app.overlay.textContent).toContain('endless');
    expect(h.app.save.endlessBest(1)).toBeGreaterThan(0);
    h.click('[data-act="again"]');
    h.tick(2);
    expect(play.failed).toBe(false);
    expect(play.endless.cleared).toBe(0);
  });

  it('speeds the endless run up each lap and keeps medals untouched', async () => {
    const play = h.scenes.current;
    const before = JSON.stringify(h.app.save.level('w1-l1'));
    play.endless.ids = ['w1-l1'];
    play.endless.i = 0;
    play.load('w1-l1');
    play.sim.won = true;
    play.onClear();
    expect(play.endless.lap).toBe(1);
    expect(play.endless.cleared).toBe(1);
    await new Promise((r) => setTimeout(r, 750));
    expect(play.timeScale).toBeCloseTo(1.05, 5);
    expect(JSON.stringify(h.app.save.level('w1-l1')).replace(/"attempts":\d+/, '')).toBe(before.replace(/"attempts":\d+/, ''));
  });
});
