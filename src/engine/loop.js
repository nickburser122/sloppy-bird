export class Loop {
  constructor({ hz, maxFrameMs, update, render }) {
    this.step = 1000 / hz;
    this.maxFrameMs = maxFrameMs;
    this.updateFn = update;
    this.renderFn = render;
    this.acc = 0;
    this.last = 0;
    this.raf = 0;
    this.running = false;
    this.fps = 0;
    this.frames = 0;
    this.fpsAt = 0;
    this.tick = this.tick.bind(this);
  }

  advance(deltaMs) {
    this.acc += Math.min(deltaMs, this.maxFrameMs);
    let steps = 0;
    while (this.acc >= this.step) {
      this.updateFn(this.step / 1000);
      this.acc -= this.step;
      steps++;
    }
    this.renderFn(this.acc / this.step);
    return steps;
  }

  tick(now) {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.tick);
    if (this.last === 0) {
      this.last = now;
      this.fpsAt = now;
    }
    const delta = now - this.last;
    this.last = now;
    this.frames++;
    if (now - this.fpsAt >= 500) {
      this.fps = (this.frames * 1000) / (now - this.fpsAt);
      this.frames = 0;
      this.fpsAt = now;
    }
    this.advance(delta);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = 0;
    this.acc = 0;
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }
}
