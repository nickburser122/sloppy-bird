import { RunMode } from './run.js';
import { FlapMode } from './flap.js';
import { FlipMode } from './flip.js';

export function createMode(kind, player, env) {
  if (kind === 'flap') return new FlapMode(player, env);
  if (kind === 'flip') return new FlipMode(player, env);
  return new RunMode(player, env);
}
