const KEY = 'nerve.save.v1';

export const defaultSettings = () => ({ muted: false, volume: 0.5, slow: false, reducedMotion: false, outline: false });

const blank = () => ({ v: 1, levels: {}, settings: defaultSettings(), gauntlets: {} });

const blankLevel = () => ({
  bestPct: 0,
  attempts: 0,
  clear: false,
  clearSlow: false,
  clean: false,
  shard: false,
  bestMs: 0,
  ghost: null
});

export function createSave(storage = globalThis.localStorage) {
  let data = blank();
  try {
    const raw = storage && storage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.v === 1 && parsed.levels) {
        data = { ...blank(), ...parsed, settings: { ...defaultSettings(), ...(parsed.settings || {}) }, gauntlets: parsed.gauntlets || {} };
      }
    }
  } catch {
    data = blank();
  }

  const persist = () => {
    try {
      if (storage) storage.setItem(KEY, JSON.stringify(data));
    } catch {
      return;
    }
  };

  const level = (id) => {
    if (!data.levels[id]) data.levels[id] = blankLevel();
    return data.levels[id];
  };

  const settings = () => data.settings;

  const setSetting = (k, v) => {
    data.settings[k] = v;
    persist();
  };

  const gauntlet = (w) => data.gauntlets[w] || false;

  const setGauntlet = (w) => {
    data.gauntlets[w] = true;
    persist();
  };

  const reset = () => {
    data = blank();
    persist();
  };

  return { level, persist, data: () => data, settings, setSetting, gauntlet, setGauntlet, reset };
}
