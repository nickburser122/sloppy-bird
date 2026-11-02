import { describe, it, expect, afterEach } from 'vitest';
import { Settings, ASSIST } from '../src/settings.js';
import { SaveStore, SAVE_KEY } from '../src/save.js';
import { LevelRuntime } from '../src/levels/runtime.js';
import { createMode } from '../src/modes/index.js';
import { createPlayer } from '../src/entities/player.js';
import { createObstacle } from '../src/entities/obstacles/types.js';
import { Input } from '../src/engine/input.js';
import { tuning } from '../src/config/tuning.js';
import { motion, quality } from '../src/config/tokens.js';
import { DT, makeApp, drive } from './helpers.js';

function memory() {
  const map = new Map();
  return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), map };
}

function make(env) {
  return new Settings(new SaveStore(memory()), env || { systemReduced: () => false });
}

afterEach(() => {
  tuning.debug.invincible = false;
  tuning.audio.muted = false;
  tuning.audio.volume = 0.5;
  motion.reduced = false;
  quality.shadows = true;
});

describe('Settings', () => {
  it('applies sound and volume to the audio tuning', () => {
    const s = make();
    s.set('sound', false);
    expect(tuning.audio.muted).toBe(true);
    s.set('sound', true);
    s.set('volume', 0.25);
    expect(tuning.audio.muted).toBe(false);
    expect(tuning.audio.volume).toBe(0.25);
  });

  it('motion follows the device by default and can be forced either way', () => {
    let device = true;
    const s = make({ systemReduced: () => device });
    expect(motion.reduced).toBe(true);
    s.set('motion', 'full');
    expect(motion.reduced).toBe(false);
    s.set('motion', 'reduce');
    device = false;
    s.apply();
    expect(motion.reduced).toBe(true);
    s.set('motion', 'system');
    expect(motion.reduced).toBe(false);
  });

  it('graphics: auto drops shadows only after a performance downgrade', () => {
    const s = make();
    expect(quality.shadows).toBe(true);
    s.downgrade();
    expect(quality.shadows).toBe(false);
    s.set('quality', 'high');
    expect(quality.shadows).toBe(true);
    s.set('quality', 'low');
    expect(quality.shadows).toBe(false);
  });

  it('notifies listeners and survives a reload', () => {
    const storage = memory();
    const a = new Settings(new SaveStore(storage), { systemReduced: () => false });
    const seen = [];
    a.onChange((k, v) => seen.push([k, v]));
    a.set('assist', true);
    expect(seen).toEqual([['assist', true]]);
    const b = new Settings(new SaveStore(storage), { systemReduced: () => false });
    expect(b.assist).toBe(true);
    expect(b.timeScale()).toBe(ASSIST.timeScale);
  });

  it('ignores invalid values', () => {
    const s = make();
    expect(s.set('motion', 'sideways')).toBe(false);
    expect(s.get('motion')).toBe('system');
    expect(s.timeScale()).toBe(1);
  });
});

