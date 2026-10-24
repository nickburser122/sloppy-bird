import { colors, radius, tokens, motion, shade } from '../../config/tokens.js';
import { drawTelegraph } from './shared.js';

const HEX = ['0x7ffd 4a10', '0xdead beef', '0x0000 0000', '0xcafe f00d', '0x1badb002', '0xfee1 dead', '0x8badf00d', '0xbaad f00d'];

export function drawSegfaultBoss(ctx, L, st) {
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

  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i === 0 ? colors.hazard : colors.border;
    ctx.beginPath();
    ctx.arc(x + 20 + i * 14, y + 20, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.font = '500 11px ' + tokens.font.mono;
  const scroll = motion.reduced ? 0 : Math.floor(st.time * (st.flash >= 0 ? 8 : 3));
  const rows = Math.max(3, Math.floor((L.h - 130) / 18));
  for (let i = 0; i < rows; i++) {
    const glitch = st.phase > 0 && (i + scroll) % 5 === 0;
    ctx.fillStyle = glitch ? colors.hazard : colors.muted;
    ctx.fillText(HEX[(i + scroll) % HEX.length], x + 18 + (glitch ? 6 : 0), y + 52 + i * 18);
  }

  ctx.fillStyle = colors.hazard;
  ctx.font = '700 ' + Math.max(11, Math.round(L.w * 0.075)) + 'px ' + tokens.font.mono;
  ctx.fillText('SEGFAULT', x + 18, y + L.h - 62);
  ctx.fillStyle = colors.fg;
  ctx.font = '500 10px ' + tokens.font.mono;
  ctx.fillText('core dumped', x + 18, y + L.h - 44);
  const blink = motion.reduced ? 1 : Math.floor(st.time * 2) % 2;
  if (blink) {
    ctx.fillStyle = colors.accent;
    ctx.fillRect(x + 18, y + L.h - 32, 10, 16);
  }

  if (st.flash >= 0) drawTelegraph(ctx, L, st);
}
