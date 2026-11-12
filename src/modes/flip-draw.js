import { tuning } from '../config/tuning.js';

const F = tuning.flip;
const R = tuning.run;
const W = tuning.stage.w;
const H = tuning.stage.h;
const MID = (F.floor + F.ceil) / 2;
const TAU = Math.PI * 2;

function background(ctx, sim, pal, motion) {
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, W, H);
  const off = -((sim.xt * 0.25) % 160);
  ctx.fillStyle = pal.panel;
  for (let x = off - 160; x < W + 160; x += 160) {
    ctx.fillRect(x + 8, F.ceil + 12, 144, F.floor - F.ceil - 24);
  }
  ctx.strokeStyle = pal.panelLine;
  ctx.lineWidth = 2;
  for (let x = off - 160; x < W + 160; x += 160) ctx.strokeRect(x + 8, F.ceil + 12, 144, F.floor - F.ceil - 24);
  const off2 = -((sim.xt * 0.12) % 120);
  ctx.fillStyle = pal.star;
  for (let x = off2 - 120; x < W + 120; x += 120) {
    ctx.fillRect(x + 20, 30, 3, 3);
    ctx.fillRect(x + 70, 62, 2, 2);
    ctx.fillRect(x + 40, F.floor + 40, 3, 3);
    ctx.fillRect(x + 95, F.floor + 70, 2, 2);
  }
  if (!motion) {
    const f = (sim.t / sim.c.beatSec) % 1;
    ctx.fillStyle = `rgba(${pal.pulse},${0.1 * (1 - f) * (1 - f)})`;
    ctx.fillRect(0, F.ceil, W, F.floor - F.ceil);
  }
}

function surfaces(ctx, sim, pal) {
  const xt = sim.xt;
  for (const side of [0, 1]) {
    const y = side === 0 ? F.floor : F.ceil - 24;
    let cur = 0;
    const pieces = [];
    for (const g of sim.c.gaps) {
      if (g.side !== side) continue;
      const sx = g.ox - xt + F.px;
      if (sx > W || sx + g.w < 0) continue;
      if (sx > cur) pieces.push([cur, sx]);
      cur = Math.max(cur, sx + g.w);
    }
    pieces.push([cur, W]);
    for (const [a, b] of pieces) {
      ctx.fillStyle = pal.hull;
      ctx.fillRect(a, y, b - a, 24 + (side === 0 ? H - F.floor : 0));
      ctx.fillStyle = pal.edge;
      ctx.fillRect(a, side === 0 ? F.floor : F.ceil - 4, b - a, 4);
    }
  }
}