describe('assist: the same course at 80% speed', () => {
  it('runs at 0.8 of the pace', () => {
    expect(ASSIST.timeScale).toBe(0.8);
  });

  function simulate(kind, scale, script, endD) {
    const player = createPlayer();
    const level = {
      mode: kind,
      obstacles: [],
      items: [],
      length: 1e9,
      tokenTotal: 0,
      speedAt: () => tuning.world.speed
    };
    const env = {
      width: () => 1000,
      groundY: () => 500
    };
    const mode = createMode(kind, player, env);
    const rt = new LevelRuntime(level, mode, env);
    const todo = script.slice();
    const samples = [];
    let top = player.y;
    let landed = -1;
    let airborne = false;
    let guard = 0;
    while (rt.distance < endD && guard++ < 100000) {
      while (todo.length && rt.distance >= todo[0].d) {
        const a = todo.shift();
        if (a.act === 'press') mode.onPress();
        else if (a.act === 'release') mode.onRelease();
        else if (a.act === 'tap') {
          mode.onPress();
          mode.onRelease();
        }
      }
      rt.update(DT * scale);
      top = Math.min(top, player.y);
      if (kind === 'run') {
        if (!mode.grounded) airborne = true;
        else if (airborne && landed < 0) landed = rt.distance;
      }
      samples.push([rt.distance, player.y]);
    }
    const at = (d) => {
      let best = samples[0];
      for (const s of samples) if (Math.abs(s[0] - d) < Math.abs(best[0] - d)) best = s;
      return best[1];
    };
    return { top, landed, at, distance: rt.distance };
  }

  it('RUN: same jump height and landing point', () => {
    const script = [
      { d: 300, act: 'press' },
      { d: 370, act: 'release' }
    ];
    const a = simulate('run', 1, script, 1000);
    const b = simulate('run', ASSIST.timeScale, script, 1000);
    expect(Math.abs(a.top - b.top)).toBeLessThan(4);
    expect(Math.abs(a.landed - b.landed)).toBeLessThan(6);
  });

  it('FLAP: same altitude along the course after the same taps', () => {
    const script = [
      { d: 200, act: 'tap' },
      { d: 420, act: 'tap' },
      { d: 640, act: 'tap' }
    ];
    const a = simulate('flap', 1, script, 1200);
    const b = simulate('flap', ASSIST.timeScale, script, 1200);
    for (const d of [500, 800, 1100]) expect(Math.abs(a.at(d) - b.at(d))).toBeLessThan(10);
  });

  it('FLIP: same flight path through a flip', () => {
    const script = [
      { d: 300, act: 'press' },
      { d: 700, act: 'press' }
    ];
    const a = simulate('flip', 1, script, 1300);
    const b = simulate('flip', ASSIST.timeScale, script, 1300);
    for (const d of [380, 500, 800, 1000]) expect(Math.abs(a.at(d) - b.at(d))).toBeLessThan(14);
  });

  function runtime(assist) {
    const player = createPlayer();
    const env = { width: () => 1000, groundY: () => 500 };
    const mode = createMode('run', player, env);
    const level = {
      mode: 'run',
      obstacles: [createObstacle({ type: 'button', at: 700 }, 0), createObstacle({ type: 'button', at: 2600 }, 0)],
      items: [],
      length: 1e6,
      tokenTotal: 0,
      speedAt: () => tuning.world.speed
    };
    return new LevelRuntime(level, mode, env, { assist });
  }

  it('starts every attempt with a shield, including after a respawn', () => {
    const rt = runtime(true);
    expect(rt.shield).toBe(true);
    for (let i = 0; i < 600 && rt.state !== 'dead'; i++) rt.update(DT);
    expect(rt.state).toBe('running');
    for (let i = 0; i < 600 && rt.state !== 'dead'; i++) rt.update(DT);
    expect(rt.state).toBe('dead');
    for (let i = 0; i < 60; i++) rt.update(DT);
    expect(rt.state).toBe('running');
    expect(rt.shield).toBe(true);
  });

  it('is off by default and leaves normal runs untouched', () => {
    expect(runtime(false).shield).toBe(false);
  });
});

