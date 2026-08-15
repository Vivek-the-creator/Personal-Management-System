import type { CalendarDay, CalendarMonth, SelectedDateParts, WeekStartsOn } from "@/types/calendar.types";

export const MONTH_NAMES = [
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
] as const;

export const WEEKDAY_LABELS: Record<WeekStartsOn, string[]> = {
  0: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  1: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  6: ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"],
};

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function previousMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

export function nextMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return dateKey(a) === dateKey(b);
}

export function getWeekOffset(date: Date, weekStartsOn: WeekStartsOn): number {
  return (date.getDay() - weekStartsOn + 7) % 7;
}

export function formatMonthTitle(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatSelectedDate(date: Date): SelectedDateParts {
  return {
    fullDate: formatDateLabel(date),
    largeDate: String(date.getDate()).padStart(2, "0"),
    dayName: new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date),
    monthName: MONTH_NAMES[date.getMonth()],
    year: String(date.getFullYear()),
  };
}

export function generateMonth(monthDate: Date, weekStartsOn: WeekStartsOn): CalendarMonth {
  const current = startOfMonth(monthDate);
  const year = current.getFullYear();
  const month = current.getMonth();
  const today = new Date();
  const firstCell = addDays(current, -getWeekOffset(current, weekStartsOn));
  const days: CalendarDay[] = Array.from({ length: 42 }, (_, index) => {
    const date = addDays(firstCell, index);
    const day = date.getDay();

    return {
      date,
      dateKey: dateKey(date),
      dayOfMonth: date.getDate(),
      isCurrentMonth: date.getMonth() === month && date.getFullYear() === year,
      isToday: isSameDay(date, today),
      isWeekend: day === 0 || day === 6,
    };
  });

  return {
    year,
    month,
    days,
    weeks: Array.from({ length: 6 }, (_, index) => days.slice(index * 7, index * 7 + 7)),
  };
}
