// src/navigation/RootDrawer.js
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import MainNavigator from './MainNavigator';
import SettingsStack from './SettingsNavigator';
import { Icon } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import BasePage from '../screens/BasePage';

const Drawer = createDrawerNavigator();

export default function RootDrawer({ appConfig }) {
    const theme = useTheme();

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false, // each child can have its own header
        drawerType: 'front',
          overlayColor: 'rgba(0,0,0,0.5)',
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.textSecondary || '#222',
        drawerLabelStyle: { fontSize: 16, fontWeight: '500' },
      }}
      initialRouteName="Home"
    >
      <Drawer.Screen
        name="Home"
        options={{
          drawerIcon: ({ color, size }) => (
            <Icon source="home-outline" color={color} size={size} />
          ),
        }}
      >
        {() => <MainNavigator appConfig={appConfig} />}
      </Drawer.Screen>

      {appConfig.subNavigation.map((route) => (
        <Drawer.Screen
          key={route.name}
          name={route.name}
          children={() => (
            <BasePage
              appConfig={appConfig}
              name={route.name}
              viewData={route.views || []}
              displayName={route.displayName || route.name}
              settings={route.settings || []}
            />
          )}
          options={{
            drawerLabel: route.displayName || route.name,
            drawerIcon: ({ color, size }) => (
            <Icon source={route.icon.android} color={color} size={size} />
          ),
          }}
        />
      ))}

      <Drawer.Screen
        name="Settings"
        options={{
          drawerIcon: ({ color, size }) => (
            <Icon source="cog-outline" color={color} size={size} />
          ),
        }}
      >
        {() => <SettingsStack appConfig={appConfig} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}
