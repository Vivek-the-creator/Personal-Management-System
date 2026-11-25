import { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";
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
import type { TimelineFilterType, TimelineTimeHorizon } from "@/types/timeline.types";

interface TimelineHeaderProps {
  selectedCalendarId: string | null;
  onSelectCalendar: (calendarId: string | null) => void;
  typeFilter: TimelineFilterType;
  onChangeTypeFilter: (filter: TimelineFilterType) => void;
  timeHorizon: TimelineTimeHorizon;
  onChangeTimeHorizon: (horizon: TimelineTimeHorizon) => void;
  customStartDate?: string;
  customEndDate?: string;
  onSetCustomRange: (start?: string, end?: string) => void;
  onResetFilters: () => void;
  onJumpToToday: () => void;
  totalEntries: number;
}

export function TimelineHeader({
  selectedCalendarId,
  onSelectCalendar,
  typeFilter,
  onChangeTypeFilter,
  timeHorizon,
  onChangeTimeHorizon,
  customStartDate,
  customEndDate,
  onSetCustomRange,
  onResetFilters,
  onJumpToToday,
  totalEntries,
}: TimelineHeaderProps) {
  const { visibleCalendars, activeCalendars } = useCalendarWorkspaces();
  const [showCustomRangeModal, setShowCustomRangeModal] = useState(false);
  const [rangeStartInput, setRangeStartInput] = useState(customStartDate || "");
  const [rangeEndInput, setRangeEndInput] = useState(customEndDate || "");

  const selectedCalendar = activeCalendars.find((c) => c.id === selectedCalendarId);
  const isFiltering =
    Boolean(selectedCalendarId) ||
    typeFilter !== "all" ||
    timeHorizon !== "all" ||
    Boolean(customStartDate) ||
    Boolean(customEndDate);

  const typeOptions: { id: TimelineFilterType; label: string }[] = [
    { id: "all", label: "All Items" },
    { id: "events", label: "Events" },
    { id: "notes", label: "Notes" },
  ];

  const horizonOptions: { id: TimelineTimeHorizon; label: string }[] = [
    { id: "all", label: "All Time" },
    { id: "past", label: "Past" },
    { id: "today", label: "Today" },
    { id: "upcoming", label: "Upcoming" },
  ];

  function applyRange() {
    onSetCustomRange(
      rangeStartInput ? `${rangeStartInput}T00:00:00.000Z` : undefined,
      rangeEndInput ? `${rangeEndInput}T23:59:59.999Z` : undefined
    );
    setShowCustomRangeModal(false);
  }

  function clearRange() {
    setRangeStartInput("");
    setRangeEndInput("");
    onSetCustomRange(undefined, undefined);
    setShowCustomRangeModal(false);
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur-sm sm:p-5">
      {/* Top Bar: Title, Calendar Switcher, Jump to Today */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Chronological Timeline
            </h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {totalEntries} {totalEntries === 1 ? "entry" : "entries"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Your personal life archive across past, present, and future.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Calendar Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-xl border-border/80 px-3 font-medium"
                aria-label="Filter by calendar"
              >
                {selectedCalendar ? (
                  <>
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: selectedCalendar.color }}
                    />
                    <span className="text-base leading-none">{selectedCalendar.emoji}</span>
                    <span className="max-w-[120px] truncate">{selectedCalendar.name}</span>
                  </>
                ) : (
                  <>
                    <span className="flex h-2.5 w-2.5 items-center justify-center">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    </span>
                    <span>All Calendars</span>
                  </>
                )}
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5 shadow-lg">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Filter Calendar
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => onSelectCalendar(null)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg py-2 text-sm",
                  !selectedCalendarId && "bg-primary/10 font-semibold text-primary"
                )}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                <span>All Calendars</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {visibleCalendars.map((cal) => (
                <DropdownMenuItem
                  key={cal.id}
                  onClick={() => onSelectCalendar(cal.id)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg py-2 text-sm",
                    selectedCalendarId === cal.id && "bg-primary/10 font-semibold text-primary"
                  )}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cal.color }} />
                  <span className="text-base leading-none">{cal.emoji}</span>
                  <span className="truncate">{cal.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Jump to Today Button */}
          <Button
            variant="default"
            size="sm"
            onClick={onJumpToToday}
            className="h-9 gap-1.5 rounded-xl px-3 font-semibold shadow-sm"
          >
            <CalendarIcon className="h-4 w-4" />
            Today
          </Button>

          {/* Reset Filters (if active) */}
          {isFiltering && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-9 gap-1 rounded-xl px-2 text-xs text-muted-foreground hover:text-foreground"
              title="Reset all filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Filter Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-border/40">
        {/* Type Filters (All | Events | Notes) */}
        <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1">
          {typeOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChangeTypeFilter(opt.id)}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                typeFilter === opt.id
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Time Horizon Pills (All | Past | Today | Upcoming) */}
        <div className="flex flex-wrap items-center gap-1">
          {horizonOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChangeTimeHorizon(opt.id)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
                timeHorizon === opt.id
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}

          {/* Custom Date Range Trigger */}
          <Button
            variant={customStartDate || customEndDate ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowCustomRangeModal(true)}
            className="h-7 rounded-lg px-2 text-xs"
          >
            <SlidersHorizontal className="mr-1 h-3 w-3" />
            {customStartDate || customEndDate ? "Range Active" : "Date Range"}
          </Button>
        </div>
      </div>

      {/* Custom Date Range Popover/Modal */}
      {showCustomRangeModal && (
        <div className="mt-2 rounded-xl border border-border/80 bg-background/95 p-3.5 shadow-md">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold text-foreground">Custom Date Range</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowCustomRangeModal(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">From Date</label>
              <input
                type="date"
                value={rangeStartInput}
                onChange={(e) => setRangeStartInput(e.target.value)}
                className="mt-1 h-8 w-full rounded-md border border-input bg-card px-2.5 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">To Date</label>
              <input
                type="date"
                value={rangeEndInput}
                onChange={(e) => setRangeEndInput(e.target.value)}
                className="mt-1 h-8 w-full rounded-md border border-input bg-card px-2.5 text-xs text-foreground"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearRange}>
              Clear
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={applyRange}>
              Apply Filter
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
