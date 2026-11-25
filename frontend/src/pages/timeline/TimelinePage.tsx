import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { EventDetailsModal } from "@/components/events/EventDetailsModal";
import { EventForm } from "@/components/events/EventForm";
import { EventModalDialog } from "@/components/events/EventModalDialog";
import { NoteDetailModal } from "@/components/notes/NoteDetailModal";
import { NoteEditorModal } from "@/components/notes/NoteEditorModal";
import {
  TimelineEmptyState,
  TimelineHeader,
  TimelineJumpBar,
  TimelineYearSection,
} from "@/components/timeline";
import { useDocumentTitle, useEvents, useNotes, useTimeline } from "@/hooks";
import type { EventItem, NoteItem } from "@/types";
import type { TimelineEventEntry, TimelineNoteEntry } from "@/types/timeline.types";

export function TimelinePage() {
  useDocumentTitle("Timeline — Doodo");
  const prefersReducedMotion = useReducedMotion();

  const timeline = useTimeline();
  const { updateEvent, deleteEvent } = useEvents();
  const { updateNote, deleteNote } = useNotes();

  // Modal states for events and notes
  const [viewingEvent, setViewingEvent] = useState<EventItem | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

  const [viewingNote, setViewingNote] = useState<NoteItem | null>(null);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);

  const isFiltered =
    Boolean(timeline.selectedCalendarId) ||
    timeline.typeFilter !== "all" ||
    timeline.timeHorizon !== "all" ||
    Boolean(timeline.customStartDate) ||
    Boolean(timeline.customEndDate);

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="space-y-4 max-w-5xl mx-auto"
    >
      {/* Top Controls Header */}
      <TimelineHeader
        selectedCalendarId={timeline.selectedCalendarId}
        onSelectCalendar={timeline.setSelectedCalendarId}
        typeFilter={timeline.typeFilter}
        onChangeTypeFilter={timeline.setTypeFilter}
        timeHorizon={timeline.timeHorizon}
        onChangeTimeHorizon={timeline.setTimeHorizon}
        customStartDate={timeline.customStartDate}
        customEndDate={timeline.customEndDate}
        onSetCustomRange={(start, end) => {
          timeline.setCustomStartDate(start);
          timeline.setCustomEndDate(end);
        }}
        onResetFilters={timeline.resetFilters}
        onJumpToToday={timeline.jumpToToday}
        totalEntries={timeline.totalEntries}
      />

      {/* Quick Jump Bar for Year Navigation */}
      <TimelineJumpBar
        yearsWithData={timeline.yearsWithData}
        visibleYearStart={timeline.visibleYearStart}
        visibleYearEnd={timeline.visibleYearEnd}
        onJumpToYear={timeline.jumpToYear}
        onLoadEarlier={timeline.loadEarlierYears}
        onLoadLater={timeline.loadLaterYears}
        onPrevYear={timeline.goToPrevYear}
        onNextYear={timeline.goToNextYear}
      />

      {/* Main Timeline Stream */}
      {timeline.isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs">Loading life timeline...</span>
          </div>
        </div>
      ) : timeline.yearGroups.length === 0 ? (
        <TimelineEmptyState
          isFiltered={isFiltered}
          onResetFilters={timeline.resetFilters}
        />
      ) : (
        <div className="space-y-6 pt-2">
          {timeline.yearGroups.map((yg) => (
            <TimelineYearSection
              key={yg.year}
              yearGroup={yg}
              onSelectEvent={(entry: TimelineEventEntry) => {
                setViewingEvent(entry.rawEvent);
              }}
              onSelectNote={(entry: TimelineNoteEntry) => {
                setViewingNote(entry.rawNote);
              }}
            />
          ))}
        </div>
      )}

      {/* Event Details Modal */}
      <EventDetailsModal
        event={viewingEvent}
        onClose={() => setViewingEvent(null)}
        onEdit={(evt) => {
          setViewingEvent(null);
          setEditingEvent(evt);
        }}
        onDelete={async (id) => {
          await deleteEvent(id);
          timeline.invalidate();
        }}
      />

      {/* Edit Event Dialog */}
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
              timeline.invalidate();
            }}
            onCancel={() => setEditingEvent(null)}
          />
        )}
      </EventModalDialog>

      {/* Note Detail Modal */}
      <NoteDetailModal
        note={viewingNote}
        onClose={() => setViewingNote(null)}
        onEdit={(n) => {
          setViewingNote(null);
          setEditingNote(n);
        }}
        onDelete={async (id) => {
          await deleteNote(id);
          timeline.invalidate();
        }}
      />

      {/* Edit Note Modal */}
      <NoteEditorModal
        open={Boolean(editingNote)}
        note={editingNote}
        onSave={async (values) => {
          if (!editingNote) return;
          await updateNote(editingNote.id, values);
          setEditingNote(null);
          timeline.invalidate();
        }}
        onClose={() => setEditingNote(null)}
      />
    </motion.div>
  );
}
