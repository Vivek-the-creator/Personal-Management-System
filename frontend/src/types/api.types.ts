export interface ApiResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
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

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}
