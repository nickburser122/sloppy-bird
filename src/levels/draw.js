import { colors, radius, tokens, shadowColor, motion, shade } from '../config/tokens.js';
import { tuning } from '../config/tuning.js';
import { obstacleLift } from '../entities/obstacles/types.js';

function ink(a) {
  return 'rgba(' + colors.solidInk + ', ' + a + ')';
}

const TILE = 1400;
const PARALLAX = 0.2;
const HATCH = 9;
const SKELETON = [
  [80, 0.2, 420, 0.07],
  [80, 0.32, 300, 0.07],
  [80, 0.46, 360, 0.028],
  [80, 0.52, 260, 0.028],
  [80, 0.62, 150, 0.08],
  [700, 0.2, 200, 0.34],
  [930, 0.2, 200, 0.34],
  [1160, 0.2, 200, 0.34],
  [700, 0.62, 660, 0.028],
  [700, 0.68, 480, 0.028]
];

function drawSkeletonBackdrop(ctx, w, gy, scroll) {
  const base = -((scroll * PARALLAX) % TILE);
  ctx.fillStyle = colors.skeleton;
  for (let t = base; t < w; t += TILE) {
    for (let i = 0; i < SKELETON.length; i++) {
      const r = SKELETON[i];
      const x = t + r[0];
      if (x > w || x + r[2] < 0) continue;
      ctx.beginPath();
      ctx.roundRect(x, gy * r[1], r[2], gy * r[3], radius.s);
      ctx.fill();
    }
  }
}

export function drawGround(ctx, w, gy, scroll, mode) {
  const spacing = tuning.world.tickSpacing;
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, gy + 0.5);
  ctx.lineTo(w, gy + 0.5);
  for (let x = -(scroll % spacing); x < w; x += spacing) {
    ctx.moveTo(x + 0.5, gy);
    ctx.lineTo(x + 0.5, gy + tuning.world.tickLength);
  }
  if (mode === 'flap' || mode === 'flip') {
    const top = gy - (mode === 'flip' ? tuning.flip.fieldH : tuning.flap.fieldH);
    ctx.moveTo(0, top + 0.5);
    ctx.lineTo(w, top + 0.5);
  }
  ctx.stroke();
}

const FEED_TILE = 980;

function drawPost(ctx, x, y, w, h) {
  ctx.fillStyle = colors.skeleton;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius.l);
  ctx.fill();
  ctx.fillStyle = colors.bg;
  ctx.beginPath();
  ctx.arc(x + 32, y + 32, 14, 0, Math.PI * 2);
  ctx.roundRect(x + 58, y + 22, 130, 8, 4);
  ctx.roundRect(x + 58, y + 38, 84, 6, 3);
  ctx.roundRect(x + 20, y + 66, w - 40, h - 104, radius.m);
  ctx.roundRect(x + 20, y + h - 26, 90, 8, 4);
  ctx.fill();
}

function drawFeedBackdrop(ctx, w, gy, scroll) {
  const base = -((scroll * PARALLAX) % FEED_TILE);
  for (let t = base; t < w; t += FEED_TILE) {
    drawPost(ctx, t + 30, gy * 0.08, 400, gy * 0.4);
    drawPost(ctx, t + 520, gy * 0.42, 400, gy * 0.44);
  }
}

function drawDashboardBackdrop(ctx, w, gy, scroll) {
  ctx.strokeStyle = colors.skeleton;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = gy; y > 40; y -= 60) {
    ctx.moveTo(0, Math.round(y) + 0.5);
    ctx.lineTo(w, Math.round(y) + 0.5);
  }
  const vx = 160;
  for (let x = -((scroll * 0.3) % vx); x < w; x += vx) {
    ctx.moveTo(Math.round(x) + 0.5, 40);
    ctx.lineTo(Math.round(x) + 0.5, gy);
  }
  ctx.stroke();
}

const CODE_LINES = [
  [0, 220],
  [1, 150],
  [1, 260],
  [2, 180],
  [2, 90],
  [1, 200],
  [0, 120],
  [0, 0],
  [0, 280],
  [1, 170],
  [2, 240],
  [2, 130],
  [1, 110],
  [0, 190]
];

