import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setAccessToken } from "@/lib/api-client";
import type { User } from "@/types";

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Set authenticated user + in-memory access token */
  setUser: (user: User | null, accessToken?: string) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user, accessToken) => {
        // Keep access token in memory only (not persisted)
        if (accessToken) setAccessToken(accessToken);
        set({ user, isAuthenticated: !!user });
      },

      setLoading: (isLoading) => set({ isLoading }),

      logout: () => {
        setAccessToken(null);
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "pms-user",
      // Only persist user identity — access token NEVER goes to localStorage
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
