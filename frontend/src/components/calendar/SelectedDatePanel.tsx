import { AnimatePresence, motion } from "framer-motion";
import { FileText, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EventItem, NoteItem } from "@/types";
import { formatSelectedDate } from "@/utils/calendar";
import { getDerivedColorStyles } from "@/utils/color-contrast.utils";
import { extractPlainTextSnippet } from "@/utils/html-sanitizer.utils";

interface SelectedDatePanelProps {
  selectedDate: Date | null;
  events?: EventItem[];
  notes?: NoteItem[];
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: () => void;
  onAddNote: () => void;
  onEventClick: (event: EventItem) => void;
  onNoteClick: (note: NoteItem) => void;
}

function SelectedDateContent({
  selectedDate,
  events = [],
  notes = [],
  onAddEvent,
  onAddNote,
  onEventClick,
  onNoteClick,
}: {
  selectedDate: Date;
  events?: EventItem[];
  notes?: NoteItem[];
  onAddEvent: () => void;
  onAddNote: () => void;
  onEventClick: (event: EventItem) => void;
  onNoteClick: (note: NoteItem) => void;
}) {
  const date = formatSelectedDate(selectedDate);

  return (
    <div className="flex h-full flex-col">
      <p className="text-sm font-medium text-muted-foreground">{date.fullDate}</p>
      <div className="mt-2 flex items-end justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-end gap-3">
          <span className="text-5xl font-semibold leading-none text-foreground sm:text-6xl">
            {date.largeDate}
          </span>
          <span className="pb-1 text-sm font-medium text-muted-foreground">
            {date.dayName}
            <br />
            {date.monthName} {date.year}
          </span>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="mt-3 flex items-center gap-2 shrink-0">
        <Button size="sm" variant="outline" className="flex-1 gap-1.5 rounded-xl shadow-xs" onClick={onAddEvent}>
          <Plus className="h-3.5 w-3.5" /> Add Event
        </Button>
        <Button size="sm" className="flex-1 gap-1.5 rounded-xl shadow-xs" onClick={onAddNote}>
          <Plus className="h-3.5 w-3.5" /> Add Note
        </Button>
      </div>

      {/* Content Scroll Area */}
      <div className="mt-4 flex flex-1 flex-col gap-5 overflow-y-auto pr-1">
        {/* Events Section */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Events ({events.length})
            </h3>
          </div>

          {events.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/15 p-3 text-center text-xs text-muted-foreground">
              No events scheduled for this day.
            </div>
          ) : (
            <div className="grid gap-2">
              {events.map((evt) => {
                const styles = getDerivedColorStyles(evt.highlightColor);
                const startTime = new Date(evt.startAt);

                return (
                  <div
                    key={evt.id}
                    onClick={() => onEventClick(evt)}
                    className="group flex cursor-pointer items-center justify-between rounded-xl border border-border/60 p-2.5 transition hover:border-primary/40 hover:bg-accent/40"
                    style={{ backgroundColor: styles.softBg }}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-background/80 text-sm shadow-xs">
                        {evt.emoji || "📅"}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold" style={{ color: styles.textColor }}>
                          {evt.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {evt.isAllDay
                            ? "All Day"
                            : startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>

                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: styles.hex }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Notes & Diary ({notes.length})
            </h3>
          </div>

          {notes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/15 p-3 text-center text-xs text-muted-foreground">
              No notes for this day.
            </div>
          ) : (
            <div className="grid gap-2">
              {notes.map((note) => {
                const snippet = extractPlainTextSnippet(note.content, 90);

                return (
                  <div
                    key={note.id}
                    onClick={() => onNoteClick(note)}
                    className="group flex cursor-pointer flex-col gap-1 rounded-xl border border-border/60 bg-muted/20 p-3 transition hover:border-primary/40 hover:bg-accent/40"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <h4 className="truncate text-xs font-semibold text-foreground">
                        {note.title || "Untitled Entry"}
                      </h4>
                    </div>
                    {snippet && (
                      <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                        &quot;{snippet}&quot;
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SelectedDatePanel({
  selectedDate,
  events = [],
  notes = [],
  isOpen,
  onClose,
  onAddEvent,
  onAddNote,
  onEventClick,
  onNoteClick,
}: SelectedDatePanelProps) {
  return (
    <>
      <AnimatePresence>
        {isOpen && selectedDate && (
          <motion.aside
            key="desktop-date-panel"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="hidden w-80 shrink-0 flex-col rounded-xl border border-border/60 bg-card p-5 shadow-sm lg:flex"
            aria-label="Selected date details"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Selected Date
              </span>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close details">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SelectedDateContent
              selectedDate={selectedDate}
              events={events}
              notes={notes}
              onAddEvent={onAddEvent}
              onAddNote={onAddNote}
              onEventClick={onEventClick}
              onNoteClick={onNoteClick}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && selectedDate && (
          <motion.div
            key="mobile-date-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 z-50 bg-foreground/18 backdrop-blur-[2px] lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Selected date details"
          >
            <button className="absolute inset-0" type="button" onClick={onClose} aria-label="Close details" />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.26, ease: "easeOut" }}
              className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-border/60 bg-card p-5 pb-[calc(5rem+env(safe-area-inset-bottom))] shadow-2xl"
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Selected Date
                </span>
                <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close details">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <SelectedDateContent
                selectedDate={selectedDate}
                events={events}
                notes={notes}
                onAddEvent={onAddEvent}
                onAddNote={onAddNote}
                onEventClick={onEventClick}
                onNoteClick={onNoteClick}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
