import { memo } from "react";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarDay, EventItem, FestivalRecord } from "@/types";
import { getDerivedColorStyles } from "@/utils/color-contrast.utils";

interface CalendarCellProps {
  day: CalendarDay;
  isSelected: boolean;
  events?: EventItem[];
  festivals?: FestivalRecord[];
  hasNotes?: boolean;
  onSelect: (date: Date) => void;
  onEventClick?: (event: EventItem) => void;
}

function CalendarCellComponent({
  day,
  isSelected,
  events = [],
  festivals = [],
  hasNotes = false,
  onSelect,
  onEventClick,
}: CalendarCellProps) {
  const visibleEvents = events.slice(0, 2);
  const overflowCount = events.length - visibleEvents.length;
  const primaryFestival = festivals[0];
  const extraFestivalsCount = festivals.length > 1 ? festivals.length - 1 : 0;

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.985 }}
      onClick={() => onSelect(day.date)}
      aria-label={day.date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}
      aria-current={day.isToday ? "date" : undefined}
      aria-pressed={isSelected}
      className={cn(
        "group relative flex min-h-[4.75rem] flex-col items-start gap-1.5 border-r border-t border-border/50 p-1.5 text-left",
        "transition duration-200 hover:z-10 hover:bg-accent/45 hover:shadow-[inset_0_0_0_1px_hsl(var(--ring)/0.18)]",
        "focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        "active:bg-accent/70 sm:min-h-[6.5rem] sm:p-2 md:min-h-[7.5rem] lg:min-h-[8.75rem] xl:min-h-[9.25rem]",
        day.isCurrentMonth ? "bg-card" : "bg-muted/20",
        isSelected && "z-10 bg-primary/8 shadow-[inset_0_0_0_2px_hsl(var(--primary)/0.42)]"
      )}
    >
      {/* Date Header / Prominent Number */}
      <div className="flex w-full items-center justify-between">
        <span
          className={cn(
            "grid h-6 w-6 place-items-center rounded-full text-xs font-semibold transition sm:h-7 sm:w-7 sm:text-sm",
            day.isToday
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
              : day.isCurrentMonth
                ? "text-foreground group-hover:bg-background"
                : "text-muted-foreground/45",
            isSelected && !day.isToday && "bg-primary/12 text-primary"
          )}
        >
          {day.dayOfMonth}
        </span>

        {hasNotes && (
          <div
            className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary transition group-hover:bg-primary/15"
            title="Note recorded for this date"
          >
            <FileText className="h-3 w-3 shrink-0" />
            <span className="hidden sm:inline">Note</span>
          </div>
        )}
      </div>

      {/* Subtle Festival / Holiday Indicator */}
      {primaryFestival && (
        <div
          className="flex w-full items-center gap-1 overflow-hidden rounded border border-amber-500/20 bg-amber-500/8 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-200"
          title={festivals.map((f) => `${f.emoji} ${f.name}`).join(" · ")}
        >
          <span className="shrink-0 text-[11px] leading-none">{primaryFestival.emoji}</span>
          <span className="hidden truncate sm:inline">{primaryFestival.name}</span>
          {extraFestivalsCount > 0 && (
            <span className="ml-auto shrink-0 text-[9px] font-semibold opacity-80">
              +{extraFestivalsCount}
            </span>
          )}
        </div>
      )}

      {/* Events List Container */}
      <div className="mt-1 flex w-full flex-col gap-1 overflow-hidden">
        {visibleEvents.map((evt) => {
          const styles = getDerivedColorStyles(evt.highlightColor);

          return (
            <div
              key={evt.id}
              onClick={(e) => {
                e.stopPropagation();
                if (onEventClick) onEventClick(evt);
                else onSelect(day.date);
              }}
              className={cn(
                "group/chip relative flex items-center gap-1 overflow-hidden rounded px-1.5 py-0.5 text-[11px] font-medium leading-snug transition hover:brightness-95",
                evt.highlightStyle === "outline" && "border",
                evt.highlightStyle === "top_accent" && "border-t-2",
                evt.highlightStyle === "bottom_accent" && "border-b-2",
                evt.highlightStyle === "left_accent" && "border-l-2"
              )}
              style={{
                backgroundColor: evt.highlightStyle === "background" ? styles.softBg : "rgba(15, 23, 42, 0.04)",
                borderColor: evt.highlightStyle !== "background" ? styles.hex : undefined,
                color: styles.textColor,
              }}
              title={evt.title}
            >
              {evt.highlightStyle === "dot" && (
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: styles.hex }}
                />
              )}
              <span className="shrink-0 text-xs">{evt.emoji || "📅"}</span>
              <span className="truncate">{evt.title}</span>
            </div>
          );
        })}

        {overflowCount > 0 && (
          <span className="self-start rounded bg-muted/60 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            +{overflowCount} more
          </span>
        )}
      </div>
    </motion.button>
  );
}

export const CalendarCell = memo(CalendarCellComponent);
