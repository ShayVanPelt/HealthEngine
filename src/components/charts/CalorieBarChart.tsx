'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { useChartColors } from '@/hooks/useChartColors';
import type { CalorieSummaryDay } from '@/app/api/calories/summary/route';

interface Props {
  dailyGoal: number | null;
  refreshKey?: string | number; // increment to trigger refetch
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  goal: number | null;
}

function CustomTooltip({ active, payload, label, goal }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  const pct = goal ? Math.round((val / goal) * 100) : null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md text-xs space-y-0.5">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-bold text-foreground">{val.toLocaleString()} Cal</p>
      {pct !== null && (
        <p className={pct >= 100 ? 'text-green-500' : 'text-muted-foreground'}>
          {pct}% of daily goal
        </p>
      )}
    </div>
  );
}

export default function CalorieBarChart({ dailyGoal, refreshKey }: Props) {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<CalorieSummaryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const colors = useChartColors();

  const fetch30Days = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/calories/summary?days=30');
      if (res.ok) {
        const json = await res.json();
        setData(json.data ?? []);
      }
    } catch {
      // fail silently — chart is non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { fetch30Days(); }, [fetch30Days, refreshKey]);

  if (!mounted || loading) {
    return <div className="h-48 rounded-lg bg-muted animate-pulse" />;
  }

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center rounded-lg border border-border bg-card">
        <p className="text-sm text-muted-foreground">No calorie data in the last 30 days</p>
      </div>
    );
  }

  // Format dates for display — keep only last 14 bars for readability
  const chartData = data.slice(-14).map((d) => {
    const [, , day] = d.date.split('-');
    return { ...d, label: `${parseInt(day)}` };
  });

  const maxVal = Math.max(...chartData.map((d) => d.calories), dailyGoal ?? 0);

  return (
    <ResponsiveContainer width="100%" height={192}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barSize={14}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: colors.mutedForeground, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, Math.ceil(maxVal * 1.1)]}
          tick={{ fill: colors.mutedForeground, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={40}
          tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
        />
        <Tooltip
          cursor={{ fill: colors.muted }}
          content={(props) => (
            <CustomTooltip
              active={props.active}
              payload={props.payload as { value: number }[] | undefined}
              label={props.label as string | undefined}
              goal={dailyGoal}
            />
          )}
        />
        {dailyGoal && (
          <ReferenceLine
            y={dailyGoal}
            stroke={colors.primary}
            strokeDasharray="4 3"
            strokeWidth={1.5}
            label={{
              value: 'Goal',
              position: 'insideTopRight',
              fill: colors.primary,
              fontSize: 9,
              fontWeight: 700,
            }}
          />
        )}
        <Bar
          dataKey="calories"
          fill={colors.primary}
          radius={[3, 3, 0, 0]}
          opacity={0.85}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
