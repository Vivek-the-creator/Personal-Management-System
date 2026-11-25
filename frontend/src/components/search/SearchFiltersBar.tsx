import { useState } from "react";
import { ChevronDown, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCalendarWorkspaces } from "@/hooks";
import { cn } from "@/lib/utils";
import type { SearchCategory, SearchTimeHorizon } from "@/types/search.types";

interface SearchFiltersBarProps {
  category: SearchCategory;
  onChangeCategory: (category: SearchCategory) => void;
  timeHorizon: SearchTimeHorizon;
  onChangeTimeHorizon: (horizon: SearchTimeHorizon) => void;
  calendarId: string | null;
  onChangeCalendar: (calendarId: string | null) => void;
  customStartDate?: string;
  customEndDate?: string;
  onSetCustomRange: (start?: string, end?: string) => void;
  onResetFilters: () => void;
  hasActiveFilter: boolean;
  compact?: boolean;
}

export function SearchFiltersBar({
  category,
  onChangeCategory,
  timeHorizon,
  onChangeTimeHorizon,
  calendarId,
  onChangeCalendar,
  customStartDate,
  customEndDate,
  onSetCustomRange,
  onResetFilters,
  hasActiveFilter,
  compact = false,
}: SearchFiltersBarProps) {
  const { visibleCalendars, activeCalendars } = useCalendarWorkspaces();
  const [showRange, setShowRange] = useState(false);
  const [startInput, setStartInput] = useState(customStartDate?.split("T")[0] ?? "");
  const [endInput, setEndInput] = useState(customEndDate?.split("T")[0] ?? "");

  const selectedCalendar = activeCalendars.find((c) => c.id === calendarId);

  const categories: { id: SearchCategory; label: string }[] = [
    { id: "all", label: "All" },
    { id: "events", label: "Events" },
    { id: "notes", label: "Notes" },
    { id: "festivals", label: "Festivals" },
    { id: "calendars", label: "Calendars" },
  ];

  const horizons: { id: SearchTimeHorizon; label: string }[] = [
    { id: "all", label: "Any Time" },
    { id: "past", label: "Past" },
    { id: "today", label: "Today" },
    { id: "upcoming", label: "Upcoming" },
  ];

  function applyRange() {
    onSetCustomRange(
      startInput ? `${startInput}T00:00:00.000Z` : undefined,
      endInput ? `${endInput}T23:59:59.999Z` : undefined
    );
    setShowRange(false);
  }

  function clearRange() {
    setStartInput("");
    setEndInput("");
    onSetCustomRange(undefined, undefined);
    setShowRange(false);
  }

  return (
    <div className="space-y-2">
      <div className={cn("flex flex-wrap items-center gap-2", compact ? "text-xs" : "text-sm")}>
        {/* Category Pills */}
        <div
          className="flex items-center gap-1 rounded-xl bg-muted/60 p-1"
          role="group"
          aria-label="Filter by result type"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onChangeCategory(cat.id)}
              aria-pressed={category === cat.id}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                category === cat.id
                  ? "bg-background font-semibold text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Time Horizon Pills (hidden when filtering strictly by Calendars) */}
        {category !== "calendars" && (
          <div
            className="flex flex-wrap items-center gap-1"
            role="group"
            aria-label="Filter by time horizon"
          >
            {horizons.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => onChangeTimeHorizon(h.id)}
                aria-pressed={timeHorizon === h.id}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  timeHorizon === h.id
                    ? "bg-primary font-semibold text-primary-foreground shadow-xs"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {h.label}
              </button>
            ))}
          </div>
        )}

        {/* Specific Calendar Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 rounded-lg px-2.5 text-xs"
              aria-label="Filter search by calendar"
            >
              {selectedCalendar ? (
                <>
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: selectedCalendar.color }}
                  />
                  <span>{selectedCalendar.emoji}</span>
                  <span className="max-w-[90px] truncate">{selectedCalendar.name}</span>
                </>
              ) : (
                <span>All Calendars</span>
              )}
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 rounded-xl p-1.5">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Calendar Scope
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => onChangeCalendar(null)}
              className={cn(
                "cursor-pointer rounded-lg text-xs",
                !calendarId && "bg-primary/10 font-semibold text-primary"
              )}
            >
              All Calendars
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {visibleCalendars.map((cal) => (
              <DropdownMenuItem
                key={cal.id}
                onClick={() => onChangeCalendar(cal.id)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg text-xs",
                  calendarId === cal.id && "bg-primary/10 font-semibold text-primary"
                )}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: cal.color }}
                />
                <span>{cal.emoji}</span>
                <span className="truncate">{cal.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Custom Date Range Toggle */}
        {category !== "calendars" && (
          <Button
            variant={customStartDate || customEndDate ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowRange((v) => !v)}
            className="h-7 gap-1 rounded-lg px-2 text-xs"
          >
            <SlidersHorizontal className="h-3 w-3" />
            {customStartDate || customEndDate ? "Date Range Active" : "Date Range"}
          </Button>
        )}

        {hasActiveFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-7 gap-1 rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      {showRange && (
        <div className="rounded-xl border border-border/80 bg-background/95 p-3 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold text-foreground">Filter by Date Range</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowRange(false)}
              aria-label="Close date range filter"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">From</label>
              <input
                type="date"
                value={startInput}
                onChange={(e) => setStartInput(e.target.value)}
                className="mt-1 h-8 w-full rounded-md border border-input bg-card px-2.5 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">To</label>
              <input
                type="date"
                value={endInput}
                onChange={(e) => setEndInput(e.target.value)}
                className="mt-1 h-8 w-full rounded-md border border-input bg-card px-2.5 text-xs text-foreground"
              />
            </div>
          </div>
          <div className="mt-2.5 flex justify-end gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearRange}>
              Clear
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={applyRange}>
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
