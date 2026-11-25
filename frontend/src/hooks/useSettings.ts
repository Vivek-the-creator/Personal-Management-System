import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserStore, useThemeStore } from "@/store";
import { settingsRepository } from "@/db/repositories/settingsRepository";
import { syncRepository } from "@/db/repositories/syncRepository";
import { syncEngine } from "@/sync";
import type { SettingsDTO } from "@/types";
import type { LocalSettings } from "@/db";

const SETTINGS_KEY = ["settings"] as const;

export function useSettings() {
  const user = useUserStore((state) => state.user);
  const { setTheme } = useThemeStore();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: async () => {
      if (!user?.id) return null;
      let settings = await settingsRepository.get(user.id);

      if (!settings) {
        // Default settings
        const now = new Date().toISOString();
        const defaultSettings: LocalSettings = {
          userId: user.id,
          theme: "system",
          language: "en",
          dateFormat: "MM/DD/YYYY",
          timeFormat: "12h",
          weekStartsOn: 0,
          notificationsEnabled: true,
          localUpdatedAt: now,
          serverUpdatedAt: null,
          syncStatus: "synced",
        };
        await settingsRepository.upsert(defaultSettings);
        settings = defaultSettings;
      }

      if (settings.theme) {
        setTheme(settings.theme as "light" | "dark" | "system");
      }

      const dto: SettingsDTO = {
        theme: settings.theme,
        language: settings.language,
        dateFormat: settings.dateFormat,
        timeFormat: settings.timeFormat,
        weekStartsOn: settings.weekStartsOn,
        notificationsEnabled: settings.notificationsEnabled,
      };

      return dto;
    },
    enabled: !!user?.id,
  });

  const mutation = useMutation({
    mutationFn: async (partial: Partial<SettingsDTO>) => {
      if (!user?.id) throw new Error("Not authenticated");

      const existing = await settingsRepository.get(user.id);
      const now = new Date().toISOString();

      const updated: LocalSettings = {
        userId: user.id,
        theme: partial.theme ?? existing?.theme ?? "system",
        language: partial.language ?? existing?.language ?? "en",
        dateFormat: partial.dateFormat ?? existing?.dateFormat ?? "MM/DD/YYYY",
        timeFormat: partial.timeFormat ?? existing?.timeFormat ?? "12h",
        weekStartsOn: partial.weekStartsOn ?? existing?.weekStartsOn ?? 0,
        notificationsEnabled: partial.notificationsEnabled ?? existing?.notificationsEnabled ?? true,
        localUpdatedAt: now,
        serverUpdatedAt: existing?.serverUpdatedAt ?? null,
        syncStatus: "pending",
      };

      // 1. Save to IndexedDB immediately
      await settingsRepository.upsert(updated);

      // 2. Queue sync operation
      await syncRepository.enqueue({
        operationId: crypto.randomUUID(),
        operation: "UPDATE_SETTINGS",
        entityId: user.id,
        payload: partial,
      });

      // 3. Trigger sync
      syncEngine.trigger("update-settings");

      if (updated.theme) {
        setTheme(updated.theme as "light" | "dark" | "system");
      }

      const dto: SettingsDTO = {
        theme: updated.theme,
        language: updated.language,
        dateFormat: updated.dateFormat,
        timeFormat: updated.timeFormat,
        weekStartsOn: updated.weekStartsOn,
        notificationsEnabled: updated.notificationsEnabled,
      };

      return dto;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(SETTINGS_KEY, updated);
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
