import { describe, it, expect } from 'vitest';
import { themes } from '../src/config/tokens.js';

function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function ratio(a, b) {
  const l1 = lum(a);
  const l2 = lum(b);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

describe('theme contrast (WCAG)', () => {
  for (const [name, t] of Object.entries(themes)) {
    it(name + ': body text is AAA on the page and on cards', () => {
      expect(ratio(t.fg, t.bg)).toBeGreaterThanOrEqual(7);
      expect(ratio(t.fg, t.surface)).toBeGreaterThanOrEqual(7);
    });

    it(name + ': secondary text meets AA on the page and on cards', () => {
      expect(ratio(t.muted, t.bg)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(t.muted, t.surface)).toBeGreaterThanOrEqual(4.5);
    });

    it(name + ': accent, hazard and solid shapes meet the 3:1 non-text minimum', () => {
      expect(ratio(t.accent, t.bg)).toBeGreaterThanOrEqual(3);
      expect(ratio(t.accent, t.surface)).toBeGreaterThanOrEqual(3);
      expect(ratio(t.hazard, t.bg)).toBeGreaterThanOrEqual(3);
      expect(ratio(t.solid, t.bg)).toBeGreaterThanOrEqual(3);
    });

    it(name + ': text and glyphs on the accent colour meet AA', () => {
      expect(ratio(t.onAccent, t.accent)).toBeGreaterThanOrEqual(4.5);
    });

    it(name + ': hazard and accent are not distinguishable by hue alone, so shape also differs', () => {
      expect(t.hazard.toLowerCase()).not.toBe(t.accent.toLowerCase());
    });
  }
});
