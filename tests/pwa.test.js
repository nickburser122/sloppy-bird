import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { build } from 'vite';
import vm from 'node:vm';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { listFiles, precacheList, serviceWorkerSource, versionOf } from '../tools/pwa.js';
import { settingsHtml } from '../src/ui/menus/settingsForm.js';
import { makeApp } from './helpers.js';

let out;
let files;
let list;

beforeAll(async () => {
  out = mkdtempSync(join(tmpdir(), 'atf-'));
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    await build({ logLevel: 'silent', mode: 'production', build: { outDir: out, emptyOutDir: true } });
  } finally {
    process.env.NODE_ENV = previous;
  }
  files = listFiles(out);
  list = precacheList(files);
}, 60000);

afterAll(() => {
  rmSync(out, { recursive: true, force: true });
});

function pngSize(path) {
  const b = readFileSync(path);
  expect(b.slice(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

describe('production build output', () => {
  it('contains the app shell, manifest, icons and service worker', () => {
    for (const f of ['index.html', 'manifest.webmanifest', 'sw.js', 'favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png']) {
      expect(files).toContain(f);
    }
    expect(files.some((f) => /^assets\/index-.*\.js$/.test(f))).toBe(true);
    expect(files.some((f) => /\.woff2$/.test(f))).toBe(true);
  });

  it('loads only the latin font subsets so the offline download stays small', () => {
    const fonts = files.filter((f) => f.endsWith('.woff2'));
    expect(fonts.length).toBe(2);
    expect(fonts.every((f) => f.includes('latin'))).toBe(true);
  });

  it('uses relative URLs so it works from any sub-path', () => {
    const html = readFileSync(join(out, 'index.html'), 'utf8');
    expect(html).not.toMatch(/(src|href)="\/[^/]/);
    expect(html).toContain('href="manifest.webmanifest"');
    expect(html).toContain('rel="apple-touch-icon"');
    expect(html).toContain('name="theme-color"');
    expect(html).toContain('id="live"');
  });

  it('has a valid installable manifest', () => {
    const m = JSON.parse(readFileSync(join(out, 'manifest.webmanifest'), 'utf8'));
    expect(m.name).toBe('Above the Fold');
    expect(m.display).toBe('standalone');
    expect(m.start_url).toBe('./');
    expect(m.scope).toBe('./');
    const sizes = m.icons.map((i) => i.sizes + ':' + i.purpose);
    expect(sizes).toContain('192x192:any');
    expect(sizes).toContain('512x512:any');
    expect(sizes).toContain('512x512:maskable');
    for (const icon of m.icons) expect(existsSync(join(out, icon.src))).toBe(true);
  });

  it('ships icons at the sizes the manifest claims', () => {
    expect(pngSize(join(out, 'icons/icon-192.png'))).toEqual({ w: 192, h: 192 });
    expect(pngSize(join(out, 'icons/icon-512.png'))).toEqual({ w: 512, h: 512 });
    expect(pngSize(join(out, 'icons/icon-maskable-512.png'))).toEqual({ w: 512, h: 512 });
    expect(pngSize(join(out, 'icons/apple-touch-icon.png'))).toEqual({ w: 180, h: 180 });
  });

  it('bundles the app into one script under a sensible size', () => {
    const js = files.find((f) => /^assets\/index-.*\.js$/.test(f));
    const bytes = readFileSync(join(out, js)).length;
    expect(bytes).toBeLessThan(220 * 1024);
    expect(readFileSync(join(out, js), 'utf8')).toContain('serviceWorker');
  });

  it('precaches everything it needs to run offline and nothing that does not exist', () => {
    const sw = readFileSync(join(out, 'sw.js'), 'utf8');
    const m = sw.match(/const PRECACHE = (\[.*?\]);/s);
    const shipped = JSON.parse(m[1]);
    expect(shipped).toEqual(list);
    for (const f of shipped) if (f !== './') expect(existsSync(join(out, f))).toBe(true);
    expect(shipped).toContain('index.html');
    expect(shipped).not.toContain('sw.js');
    for (const f of files.filter((x) => x !== 'sw.js')) expect(shipped).toContain(f);
  });
});

function makeWorker(listIn) {
  const base = 'https://example.test/game/';
  const key = (u) => new URL(typeof u === 'string' ? u : u.url, base).href;
  const stores = new Map();
  const caches = {
    stores,
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const s = stores.get(name);
      return {
        async addAll(urls) {
          for (const u of urls) s.set(key(u), { ok: true, body: 'cached:' + u });
        },
        async put(req, res) {
          s.set(key(req), res);
        }
      };
    },
    async match(req) {
      for (const s of stores.values()) if (s.has(key(req))) return s.get(key(req));
      return undefined;
    },
    async keys() {
      return [...stores.keys()];
    },
    async delete(n) {
      return stores.delete(n);
    }
  };
  const handlers = {};
  const net = { calls: [], offline: false };
  const state = { skipped: false, claimed: false };
  const self = {
    location: { origin: 'https://example.test' },
    addEventListener: (t, fn) => (handlers[t] = fn),
    skipWaiting: () => {
      state.skipped = true;
      return Promise.resolve();
    },
    clients: {
      claim: () => {
        state.claimed = true;
        return Promise.resolve();
      }
    }
  };
  const fetch = async (req) => {
    net.calls.push(req.url);
    if (net.offline) throw new Error('offline');
    return {
      ok: true,
      body: 'network:' + req.url,
      clone() {
        return this;
      }
    };
  };
  const sandbox = { self, caches, fetch, URL, Promise };
  vm.runInNewContext(serviceWorkerSource(listIn), sandbox);
  async function fire(type, extra) {
    let pending = Promise.resolve();
    const event = { ...extra, waitUntil: (p) => (pending = p), respondWith: (p) => (pending = p) };
    handlers[type](event);
    return pending;
  }
  const request = (url, o) => ({ method: 'GET', mode: 'cors', url: base + url, ...o });
  return { caches, net, state, fire, request, handlers };
}

describe('service worker behaviour', () => {
  it('installs by precaching the whole list and activates immediately', async () => {
    const w = makeWorker(list);
    await w.fire('install');
    const cacheName = [...w.caches.stores.keys()][0];
    expect(cacheName).toMatch(/^atf-/);
    expect(w.caches.stores.get(cacheName).size).toBe(list.length);
    expect(w.state.skipped).toBe(true);
    await w.fire('activate');
    expect(w.state.claimed).toBe(true);
  });

  it('serves the app offline: assets from the cache without touching the network', async () => {
    const w = makeWorker(list);
    await w.fire('install');
    w.net.offline = true;
    const asset = files.find((f) => /^assets\/index-.*\.js$/.test(f));
    const res = await w.fire('fetch', { request: w.request(asset) });
    expect(res.body).toBe('cached:' + asset);
    expect(w.net.calls.length).toBe(0);
  });

  it('serves the app shell for navigations while offline', async () => {
    const w = makeWorker(list);
    await w.fire('install');
    w.net.offline = true;
    for (const url of ['', 'index.html', 'anything?x=1']) {
      const res = await w.fire('fetch', { request: w.request(url, { mode: 'navigate' }) });
      expect(res.body).toBe('cached:index.html');
    }
  });

  it('fetches unknown same-origin files once and caches them', async () => {
    const w = makeWorker(list);
    await w.fire('install');
    const first = await w.fire('fetch', { request: w.request('extra.json') });
    expect(first.body).toBe('network:https://example.test/game/extra.json');
    w.net.offline = true;
    await new Promise((r) => setTimeout(r, 0));
    const second = await w.fire('fetch', { request: w.request('extra.json') });
    expect(second.body).toBe('network:https://example.test/game/extra.json');
    expect(w.net.calls.length).toBe(1);
  });

  it('leaves non-GET and cross-origin requests alone', async () => {
    const w = makeWorker(list);
    await w.fire('install');
    let responded = false;
    w.handlers.fetch({ request: w.request('x', { method: 'POST' }), respondWith: () => (responded = true) });
    w.handlers.fetch({ request: { method: 'GET', mode: 'cors', url: 'https://other.test/a.js' }, respondWith: () => (responded = true) });
    expect(responded).toBe(false);
  });

  it('a new version removes the old cache but leaves unrelated caches', async () => {
    const w = makeWorker(list);
    w.caches.stores.set('atf-oldversion', new Map());
    w.caches.stores.set('other-app', new Map());
    await w.fire('install');
    await w.fire('activate');
    expect(w.caches.stores.has('atf-oldversion')).toBe(false);
    expect(w.caches.stores.has('other-app')).toBe(true);
  });

  it('the cache version changes whenever any shipped file changes', () => {
    expect(versionOf(list)).toBe(versionOf(list.slice()));
    expect(versionOf(list)).not.toBe(versionOf(list.map((f, i) => (i === 1 ? f + 'x' : f))));
    expect(versionOf(list)).not.toBe(versionOf(list.slice(1)));
  });
});

describe('install hint on iPhone', () => {
  it('shows the Share instructions instead of a button where the install prompt is unavailable', () => {
    const app = makeApp(1000, 700);
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' });
    const html = settingsHtml(app);
    expect(html).toContain('Add to Home Screen');
    expect(html).not.toContain('data-install');
    vi.unstubAllGlobals();
  });

  it('shows a button when the browser can prompt', () => {
    const app = makeApp(1000, 700);
    app.installPrompt = { prompt() {} };
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Linux; Android 14)' });
    expect(settingsHtml(app)).toContain('data-install');
    vi.unstubAllGlobals();
  });
});
