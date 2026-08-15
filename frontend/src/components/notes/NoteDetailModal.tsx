import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, FileText, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NoteItem } from "@/types";
import { sanitizeHtml } from "@/utils/html-sanitizer.utils";

interface NoteDetailModalProps {
  note: NoteItem | null;
  onClose: () => void;
  onEdit: (note: NoteItem) => void;
  onDelete: (noteId: string) => Promise<void>;
}

export function NoteDetailModal({
  note,
  onClose,
  onEdit,
  onDelete,
}: NoteDetailModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!note) return null;

  const dateStr = new Date(note.date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const updatedStr = new Date(note.updatedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  async function handleDelete() {
    if (!note) return;
    setIsDeleting(true);
    try {
      await onDelete(note.id);
      onClose();
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  }

  const cleanContentHtml = sanitizeHtml(note.content);

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
          className="relative z-10 flex max-h-[88vh] sm:max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border border-border/60 bg-card p-5 shadow-2xl"
        >
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {note.title || "Untitled Entry"}
                </h2>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" /> {dateStr} · Updated at {updatedStr}
                </span>
              </div>
            </div>

            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Sanitized Rich Text Content Area */}
          <div className="mt-4 flex-1 overflow-y-auto pr-1">
            <div
              className="prose dark:prose-invert prose-sm rounded-xl border border-border/60 bg-muted/20 p-4 text-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: cleanContentHtml }}
            />
          </div>

          {/* Delete Confirmation Banner */}
          {showConfirm && (
            <div className="mt-4 shrink-0 rounded-xl border border-destructive/30 bg-destructive/8 p-3 text-xs text-destructive">
              <p className="font-semibold">Permanently delete this note?</p>
              <p className="mt-1">This action soft deletes the entry.</p>
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
                <Button size="sm" onClick={() => onEdit(note)}>
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
