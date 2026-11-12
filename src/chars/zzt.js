const BODY = '#26382b';
const GLOW = '#d8ff6a';
const WING = 'rgba(190,255,230,0.55)';

export const zztColors = [GLOW, '#fffbc2', '#8fffb0', BODY];

export function drawZzt(ctx, x, y, st) {
  const cx = x + 20;
  const flap = Math.max(0, st.flapT || 0);
  const beat = 0.5 + 0.5 * Math.sin(st.t * 6);
  ctx.save();
  ctx.translate(cx, y);
  const tilt = Math.max(-0.35, Math.min(0.35, st.vy / 1800));
  ctx.rotate(tilt);
  const g = ctx.createRadialGradient(-9, 2, 2, -9, 2, 34);
  g.addColorStop(0, 'rgba(216,255,106,0.9)');
  g.addColorStop(0.35, `rgba(216,255,106,${0.28 + 0.12 * beat})`);
  g.addColorStop(1, 'rgba(216,255,106,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(-9, 2, 34, 0, Math.PI * 2);
  ctx.fill();
  const ang = flap > 0 ? Math.sin(st.t * 70) * 0.9 : Math.sin(st.t * 18) * 0.25;
  ctx.fillStyle = WING;
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.5;
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(2, -4);
    ctx.rotate(-0.6 + s * ang * 0.5 - 0.5);
    ctx.beginPath();
    ctx.ellipse(-3, -11, 5, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = BODY;
  ctx.beginPath();
  ctx.ellipse(3, 0, 9, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = GLOW;
  ctx.beginPath();
  ctx.ellipse(-9, 2, 7, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fffde0';
  ctx.beginPath();
  ctx.ellipse(-10, 1, 3, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = BODY;
  ctx.beginPath();
  ctx.arc(13, -1, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(15, -2.5, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = BODY;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(15, -5);
  ctx.quadraticCurveTo(20, -12, 24, -10);
  ctx.moveTo(12, -6);
  ctx.quadraticCurveTo(14, -14, 19, -15);
  ctx.stroke();
  ctx.restore();
}
