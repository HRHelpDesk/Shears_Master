// src/navigation/AppRoutes.js
import React, { useContext, useRef, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from '../screens/auth/LoginScreen';
import SplashScreen from '../screens/SplashScreen';
import DetailView from '../components/BaseUI/ListItemDetail';
import RootDrawer from './RootDrawer';
import { getAppConfig } from 'shears-shared/src/config/getAppConfig';
import { CURRENT_APP, CURRENT_WHITE_LABEL } from 'shears-shared/src/config/currentapp';
import { AppLogos } from '../config/appLogos';
import CalendarListView from '../components/Calendar/CalendarListView';
import { useStripeTerminal } from '@stripe/stripe-terminal-react-native';
import { AuthContext } from '../context/AuthContext';

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
    console.log(appConfig)
  }, [user]);

  // App.tsx
    const { initialize } = useStripeTerminal();

   useEffect(() => {
    initialize();
  }, [initialize])


  if (loading) return <SplashScreen appConfig={appConfig} logo={logo} />;

  return (

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
                gestureEnabled: false,
                animation: 'slide_from_bottom',
              }}
            />
          </>
        )}
      </Stack.Navigator>
  );
}

export default function AppNavigator() {



  return (
      <NavigationContainer>
        <AppRoutes />
      </NavigationContainer>
  );
}