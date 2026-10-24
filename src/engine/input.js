import { tuning } from '../config/tuning.js';

const KEYS = new Set(['Space', 'ArrowUp']);
const FIELDS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'SUMMARY', 'A']);

export class Input {
  constructor() {
    this.sources = new Set();
    this.pendingPress = false;
    this.pendingRelease = false;
    this.pressed = false;
    this.released = false;
    this.down = false;
    this.heldMs = 0;
    this.bufferLeft = 0;
    this.pad = false;
    this.padsConnected = 0;
    this.detach = null;
  }

  get buffered() {
    return this.bufferLeft > 0;
  }

  setSource(id, down) {
    const before = this.sources.size > 0;
    if (down) this.sources.add(id);
    else this.sources.delete(id);
    const after = this.sources.size > 0;
    if (!before && after) this.pendingPress = true;
    if (before && !after) this.pendingRelease = true;
  }

  update(dtMs) {
    if (this.padsConnected > 0) this.pollPad();
    this.pressed = this.pendingPress;
    this.released = this.pendingRelease;
    this.pendingPress = false;
    this.pendingRelease = false;
    if (this.pressed) {
      this.bufferLeft = tuning.input.bufferMs;
      this.heldMs = 0;
    } else if (this.bufferLeft > 0) {
      this.bufferLeft = Math.max(0, this.bufferLeft - dtMs);
    }
    this.down = this.sources.size > 0;
    if (this.down && !this.pressed) this.heldMs += dtMs;
  }

  consume() {
    this.bufferLeft = 0;
  }

  reset() {
    this.sources.clear();
    this.pendingPress = false;
    this.pendingRelease = false;
    this.pressed = false;
    this.released = false;
    this.down = false;
    this.heldMs = 0;
    this.bufferLeft = 0;
    this.pad = false;
  }

  pollPad() {
    const list = navigator.getGamepads ? navigator.getGamepads() : null;
    let down = false;
    if (list) {
      for (let i = 0; i < list.length; i++) {
        const g = list[i];
        if (g && g.buttons[0] && g.buttons[0].pressed) {
          down = true;
          break;
        }
      }
    }
    if (down !== this.pad) {
      this.pad = down;
      this.setSource('pad', down);
    }
  }

  attach(target) {
    this.detachAll();
    const isUi = (e) => e.target && e.target.closest && e.target.closest('[data-ui]');
    const onDown = (e) => {
      if (isUi(e)) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      if (target.setPointerCapture) target.setPointerCapture(e.pointerId);
      this.setSource('p' + e.pointerId, true);
    };
    const onUp = (e) => this.setSource('p' + e.pointerId, false);
    const stop = (e) => {
      if (!isUi(e)) e.preventDefault();
    };
    const onKeyDown = (e) => {
      if (!KEYS.has(e.code)) return;
      if (e.target && FIELDS.has(e.target.tagName)) return;
      e.preventDefault();
      if (e.repeat) return;
      this.setSource('k' + e.code, true);
    };
    const onKeyUp = (e) => {
      if (KEYS.has(e.code)) this.setSource('k' + e.code, false);
    };
    const onBlur = () => this.reset();
    const onPadIn = () => {
      this.padsConnected++;
    };
    const onPadOut = () => {
      this.padsConnected = Math.max(0, this.padsConnected - 1);
    };
    const passive = { passive: false };

    target.addEventListener('pointerdown', onDown);
    target.addEventListener('pointerup', onUp);
    target.addEventListener('pointercancel', onUp);
    target.addEventListener('touchstart', stop, passive);
    target.addEventListener('touchmove', stop, passive);
    target.addEventListener('contextmenu', stop);
    target.addEventListener('gesturestart', stop);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    window.addEventListener('gamepadconnected', onPadIn);
    window.addEventListener('gamepaddisconnected', onPadOut);

    this.detach = () => {
      target.removeEventListener('pointerdown', onDown);
      target.removeEventListener('pointerup', onUp);
      target.removeEventListener('pointercancel', onUp);
      target.removeEventListener('touchstart', stop, passive);
      target.removeEventListener('touchmove', stop, passive);
      target.removeEventListener('contextmenu', stop);
      target.removeEventListener('gesturestart', stop);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('gamepadconnected', onPadIn);
      window.removeEventListener('gamepaddisconnected', onPadOut);
      this.detach = null;
    };
  }

  detachAll() {
    if (this.detach) this.detach();
  }
}
