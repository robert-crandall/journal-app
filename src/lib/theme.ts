import { createContext, useContext, useEffect, useState } from 'react';
import { createTheme, PaletteMode } from '@mui/material';

type ColorMode = 'light' | 'dark' | 'system';
type ColorModeContextType = {
  mode: ColorMode;
  resolvedMode: PaletteMode;
  toggleColorMode: () => void;
  setColorMode: (mode: ColorMode) => void;
};

export const ColorModeContext = createContext<ColorModeContextType>({
  mode: 'system',
  resolvedMode: 'light',
  toggleColorMode: () => {},
  setColorMode: () => {},
});

export function useColorMode() {
  return useContext(ColorModeContext);
}

export const baseThemeOptions = {
  typography: {
    fontFamily: '"Comic-Sans", system-ui, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.1rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },
  },
};

export const lightTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    mode: 'light',
    primary: {
      main: '#6200EE',
      light: '#9c4dff',
      dark: '#3700B3',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#03DAC6',
      light: '#66fff9',
      dark: '#00a896',
      contrastText: '#000000',
    },
    background: {
      default: '#f5f5f7',
      paper: '#ffffff',
    },
    error: {
      main: '#B00020',
    },
  },
});

export const darkTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: '#BB86FC',
      light: '#efd5ff',
      dark: '#8a4fc8',
      contrastText: '#000000',
    },
    secondary: {
      main: '#03DAC6',
      light: '#66fff9',
      dark: '#00a896',
      contrastText: '#000000',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    error: {
      main: '#CF6679',
    },
  },
});
