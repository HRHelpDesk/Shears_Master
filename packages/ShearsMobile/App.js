// App.js
import React, { useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StripeProvider } from '@stripe/stripe-react-native';
import { StripeTerminalProvider, useStripeTerminal } from '@stripe/stripe-terminal-react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { getAppConfig } from 'shears-shared/src/config/getAppConfig';
import { CURRENT_APP, CURRENT_WHITE_LABEL } from 'shears-shared/src/config/currentapp';
import { createTheme } from './src/theme/createTheme';
import { BASE_URL } from 'shears-shared/src/config/api';

const appConfig = getAppConfig(CURRENT_APP, CURRENT_WHITE_LABEL);

// ✅ Separate component to safely initialize SDK once
function StripeTerminalInitializer() {
  const { initialize } = useStripeTerminal();

  useEffect(() => {
    const init = async () => {
      const { error } = await initialize();
      if (error) {
        console.log('❌ Stripe Terminal initialization failed:', error);
      } else {
        console.log('✅ Stripe Terminal SDK initialized successfully');
      }
    };
    init();
  }, [initialize]);

  return <AppNavigator />;
}

export default function App() {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState(systemScheme || 'light');

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setThemeMode(colorScheme || 'light');
    });
    return () => sub.remove();
  }, []);

  const theme = useMemo(() => createTheme(themeMode, appConfig.themeColors), [themeMode]);

  const fetchTokenProvider = async () => {
    try {
      const res = await fetch(`${BASE_URL}/v1/stripe/connection_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const { secret } = await res.json();

      console.log("secret", secret)
      return secret;
    } catch (err) {
      console.error('Failed to fetch connection token:', err);
      throw err;
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StripeProvider
        publishableKey="pk_test_51SPNqR1OAQam7tPgFryvj6gCkIICX1ptrBIRX2ni67VXIYOrWr61l4dG2hTBILCVnNEtebdzxVnmLrbkFHQW4bYb002vB3Y8Mp"
        merchantIdentifier="merchant.com.shears"
        urlScheme="shears"
      >
        <StripeTerminalProvider logLevel="verbose" tokenProvider={fetchTokenProvider}>
          <SafeAreaProvider>
            <PaperProvider theme={theme}>
              <StripeTerminalInitializer />
            </PaperProvider>
          </SafeAreaProvider>
        </StripeTerminalProvider>
      </StripeProvider>
    </GestureHandlerRootView>
  );
}
