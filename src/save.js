export const SAVE_KEY = 'above-the-fold:save';
export const SAVE_VERSION = 2;

export const DEFAULT_SETTINGS = { sound: true, volume: 0.5, motion: 'system', assist: false, quality: 'auto' };
export const MOTION_MODES = ['system', 'reduce', 'full'];
export const QUALITY_MODES = ['auto', 'high', 'low'];

export function sanitizeSettings(raw) {
  const out = { ...DEFAULT_SETTINGS };
  if (!raw || typeof raw !== 'object') return out;
  if (typeof raw.sound === 'boolean') out.sound = raw.sound;
  if (typeof raw.assist === 'boolean') out.assist = raw.assist;
  if (typeof raw.volume === 'number' && Number.isFinite(raw.volume)) out.volume = Math.min(1, Math.max(0, raw.volume));
  if (MOTION_MODES.includes(raw.motion)) out.motion = raw.motion;
  if (QUALITY_MODES.includes(raw.quality)) out.quality = raw.quality;
  return out;
}

export function emptySave() {
  return { version: SAVE_VERSION, levels: {}, settings: { ...DEFAULT_SETTINGS } };
}

function finiteOr(v, fallback) {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : fallback;
}

function sanitize(raw) {
  if (!raw || typeof raw !== 'object' || (raw.version !== SAVE_VERSION && raw.version !== 1)) return emptySave();
  if (!raw.levels || typeof raw.levels !== 'object') return emptySave();
  const out = emptySave();
  if (raw.version === SAVE_VERSION) out.settings = sanitizeSettings(raw.settings);
  for (const id of Object.keys(raw.levels)) {
    const r = raw.levels[id];
    if (!r || typeof r !== 'object') continue;
    const stars = Math.min(3, Math.max(0, Math.floor(finiteOr(r.stars, 0))));
    if (stars === 0) continue;
    out.levels[id] = {
      stars,
      bestTime: finiteOr(r.bestTime, null),
      bestRetries: finiteOr(r.bestRetries, null)
    };
  }
  return out;
}

export class SaveStore {
  constructor(storage) {
    this.storage = storage;
    this.data = this.read();
  }

  read() {
    try {
      const text = this.storage.getItem(SAVE_KEY);
      return text ? sanitize(JSON.parse(text)) : emptySave();
    } catch {
      return emptySave();
    }
  }

  write() {
    try {
      this.storage.setItem(SAVE_KEY, JSON.stringify(this.data));
      return true;
    } catch {
      return false;
    }
  }

  get(id) {
    return this.data.levels[id] || null;
  }

  stars(id) {
    const r = this.get(id);
    return r ? r.stars : 0;
  }

  completed(id) {
    return this.stars(id) > 0;
  }

  isUnlocked(order, id) {
    const i = order.indexOf(id);
    if (i < 0) return false;
    if (i === 0) return true;
    return this.completed(order[i - 1]);
  }

  record(id, result) {
    const prev = this.get(id);
    const next = {
      stars: Math.max(prev ? prev.stars : 0, result.stars),
      bestTime: prev && prev.bestTime !== null ? Math.min(prev.bestTime, result.time) : result.time,
      bestRetries: prev && prev.bestRetries !== null ? Math.min(prev.bestRetries, result.retries) : result.retries
    };
    this.data.levels[id] = next;
    this.write();
    return { improved: !prev || next.stars > prev.stars, best: next };
  }

  reset() {
    this.data = { ...emptySave(), settings: this.data.settings };
    this.write();
  }

  settings() {
    return this.data.settings;
  }

  setSetting(key, value) {
    if (!(key in DEFAULT_SETTINGS)) return false;
    const next = sanitizeSettings({ ...this.data.settings, [key]: value });
    if (next[key] !== value && key !== 'volume') return false;
    this.data.settings = next;
    this.write();
    return true;
  }
}

export function createSave() {
  let storage;
  try {
    storage = window.localStorage;
    storage.getItem(SAVE_KEY);
  } catch {
    const mem = new Map();
    storage = {
      getItem: (k) => (mem.has(k) ? mem.get(k) : null),
      setItem: (k, v) => mem.set(k, String(v))
    };
  }
  return new SaveStore(storage);
}
