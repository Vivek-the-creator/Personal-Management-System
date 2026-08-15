import { apiClient } from "@/lib/api-client";
import type { ApiResponse, UserDTO, SettingsDTO } from "@/types";

export async function getMe(): Promise<UserDTO> {
  const res = await apiClient.get<ApiResponse<UserDTO>>("/me");
  if (!res.data) throw new Error("Empty user response");
  return res.data;
}

export async function getSettings(): Promise<SettingsDTO> {
  const res = await apiClient.get<ApiResponse<SettingsDTO>>("/settings");
  if (!res.data) throw new Error("Empty settings response");
  return res.data;
}

export async function updateSettings(
  partial: Partial<SettingsDTO>
): Promise<SettingsDTO> {
  const res = await apiClient.put<ApiResponse<SettingsDTO>>("/settings", partial);
  if (!res.data) throw new Error("Empty settings response");
  return res.data;
}
