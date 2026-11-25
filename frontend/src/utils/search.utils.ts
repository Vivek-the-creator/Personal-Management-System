/**
 * Escapes special RegExp characters so user queries with symbols
 * (e.g. "C++", "50%", "(draft)", "$100") never throw or misbehave.
 */
export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Normalizes text for case-insensitive, diacritic-insensitive,
 * whitespace-normalized search matching.
 */
export function normalizeSearchText(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Splits a raw search query into unique normalized tokens.
 */
export function tokenizeQuery(query: string): string[] {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];
  const parts = normalized.split(" ").filter(Boolean);
  return Array.from(new Set(parts));
}

/**
 * Returns true if every token in `tokens` appears in at least one of the provided fields.
 */
export function matchesAllTokens(
  fields: (string | undefined | null)[],
  tokens: string[]
): boolean {
  if (tokens.length === 0) return true;
  const combined = normalizeSearchText(fields.filter(Boolean).join(" "));
  if (!combined) return false;
  return tokens.every((token) => combined.includes(token));
}

/**
 * Computes a simple relevance score so title/name matches rank above body/date matches.
 */
export function computeRelevanceScore(
  primaryText: string | undefined,
  secondaryFields: (string | undefined)[],
  tokens: string[]
): number {
  if (tokens.length === 0) return 0;
  const normPrimary = normalizeSearchText(primaryText || "");
  const normSecondary = normalizeSearchText(secondaryFields.filter(Boolean).join(" "));
  const fullQuery = tokens.join(" ");

  let score = 0;
  if (normPrimary === fullQuery) score += 100;
  else if (normPrimary.startsWith(fullQuery)) score += 60;
  else if (normPrimary.includes(fullQuery)) score += 40;

  for (const token of tokens) {
    if (normPrimary.includes(token)) score += 20;
    if (normSecondary.includes(token)) score += 5;
  }

  return score;
}

/**
 * Extracts a contextual plain-text snippet centered around the first matching token.
 */
export function extractSnippet(
  plainText: string,
  tokens: string[],
  maxLength = 130
): string {
  if (!plainText) return "";
  const cleaned = plainText.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;

  if (tokens.length === 0) {
    return `${cleaned.slice(0, maxLength - 1).trimEnd()}…`;
  }

  const normalized = normalizeSearchText(cleaned);
  let firstMatchIdx = -1;
  for (const token of tokens) {
    const idx = normalized.indexOf(token);
    if (idx !== -1 && (firstMatchIdx === -1 || idx < firstMatchIdx)) {
      firstMatchIdx = idx;
    }
  }

  if (firstMatchIdx === -1 || firstMatchIdx < 35) {
    return `${cleaned.slice(0, maxLength - 1).trimEnd()}…`;
  }

  const start = Math.max(0, firstMatchIdx - 35);
  const end = Math.min(cleaned.length, start + maxLength);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < cleaned.length ? "…" : "";
  return `${prefix}${cleaned.slice(start, end).trim()}${suffix}`;
}

export interface HighlightSegment {
  text: string;
  highlight: boolean;
}

/**
 * Tokenizes `text` into safe React-renderable segments highlighting any query token matches.
 * Never outputs raw HTML or uses dangerouslySetInnerHTML.
 */
export function highlightTokens(text: string, query: string): HighlightSegment[] {
  if (!text) return [];
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return [{ text, highlight: false }];

  // Sort longest tokens first so partial prefixes don't shadow longer matches
  const sorted = [...tokens].sort((a, b) => b.length - a.length);
  const pattern = sorted.map(escapeRegExp).join("|");
  if (!pattern) return [{ text, highlight: false }];

  const regex = new RegExp(`(${pattern})`, "gi");
  const parts = text.split(regex);

  const segments: HighlightSegment[] = [];
  for (const part of parts) {
    if (!part) continue;
    const isMatch = sorted.some(
      (t) => normalizeSearchText(part) === t
    );
    segments.push({ text: part, highlight: isMatch });
  }

  return segments;
}

/**
 * Formats an ISO date string into a readable date label for search metadata,
 * extracting YYYY-MM-DD directly to avoid local timezone off-by-one shifts.
 */
export function formatSearchDateLabel(isoDate: string): string {
  const dayPart = isoDate.split("T")[0];
  const [y, m, d] = dayPart.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  const dateObj = new Date(y, m - 1, d, 12, 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(dateObj);
}
