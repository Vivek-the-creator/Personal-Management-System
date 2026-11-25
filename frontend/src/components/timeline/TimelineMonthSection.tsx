import type { TimelineMonthGroup, TimelineEventEntry, TimelineNoteEntry } from "@/types/timeline.types";
import { TimelineDayNode } from "./TimelineDayNode";

interface TimelineMonthSectionProps {
  monthGroup: TimelineMonthGroup;
  onSelectEvent: (event: TimelineEventEntry) => void;
  onSelectNote: (note: TimelineNoteEntry) => void;
}

export function TimelineMonthSection({
  monthGroup,
  onSelectEvent,
  onSelectNote,
}: TimelineMonthSectionProps) {
  const { month, year, monthName, dateGroups, totalEntries } = monthGroup;

  return (
    <div
      id={`month-header-${year}-${month}`}
      className="relative space-y-4 pt-3 first:pt-0"
    >
      {/* Month Subheading */}
      <div className="sticky top-16 z-10 flex items-center gap-2.5 bg-background/80 py-1.5 backdrop-blur-md">
        <div className="h-2 w-2 rounded-full bg-primary/70" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {monthName} {year}
        </h3>
        <div className="h-px flex-1 bg-border/60" />
        <span className="text-xs text-muted-foreground font-medium">
          {totalEntries} {totalEntries === 1 ? "entry" : "entries"}
        </span>
      </div>

      {/* Days inside this month */}
      <div className="pl-1 sm:pl-2">
        {dateGroups.map((dg) => (
          <TimelineDayNode
            key={dg.dateKey}
            dateGroup={dg}
            onSelectEvent={onSelectEvent}
            onSelectNote={onSelectNote}
          />
        ))}
      </div>
    </div>
  );
}
