import { apiClient } from "@/lib/api-client";
import type { ApiResponse, AuthResponseDTO, LoginCredentials, RegisterCredentials } from "@/types";

export async function loginService(credentials: LoginCredentials): Promise<AuthResponseDTO> {
  const res = await apiClient.post<ApiResponse<AuthResponseDTO>>(
    "/auth/login",
    credentials,
    { skipAuth: true }
  );
  if (!res.data) throw new Error("Empty auth response");
  return res.data;
}

export async function registerService(credentials: RegisterCredentials): Promise<AuthResponseDTO> {
  const res = await apiClient.post<ApiResponse<AuthResponseDTO>>(
    "/auth/register",
    credentials,
    { skipAuth: true }
  );
  if (!res.data) throw new Error("Empty auth response");
  return res.data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout", undefined, { skipAuth: true });
}

export async function refreshSession(): Promise<string | null> {
  try {
    const res = await apiClient.post<ApiResponse<{ accessToken: string }>>(
      "/auth/refresh",
      undefined,
      { skipAuth: true }
    );
    return res.data?.accessToken ?? null;
  } catch {
    return null;
  }
}
