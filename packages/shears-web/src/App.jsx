// src/App.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import AppNavigator from './navigation/AppNavigator';
import { createTheme } from './theme/createTheme';
import { getAppConfig } from 'shears-shared/src/config/getAppConfig';
import { CURRENT_APP, CURRENT_WHITE_LABEL } from 'shears-shared/src/config/currentapp';
import './App.css';

const appConfig = getAppConfig(CURRENT_APP, CURRENT_WHITE_LABEL);

export default function App() {
  const [mode, setMode] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  // Listen for system dark mode changes
  useEffect(() => {
    const listener = (e) => setMode(e.matches ? 'dark' : 'light');
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const theme = useMemo(() => createTheme(mode, appConfig.themeColors), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppNavigator />
    </ThemeProvider>
  );
}
