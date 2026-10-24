import { tuning } from '../../config/tuning.js';
import { colors, radius, tokens, motion } from '../../config/tokens.js';

export function bossLayout(width, groundY, tall) {
  const b = tuning.boss;
  const w = Math.min(b.maxW, Math.max(b.minW, width * b.widthRatio));
  const h = tall ? tall : Math.min(w * 1.4, groundY - 90);
  return { x: width - w - b.margin, y: groundY - h, w, h };
}

export function drawTelegraph(ctx, L, st) {
  const x = L.x + (motion.reduced ? 0 : st.flinch * 8);
  const pulse = motion.reduced ? 1 : 0.55 + 0.45 * Math.sin(st.flash * 0.03);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.strokeStyle = colors.hazard;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - 2, L.y - 2, L.w + 4, L.h + 4, radius.l + 2);
  ctx.stroke();
  ctx.restore();
  ctx.font = '600 12px ' + tokens.font.mono;
  const tw = ctx.measureText(st.label).width + 20;
  const cx = x + L.w / 2;
  const ly = Math.max(L.y - 34, 66);
  ctx.fillStyle = colors.surface;
  ctx.strokeStyle = colors.hazard;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(cx - tw / 2, ly, tw, 24, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = colors.fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(st.label, cx, ly + 12);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
}