describe('assist and settings inside scenes', () => {
  it('a level started with assist runs slower in game time and holds a shield', () => {
    const plain = makeApp(1000, 700);
    plain.scenes.go('Level', { world: 0, index: 0 });
    drive(plain, 240, 40);
    const normal = plain.scenes.current.runtime.distance;

    const app = makeApp(1000, 700);
    app.settings.set('assist', true);
    app.scenes.go('Level', { world: 0, index: 0 });
    const sc = app.scenes.current;
    expect(sc.runtime.shield).toBe(true);
    drive(app, 240, 40);
    expect(sc.runtime.distance / normal).toBeGreaterThan(0.75);
    expect(sc.runtime.distance / normal).toBeLessThan(0.85);
  });

  it('turning assist on from the pause screen applies after resuming', () => {
    const app = makeApp(1000, 700);
    app.scenes.go('Level', { world: 0, index: 0 });
    drive(app, 30, 10);
    app.scenes.pause('Pause');
    const toggle = app.overlay.querySelector('[data-set="assist"]');
    toggle.checked = true;
    toggle.dispatchEvent(new window.Event('change', { bubbles: true }));
    expect(app.settings.assist).toBe(true);
    app.scenes.resume();
    expect(app.scenes.current.runtime.assist).toBe(true);
  });

  it('the settings screen changes and saves each option', () => {
    const app = makeApp(1000, 700);
    app.scenes.go('Settings', { from: 'Menu' });
    const q = (k) => app.overlay.querySelector('[data-set="' + k + '"]');
    q('sound').checked = false;
    q('sound').dispatchEvent(new window.Event('change', { bubbles: true }));
    expect(app.settings.get('sound')).toBe(false);
    expect(tuning.audio.muted).toBe(true);
    q('volume').value = '30';
    q('volume').dispatchEvent(new window.Event('input', { bubbles: true }));
    expect(app.settings.get('volume')).toBeCloseTo(0.3);
    q('motion').value = 'reduce';
    q('motion').dispatchEvent(new window.Event('change', { bubbles: true }));
    expect(motion.reduced).toBe(true);
    q('quality').value = 'low';
    q('quality').dispatchEvent(new window.Event('change', { bubbles: true }));
    expect(quality.shadows).toBe(false);
    q('assist').checked = true;
    q('assist').dispatchEvent(new window.Event('change', { bubbles: true }));
    expect(app.settings.assist).toBe(true);
    expect(JSON.parse(app.storage.get(SAVE_KEY)).settings.assist).toBe(true);
    expect(app.announced).toContain('Assist mode on');
  });

  it('the controls reflect the stored values when the screen opens', () => {
    const app = makeApp(1000, 700);
    app.settings.set('volume', 0.8);
    app.settings.set('assist', true);
    app.scenes.go('Settings', { from: 'Menu' });
    expect(app.overlay.querySelector('[data-set="volume"]').value).toBe('80');
    expect(app.overlay.querySelector('[data-set="assist"]').checked).toBe(true);
    expect(app.overlay.querySelector('output').textContent).toBe('80%');
  });

  it('volume is disabled while sound is off', () => {
    const app = makeApp(1000, 700);
    app.settings.set('sound', false);
    app.scenes.go('Settings', { from: 'Menu' });
    expect(app.overlay.querySelector('[data-set="volume"]').disabled).toBe(true);
  });

  it('reset progress needs a confirmation and keeps settings', () => {
    const app = makeApp(1000, 700);
    app.save.record('w1l1', { stars: 3, time: 50, retries: 0 });
    app.settings.set('assist', true);
    app.scenes.go('Settings', { from: 'Menu' });
    const reset = app.overlay.querySelector('[data-reset]');
    reset.click();
    expect(app.save.stars('w1l1')).toBe(3);
    expect(app.overlay.querySelector('.confirm').hidden).toBe(false);
    app.overlay.querySelector('[data-cancel]').click();
    expect(app.save.stars('w1l1')).toBe(3);
    expect(app.overlay.querySelector('.confirm').hidden).toBe(true);
    app.overlay.querySelector('[data-reset]').click();
    app.overlay.querySelector('[data-confirm]').click();
    expect(app.save.stars('w1l1')).toBe(0);
    expect(app.settings.assist).toBe(true);
    expect(app.announced).toContain('Progress cleared');
  });

  it('the install row only shows when the browser offers installation', () => {
    const a = makeApp(1000, 700);
    a.scenes.go('Settings', { from: 'Menu' });
    expect(a.overlay.querySelector('.install').hidden).toBe(true);
    const b = makeApp(1000, 700);
    let prompted = 0;
    b.installPrompt = { prompt: () => prompted++ };
    b.scenes.go('Settings', { from: 'Menu' });
    expect(b.overlay.querySelector('.install').hidden).toBe(false);
    b.overlay.querySelector('[data-install]').click();
    expect(prompted).toBe(1);
    expect(b.installPrompt).toBe(null);
  });

  it('back and Escape return to where the screen was opened from', () => {
    const app = makeApp(1000, 700);
    app.scenes.go('Settings', { from: 'WorldSelect' });
    app.overlay.querySelector('[data-back]').click();
    expect(app.scenes.name).toBe('WorldSelect');
    app.scenes.go('Settings', { from: 'Menu' });
    window.dispatchEvent(new window.KeyboardEvent('keydown', { code: 'Escape' }));
    expect(app.scenes.name).toBe('Menu');
  });

  it('the menu and level select both open settings', () => {
    const app = makeApp(1000, 700);
    app.scenes.go('Menu');
    app.overlay.querySelector('[data-settings]').click();
    expect(app.scenes.name).toBe('Settings');
    app.scenes.go('WorldSelect', {});
    app.overlay.querySelector('[data-settings]').click();
    expect(app.scenes.name).toBe('Settings');
    expect(app.scenes.current.from).toBe('WorldSelect');
  });
});

