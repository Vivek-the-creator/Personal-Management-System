import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { CalendarWorkspace } from "@/types";

interface DeleteCalendarDialogProps {
  calendar: CalendarWorkspace | null;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  disabledReason?: string;
}

export function DeleteCalendarDialog({
  calendar,
  onCancel,
  onConfirm,
  disabledReason,
}: DeleteCalendarDialogProps) {
  return (
    <AnimatePresence>
      {calendar && (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center bg-foreground/25 px-4 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="alertdialog"
          aria-modal="true"
          aria-label="Delete calendar"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-full max-w-sm rounded-xl border border-border/60 bg-card p-5 shadow-2xl"
          >
            <h2 className="text-lg font-semibold text-foreground">Delete {calendar.name}?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Deleting removes this calendar permanently. This cannot be undone.
            </p>
            {disabledReason && <p className="mt-3 text-sm text-destructive">{disabledReason}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={onConfirm} disabled={Boolean(disabledReason)}>
                Delete
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
