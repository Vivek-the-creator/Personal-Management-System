export type DurationUnit = "days" | "weeks" | "months" | "years";
export type DateOperation = "add" | "subtract";

export interface DateCalculationResult {
  originalDate: Date;
  originalDateKey: string;
  calculatedDate: Date;
  calculatedDateKey: string;
  dayOfWeek: string;
  operation: DateOperation;
  amount: number;
  unit: DurationUnit;
  explanation: string;
  wasMonthEndClamped: boolean;
}

export interface DateDifferenceResult {
  startDate: Date;
  endDate: Date;
  startDateKey: string;
  endDateKey: string;
  isReversed: boolean;
  exclusiveDays: number;
  inclusiveDays: number;
  weeks: number;
  remainingDays: number;
  years: number;
  months: number;
  days: number;
  explanation: string;
}

export type CountdownStatus = "today" | "tomorrow" | "upcoming";

export interface CountdownItem {
  id: string;
  eventId: string;
  title: string;
  emoji: string;
  targetDate: Date;
  targetDateKey: string;
  daysRemaining: number;
  status: CountdownStatus;
  calendarId: string;
  calendarName: string;
  calendarColor: string;
  calendarEmoji: string;
  isRecurring: boolean;
  isBirthdayOrAnniversary: boolean;
}
