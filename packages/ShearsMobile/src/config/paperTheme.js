// // config/paperTheme.js
// import { configureFonts, DefaultTheme } from 'react-native-paper';
// import { CURRENT_APP, CURRENT_WHITE_LABEL } from 'shears-shared/src/config/currentapp';
// import { getAppConfig } from 'shears-shared/src/config/getAppConfig';

// // Optional: Configure custom fonts
// const fontConfig = {
//   fontFamily: 'Roboto', // Consider 'Barlow' or 'Montserrat' for a barbershop vibe
// };

// const appConfig = getAppConfig(CURRENT_APP, CURRENT_WHITE_LABEL);

// export const paperTheme = (mode = 'light') => ({
//   ...DefaultTheme,
//   colors: {
//     ...DefaultTheme.colors,
//     primary: appConfig.themeColors[mode].primary,
//     accent: appConfig.themeColors[mode].secondary, // Maps to secondary in Paper
//     background: appConfig.themeColors[mode].background,
//     surface: appConfig.themeColors[mode].surface,
//     text: appConfig.themeColors[mode].text,
//     onSurface: appConfig.themeColors[mode].onSurface,
//     onSurfaceVariant: appConfig.themeColors[mode].textSecondary,
//     disabled: appConfig.themeColors[mode].disabled,
//     error: appConfig.themeColors[mode].error,
//     backdrop: `${appConfig.themeColors[mode].background}80`, // Semi-transparent backdrop
//     notification: appConfig.themeColors[mode].accent, // For badges or notifications
//     surfaceVariant: appConfig.themeColors[mode].primaryContainer,
//     outline: appConfig.themeColors[mode].border,
//   },
//   fonts: configureFonts({ config: fontConfig }),
//   roundness: 8, // Softer corners for a modern look
// });