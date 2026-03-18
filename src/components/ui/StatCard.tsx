import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
}

export default function StatCard({ title, value, unit, subtitle }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-primary/50" />
      <CardContent className="p-4 sm:p-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          {title}
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl sm:text-4xl font-bold text-primary">
            {value}
          </span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
