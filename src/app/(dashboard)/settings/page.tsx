'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { usePreferences } from '@/contexts/PreferencesContext';
import type { ThemePreference, WeightUnit, MacroUnit, EffortUnit } from '@/types';
import { cn } from '@/lib/utils';

const THEME_OPTIONS: { value: ThemePreference; label: string; Icon: React.ElementType }[] = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
];

interface UnitRowProps {
  label: string;
  options: { value: string; label: string }[];
  current: string;
  onChange: (v: string) => void;
}

function UnitRow({ label, options, current, onChange }: UnitRowProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className={cn('grid gap-2', options.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
        {options.map((opt) => (
          <Button
            key={opt.value}
            variant={current === opt.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(opt.value)}
            className="h-9"
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { preferences, setTheme, setUnits } = usePreferences();
  const { theme } = preferences;
  const { bodyWeight, liftingWeight, macros, effort } = preferences.units;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 sm:mb-10 animate-fade-in-up">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none">Settings</h1>
        <p className="text-muted-foreground mt-3 text-sm">Manage your preferences</p>
      </div>

      <div className="space-y-6 max-w-2xl animate-fade-in-up" style={{ animationDelay: '80ms' }}>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Choose how HealthEngine looks on this device</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Theme</Label>
              <div className="grid grid-cols-3 gap-2">
                {THEME_OPTIONS.map(({ value, label, Icon }) => (
                  <Button
                    key={value}
                    variant={theme === value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme(value)}
                    className="h-9 gap-1.5"
                  >
                    <Icon size={14} />
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Units */}
        <Card>
          <CardHeader>
            <CardTitle>Units</CardTitle>
            <CardDescription>
              Values are stored in base units and converted for display only. Changing units does
              not alter your logged data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <UnitRow
                label="Body Weight"
                options={[{ value: 'kg', label: 'kg' }, { value: 'lbs', label: 'lbs' }]}
                current={bodyWeight}
                onChange={(v) => setUnits({ bodyWeight: v as WeightUnit })}
              />
              <UnitRow
                label="Lifting Weight"
                options={[{ value: 'kg', label: 'kg' }, { value: 'lbs', label: 'lbs' }]}
                current={liftingWeight}
                onChange={(v) => setUnits({ liftingWeight: v as WeightUnit })}
              />
              <UnitRow
                label="Food Macros (protein / carbs / fat)"
                options={[{ value: 'g', label: 'g' }, { value: 'oz', label: 'oz' }]}
                current={macros}
                onChange={(v) => setUnits({ macros: v as MacroUnit })}
              />
              <UnitRow
                label="Effort Tracking"
                options={[
                  { value: 'RPE', label: 'RPE (1–10)' },
                  { value: 'RIR', label: 'RIR (0–9)' },
                ]}
                current={effort}
                onChange={(v) => setUnits({ effort: v as EffortUnit })}
              />
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center pb-4">
          Preferences are saved automatically to this browser.
        </p>
      </div>
    </div>
  );
}
