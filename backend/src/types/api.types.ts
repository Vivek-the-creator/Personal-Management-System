export interface ApiResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface HealthCheckData {
  status: string;
  version: string;
  environment: string;
  uptime: number;
}

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface SettingsDTO {
  theme: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  weekStartsOn: number;
  notificationsEnabled: boolean;
}

export interface AuthResponseDTO {
  accessToken: string;
  user: UserDTO;
  settings: SettingsDTO;
}

export interface CalendarDTO {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description?: string;
  isDefault: boolean;
  isVisible: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalendarBody {
  name: string;
  emoji: string;
  color: string;
  description?: string;
  isDefault?: boolean;
}

export interface UpdateCalendarBody {
  name?: string;
  emoji?: string;
  color?: string;
  description?: string;
  isDefault?: boolean;
  isVisible?: boolean;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

export interface UpdateSettingsBody {
  theme?: string;
  language?: string;
  dateFormat?: string;
  timeFormat?: string;
  weekStartsOn?: number;
  notificationsEnabled?: boolean;
}

export interface EventDTO {
  id: string;
  calendarId: string;
  title: string;
  description?: string;
  emoji?: string;
  highlightColor: string;
  highlightStyle: string;
  startAt: string;
  endAt: string;
  isAllDay: boolean;
  location?: string;
  priority: string;
  recurrenceRule?: string;
  recurrenceEnd?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventBody {
  calendarId: string;
  title: string;
  description?: string;
  emoji?: string;
  highlightColor?: string;
  highlightStyle?: string;
  startAt: string;
  endAt: string;
  isAllDay?: boolean;
  location?: string;
  priority?: string;
  recurrenceRule?: string;
  recurrenceEnd?: string;
}

export interface UpdateEventBody {
  calendarId?: string;
  title?: string;
  description?: string;
  emoji?: string;
  highlightColor?: string;
  highlightStyle?: string;
  startAt?: string;
  endAt?: string;
  isAllDay?: boolean;
  location?: string;
  priority?: string;
  recurrenceRule?: string;
  recurrenceEnd?: string;
}

export interface EventFilterParams {
  calendarId?: string;
  startDate?: string;
  endDate?: string;
  includeDeleted?: boolean;
}

export interface NoteDTO {
  id: string;
  calendarId?: string;
  title?: string;
  content: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteBody {
  calendarId?: string;
  title?: string;
  content: string;
  date: string;
}

export interface UpdateNoteBody {
  calendarId?: string;
  title?: string;
  content?: string;
  date?: string;
}

export interface NoteFilterParams {
  calendarId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  includeDeleted?: boolean;
}

export interface ReminderDTO {
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

export interface PushSubscriptionBody {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
}

export interface PushStatusDTO {
  hasSubscription: boolean;
  vapidPublicKey: string;
  subscriptionCount: number;
}
