import { tuning } from './config/tuning.js';
import { motion, quality } from './config/tokens.js';

export const ASSIST = { timeScale: 0.8 };

export class Settings {
  constructor(save, env) {
    this.save = save;
    this.env = env || { systemReduced: () => false };
    this.perfLow = false;
    this.listeners = [];
    this.apply();
  }

  get(key) {
    return this.save.settings()[key];
  }

  set(key, value) {
    if (!this.save.setSetting(key, value)) return false;
    this.apply();
    for (const fn of this.listeners) fn(key, value);
    return true;
  }

  get assist() {
    return this.get('assist');
  }

  timeScale() {
    return this.assist ? ASSIST.timeScale : 1;
  }

  downgrade() {
    if (this.perfLow) return;
    this.perfLow = true;
    this.apply();
  }

  onChange(fn) {
    this.listeners.push(fn);
  }

  apply() {
    tuning.audio.muted = !this.get('sound');
    tuning.audio.volume = this.get('volume');
    const m = this.get('motion');
    motion.reduced = m === 'reduce' || (m === 'system' && this.env.systemReduced());
    const q = this.get('quality');
    quality.shadows = q === 'high' || (q === 'auto' && !this.perfLow);
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.classList.toggle('reduce-motion', motion.reduced);
    }
  }
}
