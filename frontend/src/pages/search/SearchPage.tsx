import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EventDetailsModal } from "@/components/events/EventDetailsModal";
import { EventForm } from "@/components/events/EventForm";
import { EventModalDialog } from "@/components/events/EventModalDialog";
import { NoteDetailModal } from "@/components/notes/NoteDetailModal";
import { NoteEditorModal } from "@/components/notes/NoteEditorModal";
import {
  SearchFiltersBar,
  SearchResultsList,
  SearchSuggestions,
} from "@/components/search";
import { Button } from "@/components/ui/button";
import {
  useDocumentTitle,
  useEvents,
  useGlobalSearch,
  useNotes,
} from "@/hooks";
import { useCalendarStore, useCalendarWorkspaceStore } from "@/store";
import type { EventItem, NoteItem } from "@/types";
import type { AnySearchResult } from "@/types/search.types";

export function SearchPage() {
  useDocumentTitle("Search — Doodo");
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedGlobalCalendarId = useCalendarWorkspaceStore(
    (state) => state.selectedCalendarId
  );
  const setSelectedCalendarId = useCalendarWorkspaceStore(
    (state) => state.setSelectedCalendarId
  );
  const setVisibleMonth = useCalendarStore((state) => state.setVisibleMonth);
  const setRequestedDate = useCalendarStore((state) => state.setRequestedDate);

  const search = useGlobalSearch(selectedGlobalCalendarId);
  const { updateEvent, deleteEvent } = useEvents();
  const { updateNote, deleteNote } = useNotes();

  const [activeIndex, setActiveIndex] = useState(0);

  // Detail/Edit modals
  const [viewingEvent, setViewingEvent] = useState<EventItem | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [viewingNote, setViewingNote] = useState<NoteItem | null>(null);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);

  // Sync calendar filter when global calendar changes
  useEffect(() => {
    search.setCalendarId(selectedGlobalCalendarId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGlobalCalendarId]);

  const flatResults = useMemo<AnySearchResult[]>(() => {
    if (!search.results) return [];
    return [
      ...search.results.events,
      ...search.results.notes,
      ...search.results.calendars,
      ...search.results.festivals,
    ];
  }, [search.results]);

  useEffect(() => {
    setActiveIndex(0);
  }, [flatResults.length, search.debouncedQuery]);

  const handleSelectResult = useCallback(
    (result: AnySearchResult) => {
      if (search.query.trim()) {
        search.saveSearchToHistory();
      }

      if (result.category === "event") {
        setViewingEvent(result.rawEvent);
      } else if (result.category === "note") {
        setViewingNote(result.rawNote);
      } else if (result.category === "calendar") {
        setSelectedCalendarId(result.id);
        navigate("/calendar");
      } else if (result.category === "festival") {
        const [y, m, d] = result.date.split("-").map(Number);
        if (y && m && d) {
          const target = new Date(y, m - 1, d, 12, 0, 0);
          setVisibleMonth(target);
          setRequestedDate(target);
        }
        navigate("/calendar");
      }
    },
    [navigate, search, setRequestedDate, setSelectedCalendarId, setVisibleMonth]
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
      navigate("/calendar");
    },
    [navigate, search, setRequestedDate, setSelectedCalendarId, setVisibleMonth]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
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
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mx-auto max-w-3xl space-y-4"
      onKeyDown={handleKeyDown}
    >
      {/* Search Header Card */}
      <div className="space-y-3 rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              Search Life Archive
            </h1>
            <p className="text-xs text-muted-foreground">
              Events, diary notes, locations, and calendars — offline &amp; instant.
            </p>
          </div>
          {search.results && search.shouldSearch && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {search.results.totalCount}{" "}
              {search.results.totalCount === 1 ? "match" : "matches"}
            </span>
          )}
        </div>

        {/* Large Touch-Friendly Search Input */}
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="search"
            value={search.query}
            onChange={(e) => search.setQuery(e.target.value)}
            placeholder="Search events, notes, places, dates..."
            aria-label="Search life archive"
            className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {search.query && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => search.setQuery("")}
              aria-label="Clear search"
              className="absolute right-1.5 h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filters */}
        <SearchFiltersBar
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

      {/* Results / Suggestions Container */}
      <div className="rounded-2xl border border-border/60 bg-card/50 p-4">
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
            onSelectEvent={(evt) => setViewingEvent(evt.rawEvent)}
            onSelectNote={(note) => setViewingNote(note.rawNote)}
          />
        )}
      </div>

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
    </motion.div>
  );
}
