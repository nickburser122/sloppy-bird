import { tuning } from '../config/tuning.js';
import { motion, easeOutCubic } from '../config/tokens.js';

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.mag = 0;
    this.left = 0;
  }

  shake(mag) {
    if (motion.reduced) return;
    this.mag = Math.min(tuning.fx.shakeMax, Math.max(this.mag * (this.left > 0 ? 1 : 0), mag));
    this.left = tuning.fx.shakeMs;
  }

  update(dt) {
    if (this.left <= 0) {
      this.x = 0;
      this.y = 0;
      this.mag = 0;
      return;
    }
    this.left -= dt * 1000;
    const k = easeOutCubic(Math.max(0, this.left) / tuning.fx.shakeMs);
    const a = this.mag * k;
    this.x = (Math.random() * 2 - 1) * a;
    this.y = (Math.random() * 2 - 1) * a;
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.mag = 0;
    this.left = 0;
  }
}
