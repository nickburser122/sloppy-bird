# Above the Fold

A one-button runner anthology of short, hard levels. You are a glowing cursor running through websites. Vanilla JavaScript, Vite, one canvas, no game framework.

## Run it

    npm install
    npm run dev
    npm test
    npm run build

`npm run build` runs the whole test suite first. A level that fails the validator fails the build. Add `?debug` to the URL, or press the backtick key, for the tuning panel.

## Worlds

Every level is 30 seconds or less, starts at full speed and has no checkpoints: one mistake restarts the level.

| World | Mode | Input | Levels |
| --- | --- | --- | --- |
| Landing Page | RUN | hold for a higher jump | Above the Fold, Sticky Header |
| Social Feed | FLAP | tap to flap, hold to glide | Infinite Scroll, Notification Storm |
| Terminal | FLIP | tap to flip gravity | Hello, World; Production Hotfix |
| The Paywall | RUN, FLAP, FLIP | the mode changes after every hit | one boss, five hits, restarts from the first hit when you die |

## Layout

- `src/config/tuning.js` holds every tuning number. `tokens.js` holds colours, radii, shadows and themes, and mirrors them into CSS variables.
- `src/engine` has the fixed-timestep loop, input, scenes, pools, collision, audio and camera.
- `src/modes` has the three movement controllers behind one interface.
- `src/levels` has chunks, level definitions, the runtime, the validator and the boss director.
- `tools/pwa.js` builds the service worker. `scripts/make-icons.mjs` renders the app icons.

## Quality gates

- The validator simulates each controller and proves every level and every boss attack is beatable, with a timing window of at least 100 ms.
- Tests cover physics, validators, save data and migration, settings, assist mode, accessibility contrast, drawing in every theme, the production bundle and the offline service worker, plus seeded fuzzing.

## Playtest

`npm run playtest` plays every level and the final boss with a bot that has no invincibility. It reads the live game state, looks ahead with the real movement code and fails if a level or boss cannot actually be cleared in play. The validator only proves a path exists on paper; the playtest proves the shipped scenes can be won.

## Settings and saves

Settings and progress live in `localStorage` under one versioned key. Assist mode runs at 80% speed and starts each attempt with a shield.

## Deploy

Push to `main`. The workflow in `.github/workflows/deploy.yml` tests, builds and publishes to GitHub Pages. All URLs are relative, so it works from a sub-path.
