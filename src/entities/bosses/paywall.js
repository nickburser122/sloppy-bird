import { colors, radius, tokens, motion, shade } from '../../config/tokens.js';
import { drawTelegraph } from './shared.js';

export function drawPaywallBoss(ctx, L, st) {
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
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.roundRect(x + 18, y + 18 + i * 12, L.w - 36 - (i % 2) * 30, 6, 3);
    ctx.fill();
  }

  const cx = x + L.w / 2;
  const ly = y + L.h * 0.36;
  const lw = L.w * 0.3;
  const lh = lw * 0.82;
  const open = Math.min(1, st.phase / 3);
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx - open * lw * 0.28, ly - lh * 0.1, lw * 0.32, Math.PI, 0);
  ctx.lineTo(cx + lw * 0.32 - open * lw * 0.28, ly + lh * 0.05 - open * 8);
  ctx.moveTo(cx - lw * 0.32 - open * lw * 0.28, ly - lh * 0.1);
  ctx.lineTo(cx - lw * 0.32 - open * lw * 0.28, ly + lh * 0.05);
  ctx.stroke();
  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.roundRect(cx - lw / 2, ly, lw, lh, 8);
  ctx.fill();
  ctx.fillStyle = colors.surface;
  ctx.beginPath();
  ctx.arc(cx, ly + lh * 0.4, lw * 0.07, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx - lw * 0.03, ly + lh * 0.4, lw * 0.06, lh * 0.28);

  ctx.fillStyle = colors.fg;
  ctx.textAlign = 'center';
  ctx.font = '650 ' + Math.max(14, Math.round(L.w * 0.12)) + 'px ' + tokens.font.mono;
  ctx.fillText('$9.99/mo', cx, y + L.h * 0.68);

  const by = y + L.h - 56;
  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.roundRect(x + 16, by, L.w - 32, 28, radius.s);
  ctx.fill();
  ctx.fillStyle = colors.bg;
  ctx.font = '700 11px ' + tokens.font.mono;
  ctx.fillText('SUBSCRIBE', cx, by + 18);
  ctx.fillStyle = colors.muted;
  ctx.font = '500 9px ' + tokens.font.mono;
  ctx.fillText('no thanks', cx, by + 42);
  ctx.textAlign = 'start';

  if (st.flash >= 0) drawTelegraph(ctx, L, st);
}
