import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimelineDateGroup, TimelineEventEntry, TimelineNoteEntry } from "@/types/timeline.types";
import { TimelineCard } from "./TimelineCard";
import { TimelineNoteCard } from "./TimelineNoteCard";

interface TimelineDayNodeProps {
  dateGroup: TimelineDateGroup;
  onSelectEvent: (event: TimelineEventEntry) => void;
  onSelectNote: (note: TimelineNoteEntry) => void;
}

export function TimelineDayNode({
  dateGroup,
  onSelectEvent,
  onSelectNote,
}: TimelineDayNodeProps) {
  const { dateKey, dayOfMonth, dayName, formattedDate, isToday, entries } = dateGroup;

  return (
    <div
      id={isToday ? "timeline-today-marker" : `date-node-${dateKey}`}
      className="relative flex gap-3 sm:gap-5 pb-6 last:pb-2"
    >
      {/* Left Timeline Spine / Node Indicator */}
      <div className="flex flex-col items-center">
        {/* Node Circle */}
        <div
          className={cn(
            "relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all",
            isToday
              ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/30 ring-4 ring-primary/20"
              : "border-border bg-card text-muted-foreground shadow-xs"
          )}
        >
          <span className="text-xs sm:text-sm font-bold">{dayOfMonth}</span>

          {isToday && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
            </span>
          )}
        </div>

        {/* Vertical track connecting line */}
        <div className="mt-2 w-0.5 flex-1 bg-border/60" aria-hidden="true" />
      </div>

      {/* Right Content: Date Header & Entry Cards */}
      <div className="flex-1 min-w-0 pt-0.5">
        {/* Date Label Header */}
        <div className="mb-2.5 flex items-center gap-2">
          <span
            className={cn(
              "text-xs sm:text-sm font-semibold tracking-tight",
              isToday ? "text-primary font-bold" : "text-foreground"
            )}
          >
            {dayName}, {formattedDate}
          </span>

          {isToday && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
              <Sparkles className="h-3 w-3" />
              TODAY
            </span>
          )}

          <span className="text-[11px] text-muted-foreground">
            ({entries.length} {entries.length === 1 ? "item" : "items"})
          </span>
        </div>

        {/* Entries List */}
        <div className="space-y-2.5">
          {entries.map((entry) => {
            if (entry.type === "event") {
              return (
                <TimelineCard
                  key={entry.id}
                  entry={entry}
                  onClick={() => onSelectEvent(entry)}
                />
              );
            }
            return (
              <TimelineNoteCard
                key={entry.id}
                entry={entry}
                onClick={() => onSelectNote(entry)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
