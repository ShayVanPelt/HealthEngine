import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardTrend {
  delta: number;
  label: string;
  /** 'up' = green when positive, 'down' = green when negative, 'neutral' = always gray */
  positiveDirection: 'up' | 'down' | 'neutral';
}

interface StatCardProgress {
  current: number;
  goal: number;
  label?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  animationDelay?: string;
  trend?: StatCardTrend;
  progress?: StatCardProgress;
}

function TrendChip({ trend }: { trend: StatCardTrend }) {
  const { delta, label, positiveDirection } = trend;
  const isPositive = delta > 0;
  const isNeutral = positiveDirection === 'neutral' || delta === 0;

  let colorClass = 'text-muted-foreground';
  if (!isNeutral) {
    const goodDirection = positiveDirection === 'up' ? isPositive : !isPositive;
    colorClass = goodDirection ? 'text-green-600 dark:text-green-400' : 'text-destructive';
  }

  const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
  const absVal = Math.abs(delta);

  return (
    <span className={cn('inline-flex items-center gap-0.5 text-[11px] font-semibold', colorClass)}>
      {arrow} {absVal > 0 ? absVal : ''} {label}
    </span>
  );
}

function ProgressBar({ progress }: { progress: StatCardProgress }) {
  const pct = Math.min(100, Math.round((progress.current / Math.max(1, progress.goal)) * 100));
  const over = progress.current > progress.goal;

  return (
    <div className="mt-3 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {progress.label ?? 'Goal'}
        </span>
        <span className={cn('text-[10px] font-bold uppercase tracking-wider', over ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground')}>
          {pct}%
        </span>
      </div>
      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            over ? 'bg-green-500' : pct >= 80 ? 'bg-primary' : 'bg-primary/60'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">
        {progress.current} / {progress.goal} {progress.label?.toLowerCase().includes('workout') ? 'workouts' : ''}
      </p>
    </div>
  );
}

export default function StatCard({
  title,
  value,
  unit,
  subtitle,
  animationDelay,
  trend,
  progress,
}: StatCardProps) {
  return (
    <Card
      className="relative overflow-hidden animate-fade-in-up"
      style={animationDelay ? { animationDelay } : undefined}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
      <CardContent className="p-5 sm:p-6 pl-7 sm:pl-8">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl sm:text-6xl font-black text-primary leading-none tracking-tight">
            {value}
          </span>
          {unit && <span className="text-sm font-medium text-muted-foreground">{unit}</span>}
        </div>
        {trend && <div className="mt-1.5"><TrendChip trend={trend} /></div>}
        {subtitle && !trend && <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>}
        {subtitle && trend && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {progress && <ProgressBar progress={progress} />}
      </CardContent>
    </Card>
  );
}
