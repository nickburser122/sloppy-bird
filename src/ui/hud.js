import { colors, fonts } from '../config/tokens.js';

export function drawHud(ctx, w, view) {
  const barH = 6 + 3 * (view.pulse || 0);
  ctx.fillStyle = colors.track;
  ctx.fillRect(0, 0, w, barH);
  ctx.fillStyle = colors.accent;
  ctx.fillRect(0, 0, w * view.pct, barH);
  if (view.best > 0) {
    ctx.fillStyle = colors.ghost;
    ctx.fillRect(Math.min(w - 3, w * view.best - 1.5), 0, 3, barH + 6);
  }
  ctx.fillStyle = colors.fg;
  ctx.font = `600 16px ${fonts.mono}`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText(`attempt ${view.attempt}`, 16, 20);
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.floor(view.pct * 100)}%`, w - 16, 20);
}
