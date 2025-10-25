import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { CURRENT_APP, CURRENT_WHITE_LABEL } from 'shears-shared/src/config/currentapp';
import { getAppConfig } from 'shears-shared/src/config/getAppConfig';

export const createTheme = (mode = 'light', themeColors = {}) => {
  // Ensure we have valid colors
  const appConfig = getAppConfig(CURRENT_APP, CURRENT_WHITE_LABEL);

  const defaultLight = appConfig.themeColors.dark;
  const defaultDark = appConfig.themeColors.light;

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

  return {
    ...(mode === 'light' ? MD3LightTheme : MD3DarkTheme),
    mode,
    roundness: 10,
    version: 3,
    colors: {
      ...((mode === 'light' ? MD3LightTheme : MD3DarkTheme).colors),

      // Base colors
      primary: colors.primary,
      secondary: colors.secondary,
      tertiary: colors.accent,
      background: colors.background,
      surface: colors.surface,
      text: colors.text,
      textSecondary: colors.textSecondary,
      textLight: colors.textLight,
      border: colors.border,
      error: colors.error,
      disabled: colors.disabled,

      // "On" colors for text/icons on backgrounds
      onPrimary: colors.onPrimary,
      onSecondary: colors.onSecondary,
      onSurface: colors.onSurface,

      // Semantic colors (for richer UI)
      success: '#22C55E',
      warning: '#EAB308',
      info: '#3B82F6',

      // Custom surfaces for cards and containers
      primaryContainer: colors.primaryContainer,
      secondaryContainer: colors.secondaryContainer,
      elevatedSurface: mode === 'light' ? '#FFFFFF' : '#2C2C2E',

      // Branding-specific accents
      barberGold: '#D4AF37',
      barberSteel: '#374151',
      barberShadow: 'rgba(0,0,0,0.1)',
    },
  };
};
