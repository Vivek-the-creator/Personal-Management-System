import { API_BASE_URL } from "@/constants";

/** Structured error thrown by apiClient on non-2xx responses */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
  /** Skip the auth token injection (e.g. for login endpoints) */
  skipAuth?: boolean;
}

// In-memory access token (never persisted to localStorage — XSS safe)
let _accessToken: string | null = null;
let _refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

/**
 * Perform token refresh with a single shared promise to prevent race conditions.
 * If multiple requests trigger a refresh concurrently, all share the same HTTP request.
 */
async function executeRefresh(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include", // sends the httpOnly refresh token cookie
      });
      if (!res.ok) return null;
      const body = await res.json();
      const newToken = body.data?.accessToken as string | null;
      if (newToken) setAccessToken(newToken);
      return newToken;
    } catch {
      return null;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

export async function getOrRefreshToken(): Promise<string | null> {
  if (_accessToken) return _accessToken;
  return executeRefresh();
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, skipAuth = false, ...init } = options;

  const url = new URL(`${API_BASE_URL}${endpoint}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = await getOrRefreshToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    credentials: "include",
    ...init,
    headers,
  });

  // On 401, attempt one synchronized refresh and retry
  if (response.status === 401 && !skipAuth) {
    setAccessToken(null);
    const newToken = await executeRefresh();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      const retry = await fetch(url.toString(), {
        credentials: "include",
        ...init,
        headers,
      });
      if (retry.ok) return retry.json() as Promise<T>;
    }
    throw new ApiError(401, "Session expired. Please log in again.");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      (body as { message?: string }).message ?? `HTTP ${response.status}`,
      body
    );
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { method: "GET", ...options }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),

  delete: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      method: "DELETE",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),
};
