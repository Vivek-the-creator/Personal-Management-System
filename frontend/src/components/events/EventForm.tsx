import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCalendarWorkspaces, usePushNotifications, useReminders } from "@/hooks";
import { cn } from "@/lib/utils";
import type { EventFormValues, HighlightStyle, PriorityLevel, RecurrenceRule, ReminderType } from "@/types";
import { dateKey } from "@/utils/calendar";
import { getDerivedColorStyles } from "@/utils/color-contrast.utils";

const DEFAULT_REMINDER_TIME = "06:00";

const EMOJI_OPTIONS = [
  "🎂", "🎉", "💼", "📚", "🎓", "✈️", "🏖️", "❤️",
  "🔥", "💰", "🏆", "🎮", "🏠", "🚗", "⭐", "🪔", "🎄",
] as const;

const PRESET_COLORS = [
  "#7C3AED", // Violet
  "#0EA5E9", // Sky
  "#2563EB", // Blue
  "#C026D3", // Fuchsia
  "#E11D48", // Rose
  "#DC2626", // Red
  "#EA580C", // Orange
  "#D97706", // Amber
  "#16A34A", // Green
  "#059669", // Emerald
  "#0891B2", // Cyan
  "#64748B", // Slate
] as const;

const HIGHLIGHT_STYLES: { id: HighlightStyle; label: string }[] = [
  { id: "background", label: "Background" },
  { id: "outline", label: "Outline" },
  { id: "top_accent", label: "Top Accent" },
  { id: "bottom_accent", label: "Bottom Accent" },
  { id: "left_accent", label: "Left Accent" },
  { id: "dot", label: "Dot Indicator" },
];

const PRIORITIES: { id: PriorityLevel; label: string }[] = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "urgent", label: "Urgent" },
];

const RECURRENCE_RULES: { id: RecurrenceRule; label: string }[] = [
  { id: "none", label: "Does not repeat" },
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
  { id: "custom", label: "Custom" },
];

const REMINDER_PRESETS: { id: ReminderType; label: string }[] = [
  { id: "start_of_day", label: "6:00 AM on event date" },
  { id: "event_time", label: "At event time" },
  { id: "1_hour_before", label: "1 hour before" },
  { id: "1_day_before", label: "1 day before" },
  { id: "1_week_before", label: "1 week before" },
  { id: "custom", label: "Custom Date/Time" },
];

/**
 * Compute the UTC ISO scheduledAt string from the reminder type, event start, and custom fields.
 */
