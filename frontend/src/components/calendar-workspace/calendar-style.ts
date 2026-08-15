import { CALENDAR_COLOR_TOKENS, DEFAULT_CALENDAR_COLOR } from "@/constants";

export function getCalendarColor(tokenId: string) {
  return (
    CALENDAR_COLOR_TOKENS.find((token) => token.id === tokenId) ??
    CALENDAR_COLOR_TOKENS.find((token) => token.id === DEFAULT_CALENDAR_COLOR)!
  );
}
