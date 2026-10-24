import { MOTION_MODES, QUALITY_MODES } from '../../save.js';

const MOTION_LABELS = { system: 'Match my device', reduce: 'Reduce motion', full: 'Full motion' };
const QUALITY_LABELS = { auto: 'Auto', high: 'High', low: 'Low' };

function options(list, labels) {
  return list.map((v) => '<option value="' + v + '">' + labels[v] + '</option>').join('');
}

function isStandalone() {
  return (
    typeof window !== 'undefined' &&
    ((window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true)
  );
}

function isIos() {
  return typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent || '');
}

export function settingsHtml(app) {
  const canInstall = !!app.installPrompt && !isStandalone();
  const iosHint = !canInstall && isIos() && !isStandalone();
  return (
    '<div class="settings" role="group" aria-label="Settings">' +
    '<label class="row"><span class="txt"><b>Sound effects</b><small>Jumps, pickups and boss warnings.</small></span>' +
    '<input type="checkbox" role="switch" class="switch" data-set="sound"></label>' +
    '<label class="row"><span class="txt"><b>Volume</b></span><span class="range">' +
    '<input type="range" min="0" max="100" step="5" data-set="volume" aria-label="Volume"><output class="mono"></output></span></label>' +
    '<label class="row"><span class="txt"><b>Motion</b><small>Screen shake, pulsing and tilting.</small></span>' +
    '<select data-set="motion">' +
    options(MOTION_MODES, MOTION_LABELS) +
    '</select></label>' +
    '<label class="row"><span class="txt"><b>Graphics</b><small>Low removes soft shadows to keep the frame rate up.</small></span>' +
    '<select data-set="quality">' +
    options(QUALITY_MODES, QUALITY_LABELS) +
    '</select></label>' +
    '<label class="row"><span class="txt"><b>Assist mode</b><small>Plays at 80% speed and starts every attempt with a shield.</small></span>' +
    '<input type="checkbox" role="switch" class="switch" data-set="assist"></label>' +
    '<div class="row install"' +
    (canInstall || iosHint ? '' : ' hidden') +
    '><span class="txt"><b>Install</b><small>' +
    (iosHint ? 'Tap Share, then Add to Home Screen, to play offline.' : 'Add Above the Fold to your home screen and play offline.') +
    '</small></span>' +
    (iosHint ? '' : '<button type="button" class="cta small" data-install>Install</button>') +
    '</div>' +
    '<div class="row"><span class="txt"><b>Progress</b><small>Stars and best times on this device.</small></span>' +
    '<span class="reset"><button type="button" class="cta ghost small" data-reset>Reset progress</button>' +
    '<span class="confirm" hidden><span>Clear all stars and times?</span>' +
    '<button type="button" class="cta small" data-confirm>Clear</button>' +
    '<button type="button" class="cta ghost small" data-cancel>Keep</button></span></span></div>' +
    '</div>'
  );
}

export function bindSettings(root, app) {
  const s = app.settings;
  const sync = () => {
    root.querySelectorAll('[data-set]').forEach((el) => {
      const key = el.getAttribute('data-set');
      const v = s.get(key);
      if (el.type === 'checkbox') el.checked = !!v;
      else if (key === 'volume') el.value = String(Math.round(v * 100));
      else el.value = v;
    });
    const out = root.querySelector('output');
    if (out) out.textContent = Math.round(s.get('volume') * 100) + '%';
    const vol = root.querySelector('[data-set="volume"]');
    if (vol) vol.disabled = !s.get('sound');
  };
  sync();
  root.addEventListener('input', (ev) => {
    const el = ev.target;
    if (el.getAttribute && el.getAttribute('data-set') === 'volume') {
      s.set('volume', Number(el.value) / 100);
      sync();
    }
  });
  root.addEventListener('change', (ev) => {
    const el = ev.target;
    const key = el.getAttribute && el.getAttribute('data-set');
    if (!key || key === 'volume') return;
    s.set(key, el.type === 'checkbox' ? el.checked : el.value);
    app.audio.play('click');
    sync();
    if (key === 'assist') app.announce && app.announce(el.checked ? 'Assist mode on' : 'Assist mode off');
  });
  root.addEventListener('click', (ev) => {
    const t = ev.target.closest ? ev.target.closest('button') : null;
    if (!t) return;
    const confirm = root.querySelector('.confirm');
    const reset = root.querySelector('[data-reset]');
    if (t.hasAttribute('data-reset')) {
      confirm.hidden = false;
      reset.hidden = true;
      confirm.querySelector('[data-cancel]').focus();
    } else if (t.hasAttribute('data-cancel')) {
      confirm.hidden = true;
      reset.hidden = false;
      reset.focus();
    } else if (t.hasAttribute('data-confirm')) {
      app.save.reset();
      confirm.hidden = true;
      reset.hidden = false;
      reset.focus();
      app.announce && app.announce('Progress cleared');
    } else if (t.hasAttribute('data-install') && app.installPrompt) {
      const prompt = app.installPrompt;
      app.installPrompt = null;
      root.querySelector('.install').hidden = true;
      prompt.prompt();
    }
  });
  return sync;
}
