'use client';

import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useChartColors } from '@/hooks/useChartColors';
import type { WeightEntry } from '@/types';
import { convertWeight } from '@/lib/units';
import type { WeightUnit } from '@/types';

interface Props {
  entries: WeightEntry[];
  unit: WeightUnit;
}

interface ChartPoint {
  date: string;
  weight: number;
  label: string;
}

function buildData(entries: WeightEntry[], unit: WeightUnit): ChartPoint[] {
  // entries are newest-first — reverse to chronological for the chart
  return [...entries]
    .reverse()
    .slice(-30)
    .map((e) => {
      const d = new Date(e.createdAt);
      return {
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        weight: parseFloat(convertWeight(e.weight, unit).toFixed(1)),
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
    });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  unit: WeightUnit;
}

function CustomTooltip({ active, payload, label, unit }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-bold text-foreground">
        {payload[0].value} {unit}
      </p>
    </div>
  );
}

export default function WeightChart({ entries, unit }: Props) {
  const [mounted, setMounted] = useState(false);
  const colors = useChartColors();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-48 rounded-lg bg-muted animate-pulse" />;
  }

  const data = buildData(entries, unit);

  if (data.length < 2) {
    return (
      <div className="h-48 flex items-center justify-center rounded-lg border border-border bg-card">
        <p className="text-sm text-muted-foreground">Log 2+ entries to see your trend</p>
      </div>
    );
  }

  const values = data.map((d) => d.weight);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max((max - min) * 0.3, 1);

  return (
    <ResponsiveContainer width="100%" height={192}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.primary} stopOpacity={0.18} />
            <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={colors.border}
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fill: colors.mutedForeground, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[min - padding, max + padding]}
          tick={{ fill: colors.mutedForeground, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={36}
          tickFormatter={(v: number) => v.toFixed(1)}
        />
        <Tooltip
          content={(props) => (
            <CustomTooltip
              active={props.active}
              payload={props.payload as unknown as { value: number }[] | undefined}
              label={props.label as string | undefined}
              unit={unit}
            />
          )}
        />
        <Area
          type="monotone"
          dataKey="weight"
          stroke={colors.primary}
          strokeWidth={2}
          fill="url(#weightGradient)"
          dot={false}
          activeDot={{ r: 4, fill: colors.primary, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
