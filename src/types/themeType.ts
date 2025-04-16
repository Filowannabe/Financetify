export type Theme = {
  name: string;
  dark: boolean;
  colors: {
    primary: string;
    background: string;
    surface: string;
    accent: string;
    text: string;
    subtitle: string;
    cardBackground: string;
    border: string;
  };
};

export type ThemeContextType = {
  theme: Theme;
  themes: Record<string, Theme>;
  setTheme: (themeName: string) => void;
};