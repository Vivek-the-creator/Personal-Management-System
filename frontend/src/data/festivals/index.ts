import type { FestivalRecord } from "@/types/festival.types";
import { INDIA_FESTIVALS_2025 } from "./india-2025";
import { INDIA_FESTIVALS_2026 } from "./india-2026";
import { INDIA_FESTIVALS_2027 } from "./india-2027";

export { INDIA_FESTIVALS_2025, INDIA_FESTIVALS_2026, INDIA_FESTIVALS_2027 };

/**
 * Combined static festival reference dataset.
 * Deduplicated by `id` at export time.
 */
const combined: FestivalRecord[] = [
  ...INDIA_FESTIVALS_2025,
  ...INDIA_FESTIVALS_2026,
  ...INDIA_FESTIVALS_2027,
];

const seen = new Set<string>();
export const ALL_FESTIVALS: FestivalRecord[] = combined.filter((item) => {
  if (seen.has(item.id)) return false;
  seen.add(item.id);
  return true;
});

