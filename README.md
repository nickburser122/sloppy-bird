# NERVE

A short, hard, one-button game with four modes, four characters and five worlds. Every level is 15–30 seconds, instant to retry, and checked by bots that play the real controller code.

| World | Name | Character | Mode | Controls |
|---|---|---|---|---|
| 1 | Ember Woods | Kit the fox | RUN | tap to jump, hold to jump higher |
| 2 | Glowmarsh | Zzt the firefly | FLAP | tap to flap, no glide |
| 3 | Riptide Bay | Pip the otter | SURF | hold to dive, release to launch |
| 4 | Station Zero | Bolt the robot | FLIP | tap to flip gravity, on a surface only |
| 5 | The Gauntlet | all four | MIX | portals swap mode and controls mid-level |

19 levels: 4 worlds of 4, plus World 5 with 2 levels and a one-go finale.

## Run it

```
npm install
npm run dev
```

Open the printed URL. Input is Space / Up / click / tap. `Esc` returns to the map, `M` mutes.

- `?level=w3-l2` jumps straight into a level (ids are `w1-l1` … `w4-l4`, `w5-l1`, `w5-l2`, `w5-boss`).
- `?debug` (or the backtick key) shows hitboxes (`H`), invincibility (`I`) and a speed scale (`[` `]`); with debug on, keys 1–9 switch levels.

## Progress and meta

- Clear 3 of 4 levels in a world to open the next. World 5 needs all 16 earlier levels cleared. A world's **Gauntlet** (its levels back to back, zero deaths) opens once the world is fully cleared.
- Medals: ● clear, ★ clean (10 or fewer attempts in a session, or a first-try re-clear), ◆ shard (a collectible on a riskier line, placed and verified by the bot; Pier Pressure has none).
- The best attempt plays back as a translucent ghost from recorded inputs.
- Settings: sound, volume, slow mode ×0.75 (clears don't count toward unlocks), reduced motion, bold outlines, reset. Reduced motion also follows the OS setting.
- Save key: `nerve.save.v1` in `localStorage`.

## How it is built

Vanilla JS, Vite and one `<canvas>` (960×540, letterboxed). A fixed 120 Hz deterministic simulation with interpolated rendering.

```
src/
  config/     tuning.js worlds.js tokens.js
  engine/     loop input scenes pool session audio particles save progress stage
  modes/      run.js flip.js flap.js surf.js mix.js (headless sims) + *-draw.js, index.js
  chars/      fox.js zzt.js otter.js robot.js
  levels/     schema.js runtime.js validator.js data/*.js
  scenes/     play.js          ui/  title worldmap settings hud deathflash debug
playtest/     bot.js idle-bot spam-bot jitter-bot report tune patch shards probe
tests/        unit, stability, gate, menu-flow, perf and PWA tests
tools/pwa.js  service worker generation
```

Levels are hand-readable data: events placed on beats, compiled to world positions so music and obstacles stay locked together. Mode sims are pure and headless, so the same code runs in the game, the bots and the tests.

## Validation

`npm test` runs unit and stability tests, the level gates and the menu flow. A level is checked by:

- a perfect-input beam-search bot that must clear it, then input timing windows, reaction time, input rate and the longest no-input stretch measured on that path;
- an idle bot (must die in the first 10%), a spam bot sweep (must die in the first 25%) and a jitter bot (perfect inputs ±45 ms noise, 200 runs) whose clear rate has to sit inside a per-world band;
- length 15–30 s and, for MIX levels, per-segment hazards and a 400 ms safe lane after each portal.

Useful commands:

```
npm run report -- w2-l1        validate one level (DETAIL=1 for per-input windows)
npm run tune -- w2-l1 200 1    hill-climb a level's layout (CONT=1 to continue from the file)
npm run patch -- w2-l1 4       try small neighbouring edits on a nearly-passing level
npm run shards -- w2-l1        place and verify a shard
npm run icons                  regenerate app icons
```

## Known gate misses

Every gate passes on these levels: 1-1, 1-2, 1-4, 2-1, 2-3, 2-4, 3-1, 4-1, 4-2. These miss one or more and are recorded explicitly in `tests/levels.test.js` (any other failure breaks the tests):

| Level | Misses |
|---|---|
| 1-3 Rotten Bridge | tightest window 83 ms (needs 90) |
| 2-2 Silk Road | reaction 325 ms (needs 330) |
| 3-2 Pier Pressure | reaction, inputs per second, no-input stretch, jitter |
| 3-3 Reef Run | tightest window, wide-window share, no-input stretch, jitter |
| 3-4 Riptide | tightest window, wide-window share, inputs per second, no-input stretch |
| 4-3 Compactor | inputs per second |
| 4-4 Zero G | inputs per second, no-input stretch |
| 5-1 Handshake | inputs per second, no-input stretch |
| 5-2 Switchback | inputs per second, no-input stretch |
| 5-★ Nerve | no-input stretch, jitter |

Not yet done: the "jump to beat N" and validator-window overlays in the debug panel, and a measured first-time-player attempt count for 1-1. Performance is budgeted by test (a sim tick costs well under a millisecond and particles are pooled) but has not been profiled on a real phone.

## Deploy

Vercel runs `npm run build` (just `vite build`, output `dist/`, see `vercel.json`); the tests run separately in CI (`.github/workflows/ci.yml`) or locally with `npm run verify`. The build writes a service worker for offline play.
