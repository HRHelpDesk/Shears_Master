// App.js
import React, { useEffect, useMemo, useState, useContext, useCallback } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StripeProvider } from '@stripe/stripe-react-native';
import { StripeTerminalProvider } from '@stripe/stripe-terminal-react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { getAppConfig } from 'shears-shared/src/config/getAppConfig';
import { CURRENT_APP, CURRENT_WHITE_LABEL } from 'shears-shared/src/config/currentapp';
import { createTheme } from './src/theme/createTheme';
import { BASE_URL } from 'shears-shared/src/config/api';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { getStripeTerminalToken } from 'shears-shared/src/Services/Authentication';

const appConfig = getAppConfig(CURRENT_APP, CURRENT_WHITE_LABEL);

// -----------------------------------------------------
// A wrapper so tokenProvider CAN access AuthContext
// -----------------------------------------------------
function TerminalProviderWrapper({ children }) {
  const { user, token } = useContext(AuthContext);

  const fetchTerminalToken = useCallback(async () => {
    console.log("🟦 [Terminal] Token Provider Called");

    if (!user?.stripeAccountId) {
      console.warn("⚠ [Terminal] No stripeAccountId yet — user not connected");
      return null;
    }

    try {
      const secret = await getStripeTerminalToken(
        user.stripeAccountId,
        token
      );

      console.log("✅ [Terminal] Token provider returning secret");
      return secret;

    } catch (err) {
      console.error("❌ [Terminal] Failed to get terminal token:", err);
      throw err;
    }

  }, [user?.stripeAccountId, token]);

  return (
    <StripeTerminalProvider
      logLevel="verbose"
      tokenProvider={fetchTerminalToken}
      simulate="preferred"
    >
      {children}
    </StripeTerminalProvider>
  );
}


// -----------------------------------------------------

export default function App() {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState(systemScheme || "light");

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setThemeMode(colorScheme || "light");
    });
    return () => sub.remove();
  }, []);

  const theme = useMemo(
    () => createTheme(themeMode, appConfig.themeColors),
    [themeMode]
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StripeProvider
        publishableKey="pk_test_51SPNqR1OAQam7tPgFryvj6gCkIICX1ptrBIRX2ni67VXIYOrWr61l4dG2hTBILCVnNEtebdzxVnmLrbkFHQW4bYb002vB3Y8Mp"
        merchantIdentifier="merchant.com.shears"
        urlScheme="shears"
      >
        <AuthProvider>
          <TerminalProviderWrapper>
            <SafeAreaProvider>
              <PaperProvider theme={theme}>
                <AppNavigator />
              </PaperProvider>
            </SafeAreaProvider>
          </TerminalProviderWrapper>
        </AuthProvider>
      </StripeProvider>
    </GestureHandlerRootView>
  );
}
