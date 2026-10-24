const STAR = 'M10 1.8l2.4 5 5.4.7-4 3.8 1 5.4L10 14l-4.8 2.7 1-5.4-4-3.8 5.4-.7z';

function star(on) {
  return (
    '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="' +
    STAR +
    '" fill="' +
    (on ? 'var(--accent)' : 'none') +
    '" stroke="var(--accent)" stroke-width="1.4" stroke-linejoin="round"/></svg>'
  );
}

export function rating(n) {
  return (
    '<span class="rating" role="img" aria-label="' +
    n +
    ' of 3 stars">' +
    star(n >= 1) +
    star(n >= 2) +
    star(n >= 3) +
    '</span>'
  );
}

export function clock(seconds) {
  const s = Math.round(seconds);
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

export function criterion(on, text) {
  const icon = on
    ? '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    : '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M5 10h10" fill="none" stroke="var(--muted)" stroke-width="2" stroke-linecap="round"/></svg>';
  return '<li class="' + (on ? 'on' : 'off') + '">' + icon + '<span>' + text + '</span></li>';
}
