import { useEffect, type ReactNode } from "react";
import { useUserStore } from "@/store";
import { getMe } from "@/services/user.service";
import { refreshSession } from "@/services/auth.service";
import { setAccessToken } from "@/lib/api-client";
import { syncEngine, runInitialSync } from "@/sync";

function SessionHydrator() {
  const { user, isAuthenticated, setUser } = useUserStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    async function rehydrate() {
      // Offline-safe session hydration:
      // If network is available, try refreshing token & user details.
      // If offline, preserve current local session (do not log out!).
      const newToken = await refreshSession();

      if (newToken) {
        setAccessToken(newToken);
        try {
          const fetchedUser = await getMe();
          if (!cancelled) {
            setUser(
              {
                id: fetchedUser.id,
                email: fetchedUser.email,
                name: fetchedUser.name,
                avatarUrl: fetchedUser.avatarUrl,
                createdAt: fetchedUser.createdAt,
              },
              newToken
            );
          }
        } catch {
          // Ignore network errors during offline rehydration
        }
      }

      if (!cancelled && user?.id) {
        // Init sync engine with current user ID
        syncEngine.setUserId(user.id);
        // Run initial sync (if first time) or trigger incremental sync
        runInitialSync({ userId: user.id })
          .then(() => syncEngine.trigger("session-rehydrate"))
          .catch(() => {});
      }
    }

    rehydrate();
    return () => {
      cancelled = true;
    };
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
