import { describe, it, expect, vi, afterEach } from 'vitest';
import { Scene, SceneManager } from '../src/engine/scenes.js';

afterEach(() => {
  vi.useRealTimers();
});

class Probe extends Scene {
  constructor(app, target) {
    super(app);
    this.target = target;
    this.hits = 0;
    this.fired = false;
    this.log = [];
  }
  enter() {
    this.log.push('enter');
    this.listen(this.target, 'ping', () => {
      this.hits++;
    });
    this.later(100, () => {
      this.fired = true;
    });
  }
  exit() {
    this.log.push('exit');
  }
  suspend() {
    this.log.push('suspend');
  }
  resume() {
    this.log.push('resume');
  }
}

describe('SceneManager', () => {
  it('cleans up listeners and timers when a scene exits', () => {
    vi.useFakeTimers();
    const target = new EventTarget();
    const manager = new SceneManager();
    const a = new Probe({}, target);
    const b = new Probe({}, target);
    manager.register('A', a);
    manager.register('B', b);
    manager.go('A');
    target.dispatchEvent(new Event('ping'));
    expect(a.hits).toBe(1);
    manager.go('B');
    target.dispatchEvent(new Event('ping'));
    expect(a.hits).toBe(1);
    expect(b.hits).toBe(1);
    vi.advanceTimersByTime(500);
    expect(a.fired).toBe(false);
    expect(b.fired).toBe(true);
    expect(a.log).toEqual(['enter', 'exit']);
  });

  it('keeps one active scene and returns to the suspended one on resume', () => {
    const target = new EventTarget();
    const manager = new SceneManager();
    const a = new Probe({}, target);
    const p = new Probe({}, target);
    manager.register('A', a);
    manager.register('P', p);
    manager.go('A');
    expect(manager.pause('P')).toBe(true);
    expect(manager.name).toBe('P');
    expect(manager.under).toBe(a);
    expect(a.log).toEqual(['enter', 'suspend']);
    expect(manager.pause('P')).toBe(false);
    expect(manager.resume()).toBe(true);
    expect(manager.name).toBe('A');
    expect(manager.current).toBe(a);
    expect(a.log).toEqual(['enter', 'suspend', 'resume']);
    expect(p.log).toEqual(['enter', 'exit']);
  });

  it('going elsewhere while paused exits both scenes', () => {
    const target = new EventTarget();
    const manager = new SceneManager();
    const a = new Probe({}, target);
    const p = new Probe({}, target);
    const m = new Probe({}, target);
    manager.register('A', a);
    manager.register('P', p);
    manager.register('M', m);
    manager.go('A');
    manager.pause('P');
    manager.go('M');
    expect(manager.under).toBe(null);
    expect(a.log).toContain('exit');
    expect(p.log).toContain('exit');
    expect(manager.name).toBe('M');
  });

  it('only updates the active scene', () => {
    const target = new EventTarget();
    const manager = new SceneManager();
    const calls = [];
    const a = new Probe({}, target);
    const p = new Probe({}, target);
    a.update = () => calls.push('A');
    p.update = () => calls.push('P');
    manager.register('A', a);
    manager.register('P', p);
    manager.go('A');
    manager.pause('P');
    manager.update(0.01);
    expect(calls).toEqual(['P']);
  });
});
