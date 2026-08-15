export type Theme = "light" | "dark" | "system";

export interface ThemeConfig {
  name: Theme;
  label: string;
  icon: string;
}
