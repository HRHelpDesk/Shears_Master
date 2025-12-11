// src/navigation/MainNavigator.js
import React, { useContext } from 'react';
import { Platform } from 'react-native';
import { useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  createBottomTabNavigator as createStandardBottomTabs,
} from '@react-navigation/bottom-tabs';

import {
  createNativeBottomTabNavigator as createNativeBottomTabs,
} from '@bottom-tabs/react-navigation';

import BasePage from '../screens/BasePage';
import { AuthContext } from '../context/AuthContext';

// iOS = native tabs, Android = JS tabs
const Tab =
  Platform.OS === 'ios'
    ? createNativeBottomTabs()
    : createStandardBottomTabs();

// Platform icons
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
  const { user } = useContext(AuthContext);

  const resolvedDefaultRoute =
    typeof appConfig.defaultRoute === 'function'
      ? appConfig.defaultRoute(user)
      : appConfig.defaultRoute;

  console.log('Resolved Default Route (native):', resolvedDefaultRoute);
  console.log('MainNavigator appConfig (native):', appConfig);

  /* ----------------------------------------------------------
     Build viewData WITH recordType injected (per route)
  ----------------------------------------------------------- */
  const viewData = appConfig.mainNavigation.reduce((acc, route) => {
    const recordType = route.recordType || null; // ⭐ route-level recordType

    acc[route.name] = route.views
      ? route.views.map((view) => ({
          ...view,
          displayName: view.displayName || view.name,
          component: view.component,
          fields: route.fields || [],
          recordType, // ⭐ inject into each view
          data: view.data || [],
          icon: route.icon,
        }))
      : [
          {
            displayName: route.displayName || route.name,
            component: route.component || null,
            fields: route.fields || [],
            recordType, // ⭐ still injected
            data: route.data || [],
            icon: route.icon,
          },
        ];

    return acc;
  }, {});

  /* ----------------------------------------------------------
     Filter screens by user.role
  ----------------------------------------------------------- */
  const allowedTabs = appConfig.mainNavigation.filter((item) => {
    console.log('Checking permissions for tab:', item.name, item.permissions, 'against user role:', user.role);
    if (!item.permissions) return true;
    return item.permissions.includes(user.role);
  });

  console.log('Allowed Tabs (native):', allowedTabs);

  /* ----------------------------------------------------------
     CASE 1 — No tabs → Render default route directly
  ----------------------------------------------------------- */
  if (allowedTabs.length === 0) {
    const targetName = resolvedDefaultRoute;
    const defaultView = viewData[targetName] || [];

    const targetRoute =
      appConfig.mainNavigation.find((r) => r.name === targetName) || {};

    return (
      <BasePage
        appConfig={appConfig}
        name={targetName}
        recordType={targetRoute.recordType || null} // ⭐ pass recordType down
        viewData={defaultView}
        displayName={targetName}
        settings={appConfig.settings || []}
      />
    );
  }

  /* ----------------------------------------------------------
     CASE 2 — Only ONE tab → Render directly without TabBar
  ----------------------------------------------------------- */
  if (allowedTabs.length === 1) {
    const route = allowedTabs[0];
    const screens = viewData[route.name] || [];

    return (
      <BasePage
        appConfig={appConfig}
        name={route.name}
        recordType={route.recordType || null} // ⭐ pass recordType
        viewData={screens}
        displayName={route.displayName}
        settings={route.settings || []}
      />
    );
  }

  /* ----------------------------------------------------------
     CASE 3 — MULTIPLE tabs → Show TabBar
  ----------------------------------------------------------- */
  return (
    <Tab.Navigator
      initialRouteName={resolvedDefaultRoute}
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
      {allowedTabs.map((route) => (
        <Tab.Screen
          key={route.name}
          name={route.name}
          children={() => (
            <BasePage
              appConfig={appConfig}
              name={route.name}
              recordType={route.recordType || null} // ⭐ pass recordType
              viewData={viewData[route.name] || []}
              displayName={route.displayName}
              settings={route.settings || []}
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
