import { colors, fonts } from '../config/tokens.js';
import { tuning } from '../config/tuning.js';

export function drawDeath(ctx, w, h, session) {
  if (session.state !== 'dying' || session.frozen) return;
  const k = Math.min(1, session.t / tuning.restart.deathMs);
  ctx.save();
  ctx.fillStyle = colors.dim;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1 - k * k;
  ctx.fillStyle = colors.fg;
  ctx.font = `700 40px ${fonts.mono}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${Math.floor(session.lastPct * 100)}%  ·  attempt ${session.attempt}`, w / 2, h / 2);
  ctx.restore();
}
