import { useCallback, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { SelectedDatePanel } from "@/components/calendar/SelectedDatePanel";
import { EventDetailsModal } from "@/components/events/EventDetailsModal";
import { EventForm } from "@/components/events/EventForm";
import { EventModalDialog } from "@/components/events/EventModalDialog";
import { NoteDetailModal } from "@/components/notes/NoteDetailModal";
import { NoteEditorModal } from "@/components/notes/NoteEditorModal";
import { useCalendarEngine, useEvents, useNotes } from "@/hooks";
import type { EventFormValues, EventItem, NoteItem } from "@/types";
import { addDays, dateKey } from "@/utils/calendar";

export function MonthCalendar() {
  const { month, weekdayLabels, direction, setVisibleMonth } = useCalendarEngine();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDetailsOpen, setDetailsOpen] = useState(false);

  // Event Modals state
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [viewingEvent, setViewingEvent] = useState<EventItem | null>(null);

  // Note Modals state
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [viewingNote, setViewingNote] = useState<NoteItem | null>(null);

  // Calculate visible date range for month
  const startDateStr = useMemo(
    () => (month.days[0] ? month.days[0].date.toISOString() : undefined),
    [month.days]
  );
  const endDateStr = useMemo(
    () =>
      month.days[month.days.length - 1]
        ? month.days[month.days.length - 1].date.toISOString()
        : undefined,
    [month.days]
  );

  const { events, createEvent, updateEvent, deleteEvent } = useEvents(
    startDateStr,
    endDateStr
  );

  const { notes, createNote, updateNote, deleteNote } = useNotes(
    startDateStr,
    endDateStr
  );

  // Group events by YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map: Record<string, EventItem[]> = {};
    for (const evt of events) {
      const key = dateKey(new Date(evt.startAt));
      if (!map[key]) map[key] = [];
      map[key].push(evt);
    }
    return map;
  }, [events]);

  // Group notes by YYYY-MM-DD
  const notesByDate = useMemo(() => {
    const map: Record<string, NoteItem[]> = {};
    for (const note of notes) {
      const key = dateKey(new Date(note.date));
      if (!map[key]) map[key] = [];
      map[key].push(note);
    }
    return map;
  }, [notes]);

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return eventsByDate[dateKey(selectedDate)] || [];
  }, [eventsByDate, selectedDate]);

  const selectedDateNotes = useMemo(() => {
    if (!selectedDate) return [];
    return notesByDate[dateKey(selectedDate)] || [];
  }, [notesByDate, selectedDate]);

  const selectDate = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      setDetailsOpen(true);
      if (date.getMonth() !== month.month || date.getFullYear() !== month.year) {
        setVisibleMonth(date);
      }
    },
    [month.month, month.year, setVisibleMonth]
  );

  const moveSelection = useCallback(
    (days: number) => {
      const baseDate = selectedDate ?? new Date(month.year, month.month, 1);
      const nextDate = addDays(baseDate, days);
      setSelectedDate(nextDate);
      if (nextDate.getMonth() !== month.month || nextDate.getFullYear() !== month.year) {
        setVisibleMonth(nextDate);
      }
    },
    [month.month, month.year, selectedDate, setVisibleMonth]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const keyActions: Record<string, number> = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -7,
        ArrowDown: 7,
      };

      if (event.key in keyActions) {
        event.preventDefault();
        moveSelection(keyActions[event.key]);
        return;
      }

      if (event.key === "Enter" && selectedDate) {
        event.preventDefault();
        setDetailsOpen(true);
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setDetailsOpen(false);
        setSelectedDate(null);
      }
    },
    [moveSelection, selectedDate]
  );

  async function handleCreateEventSubmit(values: EventFormValues) {
    await createEvent(values);
    setIsCreateEventOpen(false);
  }

  async function handleEditEventSubmit(values: EventFormValues) {
    if (!editingEvent) return;
    await updateEvent(editingEvent.id, values);
    setEditingEvent(null);
  }

  async function handleCreateNoteSave(values: { title?: string; content: string; date: string }) {
    await createNote(values);
  }

  async function handleEditNoteSave(values: { title?: string; content: string; date: string }) {
    if (!editingNote) return;
    await updateNote(editingNote.id, values);
  }

  return (
    <div className="flex min-w-0 gap-4 lg:gap-5">
      <div className="min-w-0 flex-1">
        <CalendarGrid
          month={month}
          weekdayLabels={weekdayLabels}
          direction={direction}
          selectedDate={selectedDate}
          eventsByDate={eventsByDate}
          notesByDate={notesByDate}
          onSelectDate={selectDate}
          onEventClick={(evt) => setViewingEvent(evt)}
          onKeyDown={handleKeyDown}
        />
      </div>

      <SelectedDatePanel
        selectedDate={selectedDate}
        events={selectedDateEvents}
        notes={selectedDateNotes}
        isOpen={isDetailsOpen}
        onClose={() => setDetailsOpen(false)}
        onAddEvent={() => setIsCreateEventOpen(true)}
        onAddNote={() => setIsCreateNoteOpen(true)}
        onEventClick={(evt) => setViewingEvent(evt)}
        onNoteClick={(note) => setViewingNote(note)}
      />

      {/* Create Event Modal */}
      <EventModalDialog
        open={isCreateEventOpen}
        title="Create New Event"
        onClose={() => setIsCreateEventOpen(false)}
      >
        <EventForm
          initialDate={selectedDate}
          onSubmit={handleCreateEventSubmit}
          onCancel={() => setIsCreateEventOpen(false)}
          submitLabel="Create Event"
        />
      </EventModalDialog>

      {/* Edit Event Modal */}
      <EventModalDialog
        open={editingEvent !== null}
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
            onSubmit={handleEditEventSubmit}
            onCancel={() => setEditingEvent(null)}
            submitLabel="Save Changes"
          />
        )}
      </EventModalDialog>

      {/* View Event Details Modal */}
      <EventDetailsModal
        event={viewingEvent}
        onClose={() => setViewingEvent(null)}
        onEdit={(evt) => {
          setViewingEvent(null);
          setEditingEvent(evt);
        }}
        onDelete={async (id) => {
          await deleteEvent(id);
          setViewingEvent(null);
        }}
      />

      {/* Create Note Modal */}
      <NoteEditorModal
        open={isCreateNoteOpen}
        initialDate={selectedDate}
        onSave={handleCreateNoteSave}
        onClose={() => setIsCreateNoteOpen(false)}
      />

      {/* Edit Note Modal */}
      <NoteEditorModal
        open={editingNote !== null}
        note={editingNote}
        onSave={handleEditNoteSave}
        onClose={() => setEditingNote(null)}
      />

      {/* View Note Detail Modal */}
      <NoteDetailModal
        note={viewingNote}
        onClose={() => setViewingNote(null)}
        onEdit={(note) => {
          setViewingNote(null);
          setEditingNote(note);
        }}
        onDelete={async (id) => {
          await deleteNote(id);
          setViewingNote(null);
        }}
      />
    </div>
  );
}
