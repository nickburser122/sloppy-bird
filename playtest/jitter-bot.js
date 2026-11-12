import { runEvents, fromPairs, mulberry32, DT_MS } from './bot.js';

export function jitterBot(c, pairs, { runs = 200, noiseMs = 45, seed = 7 } = {}) {
  const rand = mulberry32(seed);
  const amp = noiseMs / DT_MS;
  let clears = 0;
  for (let r = 0; r < runs; r++) {
    const noisy = pairs.map(([a, b]) => {
      const na = a + Math.round((rand() * 2 - 1) * amp);
      const nb = b + Math.round((rand() * 2 - 1) * amp);
      return [Math.max(0, na), Math.max(na + 1, nb)];
    });
    if (runEvents(c, fromPairs(noisy)).won) clears++;
  }
  return clears / runs;
}
