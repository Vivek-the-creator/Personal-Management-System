import { Clock, MapPin, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimelineEventEntry } from "@/types/timeline.types";

interface TimelineCardProps {
  entry: TimelineEventEntry;
  onClick: () => void;
}

export function TimelineCard({ entry, onClick }: TimelineCardProps) {

  const startDate = new Date(entry.startAt);
  const endDate = new Date(entry.endAt);

  const timeStr = entry.isAllDay
    ? "All Day"
    : `${startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  const isUrgent = entry.priority === "urgent";
  const isHigh = entry.priority === "high";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Event: ${entry.title}`}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border/70 bg-card p-3.5 transition-all duration-200",
        "hover:border-border hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      {/* Highlight Accent Bar */}
      <div
        className="absolute inset-y-0 left-0 w-1.5 transition-all group-hover:w-2"
        style={{ backgroundColor: entry.highlightColor }}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-3 pl-1.5">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/80 text-xl shadow-2xs">
            {entry.emoji || "📅"}
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {entry.title}
            </h3>

            {/* Time & Recurrence */}
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                <Clock className="h-3 w-3" />
                {timeStr}
              </span>

              {entry.recurrenceRule && entry.recurrenceRule !== "none" && (
                <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
                  <Repeat className="h-3 w-3" />
                  <span className="capitalize">{entry.recurrenceRule}</span>
                </span>
              )}

              {entry.location && (
                <span className="inline-flex items-center gap-0.5 truncate text-[11px]">
                  <MapPin className="h-3 w-3" />
                  {entry.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Badges Column: Calendar + Priority */}
        <div className="flex shrink-0 flex-col items-end gap-1">
          {entry.calendar && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{
                backgroundColor: `${entry.calendar.color}18`,
                color: entry.calendar.color,
              }}
            >
              <span>{entry.calendar.emoji}</span>
              <span className="max-w-[80px] truncate">{entry.calendar.name}</span>
            </span>
          )}

          {(isUrgent || isHigh) && (
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                isUrgent && "bg-red-500/15 text-red-600 dark:text-red-400",
                isHigh && "bg-orange-500/15 text-orange-600 dark:text-orange-400"
              )}
            >
              {entry.priority}
            </span>
          )}
        </div>
      </div>

      {/* Description Snippet (if available) */}
      {entry.description && (
        <p className="mt-2 pl-1.5 text-xs text-muted-foreground line-clamp-1">
          {entry.description}
        </p>
      )}
    </div>
  );
}
