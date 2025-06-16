// Theme provider for managing daisyUI themes
// Handles theme switching and persistence

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { preferencesStorageUtils } from './storage';

export type Theme = 
  | 'light' 
  | 'dark' 
  | 'cupcake' 
  | 'bumblebee' 
  | 'emerald' 
  | 'corporate' 
  | 'synthwave' 
  | 'retro' 
  | 'cyberpunk' 
  | 'valentine' 
  | 'halloween' 
  | 'garden' 
  | 'forest' 
  | 'aqua' 
  | 'lofi' 
  | 'pastel' 
  | 'fantasy' 
  | 'wireframe' 
  | 'black' 
  | 'luxury' 
  | 'dracula' 
  | 'cmyk' 
  | 'autumn' 
  | 'business' 
  | 'acid' 
  | 'lemonade' 
  | 'night' 
  | 'coffee' 
  | 'winter';

export type AccentColor = 
  | 'primary' 
  | 'secondary' 
  | 'accent' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info';

export interface ThemeContextType {
  theme: Theme;
  accentColor: AccentColor;
  systemColorScheme: 'light' | 'dark' | null;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
  toggleTheme: () => void;
  getThemeColors: () => ThemeColors;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  base100: string;
  base200: string;
  base300: string;
  baseContent: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

// Default theme colors for reference
const defaultColors: Record<Theme, Partial<ThemeColors>> = {
  light: {
    primary: '#570df8',
    secondary: '#f000b8',
    accent: '#37cdbe',
    neutral: '#3d4451',
    base100: '#ffffff',
    base200: '#f2f2f2',
    base300: '#e5e6e6',
    baseContent: '#1f2937',
    success: '#36d399',
    warning: '#fbbd23',
    error: '#f87272',
    info: '#3abff8',
  },
  dark: {
    primary: '#661ae6',
    secondary: '#d926aa',
    accent: '#1fb2a6',
    neutral: '#191d24',
    base100: '#2a303c',
    base200: '#242933',
    base300: '#20252e',
    baseContent: '#a6adbb',
    success: '#36d399',
    warning: '#fbbd23',
    error: '#f87272',
    info: '#3abff8',
  },
  // Add more theme colors as needed
  cupcake: {},
  bumblebee: {},
  emerald: {},
  corporate: {},
  synthwave: {},
  retro: {},
  cyberpunk: {},
  valentine: {},
  halloween: {},
  garden: {},
  forest: {},
  aqua: {},
  lofi: {},
  pastel: {},
  fantasy: {},
  wireframe: {},
  black: {},
  luxury: {},
  dracula: {},
  cmyk: {},
  autumn: {},
  business: {},
  acid: {},
  lemonade: {},
  night: {},
  coffee: {},
  winter: {},
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('light');
  const [accentColor, setAccentColorState] = useState<AccentColor>('primary');

  // Initialize theme from storage
  useEffect(() => {
    const storedTheme = preferencesStorageUtils.getTheme() as Theme;
    const storedAccentColor = preferencesStorageUtils.getAccentColor() as AccentColor;
    
    if (storedTheme) {
      setThemeState(storedTheme);
    } else {
      // Use system preference as default
      const defaultTheme = systemColorScheme === 'dark' ? 'dark' : 'light';
      setThemeState(defaultTheme);
      preferencesStorageUtils.setTheme(defaultTheme);
    }

    if (storedAccentColor) {
      setAccentColorState(storedAccentColor);
    }
  }, [systemColorScheme]);

  // Update document theme attribute for web
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.style.colorScheme = 
        theme === 'dark' || theme === 'synthwave' || theme === 'halloween' || 
        theme === 'forest' || theme === 'black' || theme === 'luxury' || 
        theme === 'dracula' || theme === 'night' || theme === 'coffee' 
          ? 'dark' 
          : 'light';
    }
  }, [theme]);

  const setTheme = (newTheme: Theme): void => {
    setThemeState(newTheme);
    preferencesStorageUtils.setTheme(newTheme);
  };

  const setAccentColor = (color: AccentColor): void => {
    setAccentColorState(color);
    preferencesStorageUtils.setAccentColor(color);
  };

  const toggleTheme = (): void => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const getThemeColors = (): ThemeColors => {
    const colors = defaultColors[theme] || defaultColors.light;
    return {
      primary: colors.primary || '#570df8',
      secondary: colors.secondary || '#f000b8',
      accent: colors.accent || '#37cdbe',
      neutral: colors.neutral || '#3d4451',
      base100: colors.base100 || '#ffffff',
      base200: colors.base200 || '#f2f2f2',
      base300: colors.base300 || '#e5e6e6',
      baseContent: colors.baseContent || '#1f2937',
      success: colors.success || '#36d399',
      warning: colors.warning || '#fbbd23',
      error: colors.error || '#f87272',
      info: colors.info || '#3abff8',
    };
  };

  const value: ThemeContextType = {
    theme,
    accentColor,
    systemColorScheme: systemColorScheme as 'light' | 'dark' | null,
    setTheme,
    setAccentColor,
    toggleTheme,
    getThemeColors,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Hook for getting theme-aware colors
export const useThemeColors = (): ThemeColors => {
  const { getThemeColors } = useTheme();
  return getThemeColors();
};
