import { Check, EyeOff, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarWorkspace } from "@/types";
import { getCalendarColor } from "./calendar-style";

interface CalendarBadgeProps {
  calendar: CalendarWorkspace;
  selected?: boolean;
  compact?: boolean;
}

export function CalendarBadge({ calendar, selected = false, compact = false }: CalendarBadgeProps) {
  const color = getCalendarColor(calendar.color);

  return (
    <span className="flex min-w-0 items-center gap-2">
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-full text-sm",
          compact ? "h-7 w-7" : "h-8 w-8",
          color.softClass
        )}
      >
        <span className="text-base leading-none">{calendar.emoji}</span>
      </span>
      <span className="min-w-0">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-sm font-medium text-foreground">{calendar.name}</span>
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: color.swatch }}
            aria-hidden="true"
          />
          {calendar.isDefault && <Star className="h-3.5 w-3.5 shrink-0 fill-current text-amber-500" />}
          {!calendar.isVisible && <EyeOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        </span>
        {!compact && calendar.description && (
          <span className="block truncate text-xs text-muted-foreground">
            {calendar.description}
          </span>
        )}
      </span>
      {selected && <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />}
    </span>
  );
}
