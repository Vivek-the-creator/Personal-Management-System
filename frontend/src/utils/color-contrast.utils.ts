export interface DerivedColorStyles {
  hex: string;
  textColor: string;
  softBg: string;
  softBorder: string;
  solidBg: string;
  contrastText: string;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.trim().replace("#", "");
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return { r: 124, g: 58, b: 237 }; // fallback #7C3AED
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getReadableTextColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const luminance = getLuminance(r, g, b);
  // luminance > 0.45 means light background, needs dark text; else light text
  return luminance > 0.45 ? "#0F172A" : "#FFFFFF";
}

export function getDerivedColorStyles(
  hexColor: string,
  isDarkTheme = false
): DerivedColorStyles {
  const { r, g, b } = hexToRgb(hexColor);
  const contrastText = getReadableTextColor(hexColor);

  const alphaBg = isDarkTheme ? 0.24 : 0.14;
  const alphaBorder = isDarkTheme ? 0.45 : 0.3;

  return {
    hex: hexColor,
    textColor: isDarkTheme ? (getLuminance(r, g, b) < 0.2 ? "#F1F5F9" : hexColor) : hexColor,
    softBg: `rgba(${r}, ${g}, ${b}, ${alphaBg})`,
    softBorder: `rgba(${r}, ${g}, ${b}, ${alphaBorder})`,
    solidBg: hexColor,
    contrastText,
  };
}
