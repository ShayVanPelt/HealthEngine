interface LoadingDotsProps {
  /** Accessible description, e.g. "Loading workouts" */
  label?: string;
  className?: string;
}

export default function LoadingDots({ label = 'Loading', className }: LoadingDotsProps) {
  return (
    <div role="status" aria-label={label} className={className ?? 'flex gap-1'}>
      <span className="sr-only">{label}…</span>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}
