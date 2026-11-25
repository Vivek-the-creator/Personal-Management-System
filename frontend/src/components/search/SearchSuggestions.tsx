import { BookOpen, CalendarDays, Clock, History, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  SearchEventResult,
  SearchNoteResult,
  SearchSuggestions,
} from "@/types/search.types";
import { formatSearchDateLabel } from "@/utils/search.utils";

interface SearchSuggestionsProps {
  recentSearches: string[];
  suggestions?: SearchSuggestions;
  isLoading?: boolean;
  onSelectRecentSearch: (term: string) => void;
  onRemoveRecentSearch: (term: string) => void;
  onClearRecentSearches: () => void;
  onSelectEvent: (event: SearchEventResult) => void;
  onSelectNote: (note: SearchNoteResult) => void;
}

export function SearchSuggestions({
  recentSearches,
  suggestions,
  isLoading,
  onSelectRecentSearch,
  onRemoveRecentSearch,
  onClearRecentSearches,
  onSelectEvent,
  onSelectNote,
}: SearchSuggestionsProps) {
  const recentNotes = suggestions?.recentNotes ?? [];
  const upcomingEvents = suggestions?.upcomingEvents ?? [];

  const hasNothing =
    recentSearches.length === 0 &&
    recentNotes.length === 0 &&
    upcomingEvents.length === 0;

  if (isLoading) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground">
        Loading suggestions...
      </div>
    );
  }

  if (hasNothing) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm font-medium text-foreground">Search your life archive</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Find events, diary notes, locations, and calendars across any year.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <section aria-label="Recent searches">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <History className="h-3.5 w-3.5" />
              Recent Searches
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearRecentSearches}
              className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
              Clear history
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recentSearches.map((term) => (
              <div
                key={term}
                className="group inline-flex items-center rounded-lg border border-border/70 bg-muted/40 text-xs transition hover:border-border hover:bg-muted"
              >
                <button
                  type="button"
                  onClick={() => onSelectRecentSearch(term)}
                  className="px-2.5 py-1.5 font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-l-lg"
                >
                  {term}
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveRecentSearch(term)}
                  aria-label={`Remove "${term}" from recent searches`}
                  className="pr-2 pl-0.5 py-1.5 text-muted-foreground hover:text-foreground focus-visible:outline-none"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <section aria-label="Upcoming events">
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            Upcoming Events
          </h3>
          <div className="space-y-1.5">
            {upcomingEvents.map((evt) => (
              <button
                key={evt.id}
                type="button"
                onClick={() => onSelectEvent(evt)}
                className="flex w-full items-center gap-3 rounded-xl border border-border/50 bg-card/60 px-3 py-2.5 text-left transition hover:border-border hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-base">
                  {evt.emoji || "📅"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{evt.title}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatSearchDateLabel(evt.startAt)}</span>
                    {evt.calendarName && (
                      <>
                        <span>·</span>
                        <span className="truncate">{evt.calendarName}</span>
                      </>
                    )}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Recently Updated Notes */}
      {recentNotes.length > 0 && (
        <section aria-label="Recently updated notes">
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            Recently Updated Notes
          </h3>
          <div className="space-y-1.5">
            {recentNotes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => onSelectNote(note)}
                className="flex w-full items-start gap-3 rounded-xl border border-border/50 bg-card/60 px-3 py-2.5 text-left transition hover:border-border hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <BookOpen className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {note.title || "Untitled Diary Entry"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                    {formatSearchDateLabel(note.date)}
                    {note.snippet ? ` · "${note.snippet}"` : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
