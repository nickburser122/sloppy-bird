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

## Settings and saves

Settings and progress live in `localStorage` under one versioned key. Assist mode runs at 80% speed and starts each attempt with a shield.

## Deploy

Push to `main`. The workflow in `.github/workflows/deploy.yml` tests, builds and publishes to GitHub Pages. All URLs are relative, so it works from a sub-path.
