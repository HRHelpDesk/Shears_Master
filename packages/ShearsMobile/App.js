import React, { useState, useMemo, useEffect, useContext } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StripeProvider } from '@stripe/stripe-react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { StripeTerminalProvider } from '@stripe/stripe-terminal-react-native';

import { getAppConfig } from 'shears-shared/src/config/getAppConfig';
import { CURRENT_APP, CURRENT_WHITE_LABEL } from 'shears-shared/src/config/currentapp';
import { createTheme } from './src/theme/createTheme';
import { BASE_URL } from 'shears-shared/src/config/api';

const appConfig = getAppConfig(CURRENT_APP, CURRENT_WHITE_LABEL);

export default function App() {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState(systemScheme || 'light');
  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setThemeMode(colorScheme || 'light');
    });
    return () => subscription.remove();
  }, []);

  const theme = useMemo(() => createTheme(themeMode, appConfig.themeColors), [themeMode]);

  /** -----------------------------------------------------------------
   *  Stripe Terminal Token Provider
   *  The SDK calls this whenever it needs a new connection_token
   *  (we already have this route in your backend)
   *  ----------------------------------------------------------------- */


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* StripeProvider for online payments (PaymentSheet, Apple Pay, etc.) */}
      <StripeProvider
        publishableKey="pk_test_51SPNqR1OAQam7tPgFryvj6gCkIICX1ptrBIRX2ni67VXIYOrWr61l4dG2hTBILCVnNEtebdzxVnmLrbkFHQW4bYb002vB3Y8Mp"
        merchantIdentifier="merchant.com.shears"
        urlScheme="shears"
      >
        {/* StripeTerminalProvider for in-person payments (Tap to Pay, readers, etc.) */}
          <SafeAreaProvider>
            <PaperProvider theme={theme}>
              <AppNavigator />
            </PaperProvider>
          </SafeAreaProvider>
      </StripeProvider>
    </GestureHandlerRootView>
  );
}
