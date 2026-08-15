import type { ApiResponse } from "../types/api.types";

export function createResponse<T>(
  success: boolean,
  message: string,
  data?: T,
  error?: string
): ApiResponse<T> {
  return { success, message, ...(data !== undefined && { data }), ...(error && { error }) };
}
