import { describe, it, expect, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

let dom;
const errors = [];

beforeAll(async () => {
  const html = readFileSync('index.html', 'utf8').replace(/<script[^>]*><\/script>/g, '');
  dom = new JSDOM(html, { url: 'http://localhost/', pretendToBeVisual: true });
  const ctx = new Proxy({}, { get: (t, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : typeof k === 'symbol' ? undefined : t[k] || (() => {})), set: (t, k, v) => { t[k] = v; return true; } });
  dom.window.HTMLCanvasElement.prototype.getContext = () => ctx;
  dom.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.location = dom.window.location;
  globalThis.matchMedia = dom.window.matchMedia;
  globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
  dom.window.requestAnimationFrame = globalThis.requestAnimationFrame;
  dom.window.addEventListener('error', (e) => errors.push(e.message));
  await import('../src/main.js');
  await new Promise((r) => setTimeout(r, 120));
});

describe('boot from the real index.html', () => {
  it('starts without throwing and shows the title screen', () => {
    expect(errors).toEqual([]);
    const overlay = dom.window.document.getElementById('overlay');
    expect(overlay.querySelector('[data-act="play"]')).not.toBeNull();
    expect(overlay.textContent).toContain('nerve');
  });

  it('opens the world map from the title and lists every level', () => {
    const overlay = dom.window.document.getElementById('overlay');
    overlay.querySelector('[data-act="play"]').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    expect(overlay.querySelectorAll('.chip').length).toBe(19);
  });

  it('references only files that exist in public', () => {
    const html = readFileSync('index.html', 'utf8');
    for (const m of html.matchAll(/(?:href|src)="(?!http|\/src)([^"#?]+)"/g)) {
      const path = `public/${m[1]}`;
      expect(() => readFileSync(path)).not.toThrow();
    }
  });
});
