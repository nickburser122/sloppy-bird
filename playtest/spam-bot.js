import { runEvents, DT_MS } from './bot.js';

export function spamBot(c, intervalMs, holdMs) {
  const step = Math.max(1, Math.round(intervalMs / DT_MS));
  const hold = Math.max(1, Math.round(holdMs / DT_MS));
  const total = Math.ceil(c.duration * (1000 / DT_MS)) + 2;
  const ev = [];
  for (let t = 0; t < total; t += step) {
    ev.push([t, true]);
    ev.push([t + Math.min(hold, step - 1 || 1), false]);
  }
  return runEvents(c, ev);
}

export function spamSweep(c) {
  const out = [];
  for (let ms = 100; ms <= 600; ms += 25) {
    for (const hold of [50, ms / 2]) out.push({ ms, hold, pct: spamBot(c, ms, hold).pct });
  }
  return out;
}
