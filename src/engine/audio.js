import { tuning } from '../config/tuning.js';

export const SOUNDS = {
  jump: [{ type: 'sine', from: 360, to: 640, dur: 0.11, gain: 0.45 }],
  land: [
    { type: 'sine', from: 150, to: 70, dur: 0.09, gain: 0.45 },
    { noise: true, freq: 1800, dur: 0.05, gain: 0.1 }
  ],
  death: [
    { type: 'sawtooth', from: 320, to: 60, dur: 0.3, gain: 0.3 },
    { noise: true, freq: 900, dur: 0.2, gain: 0.22 }
  ],
  win: [
    { type: 'triangle', from: 523, to: 523, dur: 0.14, gain: 0.4 },
    { type: 'triangle', from: 659, to: 659, dur: 0.14, gain: 0.4, delay: 0.12 },
    { type: 'triangle', from: 784, to: 784, dur: 0.14, gain: 0.4, delay: 0.24 },
    { type: 'triangle', from: 1047, to: 1047, dur: 0.32, gain: 0.4, delay: 0.36 }
  ],
  shatter: [
    { noise: true, freq: 5000, dur: 0.22, gain: 0.3 },
    { type: 'square', from: 900, to: 200, dur: 0.2, gain: 0.18 }
  ],
  switch: [
    { type: 'sawtooth', from: 200, to: 900, dur: 0.22, gain: 0.2 },
    { type: 'sawtooth', from: 900, to: 300, dur: 0.18, gain: 0.16, delay: 0.14 }
  ],
  collect: [{ type: 'sine', from: 880, to: 1320, dur: 0.07, gain: 0.18 }],
  telegraph: [
    { type: 'square', from: 440, to: 440, dur: 0.09, gain: 0.16 },
    { type: 'square', from: 440, to: 440, dur: 0.09, gain: 0.16, delay: 0.16 },
    { type: 'square', from: 660, to: 660, dur: 0.14, gain: 0.16, delay: 0.32 }
  ],
  bug: [
    { type: 'triangle', from: 500, to: 1000, dur: 0.14, gain: 0.35 },
    { type: 'triangle', from: 1000, to: 1500, dur: 0.12, gain: 0.3, delay: 0.1 }
  ],
  hit: [
    { type: 'sawtooth', from: 220, to: 90, dur: 0.22, gain: 0.3 },
    { noise: true, freq: 1400, dur: 0.14, gain: 0.2 }
  ],
  click: [{ type: 'square', from: 520, to: 520, dur: 0.035, gain: 0.12 }]
};

export class Sound {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noise = null;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  play(name) {
    if (!this.ctx || tuning.audio.muted) return;
    const voices = SOUNDS[name];
    if (!voices) return;
    const ctx = this.ctx;
    this.master.gain.value = tuning.audio.volume;
    for (let i = 0; i < voices.length; i++) {
      const v = voices[i];
      const t0 = ctx.currentTime + (v.delay || 0);
      const t1 = t0 + v.dur;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t0);
      env.gain.linearRampToValueAtTime(v.gain, t0 + 0.005);
      env.gain.exponentialRampToValueAtTime(0.0001, t1);
      let src;
      if (v.noise) {
        src = ctx.createBufferSource();
        src.buffer = this.noise;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = v.freq;
        src.connect(filter);
        filter.connect(env);
      } else {
        src = ctx.createOscillator();
        src.type = v.type;
        src.frequency.setValueAtTime(v.from, t0);
        if (v.to !== v.from) src.frequency.exponentialRampToValueAtTime(v.to, t1);
        src.connect(env);
      }
      env.connect(this.master);
      src.start(t0);
      src.stop(t1 + 0.02);
    }
  }
}
