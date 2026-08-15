interface CalendarHeaderProps {
  weekdayLabels: string[];
}

export function CalendarHeader({ weekdayLabels }: CalendarHeaderProps) {
  return (
    <div className="grid grid-cols-7 border-b border-border/60 bg-muted/20" role="row">
      {weekdayLabels.map((day) => (
        <div
          key={day}
          className="px-1 py-2 text-center text-[0.65rem] font-semibold uppercase text-muted-foreground sm:py-2.5 sm:text-xs"
          role="columnheader"
        >
          {day}
        </div>
      ))}
    </div>
  );
}
