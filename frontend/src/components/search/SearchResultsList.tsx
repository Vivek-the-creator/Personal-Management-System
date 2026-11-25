import { BookOpen, Calendar, CalendarArrowUp, Loader2, MapPin, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  AnySearchResult,
  SearchCalendarResult,
  SearchEventResult,
  SearchFestivalResult,
  SearchNoteResult,
  SearchResultsGrouped,
} from "@/types/search.types";
import { FESTIVAL_CATEGORY_LABELS, formatFestivalDate } from "@/utils/festival.utils";
import { formatSearchDateLabel } from "@/utils/search.utils";
import { HighlightedText } from "./HighlightedText";

interface SearchResultsListProps {
  query: string;
  results?: SearchResultsGrouped;
  isLoading: boolean;
  error: unknown;
  activeIndex: number;
  onSelectResult: (result: AnySearchResult) => void;
  onJumpToDate?: (dateIso: string, calendarId?: string) => void;
  onLoadMore: () => void;
  onResetFilters?: () => void;
}

export function SearchResultsList({
  query,
  results,
  isLoading,
  error,
  activeIndex,
  onSelectResult,
  onJumpToDate,
  onLoadMore,
  onResetFilters,
}: SearchResultsListProps) {
  if (isLoading && !results) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="mt-2 text-xs">Searching archive...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center text-xs text-destructive">
        Unable to complete search. Please try again.
      </div>
    );
  }

  if (!results || results.totalCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <SearchX className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">No matching results</p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          Try a different keyword or broaden your calendar and date filters.
        </p>
        {onResetFilters && (
          <Button variant="outline" size="sm" onClick={onResetFilters} className="mt-4 text-xs">
            Reset Filters
          </Button>
        )}
      </div>
    );
  }

  // Compute flat index offsets so keyboard navigation (Up/Down) flows across sections seamlessly
  const eventOffset = 0;
  const noteOffset = results.events.length;
  const calendarOffset = results.events.length + results.notes.length;
  const festivalOffset =
    results.events.length + results.notes.length + results.calendars.length;

  return (
    <div className="space-y-5">
      {/* Screen reader live announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Found {results.totalCount} {results.totalCount === 1 ? "result" : "results"}
      </div>

      {/* Events Section */}
      {results.events.length > 0 && (
        <section aria-label="Matching events">
          <h3 className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Events</span>
            <span>{results.totalEvents}</span>
          </h3>
          <div className="space-y-1.5">
            {results.events.map((evt: SearchEventResult, idx: number) => {
              const flatIdx = eventOffset + idx;
              const isActive = flatIdx === activeIndex;
              return (
                <div
                  key={evt.id}
                  id={`search-result-${flatIdx}`}
                  className={cn(
                    "group flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all",
                    isActive
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border/60 bg-card/70 hover:border-border hover:bg-accent/40"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectResult(evt)}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline-none"
                  >
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg"
                      style={{ backgroundColor: `${evt.highlightColor}18` }}
                    >
                      {evt.emoji || "📅"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        <HighlightedText text={evt.title} query={query} />
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        {evt.calendarName && (
                          <span className="inline-flex items-center gap-1 font-medium">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: evt.calendarColor }}
                            />
                            {evt.calendarName}
                          </span>
                        )}
                        <span>·</span>
                        <span>
                          <HighlightedText
                            text={formatSearchDateLabel(evt.startAt)}
                            query={query}
                          />
                        </span>
                        {evt.location && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-0.5 truncate">
                              <MapPin className="h-3 w-3" />
                              <HighlightedText text={evt.location} query={query} />
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>

                  {onJumpToDate && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onJumpToDate(evt.startAt, evt.calendarId);
                      }}
                      title="Open date in Calendar"
                      aria-label={`Open ${formatSearchDateLabel(evt.startAt)} in Calendar`}
                      className="h-8 w-8 shrink-0 text-muted-foreground opacity-80 hover:text-primary hover:opacity-100"
                    >
                      <CalendarArrowUp className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Notes Section */}
      {results.notes.length > 0 && (
        <section aria-label="Matching notes">
          <h3 className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Notes</span>
            <span>{results.totalNotes}</span>
          </h3>
          <div className="space-y-1.5">
            {results.notes.map((note: SearchNoteResult, idx: number) => {
              const flatIdx = noteOffset + idx;
              const isActive = flatIdx === activeIndex;
              return (
                <div
                  key={note.id}
                  id={`search-result-${flatIdx}`}
                  className={cn(
                    "group flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all",
                    isActive
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border/60 bg-card/70 hover:border-border hover:bg-accent/40"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectResult(note)}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline-none"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <BookOpen className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        <HighlightedText
                          text={note.title || "Untitled Diary Entry"}
                          query={query}
                        />
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <HighlightedText
                          text={formatSearchDateLabel(note.date)}
                          query={query}
                        />
                        {note.calendarName && ` · ${note.calendarName}`}
                      </p>
                      {note.snippet && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          “<HighlightedText text={note.snippet} query={query} />”
                        </p>
                      )}
                    </div>
                  </button>

                  {onJumpToDate && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onJumpToDate(note.date, note.calendarId);
                      }}
                      title="Open date in Calendar"
                      aria-label={`Open ${formatSearchDateLabel(note.date)} in Calendar`}
                      className="h-8 w-8 shrink-0 text-muted-foreground opacity-80 hover:text-primary hover:opacity-100"
                    >
                      <CalendarArrowUp className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Calendars Section */}
      {results.calendars.length > 0 && (
        <section aria-label="Matching calendars">
          <h3 className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Calendars</span>
            <span>{results.totalCalendars}</span>
          </h3>
          <div className="space-y-1.5">
            {results.calendars.map((cal: SearchCalendarResult, idx: number) => {
              const flatIdx = calendarOffset + idx;
              const isActive = flatIdx === activeIndex;
              return (
                <button
                  key={cal.id}
                  id={`search-result-${flatIdx}`}
                  type="button"
                  onClick={() => onSelectResult(cal)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all focus-visible:outline-none",
                    isActive
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border/60 bg-card/70 hover:border-border hover:bg-accent/40"
                  )}
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg"
                    style={{ backgroundColor: `${cal.color}18` }}
                  >
                    {cal.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      <HighlightedText text={cal.name} query={query} />
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {cal.itemCount} {cal.itemCount === 1 ? "item" : "items"}
                      </span>
                      {cal.description && (
                        <>
                          <span>·</span>
                          <span className="truncate">
                            <HighlightedText text={cal.description} query={query} />
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Festivals Section */}
      {results.festivals.length > 0 && (
        <section aria-label="Matching festivals">
          <h3 className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Festivals &amp; Holidays</span>
            <span>{results.totalFestivals}</span>
          </h3>
          <div className="space-y-1.5">
            {results.festivals.map((fest: SearchFestivalResult, idx: number) => {
              const flatIdx = festivalOffset + idx;
              const isActive = flatIdx === activeIndex;
              return (
                <button
                  key={fest.id}
                  id={`search-result-${flatIdx}`}
                  type="button"
                  onClick={() => onSelectResult(fest)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all focus-visible:outline-none",
                    isActive
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border/60 bg-card/70 hover:border-border hover:bg-accent/40"
                  )}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-500/12 text-lg">
                    {fest.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      <HighlightedText text={fest.name} query={query} />
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <HighlightedText
                        text={formatFestivalDate(fest.date)}
                        query={query}
                      />
                      {" · "}
                      {FESTIVAL_CATEGORY_LABELS[fest.festivalCategory]}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Pagination Load More */}
      {(results.hasMoreEvents || results.hasMoreNotes) && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            className="rounded-xl text-xs"
          >
            Load more results
          </Button>
        </div>
      )}
    </div>
  );
}
