import { useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Calculator,
  Calendar as CalendarIcon,
  CalendarClock,
  Clock,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCountdowns, useDateNavigation, useDocumentTitle } from "@/hooks";
import type { DateOperation, DurationUnit } from "@/types/tools.types";
import { dateKey, formatDateLabel } from "@/utils/calendar";
import {
  calculateDateDifference,
  calculateDateOffset,
} from "@/utils/date-calculator.utils";

type ToolsTab = "calculator" | "difference" | "countdown";

const UNIT_OPTIONS: Array<{ value: DurationUnit; label: string }> = [
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
  { value: "years", label: "Years" },
];

export function ToolsPage() {
  useDocumentTitle("Smart Tools · Doodo");
  const { jumpToDate, jumpToToday } = useDateNavigation();
  const { countdowns, milestones, isLoading: countdownsLoading } = useCountdowns();

  const todayStr = useMemo(() => dateKey(new Date()), []);
  const [activeTab, setActiveTab] = useState<ToolsTab>("calculator");

  // Quick Jump state
  const [quickJumpDate, setQuickJumpDate] = useState<string>(todayStr);

  // Date Calculator state
  const [calcStartDate, setCalcStartDate] = useState<string>(todayStr);
  const [calcOperation, setCalcOperation] = useState<DateOperation>("add");
  const [calcAmountRaw, setCalcAmountRaw] = useState<string>("30");
  const [calcUnit, setCalcUnit] = useState<DurationUnit>("days");

  // Date Difference state
  const [diffStartDate, setDiffStartDate] = useState<string>(todayStr);
  const [diffEndDate, setDiffEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return dateKey(d);
  });

  // Countdown filter
  const [countdownFilter, setCountdownFilter] = useState<"all" | "milestones">("all");

  const calcOutcome = useMemo(() => {
    const trimmed = calcAmountRaw.trim();
    if (!trimmed) {
      return { result: null, error: "Enter a number of units." };
    }
    const parsed = Number(trimmed);
    try {
      const result = calculateDateOffset(calcStartDate, parsed, calcUnit, calcOperation);
      return { result, error: null };
    } catch (err) {
      return {
        result: null,
        error: err instanceof Error ? err.message : "Invalid calculation input.",
      };
    }
  }, [calcStartDate, calcAmountRaw, calcUnit, calcOperation]);

  const diffOutcome = useMemo(() => {
    try {
      const result = calculateDateDifference(diffStartDate, diffEndDate);
      return { result, error: null };
    } catch (err) {
      return {
        result: null,
        error: err instanceof Error ? err.message : "Invalid date input.",
      };
    }
  }, [diffStartDate, diffEndDate]);

  const visibleCountdowns =
    countdownFilter === "milestones" ? milestones : countdowns;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      {/* Page Header & Quick Jump */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Smart Tools
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Offline date arithmetic, difference calculations, and upcoming event countdowns.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            aria-label="Quick jump to date"
            value={quickJumpDate}
            onChange={(e) => setQuickJumpDate(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={!quickJumpDate}
            onClick={() => {
              if (quickJumpDate) jumpToDate(quickJumpDate);
            }}
          >
            Jump
          </Button>
          <Button size="sm" variant="secondary" onClick={jumpToToday}>
            Today
          </Button>
        </div>
      </div>

      {/* Focused Tool Tabs */}
      <div
        role="tablist"
        aria-label="Smart tools sections"
        className="grid grid-cols-3 gap-1 rounded-xl border border-border/60 bg-muted/40 p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "calculator"}
          onClick={() => setActiveTab("calculator")}
          className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition sm:text-sm ${
            activeTab === "calculator"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calculator className="h-4 w-4 shrink-0" />
          <span className="truncate">Calculator</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "difference"}
          onClick={() => setActiveTab("difference")}
          className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition sm:text-sm ${
            activeTab === "difference"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarClock className="h-4 w-4 shrink-0" />
          <span className="truncate">Difference</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "countdown"}
          onClick={() => setActiveTab("countdown")}
          className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition sm:text-sm ${
            activeTab === "countdown"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="h-4 w-4 shrink-0" />
          <span className="truncate">Countdowns</span>
        </button>
      </div>

      {/* Tab 1: Date Calculator */}
      {activeTab === "calculator" && (
        <Card className="border-border/70 bg-card">
          <CardHeader>
            <CardTitle className="text-base">Add or Subtract Duration</CardTitle>
            <CardDescription>
              Calculate any future or past date with leap-year and month-end clamping.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="calc-start-date"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Starting Date
                </label>
                <input
                  id="calc-start-date"
                  type="date"
                  value={calcStartDate}
                  onChange={(e) => setCalcStartDate(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs font-medium text-muted-foreground">
                  Operation
                </span>
                <div className="grid grid-cols-2 gap-1 rounded-md border border-input bg-muted/30 p-1">
                  <button
                    type="button"
                    onClick={() => setCalcOperation("add")}
                    className={`rounded py-1.5 text-xs font-medium transition ${
                      calcOperation === "add"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    + Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcOperation("subtract")}
                    className={`rounded py-1.5 text-xs font-medium transition ${
                      calcOperation === "subtract"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    − Subtract
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="calc-amount"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Number of Units
                </label>
                <input
                  id="calc-amount"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={calcAmountRaw}
                  onChange={(e) => setCalcAmountRaw(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="calc-unit"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Unit
                </label>
                <select
                  id="calc-unit"
                  value={calcUnit}
                  onChange={(e) => setCalcUnit(e.target.value as DurationUnit)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {UNIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs text-muted-foreground">Presets:</span>
              {[
                { label: "+7 days", op: "add" as const, amt: "7", unit: "days" as const },
                { label: "+30 days", op: "add" as const, amt: "30", unit: "days" as const },
                { label: "+1 month", op: "add" as const, amt: "1", unit: "months" as const },
                { label: "+1 year", op: "add" as const, amt: "1", unit: "years" as const },
                { label: "−45 days", op: "subtract" as const, amt: "45", unit: "days" as const },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setCalcOperation(preset.op);
                    setCalcAmountRaw(preset.amt);
                    setCalcUnit(preset.unit);
                  }}
                  className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setCalcStartDate(todayStr);
                  setCalcOperation("add");
                  setCalcAmountRaw("30");
                  setCalcUnit("days");
                }}
                className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            </div>

            {/* Result or Validation */}
            {calcOutcome.error ? (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
              >
                {calcOutcome.error}
              </div>
            ) : (
              calcOutcome.result && (
                <div className="rounded-xl border border-primary/25 bg-primary/5 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                        Calculated Date · {calcOutcome.result.dayOfWeek}
                      </p>
                      <p className="text-2xl font-semibold tracking-tight text-foreground">
                        {formatDateLabel(calcOutcome.result.calculatedDate)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {calcOutcome.result.explanation}
                      </p>
                    </div>

                    <Button
                      className="shrink-0 gap-1.5 self-start sm:self-center"
                      onClick={() => jumpToDate(calcOutcome.result!.calculatedDate)}
                    >
                      <CalendarIcon className="h-4 w-4" />
                      Open in Calendar
                    </Button>
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Date Difference */}
      {activeTab === "difference" && (
        <Card className="border-border/70 bg-card">
          <CardHeader>
            <CardTitle className="text-base">Date Difference</CardTitle>
            <CardDescription>
              Compare two dates with exclusive and inclusive day counts, weeks, and calendar breakdown.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
              <div className="space-y-1.5">
                <label
                  htmlFor="diff-start"
                  className="text-xs font-medium text-muted-foreground"
                >
                  First Date
                </label>
                <input
                  id="diff-start"
                  type="date"
                  value={diffStartDate}
                  onChange={(e) => setDiffStartDate(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Swap dates"
                onClick={() => {
                  setDiffStartDate(diffEndDate);
                  setDiffEndDate(diffStartDate);
                }}
                className="mx-auto"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>

              <div className="space-y-1.5">
                <label
                  htmlFor="diff-end"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Second Date
                </label>
                <input
                  id="diff-end"
                  type="date"
                  value={diffEndDate}
                  onChange={(e) => setDiffEndDate(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            {diffOutcome.error ? (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
              >
                {diffOutcome.error}
              </div>
            ) : (
              diffOutcome.result && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-border/70 bg-background p-3.5">
                      <p className="text-xs text-muted-foreground">Exclusive Days</p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">
                        {diffOutcome.result.exclusiveDays}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        End − Start
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-background p-3.5">
                      <p className="text-xs text-muted-foreground">Inclusive Days</p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">
                        {diffOutcome.result.inclusiveDays}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Includes both endpoints
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-background p-3.5">
                      <p className="text-xs text-muted-foreground">Weeks &amp; Days</p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">
                        {diffOutcome.result.weeks}w {diffOutcome.result.remainingDays}d
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        7-day weeks
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-background p-3.5">
                      <p className="text-xs text-muted-foreground">Calendar Span</p>
                      <p className="mt-1 text-lg font-semibold text-foreground">
                        {diffOutcome.result.years}y {diffOutcome.result.months}m{" "}
                        {diffOutcome.result.days}d
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Exact calendar breakdown
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-foreground">
                      {diffOutcome.result.explanation}
                    </p>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => jumpToDate(diffOutcome.result!.startDate)}
                      >
                        Open Start
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => jumpToDate(diffOutcome.result!.endDate)}
                      >
                        Open End
                      </Button>
                    </div>
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Event Countdown */}
      {activeTab === "countdown" && (
        <Card className="border-border/70 bg-card">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Upcoming Event Countdowns</CardTitle>
              <CardDescription>
                Live countdowns from your local events and recurring milestones.
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant={countdownFilter === "all" ? "default" : "outline"}
                onClick={() => setCountdownFilter("all")}
              >
                All ({countdowns.length})
              </Button>
              <Button
                size="sm"
                variant={countdownFilter === "milestones" ? "default" : "outline"}
                onClick={() => setCountdownFilter("milestones")}
              >
                Birthdays &amp; Anniversaries ({milestones.length})
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {countdownsLoading ? (
              <div className="rounded-xl border border-border/60 p-8 text-center text-sm text-muted-foreground">
                Loading upcoming events...
              </div>
            ) : visibleCountdowns.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/15 p-8 text-center text-sm text-muted-foreground">
                No upcoming events found. Create an event on your Calendar to track its countdown here.
              </div>
            ) : (
              <div className="grid gap-2.5">
                {visibleCountdowns.map((item) => {
                  const statusLabel =
                    item.status === "today"
                      ? "Today"
                      : item.status === "tomorrow"
                        ? "Tomorrow"
                        : `${item.daysRemaining} days left`;

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background/80 p-3.5 transition hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border/60 bg-card text-lg">
                          {item.emoji}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {item.title}
                            </p>
                            {item.isRecurring && (
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                Recurring
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatDateLabel(item.targetDate)}</span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: item.calendarColor }}
                              />
                              {item.calendarEmoji} {item.calendarName}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.status === "today"
                              ? "bg-primary text-primary-foreground"
                              : item.status === "tomorrow"
                                ? "bg-amber-500/15 text-amber-800 dark:text-amber-200"
                                : "bg-muted text-foreground"
                          }`}
                        >
                          {statusLabel}
                        </span>

                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => jumpToDate(item.targetDate, item.calendarId)}
                        >
                          <CalendarIcon className="h-3.5 w-3.5" />
                          Open
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