function spike(ctx, x, side, pal) {
  const base = side === 0 ? F.floor : F.ceil;
  const dir = side === 0 ? -1 : 1;
  ctx.beginPath();
  ctx.moveTo(x, base);
  ctx.lineTo(x + R.spikeW / 2, base + dir * R.spikeW);
  ctx.lineTo(x + R.spikeW, base);
  ctx.closePath();
  ctx.fillStyle = pal.hazard;
  ctx.fill();
  ctx.strokeStyle = pal.outline;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function obstacles(ctx, sim, pal) {
  const c = sim.c;
  const xt = sim.xt;
  const t = sim.t;
  for (const s of c.spikes) {
    const sx = s.ox - xt + F.px;
    if (sx > W || sx + s.w < 0) continue;
    for (let k = 0; k < s.n; k++) spike(ctx, sx + k * R.spikeW, s.side, pal);
  }
  for (const g of c.gaps) {
    const sx = g.ox - xt + F.px;
    if (sx > W || sx + g.w < 0) continue;
    ctx.strokeStyle = pal.hazard;
    ctx.lineWidth = 3;
    const y = g.side === 0 ? F.floor : F.ceil;
    ctx.beginPath();
    ctx.moveTo(sx, y);
    ctx.lineTo(sx, y + (g.side === 0 ? 14 : -14));
    ctx.moveTo(sx + g.w, y);
    ctx.lineTo(sx + g.w, y + (g.side === 0 ? 14 : -14));
    ctx.stroke();
  }
  for (const l of c.lasers) {
    const sx = l.ox - xt + F.px;
    if (sx > W || sx + l.w < 0) continue;
    const bs = sim.laserSide(l, t);
    ctx.fillStyle = 'rgba(255,77,106,0.18)';
    ctx.fillRect(sx, F.ceil, l.w, F.floor - F.ceil);
    ctx.fillStyle = pal.hazard;
    ctx.fillRect(sx, bs === 0 ? MID : F.ceil, l.w, MID - F.ceil);
    ctx.fillStyle = pal.outline;
    ctx.fillRect(sx + l.w / 2 - 1, bs === 0 ? MID : F.ceil, 2, MID - F.ceil);
    ctx.fillStyle = pal.edge;
    ctx.fillRect(sx - 4, F.ceil, l.w + 8, 8);
    ctx.fillRect(sx - 4, F.floor - 8, l.w + 8, 8);
  }
  for (const k of c.crushers) {
    const sx = k.ox - xt + F.px;
    if (sx > W || sx + k.w < 0) continue;
    const d = sim.crushDepth(k, t);
    const y = k.side === 0 ? F.floor - d : F.ceil;
    ctx.fillStyle = 'rgba(255,77,106,0.12)';
    ctx.fillRect(sx, k.side === 0 ? F.floor - k.depth : F.ceil, k.w, k.depth);
    ctx.fillStyle = pal.hull;
    ctx.fillRect(sx, y, k.w, d);
    ctx.fillStyle = pal.hazard;
    const by = k.side === 0 ? y : y + d - 8;
    ctx.fillRect(sx, by, k.w, 8);
    ctx.strokeStyle = pal.outline;
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, y, k.w, d);
  }
  for (const o of c.orbs) {
    const sx = o.ox - xt + F.px;
    if (sx > W + 40 || sx < -40) continue;
    ctx.globalAlpha = sim.used[o.id] ? 0.25 : 1;
    ctx.strokeStyle = pal.orb;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(sx, o.cy, F.orbR - 6 + Math.sin(t * 8) * 2, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = pal.orb;
    ctx.beginPath();
    ctx.arc(sx, o.cy, 6, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  for (const f of c.forces) {
    const sx = f.ox - xt + F.px;
    if (sx > W + 20 || sx < -20) continue;
    ctx.fillStyle = 'rgba(255,210,74,0.2)';
    ctx.fillRect(sx - 4, F.ceil, 8, F.floor - F.ceil);
    ctx.strokeStyle = pal.orb;
    ctx.lineWidth = 3;
    for (let y = F.ceil + 30; y < F.floor - 20; y += 60) {
      ctx.beginPath();
      ctx.moveTo(sx - 9, y);
      ctx.lineTo(sx, y + 12);
      ctx.lineTo(sx + 9, y);
      ctx.stroke();
    }
  }
  for (const p of c.portals) {
    const sx = p.ox - xt + F.px;
    if (sx > W + 20 || sx < -20) continue;
    const hot = p.mul > 1;
    ctx.fillStyle = hot ? 'rgba(255,122,61,0.28)' : 'rgba(110,195,255,0.28)';
    ctx.fillRect(sx - 6, F.ceil, 12, F.floor - F.ceil);
    ctx.strokeStyle = hot ? '#ff7a3d' : '#6ec3ff';
    ctx.lineWidth = 3;
    for (let y = F.ceil + 20; y < F.floor - 30; y += 60) {
      const d = hot ? 10 : -10;
      ctx.beginPath();
      ctx.moveTo(sx - d, y);
      ctx.lineTo(sx + d, y + 14);
      ctx.lineTo(sx - d, y + 28);
      ctx.stroke();
    }
  }
}

export function drawFlipWorld(ctx, sim, pal, { motion = false } = {}) {
  background(ctx, sim, pal, motion);
  surfaces(ctx, sim, pal);
  obstacles(ctx, sim, pal);
}
