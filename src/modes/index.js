import { tuning } from '../config/tuning.js';
import { RunSim } from './run.js';
import { FlipSim } from './flip.js';
import { drawRunWorld } from './run-draw.js';
import { drawFlipWorld } from './flip-draw.js';
import { FlapSim } from './flap.js';
import { drawFlapWorld } from './flap-draw.js';
import { drawZzt, zztColors } from '../chars/zzt.js';
import { SurfSim } from './surf.js';
import { drawSurfWorld } from './surf-draw.js';
import { drawOtter, otterColors } from '../chars/otter.js';
import { drawFox, foxColors } from '../chars/fox.js';
import { drawBolt, boltColors } from '../chars/robot.js';
import { MixSim } from './mix.js';
import { worlds } from '../config/worlds.js';

const R = tuning.run;
const F = tuning.flip;
const P = tuning.flap;
const S = tuning.surf;

export const modes = {
  surf: {
    Sim: SurfSim,
    drawWorld: drawSurfWorld,
    drawChar: (ctx, y, st) => drawOtter(ctx, S.px, y, st),
    colors: otterColors,
    dust: '#bfe9ff',
    center: (sim) => ({ x: S.px + S.sprite / 2, y: sim.y }),
    hitRect: (y) => ({ x: S.px + S.sprite / 2 - S.r, y: y - S.r, w: S.r * 2, h: S.r * 2 })
  },
  flap: {
    Sim: FlapSim,
    drawWorld: drawFlapWorld,
    drawChar: (ctx, y, st) => drawZzt(ctx, P.px, y, st),
    colors: zztColors,
    dust: '#d8ff7a',
    center: (sim) => ({ x: P.px + P.sprite / 2, y: sim.y }),
    hitRect: (y) => ({ x: P.px + P.sprite / 2 - P.r, y: y - P.r, w: P.r * 2, h: P.r * 2 })
  },
  run: {
    Sim: RunSim,
    drawWorld: drawRunWorld,
    drawChar: (ctx, y, st) => drawFox(ctx, R.px, y, st),
    colors: foxColors,
    center: (sim) => ({ x: R.px + R.sprite / 2, y: sim.y - R.sprite / 2 }),
    hitRect: (y) => {
      const hb = R.sprite * R.hitbox;
      return { x: R.px + (R.sprite - hb) / 2, y: y - R.sprite + (R.sprite - hb) / 2, w: hb, h: hb };
    }
  },
  flip: {
    Sim: FlipSim,
    drawWorld: drawFlipWorld,
    drawChar: (ctx, y, st) => drawBolt(ctx, F.px, y, st),
    colors: boltColors,
    center: (sim) => ({ x: F.px + F.sprite / 2, y: sim.y }),
    hitRect: (y) => {
      const hb = F.sprite * F.hitbox;
      return { x: F.px + (F.sprite - hb) / 2, y: y - hb / 2, w: hb, h: hb };
    }
  }
};

const WORLD_OF = { run: 1, flap: 2, surf: 3, flip: 4 };
const PORTAL_COLOR = { run: '#ff7a3d', flap: '#d8ff6a', surf: '#38c8ff', flip: '#38e8ff' };
const PORTAL_LABEL = { run: 'RUN', flap: 'FLAP', surf: 'SURF', flip: 'FLIP' };

function drawPortals(ctx, sim, opts) {
  const W = tuning.stage.w;
  const H = tuning.stage.h;
  for (const p of sim.c.mixPortals) {
    const sx = p.ox - sim.xt + 200;
    if (sx > W + 30 || sx < -30) continue;
    const col = PORTAL_COLOR[p.mode];
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = col;
    ctx.fillRect(sx - 14, 0, 28, H);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = col;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(sx - 14, 0);
    ctx.lineTo(sx - 14, H);
    ctx.moveTo(sx + 14, 0);
    ctx.lineTo(sx + 14, H);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = "700 14px 'JetBrains Mono Variable', monospace";
    ctx.textAlign = 'center';
    ctx.fillText(PORTAL_LABEL[p.mode], sx, 150);
    ctx.restore();
  }
  if (!opts.motion && sim.portalT >= 0) {
    const k = 1 - (sim.t - sim.portalT) / (tuning.mix.flashMs / 1000);
    if (k > 0) {
      ctx.fillStyle = `rgba(255,255,255,${0.7 * k})`;
      ctx.fillRect(0, 0, W, H);
    }
  }
}

modes.mix = {
  Sim: MixSim,
  drawWorld: (ctx, sim, pal, opts) => {
    modes[sim.modeName].drawWorld(ctx, sim.sub, worlds[WORLD_OF[sim.modeName]].pal, opts);
    drawPortals(ctx, sim, opts);
  },
  drawChar: (ctx, y, st) => modes[st.modeName].drawChar(ctx, y, st),
  colorsFor: (sim) => modes[sim.modeName].colors,
  dustFor: (sim) => modes[sim.modeName].dust,
  center: (sim) => modes[sim.modeName].center(sim.sub),
  hitRect: (y, sim) => modes[sim.modeName].hitRect(y)
};
