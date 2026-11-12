const blank = () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 4, rot: 0, vr: 0, g: 900, kind: 0, color: '#fff' });

export class Particles {
  constructor(max = 320) {
    this.max = max;
    this.items = Array.from({ length: max }, blank);
    this.count = 0;
  }

  clear() {
    this.count = 0;
  }

  spawn() {
    if (this.count < this.max) return this.items[this.count++];
    return this.items[0];
  }

  emit(o) {
    const p = this.spawn();
    p.x = o.x;
    p.y = o.y;
    p.vx = o.vx;
    p.vy = o.vy;
    p.life = o.life;
    p.max = o.life;
    p.size = o.size === undefined ? 4 : o.size;
    p.rot = o.rot || 0;
    p.vr = o.vr || 0;
    p.g = o.g === undefined ? 900 : o.g;
    p.kind = o.kind || 0;
    p.color = o.color;
  }

  burst(x, y, n, colors, { speed = 320, life = 0.6, size = 5, g = 900, kind = 0, up = 0 } = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.35 + Math.random() * 0.65);
      const p = this.spawn();
      p.x = x;
      p.y = y;
      p.vx = Math.cos(a) * s;
      p.vy = Math.sin(a) * s - up;
      p.life = life * (0.6 + Math.random() * 0.4);
      p.max = p.life;
      p.size = size * (0.6 + Math.random() * 0.8);
      p.color = colors[i % colors.length];
      p.rot = Math.random() * 6;
      p.vr = (Math.random() - 0.5) * 14;
      p.g = g;
      p.kind = kind;
    }
  }

  update(dt) {
    const l = this.items;
    for (let i = this.count - 1; i >= 0; i--) {
      const p = l[i];
      p.life -= dt;
      if (p.life <= 0) {
        const last = this.count - 1;
        l[i] = l[last];
        l[last] = p;
        this.count--;
        continue;
      }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
  }

  draw(ctx) {
    for (let i = 0; i < this.count; i++) {
      const p = this.items[i];
      ctx.globalAlpha = Math.max(0, Math.min(1, (p.life / p.max) * 1.4));
      ctx.fillStyle = p.color;
      if (p.kind === 1) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}
