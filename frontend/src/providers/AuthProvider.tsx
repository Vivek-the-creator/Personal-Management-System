import { useEffect, type ReactNode } from "react";
import { useUserStore } from "@/store";
import { getMe } from "@/services/user.service";
import { refreshSession } from "@/services/auth.service";
import { setAccessToken } from "@/lib/api-client";

function SessionHydrator() {
  const { isAuthenticated, setUser, logout } = useUserStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    async function rehydrate() {
      const newToken = await refreshSession();

      if (!newToken) {
        if (!cancelled) logout();
        return;
      }

      setAccessToken(newToken);

      try {
        const user = await getMe();
        if (!cancelled) {
          setUser(
            {
              id: user.id,
              email: user.email,
              name: user.name,
              avatarUrl: user.avatarUrl,
              createdAt: user.createdAt,
            },
            newToken
          );
        }
      } catch {
        if (!cancelled) logout();
      }
    }

    rehydrate();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <>
      <SessionHydrator />
      {children}
    </>
  );
}
