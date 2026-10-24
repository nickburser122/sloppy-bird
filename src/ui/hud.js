import { tuning } from '../config/tuning.js';

const MARK =
  '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><rect width="20" height="20" rx="6" fill="var(--accent)"/><path d="M6 4.5v10l2.6-2.4 1.9 3.9 1.7-.8-1.9-3.7h3.7z" fill="var(--on-accent)"/></svg>';
const SOUND_ON =
  '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M3 8h3l4-3v10l-4-3H3z" fill="currentColor"/><path d="M13 7.5a3.6 3.6 0 0 1 0 5M15 5.5a6.4 6.4 0 0 1 0 9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
const SOUND_OFF =
  '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M3 8h3l4-3v10l-4-3H3z" fill="currentColor"/><path d="M13 8l4 4M17 8l-4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

const NAMES = { blaster: 'Blaster', shield: 'Shield', magnet: 'Magnet', slowmo: 'Slow-mo' };

export function createHud(scene, cfg) {
  const tick = cfg.checkpointPct === null ? '' : '<span class="cp" style="left:' + cfg.checkpointPct.toFixed(1) + '%"></span>';
  const el = scene.mount(
    '<div class="hud-left"><span class="brand">' +
      MARK +
      '<b>Above the Fold</b></span><span class="crumbs"><span>' +
      cfg.world +
      '</span><i>/</i><span>' +
      cfg.title +
      '</span></span><span class="modebadge mono" hidden></span></div>' +
      '<div class="hud-progress"><div class="track"><span class="fill"></span>' +
      tick +
      '</div><span class="mono pct"></span></div>' +
      '<div class="hud-right"><span class="power" hidden><span class="pname"></span><span class="pbar"><i></i></span></span><span class="stat"><span class="label">' +
      cfg.countLabel +
      '</span><span class="mono count">0</span></span>' +
      '<span class="stat"><span class="label">Retries</span><span class="mono retries">0</span></span>' +
      '<button type="button" class="icon-btn mute" aria-label="Toggle sound"></button></div>',
    'hud'
  );
  const fill = el.querySelector('.fill');
  const pct = el.querySelector('.pct');
  const count = el.querySelector('.count');
  const retries = el.querySelector('.retries');
  const mute = el.querySelector('.mute');
  const power = el.querySelector('.power');
  const pname = el.querySelector('.pname');
  const pfill = el.querySelector('.pbar i');
  const badge = el.querySelector('.modebadge');
  mute.addEventListener('mousedown', (e) => e.preventDefault());
  mute.addEventListener('click', () => {
    const settings = scene.app.settings;
    if (settings) settings.set('sound', !settings.get('sound'));
    else tuning.audio.muted = !tuning.audio.muted;
  });
  let lastFill = '';
  let lastPct = '';
  let lastCount = '';
  let lastRetries = -1;
  let lastMuted = null;
  let lastPower = '';
  let lastPFill = '';
  let lastMode = '';

  return {
    update(rt, progress, pctText, countText, modeText) {
      const f = 'scaleX(' + Math.min(1, Math.max(0, progress)).toFixed(3) + ')';
      if (f !== lastFill) {
        lastFill = f;
        fill.style.transform = f;
      }
      if (pctText !== lastPct) {
        lastPct = pctText;
        pct.textContent = pctText;
      }
      if (countText !== lastCount) {
        lastCount = countText;
        count.textContent = countText;
      }
      if (rt.deaths !== lastRetries) {
        lastRetries = rt.deaths;
        retries.textContent = rt.deaths;
      }
      const kind = rt.power.kind || '';
      if (kind !== lastPower) {
        lastPower = kind;
        power.hidden = !kind;
        pname.textContent = NAMES[kind] || '';
        power.classList.toggle('static', kind === 'shield');
      }
      const pf = 'scaleX(' + rt.power.fraction().toFixed(3) + ')';
      if (kind && pf !== lastPFill) {
        lastPFill = pf;
        pfill.style.transform = pf;
      }
      const mt = modeText || '';
      if (mt !== lastMode) {
        lastMode = mt;
        badge.hidden = !mt;
        badge.textContent = mt;
      }
      if (tuning.audio.muted !== lastMuted) {
        lastMuted = tuning.audio.muted;
        mute.innerHTML = lastMuted ? SOUND_OFF : SOUND_ON;
        mute.setAttribute('aria-pressed', lastMuted ? 'true' : 'false');
      }
    }
  };
}

export const BRAND_MARK = MARK;
