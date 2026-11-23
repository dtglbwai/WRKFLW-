import React, { createContext, useContext, useEffect, useState } from 'react';

export type WorkshopThemeId =
  | 'navy-crimson'
  | 'cobalt-ceramic'
  | 'obsidian-copper'
  | 'titanium-emerald';

export type SurfaceFinish = 'gloss' | 'specular' | 'matte';

export interface ThemePreset {
  id: WorkshopThemeId;
  name: string;
  mode: 'Light' | 'Dark';
  description: string;
  swatches: [string, string, string];
  chartColors: {
    grid: string;
    labor: string;
    parts: string;
    tick: string;
  };
}

export const WORKSHOP_THEMES: ThemePreset[] = [
  {
    id: 'navy-crimson',
    name: 'Midnight Navy & Crimson',
    mode: 'Light',
    description: 'Deep industrial navy panels with signal crimson CTAs and clean whites',
    swatches: ['#F5F7FB', '#0E1B33', '#DC2626'],
    chartColors: {
      grid: '#dce3ee',
      labor: '#0e1b33',
      parts: '#dc2626',
      tick: '#64748b',
    },
  },
  {
    id: 'cobalt-ceramic',
    name: 'Cobalt Precision & Ice',
    mode: 'Light',
    description: 'Cool architectural surfaces with precision cobalt accents',
    swatches: ['#F1F5FA', '#1E3A8A', '#2563EB'],
    chartColors: {
      grid: '#dce5f1',
      labor: '#1e3a8a',
      parts: '#3b82f6',
      tick: '#64748b',
    },
  },
  {
    id: 'obsidian-copper',
    name: 'Carbon Obsidian & Crimson',
    mode: 'Dark',
    description: 'Low-glare carbon graphite glass panels with red workshop accents',
    swatches: ['#0B0E14', '#141924', '#EF4444'],
    chartColors: {
      grid: '#263044',
      labor: '#e2e8f0',
      parts: '#ef4444',
      tick: '#94a3b8',
    },
  },
  {
    id: 'titanium-emerald',
    name: 'Titanium & Racing Emerald',
    mode: 'Dark',
    description: 'Anodized slate surfaces paired with high-contrast racing emerald',
    swatches: ['#0D1215', '#151C21', '#10B981'],
    chartColors: {
      grid: '#28353f',
      labor: '#cbd5e1',
      parts: '#10b981',
      tick: '#94a3b8',
    },
  },
];

interface ThemeContextValue {
  themeId: WorkshopThemeId;
  setThemeId: (id: WorkshopThemeId) => void;
  finish: SurfaceFinish;
  setFinish: (f: SurfaceFinish) => void;
  currentPreset: ThemePreset;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = 'wrkflw_theme_pref_v1';

export function WorkshopThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [themeId, setThemeId] = useState<WorkshopThemeId>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.themeId && WORKSHOP_THEMES.some((t) => t.id === parsed.themeId)) {
          return parsed.themeId;
        }
      }
    } catch {
      // default
    }
    return 'navy-crimson';
  });

  const [finish, setFinish] = useState<SurfaceFinish>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.finish) return parsed.finish;
      }
    } catch {
      // default
    }
    return 'gloss';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', themeId);
    root.setAttribute('data-finish', finish);

    const preset = WORKSHOP_THEMES.find((t) => t.id === themeId);
    if (preset?.mode === 'Dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem(
        THEME_STORAGE_KEY,
        JSON.stringify({ themeId, finish })
      );
    } catch {
      // ignore
    }
  }, [themeId, finish]);

  const currentPreset =
    WORKSHOP_THEMES.find((t) => t.id === themeId) || WORKSHOP_THEMES[0];

  return (
    <ThemeContext.Provider
      value={{ themeId, setThemeId, finish, setFinish, currentPreset }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useWorkshopTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useWorkshopTheme must be used inside WorkshopThemeProvider');
  }
  return ctx;
}
