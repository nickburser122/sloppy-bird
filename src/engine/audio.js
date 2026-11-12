import { tuning } from '../config/tuning.js';

const SFX = {
  pop: [{ type: 'sine', from: 380, to: 720, dur: 0.1, gain: 0.28 }],
  land: [{ type: 'sine', from: 170, to: 80, dur: 0.07, gain: 0.2 }],
  death: [
    { type: 'sawtooth', from: 320, to: 55, dur: 0.22, gain: 0.26 },
    { noise: true, dur: 0.16, gain: 0.22 }
  ],
  win: [
    { type: 'triangle', from: 523, to: 523, dur: 0.14, gain: 0.28, at: 0 },
    { type: 'triangle', from: 659, to: 659, dur: 0.14, gain: 0.28, at: 0.1 },
    { type: 'triangle', from: 784, to: 784, dur: 0.14, gain: 0.28, at: 0.2 },
    { type: 'triangle', from: 1047, to: 1047, dur: 0.3, gain: 0.28, at: 0.3 }
  ],
  click: [{ type: 'triangle', from: 520, to: 680, dur: 0.05, gain: 0.14 }],
  ring: [{ type: 'triangle', from: 700, to: 1400, dur: 0.16, gain: 0.28 }],
  pad: [{ type: 'square', from: 220, to: 640, dur: 0.16, gain: 0.16 }],
  crumble: [{ noise: true, dur: 0.14, gain: 0.18 }],
  portal: [{ type: 'sawtooth', from: 200, to: 900, dur: 0.25, gain: 0.16 }]
};

export class Sound {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noise = null;
    this.muted = tuning.audio.muted;
    this.volume = tuning.audio.volume;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume;
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 12;
    comp.ratio.value = 5;
    comp.attack.value = 0.003;
    comp.release.value = 0.2;
    this.master.connect(comp);
    comp.connect(this.ctx.destination);
    const len = this.ctx.sampleRate;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  setVolume(v) {
    this.volume = v;
    if (this.master && !this.muted) this.master.gain.value = v;
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : this.volume;
  }

  tone(type, from, to, t, dur, gain, dest) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    if (to !== from) o.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(dest || this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  hit(t, dur, gain, hp, dest) {
    const s = this.ctx.createBufferSource();
    const f = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    s.buffer = this.noise;
    f.type = 'highpass';
    f.frequency.value = hp;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f);
    f.connect(g);
    g.connect(dest || this.master);
    s.start(t);
    s.stop(t + dur + 0.02);
  }

  play(name) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    for (const l of SFX[name] || []) {
      const t = now + (l.at || 0);
      if (l.noise) this.hit(t, l.dur, l.gain, 1200);
      else this.tone(l.type, l.from, l.to, t, l.dur, l.gain);
    }
  }
}

export class Music {
  constructor(sound) {
    this.sound = sound;
    this.def = null;
    this.beat = 0;
    this.next = 0;
    this.bus = null;
    this.pad = [];
  }

  start(def) {
    this.stop();
    this.def = def;
    this.beat = 0;
    this.next = 0;
    this.build();
  }

  build() {
    const s = this.sound;
    if (!s.ctx || !this.def || this.bus) return;
    this.bus = s.ctx.createGain();
    this.bus.gain.value = 0.55;
    this.bus.connect(s.master);
    const f = s.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 700;
    f.connect(this.bus);
    for (const [mul, det] of [[2, -6], [3, 5], [4, 0]]) {
      const o = s.ctx.createOscillator();
      const g = s.ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = this.def.root * mul;
      o.detune.value = det;
      g.gain.value = 0.05;
      o.connect(g);
      g.connect(f);
      o.start();
      this.pad.push(o);
    }
    this.sync();
  }

  sync() {
    if (!this.sound.ctx) return;
    this.next = this.sound.ctx.currentTime + 0.03;
    this.beat = 0;
  }

  duck(ms = 350) {
    const s = this.sound;
    if (!s.ctx || !this.bus) return;
    const t = s.ctx.currentTime;
    this.bus.gain.cancelScheduledValues(t);
    this.bus.gain.setTargetAtTime(0.12, t, 0.012);
    this.bus.gain.setTargetAtTime(0.55, t + ms / 1000, 0.12);
  }

  update() {
    const s = this.sound;
    if (!s.ctx || !this.def) return;
    if (!this.bus) this.build();
    const sec = 60 / this.def.bpm;
    if (this.next < s.ctx.currentTime - 0.25) this.next = s.ctx.currentTime + 0.05;
    while (this.next < s.ctx.currentTime + 0.15) {
      this.schedule(this.beat, this.next, sec);
      this.next += sec;
      this.beat++;
    }
  }

  schedule(b, t, sec) {
    const s = this.sound;
    const d = this.def;
    if (s.muted) return;
    s.tone('sine', 150, 45, t, 0.16, 0.5, this.bus);
    s.hit(t + sec / 2, 0.04, 0.12, 6000, this.bus);
    if (b % 2 === 1) s.hit(t, 0.1, 0.16, 2500, this.bus);
    const bn = d.bass[b % d.bass.length];
    s.tone('sawtooth', d.root * 2 ** (bn / 12), d.root * 2 ** (bn / 12), t, sec * 0.8, 0.16, this.bus);
    const ln = d.lead[b % d.lead.length];
    if (b >= 4 && b % 4 !== 3) s.tone('square', d.root * 4 * 2 ** (ln / 12), d.root * 4 * 2 ** (ln / 12), t + sec / 2, sec * 0.3, 0.05, this.bus);
  }

  stop() {
    for (const o of this.pad) {
      try {
        o.stop();
      } catch {
        continue;
      }
    }
    this.pad = [];
    if (this.bus) this.bus.disconnect();
    this.bus = null;
  }
}
