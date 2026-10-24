import { createHash } from 'node:crypto';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export function listFiles(dir) {
  const out = [];
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const full = join(d, name);
      if (statSync(full).isDirectory()) walk(full);
      else out.push(relative(dir, full).split(sep).join('/'));
    }
  };
  walk(dir);
  return out.sort();
}

export function precacheList(files) {
  const skip = (f) => f === 'sw.js' || f.endsWith('.map');
  const list = files.filter((f) => !skip(f));
  return ['./'].concat(list);
}

export function versionOf(list) {
  return createHash('sha1').update(list.join('|')).digest('hex').slice(0, 10);
}

export function serviceWorkerSource(list) {
  const version = versionOf(list);
  return (
    "const VERSION = '" +
    version +
    "';\n" +
    "const CACHE = 'atf-' + VERSION;\n" +
    'const PRECACHE = ' +
    JSON.stringify(list) +
    ';\n' +
    "self.addEventListener('install', (event) => {\n" +
    '  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));\n' +
    '});\n' +
    "self.addEventListener('activate', (event) => {\n" +
    '  event.waitUntil(\n' +
    '    caches\n' +
    '      .keys()\n' +
    "      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('atf-') && k !== CACHE).map((k) => caches.delete(k))))\n" +
    '      .then(() => self.clients.claim())\n' +
    '  );\n' +
    '});\n' +
    "self.addEventListener('fetch', (event) => {\n" +
    '  const req = event.request;\n' +
    "  if (req.method !== 'GET') return;\n" +
    '  const url = new URL(req.url);\n' +
    '  if (url.origin !== self.location.origin) return;\n' +
    "  if (req.mode === 'navigate') {\n" +
    "    event.respondWith(caches.match('./index.html').then((hit) => hit || fetch(req)));\n" +
    '    return;\n' +
    '  }\n' +
    '  event.respondWith(\n' +
    '    caches.match(req).then(\n' +
    '      (hit) =>\n' +
    '        hit ||\n' +
    '        fetch(req).then((res) => {\n' +
    '          if (res && res.ok) {\n' +
    '            const copy = res.clone();\n' +
    '            caches.open(CACHE).then((cache) => cache.put(req, copy));\n' +
    '          }\n' +
    '          return res;\n' +
    '        })\n' +
    '    )\n' +
    '  );\n' +
    '});\n'
  );
}

export function pwaPlugin() {
  let outDir = 'dist';
  return {
    name: 'atf-pwa',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      outDir = config.build.outDir.startsWith('/') ? config.build.outDir : join(config.root, config.build.outDir);
    },
    closeBundle() {
      const list = precacheList(listFiles(outDir));
      writeFileSync(join(outDir, 'sw.js'), serviceWorkerSource(list));
    }
  };
}
