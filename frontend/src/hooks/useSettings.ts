import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserStore } from "@/store";
import { useThemeStore } from "@/store";
import { getSettings, updateSettings } from "@/services/user.service";
import type { SettingsDTO } from "@/types";

const SETTINGS_KEY = ["settings"] as const;

/**
 * useSettings — fetches and mutates user settings.
 *
 * On successful fetch, syncs the `theme` field into ThemeStore so the
 * ThemeProvider applies it immediately. This is the bridge between DB-persisted
 * preferences and the in-memory theme system.
 */
export function useSettings() {
  const { isAuthenticated } = useUserStore();
  const { setTheme } = useThemeStore();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: async () => {
      const settings = await getSettings();
      // Sync theme from DB into local ThemeStore
      if (settings.theme) {
        setTheme(settings.theme as "light" | "dark" | "system");
      }
      return settings;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 min — settings change rarely
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: (partial: Partial<SettingsDTO>) => updateSettings(partial),
    onSuccess: (updated) => {
      queryClient.setQueryData(SETTINGS_KEY, updated);
      // Immediately apply theme change locally
      if (updated.theme) {
        setTheme(updated.theme as "light" | "dark" | "system");
      }
    },
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    updateSettings: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}
