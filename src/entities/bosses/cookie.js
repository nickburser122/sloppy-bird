import { colors, radius, tokens, motion, shade } from '../../config/tokens.js';
import { bossLayout, drawTelegraph } from './shared.js';

export { bossLayout };

const CHIPS = [
  [-0.42, -0.2],
  [0.3, -0.38],
  [-0.1, 0.34],
  [0.46, 0.1],
  [-0.5, 0.2],
  [0.12, -0.05]
];

export function drawCookieBoss(ctx, L, st) {
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

  ctx.fillStyle = colors.skeleton;
  ctx.beginPath();
  ctx.roundRect(x + 16, y + 16, L.w * 0.5, 8, 4);
  ctx.roundRect(x + 16, y + 30, L.w * 0.34, 8, 4);
  ctx.fill();

  const cx = x + L.w / 2;
  const cy = y + L.h * 0.45;
  const r = L.w * 0.34;
  ctx.fillStyle = colors.cookie;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.surface;
  ctx.beginPath();
  ctx.arc(cx + r * 0.85, cy - r * 0.8, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.chip;
  for (let i = 0; i < CHIPS.length; i++) {
    ctx.beginPath();
    ctx.roundRect(cx + CHIPS[i][0] * r - 3, cy + CHIPS[i][1] * r - 3, 6, 6, 1.5);
    ctx.fill();
  }

  const ex = r * 0.34;
  for (let i = -1; i <= 1; i += 2) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx + i * ex, cy - r * 0.18, r * 0.17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.fg;
    ctx.beginPath();
    ctx.arc(cx + i * ex - r * 0.05, cy - r * 0.16, r * 0.075, 0, Math.PI * 2);
    ctx.fill();
    if (st.phase > 0) {
      ctx.strokeStyle = colors.chip;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + i * ex - r * 0.2 * i, cy - r * 0.46 + (i < 0 ? 0 : r * 0.1));
      ctx.lineTo(cx + i * ex + r * 0.2 * i, cy - r * 0.38 - (i < 0 ? 0 : r * 0.1) + r * 0.1);
      ctx.stroke();
    }
  }

  const open = st.flash >= 0 ? 0.28 : 0.12;
  ctx.fillStyle = colors.chip;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.38, r * 0.36, r * open, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - r * 0.12, cy + r * 0.38 - r * open, r * 0.1, r * 0.1);
  ctx.fillRect(cx + r * 0.04, cy + r * 0.38 - r * open, r * 0.1, r * 0.1);

  const by = y + L.h - 44;
  ctx.fillStyle = colors.fg;
  ctx.beginPath();
  ctx.roundRect(x + 14, by, L.w * 0.5, 28, radius.s);
  ctx.fill();
  ctx.strokeStyle = colors.border;
  ctx.beginPath();
  ctx.roundRect(x + 14 + L.w * 0.5 + 8, by + 0.5, L.w * 0.5 - 44, 27, radius.s);
  ctx.stroke();

  if (st.flash >= 0) drawTelegraph(ctx, L, st);
}
