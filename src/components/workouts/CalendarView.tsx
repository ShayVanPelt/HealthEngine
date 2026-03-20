'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  year: number;
  month: number; // 0-indexed (0 = January)
  workoutDates: string[]; // ['2026-03-15', '2026-03-17', ...]
  selectedDate: string; // 'YYYY-MM-DD'
  onDayClick: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toDateString(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

export default function CalendarView({
  year,
  month,
  workoutDates,
  selectedDate,
  onDayClick,
  onMonthChange,
}: CalendarViewProps) {
  const today = new Date();
  const todayStr = toDateString(today.getFullYear(), today.getMonth(), today.getDate());

  const workoutDateSet = new Set(workoutDates);
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    if (month === 0) onMonthChange(year - 1, 11);
    else onMonthChange(year, month - 1);
  };

  const nextMonth = () => {
    if (month === 11) onMonthChange(year + 1, 0);
    else onMonthChange(year, month + 1);
  };

  // Build grid: leading nulls + day numbers
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to a complete row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-5">
        <Button
          onClick={prevMonth}
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-lg"
          aria-label="Previous month"
        >
          ‹
        </Button>
        <span className="font-black text-base text-foreground tracking-tight">
          {MONTH_NAMES[month]} <span className="text-muted-foreground font-medium text-sm">{year}</span>
        </span>
        <Button
          onClick={nextMonth}
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-lg"
          aria-label="Next month"
        >
          ›
        </Button>
      </div>

      {/* Weekday headers + Day cells — key triggers fade on month change */}
      <div key={`${year}-${month}`} className="animate-fade-in">
        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-1 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;

            const dateStr = toDateString(year, month, day);
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === todayStr;
            const hasWorkout = workoutDateSet.has(dateStr);

            return (
              <Button
                key={i}
                onClick={() => onDayClick(dateStr)}
                variant="ghost"
                className={cn(
                  'relative h-9 w-full rounded-md text-sm transition-all duration-150',
                  isSelected
                    ? 'bg-primary text-primary-foreground font-black shadow-sm hover:bg-primary hover:text-primary-foreground'
                    : hasWorkout
                    ? 'bg-primary/10 text-foreground font-semibold hover:bg-primary/20'
                    : isToday
                    ? 'ring-1 ring-primary text-foreground font-semibold'
                    : 'text-foreground',
                )}
              >
                {day}
                {hasWorkout && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
