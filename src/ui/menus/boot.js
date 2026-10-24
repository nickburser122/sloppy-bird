import { Scene } from '../../engine/scenes.js';
import { tuning } from '../../config/tuning.js';

export class BootScene extends Scene {
  enter() {
    const fonts = document.fonts;
    const loads = fonts
      ? Promise.allSettled([fonts.load('650 16px "Inter Variable"'), fonts.load('500 14px "JetBrains Mono Variable"')])
      : Promise.resolve();
    loads.then(() => this.later(tuning.ui.bootMs, () => this.app.scenes.go('Menu')));
  }

  render() {
    this.clear();
  }
}
