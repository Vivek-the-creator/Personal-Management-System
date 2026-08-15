import type { KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCell } from "@/components/calendar/CalendarCell";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import type { CalendarMonth, EventItem, NoteItem } from "@/types";
import { dateKey } from "@/utils/calendar";

interface CalendarGridProps {
  month: CalendarMonth;
  weekdayLabels: string[];
  direction: 1 | -1;
  selectedDate: Date | null;
  eventsByDate?: Record<string, EventItem[]>;
  notesByDate?: Record<string, NoteItem[]>;
  onSelectDate: (date: Date) => void;
  onEventClick?: (event: EventItem) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}

export function CalendarGrid({
  month,
  weekdayLabels,
  direction,
  selectedDate,
  eventsByDate = {},
  notesByDate = {},
  onSelectDate,
  onEventClick,
  onKeyDown,
}: CalendarGridProps) {
  const selectedKey = selectedDate ? dateKey(selectedDate) : null;
  const monthKey = `${month.year}-${month.month}`;

  return (
    <section
      className="min-w-0 overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm"
      aria-label={`${month.year} month calendar`}
    >
      <CalendarHeader weekdayLabels={weekdayLabels} />
      <div
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        role="grid"
        aria-label="Month view"
      >
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={monthKey}
            custom={direction}
            variants={{
              enter: (dir: number) => ({ x: dir > 0 ? 36 : -36, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (dir: number) => ({ x: dir > 0 ? -36 : 36, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="grid grid-cols-7"
          >
            {month.days.map((day) => (
              <CalendarCell
                key={day.dateKey}
                day={day}
                isSelected={selectedKey === day.dateKey}
                events={eventsByDate[day.dateKey] || []}
                hasNotes={Boolean(notesByDate[day.dateKey]?.length)}
                onSelect={onSelectDate}
                onEventClick={onEventClick}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
