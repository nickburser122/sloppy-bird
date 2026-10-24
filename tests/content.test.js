import { describe, it, expect } from 'vitest';
import { worlds } from '../src/levels/worlds.js';
import { compileLevel } from '../src/levels/compile.js';
import { obstacleHits } from '../src/entities/obstacles/types.js';
import { POWERS } from '../src/engine/powerups.js';
import { tuning } from '../src/config/tuning.js';

const allLevels = [];
for (const w of worlds) for (const def of w.levels) allLevels.push({ w, def, level: compileLevel(def, w.chunks) });

function fieldFor(mode) {
  if (mode === 'flap') return tuning.flap.fieldH;
  if (mode === 'flip') return tuning.flip.fieldH;
  if (mode === 'surf') return 260;
  return 170;
}

describe('power-up placement', () => {
  it('has a level count that matches the brief', () => {
    expect(allLevels.length).toBe(12);
  });

  for (const { def, level } of allLevels) {
    const pickups = level.items.filter((i) => i.kind === 'power');

    it(def.id + ' has hand-placed pickups of every kind', () => {
      expect(pickups.map((p) => p.power).sort()).toEqual([...POWERS].sort());
    });

    it(def.id + ' never places a pickup inside an obstacle or a gap', () => {
      const box = { x: 0, y: 0, w: 0, h: 0 };
      const circle = { x: 0, y: 0, r: 0 };
      for (const p of pickups) {
        for (const o of level.obstacles) {
          if (p.x < o.x - 90 || p.x > o.x + o.w + 90) continue;
          const hb = { x: p.x - 30, y: 500 - p.lift - 30, w: 60, h: 60 };
          const hit = obstacleHits(hb, o, o.x, 500, o.x, box, circle);
          expect(hit, def.id + ' pickup at ' + p.x + ' overlaps ' + o.type + ' at ' + o.x).toBe(false);
        }
      }
    });

    it(def.id + ' keeps pickups inside the playable field and in order', () => {
      for (const p of pickups) {
        expect(p.x).toBeGreaterThan(0);
        expect(p.x).toBeLessThan(level.length);
        expect(p.lift).toBeGreaterThan(0);
        expect(p.lift).toBeLessThan(fieldFor(def.mode || 'run') + 80);
      }
      for (let i = 1; i < level.items.length; i++) expect(level.items[i].x).toBeGreaterThanOrEqual(level.items[i - 1].x);
    });

    it(def.id + ' puts a dashed obstacle within the blaster\'s reach of its pickup', () => {
      const blaster = pickups.find((p) => p.power === 'blaster');
      const reach = (level.speedAt(blaster.x) * tuning.blaster.ms) / 1000;
      const targets = level.obstacles.filter((o) => o.destructible && o.x > blaster.x + 250 && o.x < blaster.x + reach * 0.9);
      expect(targets.length).toBeGreaterThan(0);
    });

    it(def.id + ' keeps token counts honest: pickups are not counted', () => {
      expect(level.tokenTotal).toBe(level.items.filter((i) => i.kind === 'token').length);
    });
  }

  it('hazards are never destructible in any level', () => {
    for (const { level } of allLevels) {
      for (const o of level.obstacles) if (o.kind === 'hazard') expect(o.destructible).toBe(false);
    }
  });

  it('every world has at least one dashed obstacle', () => {
    for (const w of worlds.filter((x) => x.levels.length)) {
      const total = w.levels.map((d) => compileLevel(d, w.chunks).obstacles.filter((o) => o.destructible).length);
      expect(total.reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
    }
  });
});
