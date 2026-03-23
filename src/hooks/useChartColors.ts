'use client';

import { useState, useEffect } from 'react';

interface ChartColors {
  primary: string;
  primaryArea: string;
  muted: string;
  mutedForeground: string;
  border: string;
  background: string;
  green: string;
  orange: string;
  blue: string;
}

const DEFAULTS: ChartColors = {
  primary: 'hsl(263 70% 50%)',
  primaryArea: 'hsl(263 70% 50% / 0.12)',
  muted: 'hsl(240 5% 96%)',
  mutedForeground: 'hsl(240 4% 46%)',
  border: 'hsl(240 6% 90%)',
  background: 'hsl(0 0% 100%)',
  green: 'hsl(142 71% 45%)',
  orange: 'hsl(25 95% 53%)',
  blue: 'hsl(217 91% 60%)',
};

function readColors(): ChartColors {
  if (typeof window === 'undefined') return DEFAULTS;
  const s = getComputedStyle(document.documentElement);
  const get = (v: string) => `hsl(${s.getPropertyValue(v).trim()})`;
  const primary = s.getPropertyValue('--primary').trim();
  return {
    primary: `hsl(${primary})`,
    primaryArea: `hsl(${primary} / 0.12)`,
    muted: get('--muted'),
    mutedForeground: get('--muted-foreground'),
    border: get('--border'),
    background: get('--background'),
    green: 'hsl(142 71% 45%)',
    orange: 'hsl(25 95% 53%)',
    blue: 'hsl(217 91% 60%)',
  };
}

export function useChartColors(): ChartColors {
  const [colors, setColors] = useState<ChartColors>(DEFAULTS);

  useEffect(() => {
    setColors(readColors());

    // Re-read when dark/light class is toggled on <html>
    const observer = new MutationObserver(() => setColors(readColors()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return colors;
}
