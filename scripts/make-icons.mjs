import { Resvg } from '@resvg/resvg-js';
import { writeFileSync, mkdirSync } from 'node:fs';

const NAVY = '#12123a';
const ACCENT = '#4338ff';

function art() {
  return (
    '<rect x="104" y="170" width="304" height="250" rx="30" fill="#f7f8fa"/>' +
    '<path d="M104 296H408V390a30 30 0 0 1-30 30H134a30 30 0 0 1-30-30Z" fill="#dde1f1"/>' +
    '<rect x="104" y="293" width="304" height="6" fill="#b6bcd6"/>' +
    '<rect x="140" y="204" width="86" height="14" rx="7" fill="#c3c8e0"/>' +
    '<rect x="140" y="232" width="62" height="14" rx="7" fill="#d5d9ea"/>' +
    '<circle cx="306" cy="190" r="132" fill="' + ACCENT + '" opacity="0.2"/>' +
    '<circle cx="306" cy="190" r="92" fill="' + ACCENT + '" opacity="0.26"/>' +
    '<path d="M250 96V286L294 246L324 312L358 297L329 232H388Z" fill="' + ACCENT + '" stroke="#ffffff" stroke-width="14" stroke-linejoin="round"/>'
  );
}

function svg(rounded, scale) {
  const radius = rounded ? 112 : 0;
  const body = scale === 1 ? art() : '<g transform="translate(256 256) scale(' + scale + ') translate(-256 -256)">' + art() + '</g>';
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="' +
    radius +
    '" fill="' +
    NAVY +
    '"/>' +
    body +
    '</svg>'
  );
}

function png(source, size) {
  return new Resvg(source, { fitTo: { mode: 'width', value: size } }).render().asPng();
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/favicon.svg', svg(true, 1));
writeFileSync('public/icons/icon-192.png', png(svg(true, 1), 192));
writeFileSync('public/icons/icon-512.png', png(svg(true, 1), 512));
writeFileSync('public/icons/icon-maskable-512.png', png(svg(false, 0.84), 512));
writeFileSync('public/icons/apple-touch-icon.png', png(svg(false, 0.9), 180));
console.log('icons written');
