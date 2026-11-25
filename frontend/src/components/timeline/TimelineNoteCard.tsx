import { BookOpen, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimelineNoteEntry } from "@/types/timeline.types";

interface TimelineNoteCardProps {
  entry: TimelineNoteEntry;
  onClick: () => void;
}

export function TimelineNoteCard({ entry, onClick }: TimelineNoteCardProps) {
  const updatedDate = new Date(entry.updatedAt);
  const timeStr = updatedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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
      aria-label={`Note: ${entry.title || "Untitled"}`}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border/70 bg-card/90 p-3.5 transition-all duration-200",
        "border-l-4 border-l-amber-500/80 hover:border-border hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <BookOpen className="h-4 w-4" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {entry.title || "Untitled Diary Entry"}
              </h3>
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
                Note
              </span>
            </div>

            {/* Note Snippet */}
            {entry.plainTextPreview && (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                {entry.plainTextPreview}
              </p>
            )}

            <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Updated at {timeStr}
              </span>
            </div>
          </div>
        </div>

        {/* Calendar Badge (if linked) */}
        {entry.calendar && (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{
              backgroundColor: `${entry.calendar.color}18`,
              color: entry.calendar.color,
            }}
          >
            <span>{entry.calendar.emoji}</span>
            <span className="max-w-[70px] truncate">{entry.calendar.name}</span>
          </span>
        )}
      </div>
    </div>
  );
}
