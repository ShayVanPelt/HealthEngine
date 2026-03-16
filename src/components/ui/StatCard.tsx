import Card from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
}

export default function StatCard({ title, value, unit, subtitle }: StatCardProps) {
  return (
    <Card>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{title}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold">{value}</span>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </Card>
  );
}
