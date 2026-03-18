interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
}

export default function StatCard({ title, value, unit, subtitle }: StatCardProps) {
  return (
    <div className="relative border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-6 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600 to-violet-400 dark:from-violet-500 dark:to-violet-300" />
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
        {title}
      </p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl sm:text-4xl font-bold text-violet-600 dark:text-violet-400">
          {value}
        </span>
        {unit && <span className="text-sm text-zinc-500 dark:text-zinc-400">{unit}</span>}
      </div>
      {subtitle && <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{subtitle}</p>}
    </div>
  );
}
