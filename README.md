# Above the Fold

A one-button auto-runner anthology. You are a glowing cursor running through websites. Vanilla JavaScript, Vite, one canvas, no game framework.

## Run it

    npm install
    npm run dev
    npm test
    npm run build

`npm run build` runs the whole test suite first. A level that fails the validator fails the build. Add `?debug` to the URL, or press the backtick key, for the tuning panel.

## Worlds

| World | Mode | Input | Boss |
| --- | --- | --- | --- |
| Landing Page | RUN | hold for a higher jump | Cookie Consent Monster |
| Social Feed | FLAP | tap to flap, hold to glide | The Algorithm |
| Dashboard | SURF | hold to dive, release to fly | Quarterly Crash |
| Terminal | FLIP | tap to flip gravity | Segfault |
| The Paywall | all four | one after another | The Paywall |

## Layout

- `src/config/tuning.js` holds every tuning number. `tokens.js` holds colours, radii, shadows and themes, and mirrors them into CSS variables.
- `src/engine` has the fixed-timestep loop, input, scenes, pools, collision, audio, camera and power-ups.
- `src/modes` has the four movement controllers behind one interface.
- `src/levels` has chunks, level definitions, the runtime, the validator and the boss director.
- `tools/pwa.js` builds the service worker. `scripts/make-icons.mjs` renders the app icons.

## Quality gates

- The validator simulates each controller and proves every level, boss phase and checkpoint is beatable without power-ups.
- Tests cover physics, validators, save data and migration, settings, assist mode, accessibility contrast, drawing in every theme, the production bundle and the offline service worker, plus seeded fuzzing.

## Playtest

`npm run playtest` plays every level and every boss with a bot that has no invincibility. It reads the live game state, looks ahead with the real movement code and fails if a level or boss cannot actually be cleared in play. The validator only proves a path exists on paper; the playtest proves the shipped scenes can be won.

## Power-ups

- Blaster breaks any solid obstacle in its line of fire. Hazards are untouched.
- Shield absorbs one hit from a solid or a hazard, then grants a short grace period.
- Magnet pulls in every token within range, including diamond bonus tokens buried inside obstacles.
- Slow-mo drops the world to 60% speed.
- Bonus tokens count toward the star ratio but not toward the total, so they can lift a run over the 80% line.

## Settings and saves

Settings and progress live in `localStorage` under one versioned key. Assist mode runs at 80% speed and starts each attempt with a shield.

## Deploy

Push to `main`. The workflow in `.github/workflows/deploy.yml` tests, builds and publishes to GitHub Pages. All URLs are relative, so it works from a sub-path.
