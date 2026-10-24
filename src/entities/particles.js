import { Pool } from '../engine/pool.js';
import { tuning } from '../config/tuning.js';
import { colors } from '../config/tokens.js';

export class Particles {
  constructor() {
    this.pool = new Pool(tuning.fx.maxParticles, () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      max: 0,
      size: 0,
      rot: 0,
      vr: 0,
      check: false,
      color: 'muted'
    }));
    this.dt = 0;
    this.step = this.step.bind(this);
  }

  burst(x, y, count, speed, life, size, color, checks, dirX) {
    for (let i = 0; i < count; i++) {
      const p = this.pool.acquire();
      if (!p) return;
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.35 + Math.random() * 0.65);
      p.x = x;
      p.y = y;
      p.vx = Math.cos(a) * s + dirX;
      p.vy = Math.sin(a) * s - speed * 0.4;
      p.max = life * (0.7 + Math.random() * 0.3);
      p.life = p.max;
      p.size = size * (0.7 + Math.random() * 0.6);
      p.rot = Math.random() * Math.PI;
      p.vr = (Math.random() - 0.5) * 10;
      p.check = checks && Math.random() < 0.5;
      p.color = color;
    }
  }

  step(p) {
    p.life -= this.dt;
    if (p.life <= 0) return false;
    p.vy += tuning.fx.particleGravity * this.dt;
    p.x += p.vx * this.dt;
    p.y += p.vy * this.dt;
    p.rot += p.vr * this.dt;
    return true;
  }

  update(dt) {
    this.dt = dt;
    this.pool.update(this.step);
  }

  clear() {
    this.pool.releaseAll();
  }

  render(ctx) {
    const pool = this.pool;
    for (let i = 0; i < pool.count; i++) {
      const p = pool.active[i];
      const k = p.life / p.max;
      ctx.save();
      ctx.globalAlpha = k;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.check) {
        ctx.strokeStyle = colors[p.color];
        ctx.lineWidth = 1.5;
        const s = p.size;
        ctx.beginPath();
        ctx.moveTo(-s * 0.5, 0);
        ctx.lineTo(-s * 0.1, s * 0.4);
        ctx.lineTo(s * 0.55, -s * 0.4);
        ctx.stroke();
      } else {
        ctx.fillStyle = colors[p.color];
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      }
      ctx.restore();
    }
  }
}
