export type ReminderType =
  | "event_time"
  | "start_of_day"
  | "1_hour_before"
  | "1_day_before"
  | "1_week_before"
  | "custom";

export interface ReminderItem {
  id: string;
  eventId: string;
  type: string;
  scheduledAt: string;
  timezone: string;
  enabled: boolean;
  status: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderBody {
  eventId: string;
  type?: string;
  scheduledAt: string;
  timezone?: string;
  enabled?: boolean;
}

export interface UpdateReminderBody {
  type?: string;
  scheduledAt?: string;
  timezone?: string;
  enabled?: boolean;
  status?: string;
}

export interface ReminderFormConfig {
  notifyMe: boolean;
  type: ReminderType;
  customTime: string; // e.g. "06:00"
  customDate?: string; // e.g. "2026-08-20"
}
