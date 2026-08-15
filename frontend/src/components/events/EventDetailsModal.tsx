import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Clock, MapPin, Pencil, Repeat, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCalendarWorkspaces } from "@/hooks";
import { cn } from "@/lib/utils";
import type { EventItem } from "@/types";
import { getDerivedColorStyles } from "@/utils/color-contrast.utils";

interface EventDetailsModalProps {
  event: EventItem | null;
  onClose: () => void;
  onEdit: (event: EventItem) => void;
  onDelete: (eventId: string) => Promise<void>;
}

export function EventDetailsModal({
  event,
  onClose,
  onEdit,
  onDelete,
}: EventDetailsModalProps) {
  const workspace = useCalendarWorkspaces();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!event) return null;

  const calendar = workspace.calendars.find((c) => c.id === event.calendarId);
  const styles = getDerivedColorStyles(event.highlightColor);

  const startDate = new Date(event.startAt);
  const endDate = new Date(event.endAt);

  const dateStr = startDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const timeStr = event.isAllDay
    ? "All Day"
    : `${startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  async function handleDelete() {
    if (!event) return;
    setIsDeleting(true);
    try {
      await onDelete(event.id);
      onClose();
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 p-0 backdrop-blur-[2px] sm:items-center sm:p-4 md:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
      >
        <button className="absolute inset-0" type="button" onClick={onClose} aria-label="Close" />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative z-10 flex max-h-[88vh] sm:max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border border-border/60 bg-card p-5 shadow-2xl"
        >
          {/* Top banner accent */}
          <div
            className="h-2 w-full shrink-0 rounded-full"
            style={{ backgroundColor: event.highlightColor }}
          />

          <div className="mt-4 flex shrink-0 items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-2xl">
                {event.emoji || "📅"}
              </span>
              <div>
                <h2 className="text-lg font-bold text-foreground">{event.title}</h2>
                {calendar && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" /> {calendar.emoji} {calendar.name}
                  </span>
                )}
              </div>
            </div>

            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto pr-1">
            <div className="grid gap-3 text-sm">
              {/* Date & Time */}
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0 text-foreground/70" />
                <span>
                  <strong className="text-foreground">{dateStr}</strong> ({timeStr})
                </span>
              </div>

              {/* Location */}
              {event.location && (
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0 text-foreground/70" />
                  <span className="text-foreground">{event.location}</span>
                </div>
              )}

              {/* Recurrence */}
              {event.recurrenceRule && event.recurrenceRule !== "none" && (
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Repeat className="h-4 w-4 shrink-0 text-foreground/70" />
                  <span className="capitalize text-foreground">Repeats {event.recurrenceRule}</span>
                </div>
              )}

              {/* Priority & Style Badge */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider",
                    event.priority === "urgent" && "bg-red-500/15 text-red-600 dark:text-red-400",
                    event.priority === "high" && "bg-orange-500/15 text-orange-600 dark:text-orange-400",
                    event.priority === "medium" && "bg-sky-500/15 text-sky-600 dark:text-sky-400",
                    event.priority === "low" && "bg-slate-500/15 text-slate-600 dark:text-slate-400"
                  )}
                >
                  {event.priority} Priority
                </span>

                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: styles.softBg, color: styles.textColor }}
                >
                  Style: {event.highlightStyle.replace("_", " ")}
                </span>
              </div>

              {/* Description */}
              {event.description && (
                <div className="mt-2 rounded-xl border border-border/60 bg-muted/20 p-3 text-xs leading-relaxed text-foreground">
                  {event.description}
                </div>
              )}
            </div>
          </div>

          {/* Delete Confirmation Alert */}
          {showConfirm && (
            <div className="mt-4 shrink-0 rounded-xl border border-destructive/30 bg-destructive/8 p-3 text-xs text-destructive">
              <p className="font-semibold">Permanently delete this event?</p>
              <p className="mt-1">This action cannot be undone.</p>
              <div className="mt-3 flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setShowConfirm(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </Button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          {!showConfirm && (
            <div className="mt-4 flex shrink-0 justify-between gap-2 border-t border-border/60 pt-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setShowConfirm(true)}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Close
                </Button>
                <Button size="sm" onClick={() => onEdit(event)}>
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
