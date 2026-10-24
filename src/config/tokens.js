export const tokens = {
  radius: { s: 8, m: 12, l: 20 },
  shadow: {
    1: { blur: 6, y: 2, alpha: 0.06 },
    2: { blur: 18, y: 6, alpha: 0.1 },
    3: { blur: 40, y: 16, alpha: 0.14 }
  },
  size: { xs: 12, s: 14, m: 16, l: 20, xl: 28, hero: 96 },
  ease: {
    out: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
    inOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)'
  },
  font: {
    ui: '"Inter Variable", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace'
  }
};

export const themes = {
  landing: {
    ink: '11, 18, 32',
    bg: '#f7f8fa',
    surface: '#ffffff',
    fg: '#0b1220',
    muted: '#5b6577',
    border: '#e3e7ee',
    skeleton: '#eceff4',
    accent: '#4338ff',
    glow: 'rgba(67, 56, 255, 0.40)',
    solid: '#161b2e',
    hazard: '#d92d20',
    cookie: '#d9a460',
    chip: '#5b3a1e',
    scrim: 'rgba(247, 248, 250, 0.74)',
    debug: '#e11d48',
    solidInk: '255, 255, 255',
    onAccent: '#ffffff',
    backdrop: 'skeleton'
  },
  social: {
    ink: '42, 23, 64',
    bg: '#fcf5fb',
    surface: '#ffffff',
    fg: '#2a1740',
    muted: '#7b6a93',
    border: '#efdff2',
    skeleton: '#f6e9f6',
    accent: '#d1237d',
    glow: 'rgba(209, 35, 125, 0.38)',
    solid: '#35224f',
    hazard: '#d9480f',
    cookie: '#d9a460',
    chip: '#5b3a1e',
    scrim: 'rgba(252, 245, 251, 0.74)',
    debug: '#e11d48',
    solidInk: '255, 255, 255',
    onAccent: '#ffffff',
    backdrop: 'feed'
  },
  dashboard: {
    ink: '0, 0, 0',
    bg: '#0d1530',
    surface: '#16203f',
    fg: '#e8edff',
    muted: '#8f9bc4',
    border: '#28345f',
    skeleton: '#131c3a',
    accent: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.45)',
    solid: '#d7e0ff',
    hazard: '#ff7a45',
    cookie: '#d9a460',
    chip: '#5b3a1e',
    scrim: 'rgba(13, 21, 48, 0.76)',
    debug: '#fb7185',
    solidInk: '13, 21, 48',
    onAccent: '#0d1530',
    backdrop: 'dashboard'
  },
  terminal: {
    ink: '0, 0, 0',
    bg: '#0a0e14',
    surface: '#111823',
    fg: '#d6e2f0',
    muted: '#7185a0',
    border: '#1f2b3d',
    skeleton: '#0f1620',
    accent: '#ffb454',
    glow: 'rgba(255, 180, 84, 0.45)',
    solid: '#56709c',
    hazard: '#ff5c8a',
    cookie: '#d9a460',
    chip: '#5b3a1e',
    scrim: 'rgba(10, 14, 20, 0.78)',
    debug: '#ff5c8a',
    solidInk: '255, 255, 255',
    onAccent: '#0a0e14',
    uiFont: 'mono',
    backdrop: 'terminal'
  },
  paywall: {
    ink: '0, 0, 0',
    bg: '#0c0b10',
    surface: '#17151f',
    fg: '#f4efe3',
    muted: '#9a93a8',
    border: '#2b2736',
    skeleton: '#121019',
    accent: '#f5c542',
    glow: 'rgba(245, 197, 66, 0.42)',
    solid: '#6a6296',
    hazard: '#ff6b6b',
    cookie: '#d9a460',
    chip: '#5b3a1e',
    scrim: 'rgba(12, 11, 16, 0.78)',
    debug: '#ff6b6b',
    solidInk: '255, 255, 255',
    onAccent: '#0c0b10',
    backdrop: 'skeleton'
  }
};

export const colors = {};
export const radius = tokens.radius;
export const shadow = tokens.shadow;
export const fonts = tokens.font;
export const motion = { reduced: false };
export const quality = { shadows: true };

export function shade(ctx, color, blur, offsetY) {
  if (quality.shadows) {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetY = offsetY || 0;
  } else {
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
}

Object.assign(colors, themes.landing);

export function easeOutCubic(t) {
  const k = 1 - t;
  return 1 - k * k * k;
}

export function shadowColor(level) {
  return 'rgba(' + colors.ink + ', ' + tokens.shadow[level].alpha + ')';
}

function kebab(s) {
  return s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
}

export function applyTheme(name, root) {
  const theme = themes[name];
  Object.assign(colors, theme);
  const style = (root || document.documentElement).style;
  for (const key of Object.keys(theme)) style.setProperty('--' + kebab(key), theme[key]);
  for (const key of Object.keys(tokens.radius)) style.setProperty('--radius-' + key, tokens.radius[key] + 'px');
  for (const key of Object.keys(tokens.size)) style.setProperty('--fs-' + key, tokens.size[key] + 'px');
  for (const key of Object.keys(tokens.shadow)) {
    const s = tokens.shadow[key];
    style.setProperty('--shadow-' + key, '0 ' + s.y + 'px ' + s.blur + 'px rgba(' + theme.ink + ', ' + s.alpha + ')');
  }
  for (const key of Object.keys(tokens.ease)) style.setProperty('--ease-' + kebab(key), tokens.ease[key]);
  style.setProperty('--font-ui', theme.uiFont === 'mono' ? tokens.font.mono : tokens.font.ui);
  style.setProperty('--font-mono', tokens.font.mono);
}
