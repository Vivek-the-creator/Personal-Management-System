export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface UserSettings {
  theme: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  weekStartsOn: number;
  notificationsEnabled: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
