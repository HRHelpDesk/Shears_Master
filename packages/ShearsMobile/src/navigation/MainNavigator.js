// src/navigation/MainNavigator.js
import React from 'react';
import { Platform } from 'react-native';
import { useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// ✅ Use native tabs for iOS, standard tabs for Android
import {
  createBottomTabNavigator as createStandardBottomTabs,
} from '@react-navigation/bottom-tabs';
import {
  createNativeBottomTabNavigator as createNativeBottomTabs,
} from '@bottom-tabs/react-navigation';

import BasePage from '../screens/BasePage';

// ✅ Platform-specific Tab Navigator
const Tab =
  Platform.OS === 'ios'
    ? createNativeBottomTabs()
    : createStandardBottomTabs();

// ✅ Helper for platform icons
const getTabIcon = (iosIcon, androidIcon) => {
  if (Platform.OS === 'ios') {
    return () => ({ sfSymbol: iosIcon });
  }
  return ({ color, size }) => (
    <MaterialCommunityIcons name={androidIcon} color={color} size={size} />
  );
};

const MainNavigator = ({ appConfig }) => {
  const theme = useTheme();
  const { colors } = theme;

  // ✅ Process all view data dynamically from appConfig
  const viewData = appConfig.mainNavigation.reduce((acc, route) => {
    acc[route.name] = route.views
      ? route.views.map((view) => ({
          displayName: view.displayName || view.name,
          component: view.component,
          fields: view.fields || [],
          data: view.data || [],
          icon: route.icon,
        }))
      : [
          {
            displayName: route.name,
            component: route.component || null,
            fields: route.fields || [],
            data: route.data || [],
            icon: route.icon,
          },
        ];
    return acc;
  }, {});

  return (
    <Tab.Navigator
      initialRouteName={appConfig.name}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant || colors.text,
        tabBarLabelStyle: {
          fontFamily: theme.fonts?.bodyMedium?.fontFamily || 'System',
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.3,
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        ...(Platform.OS === 'ios'
          ? {
              tabBarAppearance: 'automatic',
              tabBarStyle: {
                backgroundColor: colors.surfaceVariant + 'F0',
                position: 'absolute',
                left: 10,
                right: 10,
                bottom: 10,
                borderRadius: 28,
                borderWidth: 0,
                overflow: 'hidden',
                marginHorizontal: 12,
                shadowColor: colors.shadow || '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
              },
            }
          : {
              tabBarStyle: {
                backgroundColor: colors.surfaceVariant || '#fff',
                borderTopWidth: 1,
                borderTopColor: colors.outlineVariant || '#e0e0e0',
                elevation: 10,
              },
            }),
      }}
    >
      {appConfig.mainNavigation.map((route) => (
        <Tab.Screen
          key={route.name}
          name={route.name}
          children={() => (
            <BasePage
              appConfig={appConfig}
              name={route.name}
              viewData={viewData[route.name]}
            />
          )}
          options={{
            tabBarLabel: route.displayName,
            tabBarIcon: getTabIcon(route.icon?.ios, route.icon?.android),
          }}
        />
      ))}
    </Tab.Navigator>
  );
};

export default MainNavigator;
