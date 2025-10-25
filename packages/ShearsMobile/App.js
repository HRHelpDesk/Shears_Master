import React, { useState, useMemo, useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme, Appearance } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { getAppConfig } from 'shears-shared/src/config/getAppConfig';
import { CURRENT_APP, CURRENT_WHITE_LABEL } from 'shears-shared/src/config/currentapp';
import { createTheme } from './src/theme/createTheme';

const appConfig = getAppConfig(CURRENT_APP, CURRENT_WHITE_LABEL);

export default function App() {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [themeMode, setThemeMode] = useState(systemScheme || 'light');

  // Listen for system theme changes in real time
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setThemeMode(colorScheme || 'light');
    });

    return () => subscription.remove();
  }, []);

  const theme = useMemo(() => createTheme(themeMode, appConfig.themeColors), [themeMode]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <AppNavigator />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
