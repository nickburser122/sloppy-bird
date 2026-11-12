import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { serviceWorkerSource, precacheList } from '../tools/pwa.js';

const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));

describe('pwa', () => {
  it('has a complete manifest with existing icons', () => {
    expect(manifest.name).toBe('NERVE');
    expect(manifest.display).toBe('standalone');
    expect(manifest.orientation).toBe('landscape');
    expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true);
    for (const icon of manifest.icons) {
      const path = `public/${icon.src}`;
      expect(existsSync(path)).toBe(true);
      const head = readFileSync(path).subarray(0, 4);
      expect([...head]).toEqual([0x89, 0x50, 0x4e, 0x47]);
    }
  });

  it('links the manifest and icons from index.html', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).toContain('manifest.webmanifest');
    expect(html).toContain('apple-touch-icon');
    expect(html).toContain('viewport-fit=cover');
  });

  it('builds a service worker that precaches the shell under the nerve cache name', () => {
    const list = precacheList(['index.html', 'sw.js', 'assets/a.js', 'assets/a.js.map', 'manifest.webmanifest']);
    expect(list[0]).toBe('./');
    expect(list).toContain('assets/a.js');
    expect(list).not.toContain('sw.js');
    expect(list).toContain('manifest.webmanifest');
    const src = serviceWorkerSource(list);
    expect(src).toContain("'nerve-'");
    expect(src).toContain('PRECACHE');
  });
});
