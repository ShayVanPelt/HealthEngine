'use client';

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
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="py-1 text-center text-xs font-medium text-zinc-400 dark:text-zinc-500">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;

          const dateStr = toDateString(year, month, day);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const hasWorkout = workoutDateSet.has(dateStr);

          return (
            <button
              key={i}
              onClick={() => onDayClick(dateStr)}
              className={[
                'relative h-9 w-full flex items-center justify-center text-sm rounded-lg transition-all duration-100',
                isSelected
                  ? 'bg-violet-600 dark:bg-violet-500 text-white font-semibold shadow-sm'
                  : isToday
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800',
              ].join(' ')}
            >
              {day}
              {hasWorkout && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-500 dark:bg-violet-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
