export interface ThemeVars {
  label: string
  accent: string
  accentDark: string
  accentDim: string
  accentGlow: string
}

export const THEMES: Record<string, ThemeVars> = {
  crimson: {
    label: 'Crimson',
    accent:      '#ef4444',
    accentDark:  '#7f1d1d',
    accentDim:   'rgba(239, 68, 68, 0.15)',
    accentGlow:  'rgba(239, 68, 68, 0.30)',
  },
  amethyst: {
    label: 'Amethyst',
    accent:      '#a855f7',
    accentDark:  '#581c87',
    accentDim:   'rgba(168, 85, 247, 0.15)',
    accentGlow:  'rgba(168, 85, 247, 0.30)',
  },
  ice: {
    label: 'Ice',
    accent:      '#38bdf8',
    accentDark:  '#0c4a6e',
    accentDim:   'rgba(56, 189, 248, 0.15)',
    accentGlow:  'rgba(56, 189, 248, 0.30)',
  },
  gold: {
    label: 'Gold',
    accent:      '#f59e0b',
    accentDark:  '#78350f',
    accentDim:   'rgba(245, 158, 11, 0.15)',
    accentGlow:  'rgba(245, 158, 11, 0.30)',
  },
  obsidian: {
    label: 'Obsidian',
    accent:      '#94a3b8',   // slate-400 — distinct from Care Mode teal (#14b8a6)
    accentDark:  '#1e293b',
    accentDim:   'rgba(148, 163, 184, 0.15)',
    accentGlow:  'rgba(148, 163, 184, 0.30)',
  },
  bone: {
    label: 'Bone',
    accent:      '#e2e8f0',
    accentDark:  '#475569',
    accentDim:   'rgba(226, 232, 240, 0.15)',
    accentGlow:  'rgba(226, 232, 240, 0.30)',
  },
}

export function applyTheme(name: string, el: HTMLElement = document.documentElement): void {
  const theme = THEMES[name] ?? THEMES['crimson']
  el.style.setProperty('--accent',      theme.accent)
  el.style.setProperty('--accent-dark', theme.accentDark)
  el.style.setProperty('--accent-dim',  theme.accentDim)
  el.style.setProperty('--accent-glow', theme.accentGlow)
}
