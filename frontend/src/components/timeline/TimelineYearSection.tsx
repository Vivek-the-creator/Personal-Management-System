import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TimelineYearGroup, TimelineEventEntry, TimelineNoteEntry } from "@/types/timeline.types";
import { TimelineMonthSection } from "./TimelineMonthSection";

interface TimelineYearSectionProps {
  yearGroup: TimelineYearGroup;
  onSelectEvent: (event: TimelineEventEntry) => void;
  onSelectNote: (note: TimelineNoteEntry) => void;
}

export function TimelineYearSection({
  yearGroup,
  onSelectEvent,
  onSelectNote,
}: TimelineYearSectionProps) {
  const { year, monthGroups, totalEntries } = yearGroup;
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <section
      id={`year-header-${year}`}
      aria-label={`Year ${year}`}
      className="relative rounded-2xl border border-border/60 bg-card/30 p-4 sm:p-6 mb-6 shadow-xs"
    >
      {/* Year Banner Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? `Expand year ${year}` : `Collapse year ${year}`}
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {year}
          </h2>

          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            {totalEntries} {totalEntries === 1 ? "entry" : "entries"}
          </span>
        </div>
      </div>

      {/* Months within Year */}
      {!isCollapsed && (
        <div className="mt-3 space-y-6">
          {monthGroups.map((mg) => (
            <TimelineMonthSection
              key={`${year}-${mg.month}`}
              monthGroup={mg}
              onSelectEvent={onSelectEvent}
              onSelectNote={onSelectNote}
            />
          ))}
        </div>
      )}
    </section>
  );
}