function drawTerminalBackdrop(ctx, w, gy, scroll) {
  const tile = 700;
  const base = -((scroll * 0.2) % tile);
  ctx.fillStyle = colors.skeleton;
  for (let t = base; t < w; t += tile) {
    for (let i = 0; i < CODE_LINES.length * 2; i++) {
      const y = 76 + i * 22;
      if (y > gy - 8) break;
      const row = CODE_LINES[i % CODE_LINES.length];
      if (!row[1]) continue;
      ctx.beginPath();
      ctx.roundRect(t + 40 + row[0] * 28, y, row[1], 8, 4);
      ctx.fill();
    }
  }
}

export function drawBackdrop(ctx, w, gy, scroll) {
  if (colors.backdrop === 'terminal') drawTerminalBackdrop(ctx, w, gy, scroll);
  else if (colors.backdrop === 'dashboard') drawDashboardBackdrop(ctx, w, gy, scroll);
  else if (colors.backdrop === 'feed') drawFeedBackdrop(ctx, w, gy, scroll);
  else drawSkeletonBackdrop(ctx, w, gy, scroll);
}

export function drawPlayer(ctx, x, y, size, alpha, rot) {
  const s = size;
  if (rot) {
    ctx.save();
    ctx.translate(x + s / 2, y + s / 2);
    ctx.rotate(rot);
    ctx.translate(-(x + s / 2), -(y + s / 2));
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  shade(ctx, colors.glow, tokens.shadow[2].blur, tokens.shadow[2].y);
  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.roundRect(x, y, s, s, radius.s);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = colors.onAccent;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.3, y + s * 0.2);
  ctx.lineTo(x + s * 0.3, y + s * 0.78);
  ctx.lineTo(x + s * 0.45, y + s * 0.64);
  ctx.lineTo(x + s * 0.56, y + s * 0.86);
  ctx.lineTo(x + s * 0.66, y + s * 0.81);
  ctx.lineTo(x + s * 0.55, y + s * 0.6);
  ctx.lineTo(x + s * 0.75, y + s * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  if (rot) ctx.restore();
}

function drawHazard(ctx, o, x, gy, time) {
  const r = Math.min(radius.s, o.h / 2);
  const pulse = motion.reduced ? 0.55 : 0.45 + 0.25 * Math.sin(time * 6);
  const base = gy - o.lift;
  const top = base - o.h;
  ctx.beginPath();
  ctx.roundRect(x, top, o.w, o.h, r);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = colors.hazard;
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = colors.hazard;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let hx = x - o.h; hx < x + o.w; hx += HATCH) {
    ctx.moveTo(hx, base);
    ctx.lineTo(hx + o.h, top);
  }
  ctx.stroke();
  ctx.restore();
  ctx.beginPath();
  ctx.roundRect(x + 0.5, top + 0.5, o.w - 1, o.h - 1, r);
  ctx.strokeStyle = colors.hazard;
  ctx.stroke();
  if (o.type === 'nodata') {
    ctx.fillStyle = colors.hazard;
    ctx.font = '600 11px ' + tokens.font.mono;
    ctx.textAlign = 'center';
    ctx.fillText('NO DATA', x + o.w / 2, top + 22);
    ctx.textAlign = 'start';
  }
}

function drawButton(ctx, o, x, gy) {
  const y = gy - o.h;
  ctx.save();
  shade(ctx, shadowColor(1), tokens.shadow[1].blur, tokens.shadow[1].y);
  ctx.fillStyle = colors.solid;
  ctx.beginPath();
  ctx.roundRect(x, y, o.w, o.h, Math.min(radius.s, o.h / 2));
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = ink(0.28);
  ctx.beginPath();
  ctx.roundRect(x + o.w * 0.28, y + o.h / 2 - 2, o.w * 0.44, 4, 2);
  ctx.fill();
}

function drawModal(ctx, o, x, gy) {
  const y = gy - o.h;
  ctx.save();
  shade(ctx, shadowColor(2), tokens.shadow[2].blur, tokens.shadow[2].y);
  ctx.fillStyle = colors.solid;
  ctx.beginPath();
  ctx.roundRect(x, y, o.w, o.h, radius.m);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = ink(0.14);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + 22.5);
  ctx.lineTo(x + o.w, y + 22.5);
  ctx.stroke();
  ctx.fillStyle = ink(0.32);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(x + 12 + i * 9, y + 11, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = ink(0.2);
  ctx.beginPath();
  ctx.roundRect(x + 12, y + 36, o.w - 24, 5, 2.5);
  ctx.roundRect(x + 12, y + 48, (o.w - 24) * 0.7, 5, 2.5);
  ctx.fill();
  ctx.fillStyle = ink(0.34);
  ctx.beginPath();
  ctx.roundRect(x + o.w - 12 - 26, y + o.h - 12 - 14, 26, 14, 5);
  ctx.fill();
}

