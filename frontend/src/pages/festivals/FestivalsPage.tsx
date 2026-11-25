import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, Settings2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/app.constants";
import { useDocumentTitle, useFestivals } from "@/hooks";
import { useCalendarStore } from "@/store";
import type { FestivalCategory, FestivalRecord } from "@/types/festival.types";
import { dateKey } from "@/utils/calendar";
import {
  FESTIVAL_CATEGORY_LABELS,
  FESTIVAL_REGION_LABELS,
  formatFestivalDate,
  getUpcomingFestivals,
  parseFestivalDateParts,
} from "@/utils/festival.utils";

const CATEGORY_TABS: Array<{ value: FestivalCategory | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "national", label: "National" },
  { value: "state", label: "State" },
  { value: "hindu", label: "Hindu" },
  { value: "muslim", label: "Muslim" },
  { value: "christian", label: "Christian" },
  { value: "regional", label: "Regional" },
  { value: "international", label: "International" },
];

const MONTH_NAMES = [
  "All Months",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const AVAILABLE_YEARS = [2025, 2026, 2027];

export function FestivalsPage() {
  useDocumentTitle("Festivals & Holidays · Doodo");
  const navigate = useNavigate();
  const setRequestedDate = useCalendarStore((s) => s.setRequestedDate);
  const setVisibleMonth = useCalendarStore((s) => s.setVisibleMonth);

  const todayKey = useMemo(() => dateKey(new Date()), []);
  const currentYear = new Date().getFullYear();
  const initialYear = AVAILABLE_YEARS.includes(currentYear) ? currentYear : 2026;

  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [selectedMonth, setSelectedMonth] = useState<number | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<FestivalCategory | "all">("all");

  // All festivals respecting user settings (for Upcoming section)
  const { festivals: allEnabledFestivals, isLoading } = useFestivals({});

  // Filtered list for the selected year/month/category
  const { festivals: filteredFestivals } = useFestivals({
    year: selectedYear,
    month: selectedMonth === "all" ? undefined : selectedMonth,
    category: selectedCategory,
  });

  const upcomingFestivals = useMemo(
    () => getUpcomingFestivals(allEnabledFestivals, todayKey, 6),
    [allEnabledFestivals, todayKey]
  );

  function handleViewInCalendar(festival: FestivalRecord) {
    const { year, month, day } = parseFestivalDateParts(festival.date);
    const target = new Date(year, month, day, 12, 0, 0);
    setVisibleMonth(target);
    setRequestedDate(target);
    navigate(ROUTES.CALENDAR);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Festivals &amp; Holidays
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Cultural observances, national holidays, and regional celebrations stored offline.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 self-start sm:self-auto"
          onClick={() => navigate(ROUTES.SETTINGS_FESTIVALS)}
        >
          <Settings2 className="h-4 w-4" />
          Festival Settings
        </Button>
      </div>

      {/* Upcoming Festivals */}
      {upcomingFestivals.length > 0 && (
        <section aria-label="Upcoming festivals" className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Upcoming Observances
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingFestivals.map((fest) => (
              <Card
                key={`upcoming-${fest.id}`}
                className="border-amber-500/20 bg-amber-500/5 transition hover:border-amber-500/40"
              >
                <CardContent className="flex flex-col justify-between gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-background text-lg shadow-xs">
                      {fest.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {fest.name}
                      </p>
                      {fest.localizedName && (
                        <p className="truncate text-xs text-muted-foreground">
                          {fest.localizedName}
                        </p>
                      )}
                      <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                        {formatFestivalDate(fest.date)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-full justify-start gap-1.5 text-xs"
                    onClick={() => handleViewInCalendar(fest)}
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    View in Calendar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Browse & Filter Controls */}
      <section aria-label="Browse festivals" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Year selector */}
          <div className="flex items-center gap-1.5">
            {AVAILABLE_YEARS.map((year) => (
              <Button
                key={year}
                size="sm"
                variant={selectedYear === year ? "default" : "outline"}
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </Button>
            ))}
          </div>

          {/* Month selector */}
          <select
            aria-label="Filter by month"
            value={selectedMonth}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedMonth(val === "all" ? "all" : Number(val));
            }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {MONTH_NAMES.map((label, idx) => (
              <option key={label} value={idx === 0 ? "all" : idx - 1}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSelectedCategory(tab.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                selectedCategory === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Festival List */}
        {isLoading ? (
          <div className="rounded-xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
            Loading festivals...
          </div>
        ) : filteredFestivals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/15 p-8 text-center text-sm text-muted-foreground">
            No festivals match the selected filters or current Festival Settings.
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredFestivals.map((fest) => {
              const regions = Array.isArray(fest.region) ? fest.region : [fest.region];
              return (
                <Card key={fest.id} className="border-border/70 bg-card">
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3.5">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-xl">
                        {fest.emoji}
                      </span>
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground">
                            {fest.name}
                          </h3>
                          {fest.localizedName && (
                            <span className="text-xs text-muted-foreground">
                              ({fest.localizedName})
                            </span>
                          )}
                          <span className="rounded-full bg-amber-500/12 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-200">
                            {FESTIVAL_CATEGORY_LABELS[fest.category]}
                          </span>
                          {fest.isEstimate && (
                            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                              Estimated
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-primary">
                          {formatFestivalDate(fest.date)}
                          {" · "}
                          {regions.map((r) => FESTIVAL_REGION_LABELS[r]).join(", ")}
                        </p>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {fest.description}
                        </p>
                        <p className="text-[11px] text-muted-foreground/75">
                          Source: {fest.source}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1.5 self-start sm:self-center"
                      onClick={() => handleViewInCalendar(fest)}
                    >
                      <CalendarIcon className="h-3.5 w-3.5" />
                      View in Calendar
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

