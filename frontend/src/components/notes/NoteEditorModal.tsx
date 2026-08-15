import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/notes/RichTextEditor";
import { useMediaQuery } from "@/hooks";
import type { NoteItem } from "@/types";
import { dateKey } from "@/utils/calendar";

interface NoteEditorModalProps {
  open: boolean;
  initialDate?: Date | null;
  note?: NoteItem | null;
  onSave: (values: { title?: string; content: string; date: string }) => Promise<NoteItem | void>;
  onClose: () => void;
}

export function NoteEditorModal({
  open,
  initialDate,
  note,
  onSave,
  onClose,
}: NoteEditorModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const defaultDateStr = dateKey(initialDate ?? new Date());

  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [dateStr, setDateStr] = useState(
    note?.date ? dateKey(new Date(note.date)) : defaultDateStr
  );

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showDraftConfirm, setShowDraftConfirm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(note?.title ?? "");
      setContent(note?.content ?? "");
      setDateStr(note?.date ? dateKey(new Date(note.date)) : defaultDateStr);
      setSaveStatus("idle");
      setShowDraftConfirm(false);
      setHasUnsavedChanges(false);
    }
  }, [open, note, defaultDateStr]);

  function handleTitleChange(val: string) {
    setTitle(val);
    setHasUnsavedChanges(true);
  }

  function handleContentChange(val: string) {
    setContent(val);
    setHasUnsavedChanges(true);
  }

  function handleDateChange(val: string) {
    setDateStr(val);
    setHasUnsavedChanges(true);
  }

  async function handleExplicitSave() {
    if (!content.trim()) return;
    setSaveStatus("saving");
    try {
      await onSave({
        title: title.trim() || undefined,
        content,
        date: `${dateStr}T12:00:00.000Z`,
      });
      setSaveStatus("saved");
      setHasUnsavedChanges(false);
      onClose();
    } catch {
      setSaveStatus("error");
    }
  }

  function handleRequestClose() {
    if (hasUnsavedChanges && content.trim()) {
      setShowDraftConfirm(true);
    } else {
      onClose();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 p-0 backdrop-blur-[2px] sm:items-center sm:p-4 md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
        >
          <button className="absolute inset-0" type="button" onClick={handleRequestClose} aria-label="Close" />

          <motion.div
            initial={isDesktop ? { opacity: 0, scale: 0.96, y: 8 } : { y: "100%" }}
            animate={isDesktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
            exit={isDesktop ? { opacity: 0, scale: 0.96, y: 8 } : { y: "100%" }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative z-10 flex max-h-[88vh] sm:max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border border-border/60 bg-card p-5 shadow-2xl"
          >
            {/* Header */}
            <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  {note ? "Edit Note" : "New Entry"}
                </h2>
                {saveStatus === "saving" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-600 dark:text-green-400">
                    <Check className="h-3 w-3" /> Saved
                  </span>
                )}
                {saveStatus === "error" && (
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                    Save Error
                  </span>
                )}
              </div>

              <Button variant="ghost" size="icon" onClick={handleRequestClose} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Scrollable Editor Body */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="grid gap-3 pt-1">
                <div className="grid gap-1">
                  <Label htmlFor="note-title">Title (Optional)</Label>
                  <Input
                    id="note-title"
                    value={title}
                    maxLength={150}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Morning thoughts, Diary entry..."
                  />
                </div>

                <div className="grid gap-1">
                  <Label htmlFor="note-date">Entry Date</Label>
                  <Input
                    id="note-date"
                    type="date"
                    value={dateStr}
                    onChange={(e) => handleDateChange(e.target.value)}
                  />
                </div>

                <div className="grid gap-1">
                  <Label>Content *</Label>
                  <RichTextEditor
                    value={content}
                    onChange={handleContentChange}
                    placeholder="Write your diary entry or notes here..."
                  />
                </div>
              </div>
            </div>

            {/* Draft Protection Banner */}
            {showDraftConfirm && (
              <div className="mt-3 shrink-0 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                <p className="font-semibold">Save your entry as a draft or discard?</p>
                <div className="mt-2.5 flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={onClose}>
                    Discard
                  </Button>
                  <Button size="sm" onClick={handleExplicitSave}>
                    Save & Close
                  </Button>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            {!showDraftConfirm && (
              <div className="mt-4 flex shrink-0 justify-end gap-2 border-t border-border/60 pt-3">
                <Button variant="ghost" onClick={handleRequestClose}>
                  Cancel
                </Button>
                <Button onClick={handleExplicitSave} disabled={!content.trim() || saveStatus === "saving"}>
                  {saveStatus === "saving" ? "Saving..." : "Save Entry"}
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
