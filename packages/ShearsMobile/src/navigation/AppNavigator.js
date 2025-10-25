import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import MainNavigator from './MainNavigator';
import SplashScreen from '../screens/SplashScreen';
import { getAppConfig } from 'shears-shared/src/config/getAppConfig';
import { CURRENT_APP, CURRENT_WHITE_LABEL } from 'shears-shared/src/config/currentapp';
import { AppLogos } from '../config/appLogos';
import { AuthProvider, AuthContext } from '../context/AuthContext';
import DetailView from '../components/BaseUI/ListItemDetail';

const Stack = createNativeStackNavigator();
const appConfig = getAppConfig(CURRENT_APP, CURRENT_WHITE_LABEL);
const logo = AppLogos[CURRENT_APP][CURRENT_WHITE_LABEL];

function AppRoutes() {
  const { isLoggedIn, loading } = useContext(AuthContext);

  if (loading) {
    // While auth state is loading, show Splash
    return <SplashScreen appConfig={appConfig} logo={logo} />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
   
      {!isLoggedIn ? (
        <Stack.Screen
          name="Login"
          children={() => <LoginScreen appConfig={appConfig} logo={logo} />}
        />
      ) : (
        <>
        <Stack.Screen
          name="Main"
          children={() => <MainNavigator appConfig={appConfig} />}
        />
        <Stack.Screen
        name="ListItemDetail"
        options={{ 
          title: 'Item Details',
    presentation: 'modal', // or 'formSheet' for a centered, smaller modal on iOS
    headerShown: false, // Optional: Hide the default header for a cleaner modal look
    gestureEnabled: true, // Allow swipe-down to dismiss on iOS
    animation: 'slide_from_bottom', // Optional: Smooth slide-in animation
  
        }}
        component={DetailView}
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
