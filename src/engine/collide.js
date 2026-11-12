export function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function circles(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const r = a.r + b.r;
  return dx * dx + dy * dy < r * r;
}

export function circleAabb(c, b) {
  const nx = Math.max(b.x, Math.min(c.x, b.x + b.w));
  const ny = Math.max(b.y, Math.min(c.y, b.y + b.h));
  const dx = c.x - nx;
  const dy = c.y - ny;
  return dx * dx + dy * dy < c.r * c.r;
}

export function shrink(out, src, scale) {
  const w = src.w * scale;
  const h = src.h * scale;
  out.x = src.x + (src.w - w) / 2;
  out.y = src.y + (src.h - h) / 2;
  out.w = w;
  out.h = h;
  return out;
}
