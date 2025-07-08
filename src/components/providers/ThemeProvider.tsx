'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { ThemeProvider as MUIThemeProvider, PaletteMode, useMediaQuery } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';

import { ColorModeContext, lightTheme, darkTheme } from '@/lib/theme';

type ColorMode = 'light' | 'dark' | 'system';

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  
  const [mode, setMode] = useState<ColorMode>('system');
  const [resolvedMode, setResolvedMode] = useState<PaletteMode>('light');

  useEffect(() => {
    const savedMode = localStorage.getItem('colorMode') as ColorMode | null;
    if (savedMode) {
      setMode(savedMode);
    }
  }, []);

  useEffect(() => {
    if (mode === 'system') {
      setResolvedMode(prefersDarkMode ? 'dark' : 'light');
    } else {
      setResolvedMode(mode as PaletteMode);
    }
  }, [mode, prefersDarkMode]);

  const colorMode = useMemo(
    () => ({
      mode,
      resolvedMode,
      toggleColorMode: () => {
        const newMode = resolvedMode === 'light' ? 'dark' : 'light';
        setMode(newMode);
        localStorage.setItem('colorMode', newMode);
      },
      setColorMode: (newMode: ColorMode) => {
        setMode(newMode);
        localStorage.setItem('colorMode', newMode);
      },
    }),
    [mode, resolvedMode]
  );

  const theme = useMemo(
    () => (resolvedMode === 'light' ? lightTheme : darkTheme),
    [resolvedMode]
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ColorModeContext.Provider>
  );
}
