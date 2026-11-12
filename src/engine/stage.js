import { tuning } from '../config/tuning.js';

export function fitStage(canvas, stage) {
  const { w, h, dprCap } = tuning.stage;
  const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const fit = Math.min(vw / w, vh / h);
  const cssW = Math.floor(w * fit);
  const cssH = Math.floor(h * fit);
  stage.style.width = cssW + 'px';
  stage.style.height = cssH + 'px';
  stage.style.setProperty('--u', String(fit));
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  return { scale: (cssW * dpr) / w, portrait: vh > vw };
}