describe('announcements for screen readers', () => {
  it('announces the level and a broken shield', () => {
    const app = makeApp(1000, 700);
    app.settings.set('assist', true);
    app.scenes.go('Level', { world: 0, index: 0 });
    expect(app.announced[0]).toBe('Landing Page, Above the Fold. Level 1.');
    const sc = app.scenes.current;
    sc.runtime.onShieldBreak();
    expect(app.announced).toContain('Shield broken');
  });

  it('announces boss attacks and mode switches', () => {
    const app = makeApp(1000, 700);
    tuning.debug.invincible = true;
    app.scenes.go('Boss', { world: 3 });
    expect(app.announced[0]).toBe('The Paywall boss fight.');
    drive(app, 120 * 30, 60);
    expect(app.announced.some((t) => t.startsWith('Incoming: '))).toBe(true);
    expect(app.announced).toContain('flap mode');
  });

  it('announces when the game is paused', () => {
    const app = makeApp(1000, 700);
    app.scenes.go('Level', { world: 0, index: 0 });
    app.scenes.pause('Pause');
    expect(app.announced).toContain('Paused');
  });
});

describe('keyboard focus does not steal the jump key', () => {
  function inputOn(el) {
    const input = new Input();
    input.attach(el);
    return input;
  }

  it('Space on the page jumps, Space on a focused control does not', () => {
    const app = makeApp(1000, 700);
    const btn = document.createElement('button');
    document.body.appendChild(btn);
    const input = inputOn(document.body);
    btn.dispatchEvent(new window.KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
    input.update(8);
    expect(input.pressed).toBe(false);
    document.body.dispatchEvent(new window.KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
    input.update(8);
    expect(input.pressed).toBe(true);
    input.detachAll();
    expect(app).toBeTruthy();
  });

  it('pointer presses on interface controls are ignored but the stage still jumps', () => {
    makeApp(1000, 700);
    const stage = document.createElement('div');
    const ui = document.createElement('button');
    ui.setAttribute('data-ui', '');
    stage.appendChild(ui);
    document.body.appendChild(stage);
    const input = inputOn(stage);
    const mk = (id) => new window.Event('pointerdown', { bubbles: true, cancelable: true });
    const e1 = mk();
    e1.pointerId = 1;
    ui.dispatchEvent(e1);
    input.update(8);
    expect(input.pressed).toBe(false);
    const e2 = mk();
    e2.pointerId = 2;
    stage.dispatchEvent(e2);
    input.update(8);
    expect(input.pressed).toBe(true);
    input.detachAll();
  });
});
