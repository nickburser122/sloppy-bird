import { colors, fonts } from '../config/tokens.js';

export function createDebug() {
  const d = {
    on: new URLSearchParams(location.search).has('debug'),
    hitboxes: true,
    invincible: false,
    speed: 1,
    fps: 0
  };
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Backquote') {
      d.on = !d.on;
      return;
    }
    if (!d.on) return;
    if (e.code === 'KeyH') d.hitboxes = !d.hitboxes;
    if (e.code === 'KeyI') d.invincible = !d.invincible;
    if (e.code === 'BracketLeft') d.speed = Math.max(0.25, d.speed - 0.25);
    if (e.code === 'BracketRight') d.speed = Math.min(2, d.speed + 0.25);
  });
  return d;
}

export function drawDebug(ctx, w, d, extra) {
  if (!d.on) return;
  const lines = [
    `fps ${d.fps.toFixed(0)}`,
    `speed x${d.speed.toFixed(2)}  [ ]`,
    `hitboxes ${d.hitboxes ? 'on' : 'off'}  H`,
    `invincible ${d.invincible ? 'on' : 'off'}  I`,
    ...extra
  ];
  ctx.save();
  ctx.font = `500 12px ${fonts.mono}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillStyle = colors.hitbox;
  for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], w - 16, 48 + i * 16);
  ctx.restore();
}
