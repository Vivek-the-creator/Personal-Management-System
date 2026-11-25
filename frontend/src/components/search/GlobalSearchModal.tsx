import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EventDetailsModal } from "@/components/events/EventDetailsModal";
import { EventForm } from "@/components/events/EventForm";
import { EventModalDialog } from "@/components/events/EventModalDialog";
import { NoteDetailModal } from "@/components/notes/NoteDetailModal";
import { NoteEditorModal } from "@/components/notes/NoteEditorModal";
import { Button } from "@/components/ui/button";
import { useEvents, useGlobalSearch, useNotes } from "@/hooks";
import {
  useCalendarStore,
  useCalendarWorkspaceStore,
  useSearchModalStore,
} from "@/store";
import type { EventItem, NoteItem } from "@/types";
import type { AnySearchResult } from "@/types/search.types";
import { SearchFiltersBar } from "./SearchFiltersBar";
import { SearchResultsList } from "./SearchResultsList";
import { SearchSuggestions } from "./SearchSuggestions";

export function GlobalSearchModal() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);

  const isOpen = useSearchModalStore((state) => state.isOpen);
  const closeSearch = useSearchModalStore((state) => state.closeSearch);
  const toggleSearch = useSearchModalStore((state) => state.toggleSearch);

  const setSelectedCalendarId = useCalendarWorkspaceStore(
    (state) => state.setSelectedCalendarId
  );
  const setVisibleMonth = useCalendarStore((state) => state.setVisibleMonth);
  const setRequestedDate = useCalendarStore((state) => state.setRequestedDate);

  const search = useGlobalSearch();
  const { updateEvent, deleteEvent } = useEvents();
  const { updateNote, deleteNote } = useNotes();

  const [activeIndex, setActiveIndex] = useState(0);

  // Detail/Edit modals
  const [viewingEvent, setViewingEvent] = useState<EventItem | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [viewingNote, setViewingNote] = useState<NoteItem | null>(null);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleSearch();
      }
    }
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [toggleSearch]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const flatResults = useMemo<AnySearchResult[]>(() => {
    if (!search.results) return [];
    return [
      ...search.results.events,
      ...search.results.notes,
      ...search.results.calendars,
      ...search.results.festivals,
    ];
  }, [search.results]);

  // Reset activeIndex when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [flatResults.length, search.debouncedQuery]);

  const handleSelectResult = useCallback(
    (result: AnySearchResult) => {
      if (search.query.trim()) {
        search.saveSearchToHistory();
      }

      if (result.category === "event") {
        closeSearch();
        setViewingEvent(result.rawEvent);
      } else if (result.category === "note") {
        closeSearch();
        setViewingNote(result.rawNote);
      } else if (result.category === "calendar") {
        setSelectedCalendarId(result.id);
        closeSearch();
        navigate("/calendar");
      } else if (result.category === "festival") {
        const [y, m, d] = result.date.split("-").map(Number);
        if (y && m && d) {
          const target = new Date(y, m - 1, d, 12, 0, 0);
          setVisibleMonth(target);
          setRequestedDate(target);
        }
        closeSearch();
        navigate("/calendar");
      }
    },
    [closeSearch, navigate, search, setRequestedDate, setSelectedCalendarId, setVisibleMonth]
  );

  const handleJumpToDate = useCallback(
    (dateIso: string, calendarId?: string) => {
      if (search.query.trim()) {
        search.saveSearchToHistory();
      }
      const [y, m, d] = dateIso.split("T")[0].split("-").map(Number);
      if (y && m && d) {
        const target = new Date(y, m - 1, d, 12, 0, 0);
        if (calendarId) {
          setSelectedCalendarId(calendarId);
        }
        setVisibleMonth(target);
        setRequestedDate(target);
      }
      closeSearch();
      navigate("/calendar");
    },
    [closeSearch, navigate, search, setRequestedDate, setSelectedCalendarId, setVisibleMonth]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeSearch();
      return;
    }

    if (!search.shouldSearch || flatResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % flatResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === "Enter") {
      const selected = flatResults[activeIndex];
      if (selected) {
        e.preventDefault();
        handleSelectResult(selected);
      }
    }
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/25 p-4 pt-14 backdrop-blur-[2px] sm:pt-20"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.16 }}
            role="dialog"
            aria-modal="true"
            aria-label="Global Search"
            onKeyDown={handleKeyDown}
          >
            <button
              type="button"
              className="absolute inset-0 cursor-default"
              onClick={closeSearch}
              aria-label="Close search overlay"
              tabIndex={-1}
            />

            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="relative z-10 flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl"
            >
              {/* Search Input Header */}
              <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search.query}
                  onChange={(e) => search.setQuery(e.target.value)}
                  placeholder="Search events, notes, locations, dates, calendars..."
                  aria-label="Search Doodo life archive"
                  aria-activedescendant={
                    search.shouldSearch && flatResults.length > 0
                      ? `search-result-${activeIndex}`
                      : undefined
                  }
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                {search.query && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => search.setQuery("")}
                    aria-label="Clear search query"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
                <kbd className="hidden rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground sm:inline-block">
                  ESC
                </kbd>
              </div>

              {/* Filters Bar */}
              <div className="border-b border-border/50 bg-muted/20 px-4 py-2.5">
                <SearchFiltersBar
                  compact
                  category={search.category}
                  onChangeCategory={search.setCategory}
                  timeHorizon={search.timeHorizon}
                  onChangeTimeHorizon={search.setTimeHorizon}
                  calendarId={search.calendarId}
                  onChangeCalendar={search.setCalendarId}
                  customStartDate={search.customStartDate}
                  customEndDate={search.customEndDate}
                  onSetCustomRange={(s, e) => {
                    search.setCustomStartDate(s);
                    search.setCustomEndDate(e);
                  }}
                  onResetFilters={search.resetFilters}
                  hasActiveFilter={search.hasActiveFilter}
                />
              </div>

              {/* Results or Suggestions Body */}
              <div className="flex-1 overflow-y-auto p-4">
                {search.shouldSearch ? (
                  <SearchResultsList
                    query={search.debouncedQuery}
                    results={search.results}
                    isLoading={search.isSearching}
                    error={search.searchError}
                    activeIndex={activeIndex}
                    onSelectResult={handleSelectResult}
                    onJumpToDate={handleJumpToDate}
                    onLoadMore={search.loadMore}
                    onResetFilters={search.resetFilters}
                  />
                ) : (
                  <SearchSuggestions
                    recentSearches={search.recentSearches}
                    suggestions={search.suggestions}
                    isLoading={search.suggestionsLoading}
                    onSelectRecentSearch={(term) => search.setQuery(term)}
                    onRemoveRecentSearch={search.removeRecentSearch}
                    onClearRecentSearches={search.clearRecentSearches}
                    onSelectEvent={(evt) => {
                      closeSearch();
                      setViewingEvent(evt.rawEvent);
                    }}
                    onSelectNote={(note) => {
                      closeSearch();
                      setViewingNote(note.rawNote);
                    }}
                  />
                )}
              </div>

              {/* Footer Keyboard Hints */}
              <div className="hidden items-center justify-between border-t border-border/50 bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground sm:flex">
                <div className="flex items-center gap-3">
                  <span>
                    <kbd className="rounded border border-border bg-background px-1">↑</kbd>{" "}
                    <kbd className="rounded border border-border bg-background px-1">↓</kbd> to navigate
                  </span>
                  <span>
                    <kbd className="rounded border border-border bg-background px-1">↵</kbd> to open
                  </span>
                </div>
                <span>Works offline</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Details & Edit Modals */}
      <EventDetailsModal
        event={viewingEvent}
        onClose={() => setViewingEvent(null)}
        onEdit={(evt) => {
          setViewingEvent(null);
          setEditingEvent(evt);
        }}
        onDelete={async (id) => {
          await deleteEvent(id);
          search.invalidate();
        }}
      />

      <EventModalDialog
        open={Boolean(editingEvent)}
        title="Edit Event"
        onClose={() => setEditingEvent(null)}
      >
        {editingEvent && (
          <EventForm
            eventId={editingEvent.id}
            initialValues={{
              calendarId: editingEvent.calendarId,
              title: editingEvent.title,
              description: editingEvent.description,
              emoji: editingEvent.emoji,
              highlightColor: editingEvent.highlightColor,
              highlightStyle: editingEvent.highlightStyle,
              startAt: editingEvent.startAt,
              endAt: editingEvent.endAt,
              isAllDay: editingEvent.isAllDay,
              location: editingEvent.location,
              priority: editingEvent.priority,
              recurrenceRule: editingEvent.recurrenceRule || "none",
              recurrenceEnd: editingEvent.recurrenceEnd,
            }}
            submitLabel="Save Changes"
            onSubmit={async (values) => {
              await updateEvent(editingEvent.id, values);
              setEditingEvent(null);
              search.invalidate();
            }}
            onCancel={() => setEditingEvent(null)}
          />
        )}
      </EventModalDialog>

      {/* Note Details & Edit Modals */}
      <NoteDetailModal
        note={viewingNote}
        onClose={() => setViewingNote(null)}
        onEdit={(n) => {
          setViewingNote(null);
          setEditingNote(n);
        }}
        onDelete={async (id) => {
          await deleteNote(id);
          search.invalidate();
        }}
      />

      <NoteEditorModal
        open={Boolean(editingNote)}
        note={editingNote}
        onSave={async (values) => {
          if (!editingNote) return;
          await updateNote(editingNote.id, values);
          setEditingNote(null);
          search.invalidate();
        }}
        onClose={() => setEditingNote(null)}
      />
    </>
  );
}
