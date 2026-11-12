import { tuning } from '../config/tuning.js';

const P = tuning.surf;
const W = tuning.stage.w;
const H = tuning.stage.h;
const TAU = Math.PI * 2;

function sky(ctx, sim, pal, motion) {
  const g = ctx.createLinearGradient(0, 0, 0, P.base + 60);
  g.addColorStop(0, pal.skyTop);
  g.addColorStop(1, pal.skyBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = pal.cloud;
  for (let i = 0; i < 3; i++) {
    const off = -((sim.xt * (0.05 + i * 0.04) + i * 170) % 420);
    for (let x = off - 420; x < W + 420; x += 420) {
      ctx.beginPath();
      ctx.ellipse(x + 120, 70 + i * 55, 150, 26 + i * 4, 0, 0, TAU);
      ctx.fill();
    }
  }
  if (!motion) {
    const f = (sim.t / sim.c.beatSec) % 8;
    if (f < 0.25) {
      ctx.fillStyle = `rgba(210,230,255,${0.12 * (1 - f / 0.25)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }
}

const SURF_Y = new Float32Array(Math.ceil((W + 16) / 6) + 2);

function water(ctx, sim, pal) {
  let n = 0;
  for (let sx = -8; sx <= W + 8; sx += 6) SURF_Y[n++] = sim.surfaceAt(sim.xt + sx, sim.t);
  const g = ctx.createLinearGradient(0, P.base - 60, 0, H);
  g.addColorStop(0, pal.waterTop);
  g.addColorStop(1, pal.waterDeep);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-8, H);
  for (let i = 0; i < n; i++) ctx.lineTo(-8 + i * 6, SURF_Y[i]);
  ctx.lineTo(W + 8, H);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = pal.foam;
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    if (i) ctx.lineTo(-8 + i * 6, SURF_Y[i]);
    else ctx.moveTo(-8, SURF_Y[0]);
  }
  ctx.stroke();
  ctx.strokeStyle = pal.wood;
  ctx.lineWidth = 9;
  for (const r of sim.c.ramps) {
    const sx = r.ox + P.px - sim.xt;
    if (sx > W || sx + r.w < 0) continue;
    ctx.beginPath();
    let first = true;
    for (let u = 0; u <= r.len; u += 6) {
      const x = sx + u;
      const y = sim.surfaceAt(sim.xt + x, sim.t) - 6;
      if (first) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      first = false;
    }
    ctx.stroke();
  }
}

function things(ctx, sim, pal) {
  const c = sim.c;
  const xt = sim.xt;
  const t = sim.t;
  for (const o of c.rocks) {
    const sx = o.ox - xt + P.px;
    if (sx > W || sx + o.w < 0) continue;
    const y0 = P.base - o.top;
    const y1 = P.base + o.bot;
    ctx.fillStyle = pal.rock;
    ctx.beginPath();
    ctx.moveTo(sx, y1);
    ctx.lineTo(sx + 6, y0 + 18);
    ctx.lineTo(sx + o.w * 0.35, y0);
    ctx.lineTo(sx + o.w * 0.7, y0 + 10);
    ctx.lineTo(sx + o.w - 4, y0 + 26);
    ctx.lineTo(sx + o.w, y1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = pal.outline;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  for (const o of c.reefs) {
    const sx = o.ox - xt + P.px;
    if (sx > W || sx + o.w < 0) continue;
    const top = P.base + o.gy - o.gap / 2;
    ctx.fillStyle = pal.reef;
    ctx.fillRect(sx, -20, o.w, top + 20);
    ctx.fillRect(sx, top + o.gap, o.w, H - top - o.gap);
    ctx.fillStyle = pal.coral;
    for (let x = sx; x < sx + o.w; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x + 7, top - 14);
      ctx.lineTo(x + 14, top);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, top + o.gap);
      ctx.lineTo(x + 7, top + o.gap + 14);
      ctx.lineTo(x + 14, top + o.gap);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = pal.outline;
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, -20, o.w, top + 20);
    ctx.strokeRect(sx, top + o.gap, o.w, H - top - o.gap);
  }
  for (const o of c.buoys) {
    const sx = o.ox - xt + P.px;
    if (sx > W || sx + o.w < 0) continue;
    const bs = sim.surfaceAt(o.ox + P.px, t);
    const bx = sx + o.w / 2;
    ctx.strokeStyle = pal.chain;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(bx, bs);
    ctx.lineTo(bx, bs + o.chain);
    ctx.stroke();
    ctx.fillStyle = pal.buoy;
    ctx.beginPath();
    ctx.arc(bx, bs - 12, 15, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx - 15, bs - 15, 30, 6);
    ctx.strokeStyle = pal.outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bx, bs - 12, 15, 0, TAU);
    ctx.stroke();
  }
  for (const o of c.beams) {
    const sx = o.ox - xt + P.px;
    if (sx > W || sx + o.w < 0) continue;
    const bot = P.base + o.bottom;
    if (o.bottom < 0) {
      ctx.strokeStyle = pal.net;
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(200,220,230,0.12)';
      ctx.fillRect(sx, -20, o.w, bot + 20);
      for (let x = sx; x <= sx + o.w; x += 14) {
        ctx.beginPath();
        ctx.moveTo(x, -20);
        ctx.lineTo(x, bot);
        ctx.stroke();
      }
      for (let y = 0; y <= bot; y += 14) {
        ctx.beginPath();
        ctx.moveTo(sx, y);
        ctx.lineTo(sx + o.w, y);
        ctx.stroke();
      }
      ctx.strokeStyle = pal.hazard;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx, bot);
      ctx.lineTo(sx + o.w, bot);
      ctx.stroke();
    } else {
      ctx.fillStyle = pal.wood;
      ctx.fillRect(sx, -20, o.w, bot + 20);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      for (let y = 6; y < bot; y += 22) ctx.fillRect(sx, y, o.w, 3);
      ctx.strokeStyle = pal.outline;
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, -20, o.w, bot + 20);
      ctx.fillStyle = pal.hazard;
      ctx.fillRect(sx, bot - 6, o.w, 6);
    }
  }
  for (const o of c.sharks) {
    const sx = o.ox - xt + P.px;
    if (sx > W || sx + o.w < 0) continue;
    const sy = P.base + o.y0 + (o.amp ? o.amp * Math.sin((TAU * (t - o.tb)) / o.period) : 0);
    ctx.fillStyle = pal.shark;
    ctx.beginPath();
    ctx.ellipse(sx + 36, sy, 38, 14, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sx + 36, sy - 12);
    ctx.lineTo(sx + 26, sy - 28);
    ctx.lineTo(sx + 50, sy - 12);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sx + 74, sy);
    ctx.lineTo(sx + 82, sy - 12 + Math.sin(t * 8) * 3);
    ctx.lineTo(sx + 82, sy + 12 + Math.sin(t * 8) * 3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = pal.outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(sx + 36, sy, 38, 14, 0, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = '#ff4d6a';
    ctx.fillRect(sx + 8, sy - 4, 4, 4);
  }
  for (const o of c.whirls) {
    const sx = o.ox - xt + P.px;
    if (sx > W || sx + o.w < 0) continue;
    ctx.strokeStyle = pal.foam;
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      const bs = sim.surfaceAt(xt + sx + o.w / 2, t);
      ctx.globalAlpha = 0.7 - i * 0.14;
      ctx.beginPath();
      ctx.ellipse(sx + o.w / 2, bs + 6 + i * 16, o.w / 2 - i * 14, 10 - i * 1.5, t * (2 + i), 0, TAU * 0.8);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

export function drawSurfWorld(ctx, sim, pal, { motion = false } = {}) {
  sky(ctx, sim, pal, motion);
  things(ctx, sim, pal);
  water(ctx, sim, pal);
}
