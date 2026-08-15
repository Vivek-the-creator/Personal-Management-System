import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants";
import { useUserStore, useThemeStore } from "@/store";
import { loginService, registerService, logout as logoutService } from "@/services/auth.service";
import type { LoginCredentials, RegisterCredentials, User } from "@/types";

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, setLoading, logout: clearStore } =
    useUserStore();
  const setTheme = useThemeStore((s) => s.setTheme);
  const navigate = useNavigate();

  const handleAuthSuccess = useCallback(
    ({ accessToken, user: userDTO, settings }: Awaited<ReturnType<typeof loginService>>) => {
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

      navigate(ROUTES.CALENDAR, { replace: true });
    },
    [navigate, setUser, setTheme]
  );

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      setLoading(true);
      try {
        const authData = await loginService(credentials);
        handleAuthSuccess(authData);
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
        handleAuthSuccess(authData);
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
      clearStore();
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }, [clearStore, navigate]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };
}
