import { colors } from '../config/tokens.js';

export class Scene {
  constructor(app) {
    this.app = app;
    this.cleanups = [];
    this.timers = new Set();
  }

  enter() {}
  exit() {}
  suspend() {}
  resume() {}
  update() {}
  render() {}

  listen(target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    this.cleanups.push(() => target.removeEventListener(type, fn, opts));
  }

  later(ms, fn) {
    const id = setTimeout(() => {
      this.timers.delete(id);
      fn();
    }, ms);
    this.timers.add(id);
    return id;
  }

  mount(html, className) {
    const el = document.createElement('div');
    el.className = className;
    el.innerHTML = html;
    el.querySelectorAll('button, input, select, label, summary, details').forEach((b) => b.setAttribute('data-ui', ''));
    this.app.overlay.appendChild(el);
    this.cleanups.push(() => el.remove());
    return el;
  }

  announce(text) {
    if (this.app.announce) this.app.announce(text);
  }

  clear() {
    const { ctx, width, height } = this.app;
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);
  }

  dispose() {
    for (let i = 0; i < this.cleanups.length; i++) this.cleanups[i]();
    this.cleanups.length = 0;
    for (const id of this.timers) clearTimeout(id);
    this.timers.clear();
  }
}

export class SceneManager {
  constructor() {
    this.scenes = new Map();
    this.current = null;
    this.name = '';
    this.under = null;
    this.underName = '';
  }

  register(name, scene) {
    this.scenes.set(name, scene);
  }

  go(name, params) {
    if (this.under) this.dropUnder();
    this.leave();
    this.name = name;
    this.current = this.scenes.get(name);
    this.current.enter(params);
  }

  pause(name, params) {
    if (!this.current || this.under) return false;
    this.under = this.current;
    this.underName = this.name;
    this.under.suspend();
    this.name = name;
    this.current = this.scenes.get(name);
    this.current.enter({ ...params, under: this.under });
    return true;
  }

  resume() {
    if (!this.under) return false;
    this.leave();
    this.current = this.under;
    this.name = this.underName;
    this.under = null;
    this.underName = '';
    this.current.resume();
    return true;
  }

  leave() {
    if (!this.current) return;
    this.current.exit();
    this.current.dispose();
    this.current = null;
    this.name = '';
  }

  dropUnder() {
    this.under.exit();
    this.under.dispose();
    this.under = null;
    this.underName = '';
  }

  update(dt) {
    if (this.current) this.current.update(dt);
  }

  render(alpha) {
    if (this.current) this.current.render(alpha);
  }
}
