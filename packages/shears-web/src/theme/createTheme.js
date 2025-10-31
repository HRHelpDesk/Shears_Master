// src/theme/createTheme.js
import { createTheme as createMuiTheme } from '@mui/material/styles';
import { CURRENT_APP, CURRENT_WHITE_LABEL } from 'shears-shared/src/config/currentapp';
import { getAppConfig } from 'shears-shared/src/config/getAppConfig';

export const createTheme = (mode = 'light', themeColors = {}) => {
  const appConfig = getAppConfig(CURRENT_APP, CURRENT_WHITE_LABEL);

  const defaultLight = appConfig.themeColors.light;
  const defaultDark = appConfig.themeColors.dark;

  const colors =
    themeColors?.[mode] ||
    (mode === 'light'
      ? {
          primary: defaultLight.primary,
          secondary: defaultLight.secondary,
          accent: defaultLight.tertiary,
          background: defaultLight.background,
          surface: defaultLight.surface,
          text: defaultLight.onSurface,
          textSecondary: '#6B7280',
          textLight: '#9CA3AF',
          primaryContainer: defaultLight.primaryContainer,
          secondaryContainer: defaultLight.secondaryContainer,
          error: defaultLight.error,
          onPrimary: defaultLight.onPrimary,
          onSecondary: defaultLight.onSecondary,
          onSurface: defaultLight.onSurface,
          border: '#E5E7EB',
          disabled: '#D1D5DB',
        }
      : {
          primary: defaultDark.primary,
          secondary: defaultDark.secondary,
          accent: defaultDark.tertiary,
          background: defaultDark.background,
          surface: defaultDark.surface,
          text: defaultDark.onSurface,
          textSecondary: '#D1D5DB',
          textLight: '#9CA3AF',
          primaryContainer: defaultDark.primaryContainer,
          secondaryContainer: defaultDark.secondaryContainer,
          error: defaultDark.error,
          onPrimary: defaultDark.onPrimary,
          onSecondary: defaultDark.onSecondary,
          onSurface: defaultDark.onSurface,
          border: '#4B5563',
          disabled: '#6B7280',
        });

  return createMuiTheme({
    palette: {
      mode,
      primary: {
        main: colors.primary,
        contrastText: colors.onPrimary,
      },
      secondary: {
        main: colors.secondary,
        contrastText: colors.onSecondary,
      },
      background: {
        default: colors.background,
        paper: colors.surface,
      },
      text: {
        primary: colors.text,
        secondary: colors.textSecondary,
        disabled: colors.disabled,
      },
      error: {
        main: colors.error,
      },
      success: { main: '#22C55E' },
      warning: { main: '#EAB308' },
      info: { main: '#3B82F6' },
    },
    shape: {
      borderRadius: 10,
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    customColors: {
      // optional extra surfaces
      primaryContainer: colors.primaryContainer,
      secondaryContainer: colors.secondaryContainer,
      elevatedSurface: mode === 'light' ? '#FFFFFF' : '#2C2C2E',
      barberGold: '#D4AF37',
      barberSteel: '#374151',
      barberShadow: 'rgba(0,0,0,0.1)',
    },
  });
};
