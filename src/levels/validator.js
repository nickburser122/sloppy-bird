import { compile, modeOfEvent, segmentAt } from './runtime.js';
import { tuning } from '../config/tuning.js';
import { search, centered, runEvents, DT, reach } from '../../playtest/bot.js';
import { idleBot } from '../../playtest/idle-bot.js';
import { spamSweep } from '../../playtest/spam-bot.js';
import { jitterBot } from '../../playtest/jitter-bot.js';

export const GATES = {
  1: { window: 90, reaction: 380, ips: [1.3, 2.5], gap: 1.2, jitter: [0.15, 0.8] },
  2: { window: 70, reaction: 330, ips: [1.8, 3], gap: 1.0, jitter: [0.05, 0.6] },
  3: { window: 70, reaction: 330, ips: [1.8, 3], gap: 1.0, jitter: [0.05, 0.6] },
  4: { window: 55, reaction: 280, ips: [2, 3.5], gap: 0.9, jitter: [0.05, 0.6] },
  5: { window: 55, reaction: 280, ips: [2, 3.5], gap: 0.9, jitter: [0.05, 0.6] }
};

export function validate(level, opts = {}) {
  const gate = GATES[level.world];
  const c = compile(level);
  const fail = [];
  const m = { duration: c.duration };
  if (c.duration < 15 || c.duration > 30) fail.push(`length ${c.duration.toFixed(1)}s`);
  if (level.mode === 'mix') {
    const lane = tuning.mix.safeLaneMs / 1000 / c.beatSec;
    for (const e of level.events) {
      if (e.type === 'portal') continue;
      const sg = c.segs[segmentAt(c.segs, e.beat)];
      if (modeOfEvent(e) !== sg.mode) fail.push(`${e.type}@${e.beat} outside its mode segment`);
      for (const p of c.segs.slice(1)) if (e.beat >= p.beat - 0.05 && e.beat < p.beat + lane) fail.push(`${e.type}@${e.beat} inside a safe lane`);
    }
  }
  const idle = idleBot(c);
  m.idle = idle.pct;
  if (idle.won || idle.pct >= 0.1) fail.push(`idle bot reached ${(idle.pct * 100).toFixed(0)}%`);
  const spam = spamSweep(c);
  m.spamMax = Math.max(...spam.map((s) => s.pct));
  const worst = spam.find((s) => s.pct === m.spamMax);
  m.spamWorst = worst;
  if (m.spamMax >= 0.25) fail.push(`spam bot reached ${(m.spamMax * 100).toFixed(0)}% at ${worst.ms}ms/${worst.hold}ms`);
  const variants = opts.variants || [{ width: 160 }, { width: 320 }];
  let chosen = null;
  m.reach = 0;
  for (const v of variants) {
    const ev = search(c, v);
    m.reach = Math.max(m.reach, reach.v);
    if (!ev || !runEvents(c, ev).won) continue;
    const cen = centered(c, ev);
    const mw = Math.min(...cen.windows.map((w) => (w.hi - w.lo + 1) * DT * 1000));
    if (!chosen || mw > chosen.mw) chosen = { ...cen, mw };
  }
  if (!chosen) {
    fail.push('unbeatable');
    return { ok: false, fail, m, c };
  }
  const { pairs, windows } = chosen;
  const ms = windows.map((w) => (w.hi - w.lo + 1) * DT * 1000);
  m.inputs = pairs.length;
  m.ips = pairs.length / c.duration;
  m.press = pairs.map((p, k) => {
    const o = c.reactables.find((r) => r.te >= p[0] * DT - 0.05);
    return { t: p[0] * DT, w: ms[k], r: o ? (p[0] * DT - o.vis) * 1000 : 9999, tb: o ? o.tb : p[0] * DT };
  });
  m.minWindow = Math.min(...ms);
  m.wide = ms.filter((v) => v > 400).length / ms.length;
  m.windows = ms.map((v, k) => {
    const o = c.reactables.find((r) => r.te >= pairs[k][0] * DT - 0.05);
    return `${(pairs[k][0] * DT).toFixed(1)}s ${o ? o.kind : '-'} ${Math.round(v)}`;
  });
  const times = pairs.map((p) => p[0] * DT).sort((a, b) => a - b);
  const gaps = [times[0], ...times.slice(1).map((t, i) => t - times[i]), c.duration - times[times.length - 1]];
  m.maxGap = Math.max(...gaps);
  let react = Infinity;
  pairs.forEach((p, k) => {
    const tp = p[0] * DT;
    const o = c.reactables.find((r) => r.te >= tp - 0.05);
    if (o) react = Math.min(react, (tp - o.vis) * 1000);
  });
  m.reaction = react;
  if (m.minWindow < gate.window) fail.push(`tightest window ${m.minWindow.toFixed(0)}ms < ${gate.window}`);
  if (m.wide > 0.3) fail.push(`${(m.wide * 100).toFixed(0)}% of windows over 400ms`);
  if (react < gate.reaction) fail.push(`reaction ${react.toFixed(0)}ms < ${gate.reaction}`);
  if (m.ips < gate.ips[0] || m.ips > gate.ips[1]) fail.push(`inputs/s ${m.ips.toFixed(2)} outside ${gate.ips.join('-')}`);
  if (m.maxGap > gate.gap) fail.push(`no-input stretch ${m.maxGap.toFixed(2)}s > ${gate.gap}`);
  const jr = jitterBot(c, pairs, opts.jitter);
  m.jitter = jr;
  if (jr < gate.jitter[0] || jr > gate.jitter[1]) fail.push(`jitter clear rate ${(jr * 100).toFixed(0)}% outside ${gate.jitter.map((v) => v * 100).join('-')}%`);
  return { ok: fail.length === 0, fail, m, c, pairs };
}
