import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  CALENDAR_COLOR_TOKENS,
  CALENDAR_EMOJI_OPTIONS,
  DEFAULT_CALENDAR_COLOR,
  DEFAULT_CALENDAR_EMOJI,
} from "@/constants";
import { cn } from "@/lib/utils";
import type { CalendarFormValues, CalendarWorkspace } from "@/types";

interface CalendarFormProps {
  calendars: CalendarWorkspace[];
  calendar?: CalendarWorkspace | null;
  onSubmit: (values: CalendarFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}

export function CalendarForm({
  calendars,
  calendar,
  onSubmit,
  onCancel,
  submitLabel,
}: CalendarFormProps) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(DEFAULT_CALENDAR_EMOJI);
  const [color, setColor] = useState(DEFAULT_CALENDAR_COLOR);
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setSaving] = useState(false);

  useEffect(() => {
    setName(calendar?.name ?? "");
    setEmoji(calendar?.emoji ?? DEFAULT_CALENDAR_EMOJI);
    setColor(calendar?.color ?? DEFAULT_CALENDAR_COLOR);
    setDescription(calendar?.description ?? "");
    setIsDefault(calendar?.isDefault ?? false);
    setError("");
  }, [calendar]);

  const duplicateName = useMemo(
    () =>
      calendars.some(
        (item) =>
          item.id !== calendar?.id &&
          item.name.trim().toLowerCase() === name.trim().toLowerCase()
      ),
    [calendar?.id, calendars, name]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Name is required.");
      return;
    }
    if (trimmedName.length > 50) {
      setError("Name must be 50 characters or fewer.");
      return;
    }
    if (duplicateName) {
      setError("A calendar with this name already exists.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSubmit({
        name: trimmedName,
        emoji,
        color,
        description: description.trim() || undefined,
        isDefault,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save calendar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="calendar-name">Calendar Name</Label>
        <Input
          id="calendar-name"
          value={name}
          maxLength={50}
          onChange={(event) => setName(event.target.value)}
          placeholder="Life"
          aria-invalid={Boolean(error)}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{duplicateName ? "Name already used" : "Required"}</span>
          <span>{name.length}/50</span>
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Emoji</Label>
        <div className="grid grid-cols-8 gap-2">
          {CALENDAR_EMOJI_OPTIONS.map((option) => (
            <motion.button
              key={option}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => setEmoji(option)}
              className={cn(
                "grid h-9 place-items-center rounded-lg border text-lg transition hover:bg-accent",
                emoji === option ? "border-primary bg-primary/10" : "border-border/60"
              )}
              aria-label={`Use ${option} emoji`}
              aria-pressed={emoji === option}
            >
              {option}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Color</Label>
        <div className="grid grid-cols-8 gap-2">
          {CALENDAR_COLOR_TOKENS.map((token) => (
            <motion.button
              key={token.id}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => setColor(token.id)}
              className="relative grid h-9 place-items-center rounded-lg border border-border/60 transition hover:bg-accent"
              aria-label={`Use ${token.name}`}
              aria-pressed={color === token.id}
            >
              <span
                className="h-5 w-5 rounded-full"
                style={{ backgroundColor: token.swatch }}
                aria-hidden="true"
              />
              {color === token.id && (
                <Check className="absolute h-3.5 w-3.5 text-background" aria-hidden="true" />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="calendar-description">Description</Label>
        <textarea
          id="calendar-description"
          value={description}
          maxLength={240}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional"
          className="min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-3">
        <div>
          <Label htmlFor="calendar-default">Set as Default</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            {calendar?.isDefault
              ? "This is currently your default calendar. Set another calendar as default to change."
              : "New items will prefer this calendar."}
          </p>
        </div>
        <Switch
          id="calendar-default"
          checked={isDefault}
          onCheckedChange={setIsDefault}
          disabled={Boolean(calendar?.isDefault)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving || duplicateName}>
          {isSaving ? "Saving" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
