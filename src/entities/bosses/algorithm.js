import { colors, radius, tokens, motion, shade } from '../../config/tokens.js';
import { drawTelegraph } from './shared.js';

export function drawAlgorithmBoss(ctx, L, st) {
  const shake = motion.reduced ? 0 : st.flinch * 8;
  const x = L.x + shake;
  const y = L.y;
  ctx.save();
  shade(ctx, 'rgba(' + colors.ink + ', ' + tokens.shadow[3].alpha + ')', tokens.shadow[3].blur, tokens.shadow[3].y);
  ctx.fillStyle = colors.surface;
  ctx.beginPath();
  ctx.roundRect(x, y, L.w, L.h, radius.l);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x + 0.5, y + 0.5, L.w - 1, L.h - 1, radius.l);
  ctx.stroke();

  ctx.fillStyle = colors.fg;
  ctx.beginPath();
  ctx.roundRect(x + 16, y + 16, L.w * 0.34, 22, 11);
  ctx.fill();
  ctx.fillStyle = colors.skeleton;
  ctx.beginPath();
  ctx.roundRect(x + 24 + L.w * 0.34, y + 16, L.w * 0.3, 22, 11);
  ctx.fill();

  const cx = x + L.w / 2;
  const ey = y + L.h * 0.3;
  const rw = L.w * 0.38;
  ctx.fillStyle = colors.skeleton;
  ctx.beginPath();
  ctx.ellipse(cx, ey, rw, rw * 0.62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.accent;
  const lookX = -rw * 0.12;
  ctx.beginPath();
  ctx.arc(cx + lookX, ey, rw * 0.36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  const hs = rw * 0.2;
  ctx.beginPath();
  ctx.moveTo(cx + lookX, ey + hs * 0.55);
  ctx.bezierCurveTo(cx + lookX + hs, ey, cx + lookX + hs * 0.5, ey - hs * 0.8, cx + lookX, ey - hs * 0.3);
  ctx.bezierCurveTo(cx + lookX - hs * 0.5, ey - hs * 0.8, cx + lookX - hs, ey, cx + lookX, ey + hs * 0.55);
  ctx.fill();
  if (st.phase > 0) {
    ctx.strokeStyle = colors.fg;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - rw, ey - rw * 0.7);
    ctx.lineTo(cx - rw * 0.1, ey - rw * 0.5);
    ctx.stroke();
  }

  const bars = 6;
  const base = y + L.h - 36;
  const area = L.h * 0.34;
  const bw = (L.w - 48) / bars;
  for (let i = 0; i < bars; i++) {
    const wave = motion.reduced ? 0.6 : 0.55 + 0.35 * Math.sin(st.time * (st.flash >= 0 ? 7 : 2.4) + i * 0.9);
    const bh = area * wave;
    ctx.fillStyle = i % 2 ? colors.accent : colors.solid;
    ctx.beginPath();
    ctx.roundRect(x + 24 + i * bw + 3, base - bh, bw - 6, bh, 5);
    ctx.fill();
  }
  ctx.strokeStyle = colors.border;
  ctx.beginPath();
  ctx.moveTo(x + 20, base + 0.5);
  ctx.lineTo(x + L.w - 20, base + 0.5);
  ctx.stroke();

  if (st.flash >= 0) drawTelegraph(ctx, L, st);
}
