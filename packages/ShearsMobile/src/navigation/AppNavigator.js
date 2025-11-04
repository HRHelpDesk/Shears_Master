// src/navigation/AppRoutes.js
import React, { useContext, useRef, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from '../screens/auth/LoginScreen';
import SplashScreen from '../screens/SplashScreen';
import DetailView from '../components/BaseUI/ListItemDetail';
import { AuthContext, AuthProvider } from '../context/AuthContext';
import RootDrawer from './RootDrawer';
import { getAppConfig } from 'shears-shared/src/config/getAppConfig';
import { CURRENT_APP, CURRENT_WHITE_LABEL } from 'shears-shared/src/config/currentapp';
import { AppLogos } from '../config/appLogos';
import CalendarListView from '../components/Calendar/CalendarListView';
import { StripeTerminalProvider } from '@stripe/stripe-terminal-react-native';
import { BASE_URL } from 'shears-shared/src/config/api';

const Stack = createNativeStackNavigator();
const appConfig = getAppConfig(CURRENT_APP, CURRENT_WHITE_LABEL);
const logo = AppLogos[CURRENT_APP][CURRENT_WHITE_LABEL];

function AppRoutes() {
  const { isLoggedIn, loading, token, user } = useContext(AuthContext);
  
  // ✅ Use ref to capture the latest user value
  const userRef = useRef(user);
  
  useEffect(() => {
    userRef.current = user;
    console.log(user)
  }, [user]);

  const fetchConnectionToken = async () => {
    try {
      const currentUser = userRef.current;
      
      if (!currentUser?.stripeAccountId) {
        console.warn('⚠️ No Stripe Account ID available');
        throw new Error('Missing Stripe Account ID');
      }

      const response = await fetch(`${BASE_URL}/v1/stripe/connection_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stripeAccountId: currentUser.stripeAccountId }),
      });

      // ⚠️ Don't call .json() twice! Store it first
      const data = await response.json();
      console.log('📡 Connection token response:', data);

      if (!data?.secret) throw new Error('Missing connection token secret');
      return data.secret;
    } catch (err) {
      console.error('❌ Error fetching connection token:', err);
      throw err;
    }
  };

  if (loading) return <SplashScreen appConfig={appConfig} logo={logo} />;

  return (
    <StripeTerminalProvider 
    logLevel="verbose" 
    tokenProvider={fetchConnectionToken} 
    onUnexpectedReaderDisconnect={() => {
    console.warn('⚠️ Reader disconnected unexpectedly');
  }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          <Stack.Screen name="Login">
            {() => <LoginScreen appConfig={appConfig} logo={logo} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="RootDrawer">
              {() => <RootDrawer appConfig={appConfig} />}
            </Stack.Screen>

            <Stack.Screen
              name="ListItemDetail"
              component={DetailView}
              options={{
                title: 'Item Details',
                presentation: 'modal',
                headerShown: false,
                gestureEnabled: false,
                animation: 'slide_from_bottom',
              }}
            />

            <Stack.Screen
              name="CalendarListView"
              component={CalendarListView}
              options={{
                presentation: 'modal',
                headerShown: false,
                gestureEnabled: true,
                animation: 'slide_from_bottom',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </StripeTerminalProvider>
  );
}

export default function AppNavigator() {
  return (
    <AuthProvider>    
      <NavigationContainer>
        <AppRoutes />
      </NavigationContainer>
    </AuthProvider>
  );
}