function computeScheduledAt(
  type: ReminderType,
  eventStartIso: string,
  reminderTime: string, // "HH:MM"
  customReminderDate: string, // "YYYY-MM-DD"
): string {
  const eventStart = new Date(eventStartIso);

  switch (type) {
    case "event_time":
      return eventStart.toISOString();

    case "start_of_day": {
      // Use the event's local date at the chosen time (treated as local)
      const [h, m] = reminderTime.split(":").map(Number);
      const d = new Date(eventStartIso);
      // Build a local datetime string on the event's date
      const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD in UTC
      return new Date(`${dateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`).toISOString();
    }

    case "1_hour_before":
      return new Date(eventStart.getTime() - 60 * 60 * 1000).toISOString();

    case "1_day_before":
      return new Date(eventStart.getTime() - 24 * 60 * 60 * 1000).toISOString();

    case "1_week_before":
      return new Date(eventStart.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    case "custom": {
      return new Date(`${customReminderDate}T${reminderTime}:00`).toISOString();
    }

    default:
      return eventStart.toISOString();
  }
}

interface EventFormProps {
  initialDate?: Date | null;
  initialValues?: Partial<EventFormValues> | null;
  /** If provided, the form is in edit mode and will load + manage the existing reminder */
  eventId?: string;
  onSubmit: (values: EventFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function EventForm({
  initialDate,
  initialValues,
  eventId,
  onSubmit,
  onCancel,
  submitLabel = "Save Event",
}: EventFormProps) {
  const workspace = useCalendarWorkspaces();
  const push = usePushNotifications();
  const defaultCalendarId = workspace.selectedCalendarId || workspace.calendars[0]?.id || "";

  // Load existing reminders when editing
  const { reminders, isFetching: remindersFetching, createReminder, updateReminder, deleteReminder } = useReminders(eventId);

  const defaultDateStr = useMemo(() => {
    const d = initialDate ?? new Date();
    return dateKey(d);
  }, [initialDate]);

  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [calendarId, setCalendarId] = useState(initialValues?.calendarId ?? defaultCalendarId);
  // Extract dates directly from the ISO string (split on 'T') to avoid local-timezone
  // day-shifts: e.g. "2026-08-15T23:59:59.000Z" in IST (+5:30) would become Aug 16 via new Date().
  const [startDate, setStartDate] = useState(
    initialValues?.startAt ? initialValues.startAt.split("T")[0] : defaultDateStr
  );
  const [startTime, setStartTime] = useState(
    initialValues?.startAt && !initialValues.isAllDay
      ? initialValues.startAt.split("T")[1]?.slice(0, 5) ?? "09:00"
      : "09:00"
  );
  const [endDate, setEndDate] = useState(
    initialValues?.endAt ? initialValues.endAt.split("T")[0] : defaultDateStr
  );
  const [endTime, setEndTime] = useState(
    initialValues?.endAt && !initialValues.isAllDay
      ? initialValues.endAt.split("T")[1]?.slice(0, 5) ?? "10:00"
      : "10:00"
  );
  const [isAllDay, setIsAllDay] = useState(initialValues?.isAllDay ?? true);
  const [emoji, setEmoji] = useState<string | undefined>(initialValues?.emoji ?? undefined);
  const [highlightColor, setHighlightColor] = useState(initialValues?.highlightColor ?? "#7C3AED");
  const [highlightStyle, setHighlightStyle] = useState<HighlightStyle>(
    initialValues?.highlightStyle ?? "background"
  );
  const [location, setLocation] = useState(initialValues?.location ?? "");
  const [priority, setPriority] = useState<PriorityLevel>(initialValues?.priority ?? "medium");
  const [recurrenceRule, setRecurrenceRule] = useState<string>(
    initialValues?.recurrenceRule ?? "none"
  );
  const [recurrenceEnd, setRecurrenceEnd] = useState<string>(
    initialValues?.recurrenceEnd ? initialValues.recurrenceEnd.split("T")[0] : ""
  );

  // Reminder state — initialised from the existing reminder (if editing)
  const [reminderInitialised, setReminderInitialised] = useState(!eventId); // for create mode, already ready
  const [notifyMe, setNotifyMe] = useState(false);
  const [reminderType, setReminderType] = useState<ReminderType>("start_of_day");
  const [reminderTime, setReminderTime] = useState(DEFAULT_REMINDER_TIME);
  const [customReminderDate, setCustomReminderDate] = useState(defaultDateStr);

  // Once the existing reminder is fetched, populate reminder fields.
  // IMPORTANT: use isFetching (not isLoading) as the guard.
  // In React Query v5, isLoading = isPending && isFetching. If ANY stale cache exists
  // for this query key (even []), isPending=false → isLoading=false immediately on mount,
  // so the old guard let the effect run with empty data and lock reminderInitialised=true
  // before the real network response arrived.
  // isFetching is true any time a request is in-flight, regardless of cache state.
  useEffect(() => {
    if (!eventId || reminderInitialised || remindersFetching) return;

    // Network request is done — reminders reflects the real server state
    const existing = reminders.find(
      (r) => r.status === "PENDING"
    );

    if (existing && existing.enabled) {
      setNotifyMe(true);
      setReminderType(existing.type as ReminderType);

      // scheduledAt is a UTC ISO string; extract HH:MM in local time for the time input
      const scheduled = new Date(existing.scheduledAt);
      const hh = String(scheduled.getHours()).padStart(2, "0");
      const mm = String(scheduled.getMinutes()).padStart(2, "0");
      setReminderTime(`${hh}:${mm}`);

      if (existing.type === "custom") {
        setCustomReminderDate(existing.scheduledAt.split("T")[0]);
      }
    }
    setReminderInitialised(true);
  }, [reminders, remindersFetching, eventId, reminderInitialised]);

  const [showAdvanced, setShowAdvanced] = useState(
    Boolean(
      initialValues?.description ||
        initialValues?.location ||
        initialValues?.recurrenceRule !== "none" ||
        initialValues?.priority !== "medium"
    )
  );

  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!calendarId && defaultCalendarId) {
      setCalendarId(defaultCalendarId);
    }
  }, [calendarId, defaultCalendarId]);

  async function handleNotifyToggle(checked: boolean) {
    setNotifyMe(checked);
    if (checked) {
      await push.requestPermissionAndSubscribe();
    }
  }

  const previewStyles = useMemo(
    () => getDerivedColorStyles(highlightColor, false),
    [highlightColor]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }
    if (trimmedTitle.length > 150) {
      setError("Title must be 150 characters or fewer.");
      return;
    }
    if (!calendarId) {
      setError("Please select a calendar.");
      return;
    }

    let startIso: string;
    let endIso: string;

    if (isAllDay) {
      startIso = `${startDate}T00:00:00.000Z`;
      endIso = `${endDate}T23:59:59.999Z`;
    } else {
      startIso = new Date(`${startDate}T${startTime}:00`).toISOString();
      endIso = new Date(`${endDate}T${endTime}:00`).toISOString();
    }

    if (new Date(endIso) < new Date(startIso)) {
      setError("End date/time cannot be earlier than start date/time.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      // 1. Save the event first (so we have the event ID for new events)
      await onSubmit({
        calendarId,
        title: trimmedTitle,
        description: description.trim() || undefined,
        emoji: emoji || undefined,
        highlightColor,
        highlightStyle,
        startAt: startIso,
        endAt: endIso,
        isAllDay,
        location: location.trim() || undefined,
        priority,
        recurrenceRule,
        recurrenceEnd: recurrenceEnd ? `${recurrenceEnd}T23:59:59.999Z` : undefined,
      });

      // 2. Manage reminders only when editing an existing event (we have the eventId)
      if (eventId) {
        const existingReminder = reminders[0] ?? null;

        if (notifyMe) {
          const scheduledAt = computeScheduledAt(
            reminderType,
            startIso,
            reminderTime,
            customReminderDate,
          );

          if (existingReminder) {
            // Update the existing reminder
            await updateReminder({
              id: existingReminder.id,
              body: {
                type: reminderType,
                scheduledAt,
                enabled: true,
                // Reset to PENDING so the scheduler picks it up again
                status: "PENDING",
              },
            });
          } else {
            // Create a new reminder for this event
            await createReminder({
              eventId,
              type: reminderType,
              scheduledAt,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              enabled: true,
            });
          }
        } else if (existingReminder) {
          // User turned off notify — delete the reminder
          await deleteReminder(existingReminder.id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save event.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      {/* Title */}
      <div className="grid gap-1.5">
        <Label htmlFor="event-title">Event Title *</Label>
        <Input
          id="event-title"
          value={title}
          maxLength={150}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Birthday Party, Team Sync"
          autoFocus
          required
        />
      </div>

      {/* Emoji Selection */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label>Emoji Icon</Label>
          {emoji && (
            <button
              type="button"
              onClick={() => setEmoji(undefined)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear Emoji
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EMOJI_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setEmoji(emoji === item ? undefined : item)}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-lg border text-base transition hover:bg-accent",
                emoji === item ? "border-primary bg-primary/10" : "border-border/60"
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Date & Time */}
      <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/20 p-3.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="event-allday">All-Day Event</Label>
          <Switch id="event-allday" checked={isAllDay} onCheckedChange={setIsAllDay} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1">
            <Label htmlFor="event-start-date" className="text-xs">Start Date</Label>
            <Input
              id="event-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {!isAllDay && (
            <div className="grid gap-1">
              <Label htmlFor="event-start-time" className="text-xs">Start Time</Label>
              <Input
                id="event-start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1">
            <Label htmlFor="event-end-date" className="text-xs">End Date</Label>
            <Input
              id="event-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {!isAllDay && (
            <div className="grid gap-1">
              <Label htmlFor="event-end-time" className="text-xs">End Time</Label>
              <Input
                id="event-end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Reminder Configuration Section */}
      <div className="grid gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <Label htmlFor="event-reminder" className="font-semibold cursor-pointer">
              Notify Me (Reminder)
            </Label>
          </div>
          <Switch
            id="event-reminder"
            checked={notifyMe}
            onCheckedChange={handleNotifyToggle}
            disabled={!reminderInitialised}
          />
        </div>

        {!reminderInitialised && (
          <p className="text-xs text-muted-foreground">Loading reminder...</p>
        )}

        {notifyMe && reminderInitialised && (
          <div className="grid gap-2.5 pt-1">
            <div className="grid gap-1.5">
              <Label className="text-xs">Reminder Option</Label>
              <select
                value={reminderType}
                onChange={(e) => setReminderType(e.target.value as ReminderType)}
                className="h-9 rounded-md border border-input bg-background px-3 text-xs shadow-xs"
              >
                {REMINDER_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            {reminderType === "start_of_day" && (
              <div className="grid gap-1">
                <Label htmlFor="reminder-time" className="text-xs">Reminder Time (Default: 6:00 AM)</Label>
                <Input
                  id="reminder-time"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            )}

            {reminderType === "custom" && (
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-1">
                  <Label htmlFor="custom-rem-date" className="text-xs">Custom Date</Label>
                  <Input
                    id="custom-rem-date"
                    type="date"
                    value={customReminderDate}
                    onChange={(e) => setCustomReminderDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="custom-rem-time" className="text-xs">Custom Time</Label>
                  <Input
                    id="custom-rem-time"
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            )}

            {!eventId && (
              <p className="text-xs text-amber-500/90">
                💡 Save the event first, then re-open it to set a reminder.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Calendar Workspace Selector */}
      <div className="grid gap-1.5">
        <Label htmlFor="event-calendar">Calendar Workspace</Label>
        <select
          id="event-calendar"
          value={calendarId}
          onChange={(e) => setCalendarId(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {workspace.calendars.map((cal) => (
            <option key={cal.id} value={cal.id}>
              {cal.emoji} {cal.name} {cal.isDefault ? "(Default)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Date Highlight System */}
      <div className="grid gap-3 rounded-xl border border-border/60 p-3.5">
        <div>
          <Label className="text-sm font-semibold">Date Highlight System</Label>
          <p className="text-xs text-muted-foreground">
            Personalize how this event appears on the calendar.
          </p>
        </div>

        {/* Color Presets & Custom HEX */}
        <div className="grid gap-2">
          <Label className="text-xs">Highlight Color</Label>
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESET_COLORS.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => setHighlightColor(hex)}
                className="relative grid h-7 w-7 place-items-center rounded-full border border-border/60 transition hover:scale-105"
                style={{ backgroundColor: hex }}
                aria-label={`Select ${hex}`}
              >
                {highlightColor.toUpperCase() === hex.toUpperCase() && (
                  <Check className="h-3.5 w-3.5 text-white drop-shadow" />
                )}
              </button>
            ))}

            {/* Custom HEX color input */}
            <div className="flex items-center gap-1.5 pl-2">
              <input
                type="color"
                value={highlightColor}
                onChange={(e) => setHighlightColor(e.target.value.toUpperCase())}
                className="h-7 w-7 cursor-pointer overflow-hidden rounded-full border-0 p-0"
                title="Custom color picker"
              />
              <Input
                value={highlightColor}
                maxLength={7}
                onChange={(e) => setHighlightColor(e.target.value)}
                className="h-7 w-24 text-xs font-mono"
                placeholder="#7C3AED"
              />
            </div>
          </div>
        </div>

        {/* Highlight Style Selector */}
        <div className="grid gap-2">
          <Label className="text-xs">Highlight Style</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {HIGHLIGHT_STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setHighlightStyle(style.id)}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition",
                  highlightStyle === style.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 hover:bg-accent"
                )}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="mt-1 rounded-lg border border-border/60 bg-muted/20 p-2.5">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Live Calendar Preview
          </p>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm",
                highlightStyle === "outline" && "border-2",
                highlightStyle === "top_accent" && "border-t-4",
                highlightStyle === "bottom_accent" && "border-b-4",
                highlightStyle === "left_accent" && "border-l-4"
              )}
              style={{
                backgroundColor: highlightStyle === "background" ? previewStyles.softBg : undefined,
                borderColor: highlightStyle !== "background" ? previewStyles.hex : undefined,
                color: previewStyles.textColor,
              }}
            >
              <span>31</span>
              {highlightStyle === "dot" && (
                <span
                  className="absolute bottom-1 h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: previewStyles.hex }}
                />
              )}
            </div>

            <div
              className="flex-1 truncate rounded-md px-2.5 py-1 text-xs font-semibold"
              style={{
                backgroundColor: previewStyles.softBg,
                color: previewStyles.textColor,
                borderLeft: highlightStyle === "left_accent" ? `3px solid ${previewStyles.hex}` : undefined,
              }}
            >
              {emoji || "📅"} {title || "Event Title"}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-left text-xs font-semibold text-primary hover:underline"
      >
        {showAdvanced ? "- Hide Advanced Options" : "+ Show Advanced Options (Location, Recurrence, Priority)"}
      </button>

      {showAdvanced && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="grid gap-4 border-t border-border/60 pt-4"
        >
          {/* Description */}
          <div className="grid gap-1.5">
            <Label htmlFor="event-desc">Description</Label>
            <textarea
              id="event-desc"
              value={description}
              maxLength={1000}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, notes, or agenda..."
              className="min-h-16 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Location */}
          <div className="grid gap-1.5">
            <Label htmlFor="event-location">Location</Label>
            <Input
              id="event-location"
              value={location}
              maxLength={250}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Room 402, Coffee Shop, Zoom"
            />
          </div>

          {/* Priority */}
          <div className="grid gap-1.5">
            <Label>Priority</Label>
            <div className="flex gap-1.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id)}
                  className={cn(
                    "flex-1 rounded-lg border py-1.5 text-xs font-medium transition",
                    priority === p.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 hover:bg-accent"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recurrence */}
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="event-repeat">Repeat</Label>
              <select
                id="event-repeat"
                value={recurrenceRule}
                onChange={(e) => setRecurrenceRule(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
              >
                {RECURRENCE_RULES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {recurrenceRule !== "none" && (
              <div className="grid gap-1.5">
                <Label htmlFor="event-repeat-end">Repeat End Date</Label>
                <Input
                  id="event-repeat-end"
                  type="date"
                  value={recurrenceEnd}
                  onChange={(e) => setRecurrenceEnd(e.target.value)}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}

      {error && <p className="text-xs font-medium text-destructive">{error}</p>}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
