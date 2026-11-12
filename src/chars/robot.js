const SHELL = '#9fb4c8';
const EDGE = '#2a3a52';
const VISOR = '#38e8ff';
const RED = '#ff5a5a';
const BLUE = '#5a8cff';

export const boltColors = [SHELL, VISOR, '#ffffff', EDGE];

export function drawBolt(ctx, x, y, st) {
  const sq = st.landT > 0 ? st.landT / 0.12 : 0;
  const fly = st.grounded ? 0 : Math.min(0.18, Math.abs(st.vy) / 9000);
  ctx.save();
  ctx.translate(x + 20, y);
  ctx.scale(st.gd >= 0 ? 1 : 1, st.gd);
  ctx.scale(1 + sq * 0.22 - fly * 0.5, 1 - sq * 0.22 + fly);
  ctx.fillStyle = SHELL;
  ctx.strokeStyle = EDGE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-18, -18, 36, 36, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = RED;
  ctx.fillRect(-21, -9, 6, 8);
  ctx.fillStyle = BLUE;
  ctx.fillRect(-21, 1, 6, 8);
  ctx.fillStyle = EDGE;
  ctx.fillRect(-12, 12, 24, 5);
  ctx.fillStyle = '#16223a';
  ctx.beginPath();
  ctx.roundRect(-9, -9, 24, 13, 5);
  ctx.fill();
  const blink = Math.sin(st.t * 3.1) > 0.96 ? 0.2 : 1;
  ctx.fillStyle = VISOR;
  ctx.fillRect(-4, -6, 14, 7 * blink);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-13, -14);
  ctx.lineTo(10, -14);
  ctx.stroke();
  ctx.restore();
}
