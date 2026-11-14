import { levels } from '../levels/index.js';

export const WORLD_IDS = [1, 2, 3, 4, 5];

export const worldLevels = (w) => levels.filter((l) => l.world === w);

export const isCleared = (save, id) => !!save.data().levels[id]?.clear;

export const clearedCount = (save, w) => worldLevels(w).filter((l) => isCleared(save, l.id)).length;

export const worldComplete = (save, w) => worldLevels(w).length > 0 && clearedCount(save, w) === worldLevels(w).length;

export const worldUnlocked = () => true;

export const levelUnlocked = (save, id) => levels.some((l) => l.id === id);

export const endlessUnlocked = (save, w) => worldComplete(save, w);

export const gauntletUnlocked = (save, w) => worldComplete(save, w);

export function medalsOf(rec) {
  return { clear: !!rec.clear, slow: !rec.clear && !!rec.clearSlow, clean: !!rec.clean, shard: !!rec.shard };
}

export function isClean(sessionAttempts, previouslyCleared) {
  return sessionAttempts <= 10 || (previouslyCleared && sessionAttempts === 1);
}

export function totals(save) {
  const out = { clear: 0, clean: 0, shard: 0, levels: levels.length };
  for (const l of levels) {
    const r = save.data().levels[l.id];
    if (!r) continue;
    if (r.clear) out.clear++;
    if (r.clean) out.clean++;
    if (r.shard) out.shard++;
  }
  return out;
}
