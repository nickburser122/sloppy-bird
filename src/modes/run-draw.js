import { tuning } from '../config/tuning.js';

const R = tuning.run;
const W = tuning.stage.w;
const H = tuning.stage.h;
const TAU = Math.PI * 2;

function trees(ctx, xt, factor, baseY, color, period, minH, maxH) {
  ctx.fillStyle = color;
  const off = -((xt * factor) % period);
  for (let x = off - period; x < W + period; x += period) {
    const idx = Math.round((x + xt * factor) / period);
    const h = minH + (maxH - minH) * (0.5 + 0.5 * Math.sin(idx * 12.9898));
    const w = period * 0.6;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, baseY);
    ctx.lineTo(x, baseY - h);
    ctx.lineTo(x + w / 2, baseY);
    ctx.closePath();
    ctx.fill();
  }
}

function background(ctx, sim, pal, motion) {
  const g = ctx.createLinearGradient(0, 0, 0, R.ground);
  g.addColorStop(0, pal.skyTop);
  g.addColorStop(1, pal.skyBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = pal.sun;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(720, 300, 70, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
  trees(ctx, sim.xt, 0.08, R.ground, pal.far, 90, 120, 220);
  trees(ctx, sim.xt, 0.2, R.ground, pal.mid, 70, 90, 170);
  trees(ctx, sim.xt, 0.45, R.ground, pal.near, 54, 60, 120);
  if (!motion) {
    const f = (sim.t / sim.c.beatSec) % 1;
    ctx.fillStyle = `rgba(${pal.pulse},${0.09 * (1 - f) * (1 - f)})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function ground(ctx, sim, pal) {
  const xt = sim.xt;
  ctx.fillStyle = pal.void;
  ctx.fillRect(0, R.ground, W, H - R.ground);
  let cur = 0;
  const pieces = [];
  for (const p of sim.c.pits) {
    const sx = p.ox - xt + R.px;
    if (sx > W || sx + p.w < 0) continue;
    if (sx > cur) pieces.push([cur, sx]);
    cur = Math.max(cur, sx + p.w);
  }
  pieces.push([cur, W]);
  for (const [a, b] of pieces) {
    ctx.fillStyle = pal.ground;
    ctx.fillRect(a, R.ground, b - a, H - R.ground);
    ctx.fillStyle = pal.grass;
    ctx.fillRect(a, R.ground, b - a, 5);
  }
}

function spike(ctx, x, pal) {
  ctx.beginPath();
  ctx.moveTo(x, R.ground);
  ctx.lineTo(x + R.spikeW / 2, R.ground - R.spikeW);
  ctx.lineTo(x + R.spikeW, R.ground);
  ctx.closePath();
  ctx.fillStyle = pal.hazard;
  ctx.fill();
  ctx.strokeStyle = pal.outline;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function sawBlade(ctx, x, y, r, rot, pal) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    const rr = i % 2 ? r * 0.72 : r;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = '#cfd6e6';
  ctx.fill();
  ctx.strokeStyle = pal.hazard;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = pal.hazard;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.25, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function obstacles(ctx, sim, pal) {
  const c = sim.c;
  const xt = sim.xt;
  const t = sim.t;
  for (const s of c.ceils) {
    const sx = s.ox - xt + R.px;
    if (sx > W || sx + s.w < 0) continue;
    ctx.fillStyle = pal.ceil;
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx + s.w, 0);
    ctx.lineTo(sx + s.w, s.h - 12);
    for (let x = sx + s.w; x > sx; x -= 22) {
      ctx.lineTo(x - 11, s.h);
      ctx.lineTo(Math.max(sx, x - 22), s.h - 12);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = pal.hazard;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  for (const s of c.spikes) {
    const sx = s.ox - xt + R.px;
    if (sx > W || sx + s.w < 0) continue;
    for (let k = 0; k < s.n; k++) spike(ctx, sx + k * R.spikeW, pal);
  }
  for (const s of c.saws) {
    const sx = s.ox - xt + R.px;
    if (sx > W + s.r || sx < -s.r) continue;
    if (s.cy !== s.cy2) {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, s.cy);
      ctx.lineTo(sx, s.cy2);
      ctx.stroke();
    }
    sawBlade(ctx, sx, sim.sawY(s, t), s.r, t * 12, pal);
  }
  for (const l of c.logs) {
    const sx = l.ox - xt + R.px;
    if (sx > W || sx + l.w < 0) continue;
    const y = sim.logY(l, t);
    if (y < -l.h) continue;
    ctx.fillStyle = pal.log;
    ctx.beginPath();
    ctx.roundRect(sx, y, l.w, l.h, 10);
    ctx.fill();
    ctx.strokeStyle = pal.outline;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = '#a8703d';
    ctx.beginPath();
    ctx.arc(sx + 14, y + l.h / 2, 8, 0, TAU);
    ctx.moveTo(sx + 30, y + 10);
    ctx.lineTo(sx + l.w - 10, y + 10);
    ctx.stroke();
  }
  for (const p of c.plats) {
    if (sim.broken[p.id]) continue;
    const sx = p.ox - xt + R.px;
    if (sx > W || sx + p.w < 0) continue;
    const top = sim.top(p, t);
    const shake = sim.crumT[p.id] >= 0 ? Math.sin(t * 90) * 2 : 0;
    ctx.fillStyle = p.kind === 'mover' ? pal.mover : pal.plat;
    ctx.beginPath();
    ctx.roundRect(sx + shake, top, p.w, R.platH, 5);
    ctx.fill();
    ctx.strokeStyle = pal.outline;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (p.kind === 'crumble') {
      for (let x = sx + 22; x < sx + p.w - 8; x += 26) {
        ctx.moveTo(x + shake, top + 2);
        ctx.lineTo(x - 4 + shake, top + R.platH - 2);
      }
    } else {
      ctx.moveTo(sx + p.w / 2 - 6, top + 12);
      ctx.lineTo(sx + p.w / 2, top + 5);
      ctx.lineTo(sx + p.w / 2 + 6, top + 12);
    }
    ctx.stroke();
  }
  for (const p of c.pads) {
    const sx = p.ox - xt + R.px;
    if (sx > W || sx + p.w < 0) continue;
    ctx.fillStyle = pal.pad;
    ctx.beginPath();
    ctx.moveTo(sx, R.ground);
    ctx.lineTo(sx + 10, R.ground - 14);
    ctx.lineTo(sx + p.w - 10, R.ground - 14);
    ctx.lineTo(sx + p.w, R.ground);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = pal.outline;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  for (const r of c.rings) {
    const sx = r.ox - xt + R.px;
    if (sx > W + 40 || sx < -40) continue;
    ctx.globalAlpha = sim.used[r.id] ? 0.25 : 1;
    ctx.strokeStyle = pal.ring;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(sx, r.cy, R.ringR - 4, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  for (const p of c.portals) {
    const sx = p.ox - xt + R.px;
    if (sx > W + 20 || sx < -20) continue;
    const hot = p.mul > 1;
    ctx.fillStyle = hot ? 'rgba(255,122,61,0.28)' : 'rgba(110,195,255,0.28)';
    ctx.fillRect(sx - 6, 0, 12, R.ground);
    ctx.strokeStyle = hot ? '#ff7a3d' : '#6ec3ff';
    ctx.lineWidth = 3;
    for (let y = 60; y < R.ground; y += 70) {
      ctx.beginPath();
      const d = hot ? 10 : -10;
      ctx.moveTo(sx - d, y);
      ctx.lineTo(sx + d, y + 14);
      ctx.lineTo(sx - d, y + 28);
      ctx.stroke();
    }
  }
}

function wall(ctx, sim, motion) {
  const f = motion ? 0 : Math.sin(sim.t * 9) * 6;
  const w = 70 + f;
  const g = ctx.createLinearGradient(0, 0, w + 30, 0);
  g.addColorStop(0, 'rgba(255,90,40,0.95)');
  g.addColorStop(0.6, 'rgba(255,150,60,0.55)');
  g.addColorStop(1, 'rgba(255,150,60,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w + 30, H);
}

export function drawRunWorld(ctx, sim, pal, { motion = false } = {}) {
  background(ctx, sim, pal, motion);
  ground(ctx, sim, pal);
  obstacles(ctx, sim, pal);
  if (sim.c.level.wall) wall(ctx, sim, motion);
}
