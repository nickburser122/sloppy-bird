import { tuning, defaults } from './config/tuning.js';
import { compileLevel } from './levels/compile.js';
import { validateLevel } from './levels/validator.js';
import { validateBoss } from './levels/bossValidator.js';
import { worlds } from './levels/worlds.js';

const GROUPS = ['debug', 'run', 'flap', 'flip', 'world', 'level', 'fx', 'audio', 'scoring', 'token', 'orb', 'boss', 'obstacle', 'card', 'bubble', 'like', 'block', 'float', 'cursor', 'button', 'modal', 'errorbar', 'input'];

function button(label, onClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
}

export function createDebug(app) {
  const root = document.createElement('aside');
  root.id = 'debug';
  root.hidden = true;

  const head = document.createElement('header');
  const title = document.createElement('strong');
  title.textContent = 'Debug';
  const fps = document.createElement('span');
  head.append(title, fps);
  root.append(head);

  const syncs = [];

  for (const group of GROUPS) {
    const details = document.createElement('details');
    details.open = group === 'debug';
    const summary = document.createElement('summary');
    summary.textContent = group;
    details.append(summary);

    for (const key of Object.keys(tuning[group])) {
      const isBool = typeof tuning[group][key] === 'boolean';
      const label = document.createElement('label');
      const name = document.createElement('span');
      name.textContent = key;
      const field = document.createElement('input');
      field.type = isBool ? 'checkbox' : 'number';
      if (!isBool) field.step = 'any';
      const sync = () => {
        if (isBool) field.checked = tuning[group][key];
        else field.value = tuning[group][key];
      };
      field.addEventListener('input', () => {
        if (isBool) {
          tuning[group][key] = field.checked;
          return;
        }
        const v = parseFloat(field.value);
        if (Number.isFinite(v)) tuning[group][key] = v;
      });
      sync();
      syncs.push(sync);
      label.append(name, field);
      details.append(label);
    }
    root.append(details);
  }

  const report = document.createElement('pre');
  const actions = document.createElement('div');
  actions.className = 'actions';
  actions.append(
    button('Skip', () => {
      const scene = app.scenes.under || app.scenes.current;
      if (scene && scene.skip) scene.skip();
    }),
    button('Reset', () => {
      for (const group of GROUPS) Object.assign(tuning[group], defaults[group]);
      syncs.forEach((s) => s());
    }),
    button('Validate', () => {
      const lines = [];
      for (const w of worlds) {
        for (const def of w.levels) {
          const r = validateLevel(compileLevel(def, w.chunks));
          lines.push(def.id + ': ' + (r.ok ? 'OK ' + r.seconds.toFixed(0) + 's' : r.errors.join('; ')));
        }
        const boss = validateBoss(w);
        lines.push(w.bossId + ': ' + (boss.ok ? 'OK' : boss.errors.join('; ')));
      }
      report.textContent = lines.join('\n');
    }),
    button('Copy', () => {
      if (navigator.clipboard) navigator.clipboard.writeText(JSON.stringify(tuning, null, 2));
    })
  );
  root.append(actions, report);
  document.body.append(root);

  let timer = 0;
  const setOpen = (open) => {
    root.hidden = !open;
    clearInterval(timer);
    if (!open) return;
    timer = setInterval(() => {
      fps.textContent = tuning.debug.showFps ? Math.round(app.loop.fps) + ' fps' : '';
    }, 250);
  };

  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Backquote') return;
    e.preventDefault();
    setOpen(root.hidden);
  });

  if (new URLSearchParams(location.search).has('debug')) {
    const toggle = document.createElement('button');
    toggle.id = 'debug-toggle';
    toggle.type = 'button';
    toggle.textContent = 'dbg';
    toggle.addEventListener('click', () => setOpen(root.hidden));
    document.body.append(toggle);
  }

  return { setOpen };
}
