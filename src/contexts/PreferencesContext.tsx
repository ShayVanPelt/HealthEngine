'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { AppPreferences, UnitPreferences, ThemePreference } from '@/types';

const PREFS_KEY = 'healthengine_prefs';

export const DEFAULT_PREFERENCES: AppPreferences = {
  theme: 'system',
  units: {
    bodyWeight: 'kg',
    liftingWeight: 'kg',
    macros: 'g',
    effort: 'RPE',
  },
};

function readFromStorage(): AppPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      units: { ...DEFAULT_PREFERENCES.units, ...parsed?.units },
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function applyTheme(theme: ThemePreference) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
    localStorage.setItem('theme', 'system');
  }
}

interface PreferencesContextValue {
  preferences: AppPreferences;
  setTheme: (theme: ThemePreference) => void;
  setUnits: (units: Partial<UnitPreferences>) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_PREFERENCES);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = readFromStorage();
    setPreferences(stored);
    applyTheme(stored.theme);
    // Expose the client's timezone offset to Server Components (dashboard "today" stats)
    document.cookie = `tz=${new Date().getTimezoneOffset()}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  // Listen for OS theme changes when theme is 'system'
  useEffect(() => {
    if (preferences.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preferences.theme]);

  const setTheme = useCallback((theme: ThemePreference) => {
    setPreferences((prev) => {
      const next = { ...prev, theme };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {}
      applyTheme(theme);
      return next;
    });
  }, []);

  const setUnits = useCallback((units: Partial<UnitPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, units: { ...prev.units, ...units } };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  return (
    <PreferencesContext.Provider value={{ preferences, setTheme, setUnits }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
}