function drawCard(ctx, o, x, gy) {
  const y = gy - o.lift - o.h;
  ctx.save();
  shade(ctx, shadowColor(2), tokens.shadow[2].blur, tokens.shadow[2].y);
  ctx.fillStyle = colors.solid;
  ctx.beginPath();
  ctx.roundRect(x, y, o.w, o.h, radius.m);
  ctx.fill();
  ctx.restore();
  if (o.h < 52) return;
  const top = o.edge === 'top' ? y + o.h - 44 : y + 12;
  ctx.fillStyle = ink(0.28);
  ctx.beginPath();
  ctx.arc(x + 20, top + 10, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ink(0.2);
  ctx.beginPath();
  ctx.roundRect(x + 34, top + 4, o.w - 46, 5, 2.5);
  ctx.roundRect(x + 34, top + 14, (o.w - 46) * 0.6, 5, 2.5);
  ctx.fill();
}

function drawBubble(ctx, o, x, gy) {
  const r = o.w / 2;
  const cx = x + r;
  const cy = gy - o.lift - o.h / 2;
  ctx.save();
  shade(ctx, shadowColor(2), tokens.shadow[2].blur, tokens.shadow[2].y);
  ctx.fillStyle = colors.solid;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.moveTo(cx - r * 0.55, cy + r * 0.7);
  ctx.lineTo(cx - r * 0.95, cy + r * 1.15);
  ctx.lineTo(cx - r * 0.1, cy + r * 0.95);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = ink(0.5);
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(cx + i * r * 0.36, cy, r * 0.11, 0, Math.PI * 2);
    ctx.fill();
  }
}

function heart(ctx, cx, cy, s) {
  ctx.moveTo(cx, cy + s * 0.5);
  ctx.bezierCurveTo(cx + s * 1.0, cy - s * 0.05, cx + s * 0.5, cy - s * 0.75, cx, cy - s * 0.28);
  ctx.bezierCurveTo(cx - s * 0.5, cy - s * 0.75, cx - s * 1.0, cy - s * 0.05, cx, cy + s * 0.5);
  ctx.closePath();
}

const TRAIL = [64, 128];

