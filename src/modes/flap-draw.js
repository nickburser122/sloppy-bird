import { tuning } from '../config/tuning.js';

const P = tuning.flap;
const W = tuning.stage.w;
const H = tuning.stage.h;
const TAU = Math.PI * 2;
const CX = P.px + P.sprite / 2;

function background(ctx, sim, pal, motion) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, pal.bg0);
  g.addColorStop(1, pal.bg1);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const f = (sim.t / sim.c.beatSec) % 1;
  ctx.fillStyle = pal.mist;
  for (let i = 0; i < 4; i++) {
    const off = -((sim.xt * (0.04 + i * 0.03) + i * 200) % 520);
    for (let x = off - 520; x < W + 520; x += 520) ctx.fillRect(x, 330 + i * 40, 420, 26);
  }
  ctx.strokeStyle = pal.reed;
  ctx.fillStyle = pal.reed;
  ctx.lineWidth = 3;
  const off = -((sim.xt * 0.35) % 90);
  for (let x = off - 90; x < W + 90; x += 90) {
    const idx = Math.round((x + sim.xt * 0.35) / 90);
    const h = 70 + 50 * (0.5 + 0.5 * Math.sin(idx * 7.13));
    ctx.beginPath();
    ctx.moveTo(x, P.floor);
    ctx.lineTo(x + 6, P.floor - h);
    ctx.stroke();
    ctx.fillRect(x + 2, P.floor - h - 14, 8, 18);
  }
  ctx.fillStyle = pal.water;
  ctx.fillRect(0, P.floor, W, H - P.floor);
  ctx.fillStyle = pal.waterLine;
  ctx.fillRect(0, P.floor, W, 3);
  if (!motion) {
    ctx.fillStyle = `rgba(${pal.pulse},${0.06 * (1 - f) * (1 - f)})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function vineColumn(ctx, sx, w, y0, y1, tipDir, pal) {
  if (y1 <= y0) return;
  ctx.fillStyle = pal.vine;
  ctx.fillRect(sx, y0, w, y1 - y0);
  ctx.fillStyle = pal.thorn;
  const tipY = tipDir > 0 ? y1 : y0;
  for (let x = sx; x < sx + w - 1; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, tipY);
    ctx.lineTo(x + Math.min(20, sx + w - x) / 2, tipY + tipDir * 16);
    ctx.lineTo(x + Math.min(20, sx + w - x), tipY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = pal.outline;
  ctx.lineWidth = 2;
  ctx.strokeRect(sx, y0, w, y1 - y0);
}

function hazards(ctx, sim, pal, glow) {
  const c = sim.c;
  const t = sim.t;
  const xt = sim.xt;
  for (const k of c.thorns) {
    const sx = k.ox - xt + P.px;
    if (sx > W || sx + k.w < 0) continue;
    const gy = sim.gapY(k, t);
    if (glow) {
      ctx.strokeRect(sx, -4, k.w, gy - k.gap / 2 + 4);
      ctx.strokeRect(sx, gy + k.gap / 2, k.w, H - gy - k.gap / 2);
    } else {
      vineColumn(ctx, sx, k.w, 0, gy - k.gap / 2 - 16, 1, pal);
      vineColumn(ctx, sx, k.w, gy + k.gap / 2 + 16, H, -1, pal);
    }
  }
  for (const s of c.spiders) {
    const sx = s.ox - xt + P.px;
    if (sx > W || sx < -30) continue;
    const y = sim.spiderY(s, t);
    if (glow) {
      ctx.beginPath();
      ctx.arc(sx, y, P.spiderR + 5, 0, TAU);
      ctx.stroke();
      continue;
    }
    ctx.strokeStyle = 'rgba(230,240,255,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, y);
    ctx.stroke();
    ctx.fillStyle = pal.spider;
    ctx.beginPath();
    ctx.arc(sx, y, P.spiderR, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = pal.outline;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = pal.spider;
    ctx.lineWidth = 3;
    for (let i = -2; i <= 2; i++) {
      if (!i) continue;
      ctx.beginPath();
      ctx.moveTo(sx, y);
      ctx.lineTo(sx + i * 12, y + 6 + Math.abs(i) * 4);
      ctx.stroke();
    }
    ctx.fillStyle = '#ff4d6a';
    ctx.fillRect(sx - 6, y - 4, 4, 4);
    ctx.fillRect(sx + 2, y - 4, 4, 4);
  }
  for (const p of c.plants) {
    const sx = p.ox - xt + P.px;
    if (sx > W || sx + p.w < 0) continue;
    const h = sim.plantH(p, t);
    if (glow) {
      ctx.strokeRect(sx, P.floor - Math.max(h, 18), p.w, Math.max(h, 18));
      continue;
    }
    ctx.fillStyle = pal.plant;
    ctx.fillRect(sx + p.w / 2 - 6, P.floor - Math.max(h, 24), 12, Math.max(h, 24));
    ctx.beginPath();
    ctx.ellipse(sx + p.w / 2, P.floor - h - 6, p.w / 2, 22 + h * 0.05, 0, Math.PI, TAU);
    ctx.fill();
    ctx.fillStyle = pal.outline;
    for (let x = sx + 6; x < sx + p.w - 6; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, P.floor - h - 6);
      ctx.lineTo(x + 6, P.floor - h + 8);
      ctx.lineTo(x + 12, P.floor - h - 6);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = pal.outline;
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, P.floor - h - 6, p.w, h + 6);
  }
}

function winds(ctx, sim, pal) {
  for (const w of sim.c.winds) {
    const sx = w.ox - sim.xt + P.px;
    if (sx > W || sx + w.w < 0) continue;
    ctx.fillStyle = w.dir < 0 ? pal.windUp : pal.windDown;
    ctx.fillRect(sx, 0, w.w, P.floor);
    ctx.strokeStyle = pal.wind;
    ctx.lineWidth = 3;
    const ph = (sim.t * 140) % 80;
    for (let x = sx + 24; x < sx + w.w - 10; x += 56) {
      for (let y = -80; y < P.floor; y += 80) {
        const yy = w.dir < 0 ? y + 80 - ph : y + ph;
        ctx.beginPath();
        ctx.moveTo(x - 9, yy + (w.dir < 0 ? 12 : -12));
        ctx.lineTo(x, yy);
        ctx.lineTo(x + 9, yy + (w.dir < 0 ? 12 : -12));
        ctx.stroke();
      }
    }
  }
}

export function drawFlapWorld(ctx, sim, pal, { motion = false } = {}) {
  background(ctx, sim, pal, motion);
  winds(ctx, sim, pal);
  hazards(ctx, sim, pal, false);
  const a = sim.darkAmt(sim.t);
  if (a <= 0) return;
  const cy = Math.min(Math.max(sim.y, 0), H);
  const g = ctx.createRadialGradient(CX, cy, 40, CX, cy, 150);
  g.addColorStop(0, `rgba(0,3,6,${0.0})`);
  g.addColorStop(0.7, `rgba(0,3,6,${0.15 * a})`);
  g.addColorStop(1, `rgba(0,3,6,${0.97 * a})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const f = (sim.t / sim.c.beatSec) % 1;
  ctx.save();
  ctx.globalAlpha = a * (0.45 + 0.55 * (1 - f) * (1 - f));
  ctx.strokeStyle = pal.glow;
  ctx.lineWidth = 3;
  ctx.shadowColor = pal.glow;
  ctx.shadowBlur = 14;
  hazards(ctx, sim, pal, true);
  ctx.restore();
}
