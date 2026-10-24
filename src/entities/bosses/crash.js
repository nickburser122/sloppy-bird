import { colors, radius, tokens, motion, shade } from '../../config/tokens.js';
import { drawTelegraph } from './shared.js';

export function drawCrashBoss(ctx, L, st) {
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
  ctx.font = '600 13px ' + tokens.font.mono;
  ctx.fillText('Q3', x + 18, y + 30);
  ctx.fillStyle = colors.hazard;
  ctx.font = '650 ' + Math.round(L.w * 0.17) + 'px ' + tokens.font.mono;
  ctx.fillText('-42%', x + 18, y + 30 + L.w * 0.2);

  const area = L.h * 0.46;
  const base = y + L.h - 44;
  const n = 6;
  const cw = (L.w - 44) / n;
  const wobble = motion.reduced ? 0 : Math.sin(st.time * (st.flash >= 0 ? 8 : 2)) * 6;
  for (let i = 0; i < n; i++) {
    const down = 1 - i / (n - 1);
    const top = base - area * (0.25 + 0.7 * down) - (i % 2 ? wobble : -wobble);
    const bh = area * 0.28 + (i % 3) * 8;
    const cx = x + 22 + i * cw + cw / 2;
    ctx.strokeStyle = colors.muted;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, top - 10);
    ctx.lineTo(cx, top + bh + 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(cx - cw * 0.28, top, cw * 0.56, bh, 3);
    if (i % 2) {
      ctx.fillStyle = colors.hazard;
      ctx.fill();
    } else {
      ctx.fillStyle = colors.surface;
      ctx.fill();
      ctx.strokeStyle = colors.hazard;
      ctx.stroke();
    }
  }
  ctx.strokeStyle = colors.border;
  ctx.beginPath();
  ctx.moveTo(x + 18, base + 24.5);
  ctx.lineTo(x + L.w - 18, base + 24.5);
  ctx.stroke();

  if (st.phase > 0) {
    ctx.strokeStyle = colors.hazard;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 18, y + L.h * 0.34);
    ctx.lineTo(x + L.w * 0.5, y + L.h * 0.5);
    ctx.lineTo(x + L.w - 18, y + L.h * 0.72);
    ctx.stroke();
  }

  if (st.flash >= 0) drawTelegraph(ctx, L, st);
}
