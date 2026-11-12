import { RunSim } from './run.js';
import { FlipSim } from './flip.js';
import { FlapSim } from './flap.js';
import { SurfSim } from './surf.js';
import { MixSim } from './mix.js';

export const simClasses = { run: RunSim, flip: FlipSim, flap: FlapSim, surf: SurfSim, mix: MixSim };

export const createSim = (c) => new simClasses[c.level.mode](c);
