// src/navigation/AppRoutes.js
import React, { useContext } from 'react';
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

const Stack = createNativeStackNavigator();
const appConfig = getAppConfig(CURRENT_APP, CURRENT_WHITE_LABEL);
const logo = AppLogos[CURRENT_APP][CURRENT_WHITE_LABEL];

function AppRoutes() {
  const { isLoggedIn, loading } = useContext(AuthContext);

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
              gestureEnabled: true,
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
    <AuthProvider>
      <NavigationContainer>
        <AppRoutes />
      </NavigationContainer>
    </AuthProvider>
  );
}
