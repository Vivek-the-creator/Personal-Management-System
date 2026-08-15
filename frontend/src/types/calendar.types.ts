export type WeekStartsOn = 0 | 1 | 6;

export interface CalendarDay {
  date: Date;
  dateKey: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

export interface CalendarMonth {
  year: number;
  month: number;
  weeks: CalendarDay[][];
  days: CalendarDay[];
}

export interface SelectedDateParts {
  fullDate: string;
  largeDate: string;
  dayName: string;
  monthName: string;
  year: string;
}
