import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants";
import { useUserStore, useThemeStore } from "@/store";
import { loginService, registerService, logout as logoutService } from "@/services/auth.service";
import { syncEngine, runInitialSync } from "@/sync";
import {
  syncRepository,
  calendarRepository,
  eventRepository,
  noteRepository,
} from "@/db/repositories";
import type { LoginCredentials, RegisterCredentials, User } from "@/types";

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, setLoading, logout: clearStore } =
    useUserStore();
  const setTheme = useThemeStore((s) => s.setTheme);
  const navigate = useNavigate();

  const handleAuthSuccess = useCallback(
    async ({ accessToken, user: userDTO, settings }: Awaited<ReturnType<typeof loginService>>) => {
      const mappedUser: User = {
        id: userDTO.id,
        email: userDTO.email,
        name: userDTO.name,
        avatarUrl: userDTO.avatarUrl,
        createdAt: userDTO.createdAt,
      };

      setUser(mappedUser, accessToken);

      if (settings?.theme) {
        setTheme(settings.theme as "light" | "dark" | "system");
      }

      // Sync Setup for newly authenticated user
      syncEngine.setUserId(mappedUser.id);

      const storedUserId = await syncRepository.getSyncedUserId();
      if (storedUserId && storedUserId !== mappedUser.id) {
        await syncRepository.clearAll().catch(() => {});
        await calendarRepository.clearForUser(storedUserId).catch(() => {});
        await eventRepository.clearForUser(storedUserId).catch(() => {});
        await noteRepository.clearForUser(storedUserId).catch(() => {});
      }

      // Download server data into IndexedDB
      await runInitialSync({ userId: mappedUser.id }).catch(() => {});
      syncEngine.trigger("login");

      navigate(ROUTES.CALENDAR, { replace: true });
    },
    [navigate, setUser, setTheme]
  );

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      setLoading(true);
      try {
        const authData = await loginService(credentials);
        await handleAuthSuccess(authData);
      } catch (err) {
        console.error("[Auth] Login failed:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [handleAuthSuccess, setLoading]
  );

  const register = useCallback(
    async (credentials: RegisterCredentials): Promise<void> => {
      setLoading(true);
      try {
        const authData = await registerService(credentials);
        await handleAuthSuccess(authData);
      } catch (err) {
        console.error("[Auth] Registration failed:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [handleAuthSuccess, setLoading]
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutService();
    } catch {
      // Always clear local state even if server call fails
    } finally {
      const currentUserId = user?.id;
      if (currentUserId) {
        await calendarRepository.clearForUser(currentUserId).catch(() => {});
        await eventRepository.clearForUser(currentUserId).catch(() => {});
        await noteRepository.clearForUser(currentUserId).catch(() => {});
      }
      await syncRepository.clearAll().catch(() => {});
      syncEngine.setUserId(null);
      clearStore();
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }, [clearStore, navigate, user?.id]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };
}