function drawLike(ctx, o, x, gy, d) {
  const s = o.w / 2;
  if (!motion.reduced) {
    for (let i = 0; i < TRAIL.length; i++) {
      ctx.save();
      ctx.globalAlpha = 0.16 - i * 0.07;
      ctx.fillStyle = colors.solid;
      ctx.beginPath();
      heart(ctx, x + s + TRAIL[i], gy - obstacleLift(o, d - TRAIL[i]) - o.h / 2, s);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.save();
  shade(ctx, shadowColor(2), tokens.shadow[2].blur, tokens.shadow[2].y);
  ctx.fillStyle = colors.solid;
  ctx.beginPath();
  heart(ctx, x + s, gy - obstacleLift(o, d) - o.h / 2, s);
  ctx.fill();
  ctx.restore();
}

const KPI_TEXT = ['+12.4%', '$4.2M', 'NPS 71', '-3.1%', '98.7%', '14.2k'];

function drawKpi(ctx, o, x, gy, d, ticker) {
  const y = gy - obstacleLift(o, d) - o.h;
  if (ticker && !motion.reduced) {
    for (let i = 0; i < TRAIL.length; i++) {
      ctx.save();
      ctx.globalAlpha = 0.16 - i * 0.07;
      ctx.fillStyle = colors.solid;
      ctx.beginPath();
      ctx.roundRect(x + TRAIL[i], gy - obstacleLift(o, d - TRAIL[i]) - o.h, o.w, o.h, radius.m);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.save();
  shade(ctx, shadowColor(2), tokens.shadow[2].blur, tokens.shadow[2].y);
  ctx.fillStyle = colors.solid;
  ctx.beginPath();
  ctx.roundRect(x, y, o.w, o.h, radius.m);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = ink(0.5);
  ctx.beginPath();
  ctx.roundRect(x + 12, y + 11, o.w * 0.3, 5, 2.5);
  ctx.fill();
  ctx.fillStyle = 'rgba(' + colors.solidInk + ', 0.9)';
  ctx.font = '600 ' + (ticker ? 15 : 20) + 'px ' + tokens.font.mono;
  ctx.textBaseline = 'alphabetic';
  const label = KPI_TEXT[Math.floor(Math.abs(o.x) / 10) % KPI_TEXT.length];
  if (ticker) {
    ctx.beginPath();
    ctx.moveTo(x + 14, y + o.h - 14);
    ctx.lineTo(x + 22, y + o.h - 28);
    ctx.lineTo(x + 30, y + o.h - 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillText(label, x + 38, y + o.h - 14);
  } else {
    ctx.fillText(label, x + 12, y + o.h - 16);
    ctx.strokeStyle = ink(0.34);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const sx = x + o.w - 52;
    ctx.moveTo(sx, y + o.h - 14);
    ctx.lineTo(sx + 12, y + o.h - 22);
    ctx.lineTo(sx + 24, y + o.h - 18);
    ctx.lineTo(sx + 40, y + o.h - 30);
    ctx.stroke();
  }
}

let heights = new Float32Array(512);

export function drawTerrain(ctx, width, gy, scroll, terrain, px) {
  const step = 8;
  const n = Math.ceil(width / step) + 2;
  if (n > heights.length) heights = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) heights[i] = gy - terrain.height(scroll + i * step - px);
  const bottom = gy + 600;
  ctx.beginPath();
  ctx.moveTo(0, bottom);
  for (let i = 0; i < n; i++) ctx.lineTo(i * step, heights[i]);
  ctx.lineTo((n - 1) * step, bottom);
  ctx.closePath();
  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = colors.accent;
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(0, heights[0]);
  for (let i = 1; i < n; i++) ctx.lineTo(i * step, heights[i]);
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function dashedShape(ctx, o, x, gy, d) {
  const lift = obstacleLift(o, d);
  const y = gy - lift - o.h;
  ctx.save();
  ctx.setLineDash([6, 5]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = colors.solid;
  ctx.fillStyle = colors.solid;
  ctx.beginPath();
  if (o.shape === 'circle') ctx.arc(x + o.w / 2, y + o.h / 2, o.w / 2 - 1, 0, Math.PI * 2);
  else ctx.roundRect(x + 1, y + 1, o.w - 2, o.h - 2, Math.min(radius.m, o.h / 2));
  ctx.globalAlpha = 0.16;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  if (o.w >= 40 && o.h >= 26) {
    const cx = x + o.w / 2;
    const cy = y + o.h / 2;
    ctx.fillStyle = colors.solid;
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy - 7);
    ctx.lineTo(cx + 7, cy);
    ctx.lineTo(cx - 5, cy + 7);
    ctx.closePath();
    ctx.fill();
  }
}

export function drawPower(ctx, x, y, kind, time) {
  const r = tuning.pickup.r;
  const bob = motion.reduced ? 0 : Math.sin(time * 4 + x * 0.01) * 3;
  const cy = y + bob;
  ctx.save();
  shade(ctx, colors.glow, tokens.shadow[2].blur);
  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.arc(x, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = colors.surface;
  ctx.fillStyle = colors.surface;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (kind === 'shield') {
    ctx.moveTo(x, cy - 8);
    ctx.lineTo(x + 7, cy - 5);
    ctx.lineTo(x + 6, cy + 3);
    ctx.lineTo(x, cy + 9);
    ctx.lineTo(x - 6, cy + 3);
    ctx.lineTo(x - 7, cy - 5);
    ctx.closePath();
    ctx.stroke();
  } else if (kind === 'blaster') {
    ctx.moveTo(x + 2, cy - 9);
    ctx.lineTo(x - 5, cy + 1);
    ctx.lineTo(x, cy + 1);
    ctx.lineTo(x - 2, cy + 9);
    ctx.lineTo(x + 6, cy - 2);
    ctx.lineTo(x + 1, cy - 2);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'magnet') {
    ctx.moveTo(x - 6, cy - 7);
    ctx.lineTo(x - 6, cy + 1);
    ctx.arc(x, cy + 1, 6, Math.PI, 0, true);
    ctx.lineTo(x + 6, cy - 7);
    ctx.stroke();
  } else {
    ctx.arc(x, cy, 8, 0, Math.PI * 2);
    ctx.moveTo(x, cy - 5);
    ctx.lineTo(x, cy);
    ctx.lineTo(x + 4, cy + 2);
    ctx.stroke();
  }
}

export function drawBullet(ctx, x, y) {
  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.roundRect(x, y, tuning.blaster.w, tuning.blaster.h, 3);
  ctx.fill();
}

export function drawShield(ctx, x, y, size, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = colors.accent;
  ctx.fillStyle = colors.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size * 0.82, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = alpha * 0.1;
  ctx.fill();
  ctx.restore();
}

const KEYWORDS = ['if', 'for', 'try', 'fn', 'let', 'use'];

function drawCode(ctx, o, x, gy) {
  const y = gy - o.lift - o.h;
  ctx.save();
  shade(ctx, shadowColor(2), tokens.shadow[2].blur, tokens.shadow[2].y);
  ctx.fillStyle = colors.solid;
  ctx.beginPath();
  ctx.roundRect(x, y, o.w, o.h, radius.m);
  ctx.fill();
  ctx.restore();
  if (o.h < 44) return;
  const top = o.edge === 'top' ? y + o.h - 46 : y + 12;
  ctx.fillStyle = ink(0.7);
  ctx.font = '600 12px ' + tokens.font.mono;
  ctx.fillText(KEYWORDS[Math.floor(Math.abs(o.x) / 10) % KEYWORDS.length], x + 12, top + 10);
  ctx.fillStyle = ink(0.24);
  ctx.beginPath();
  ctx.roundRect(x + 12, top + 18, o.w * 0.55, 5, 2.5);
  ctx.roundRect(x + 24, top + 28, o.w * 0.4, 5, 2.5);
  ctx.fill();
}

export function drawObstacle(ctx, o, x, gy, time, d) {
  if (o.destructible) dashedShape(ctx, o, x, gy, d);
  else if (o.type === 'block' || o.type === 'float') drawCode(ctx, o, x, gy);
  else if (o.type === 'kpi') drawKpi(ctx, o, x, gy, d, false);
  else if (o.type === 'ticker') drawKpi(ctx, o, x, gy, d, true);
  else if (o.kind === 'hazard') drawHazard(ctx, o, x, gy, time);
  else if (o.type === 'modal') drawModal(ctx, o, x, gy);
  else if (o.type === 'card') drawCard(ctx, o, x, gy);
  else if (o.type === 'bubble') drawBubble(ctx, o, x, gy);
  else if (o.type === 'like') drawLike(ctx, o, x, gy, d);
  else drawButton(ctx, o, x, gy);
}

export function drawToken(ctx, x, y, r, bonus) {
  const s = r * 1.7;
  if (bonus) {
    ctx.save();
    ctx.fillStyle = colors.accent;
    ctx.strokeStyle = colors.surface;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y - s * 0.62);
    ctx.lineTo(x + s * 0.62, y);
    ctx.lineTo(x, y + s * 0.62);
    ctx.lineTo(x - s * 0.62, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }
  ctx.fillStyle = colors.surface;
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x - s / 2, y - s / 2, s, s, 5);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.24, y + s * 0.02);
  ctx.lineTo(x - s * 0.05, y + s * 0.22);
  ctx.lineTo(x + s * 0.27, y - s * 0.2);
  ctx.stroke();
}

export function drawOrb(ctx, x, y, r, time) {
  const pulse = motion.reduced ? 0 : Math.sin(time * 5) * 2;
  ctx.save();
  shade(ctx, colors.glow, tokens.shadow[2].blur);
  ctx.fillStyle = colors.surface;
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r + pulse * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = colors.fg;
  ctx.font = '700 11px ' + tokens.font.mono;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('BUG', x, y - r - 8);
  ctx.textAlign = 'start';
  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.ellipse(x, y + 1, r * 0.34, r * 0.44, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = -1; i <= 1; i++) {
    ctx.moveTo(x - r * 0.3, y + i * r * 0.28);
    ctx.lineTo(x - r * 0.62, y + i * r * 0.4);
    ctx.moveTo(x + r * 0.3, y + i * r * 0.28);
    ctx.lineTo(x + r * 0.62, y + i * r * 0.4);
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y - r * 0.5, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
}
