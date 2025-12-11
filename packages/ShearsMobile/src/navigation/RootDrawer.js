// src/navigation/RootDrawer.js
import React, { useContext, useEffect } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import MainNavigator from './MainNavigator';
import SettingsStack from './SettingsNavigator';
import { Icon, useTheme } from 'react-native-paper';
import BasePage from '../screens/BasePage';
import { AuthContext } from '../context/AuthContext';
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import SmartProfileCard from "../components/SmartWidgets/SmartProfileCard";
import { View } from 'react-native';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  const { user } = useContext(AuthContext);
  const theme = useTheme();

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{
        //backgroundColor: theme.colors.background,
        paddingTop: 60,
      }}
    >
      {/* Profile Card */}
      <SmartProfileCard user={user} />
     <View style={{ height: 20 }} />
      {/* Drawer Items */}
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

export default function RootDrawer({ appConfig }) {
  const theme = useTheme();
  const { logout, user } = useContext(AuthContext);

  useEffect(() => {
    console.log("RootDrawer appConfig:", appConfig);
  }, []);

  /* ===========================================================
     MODE LOGIC:
     - If mainNavigation is empty & subNavigation exists → SUBNAV ONLY MODE
     =========================================================== */
  const hasMainNav = appConfig.mainNavigation?.length > 0;
  const hasSubNav = appConfig.subNavigation?.length > 0;
  const subNavOnly = !hasMainNav && hasSubNav;

  /* ===========================================================
     Build filtered subNav (permissions)
     =========================================================== */
  const filteredSubNav = (appConfig.subNavigation || []).filter(item => {
    if (!item.permissions) return true;
    return item.permissions.includes(user.role);
  });

  const firstSubNav = filteredSubNav[0];

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        overlayColor: 'rgba(0,0,0,0.5)',
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.textSecondary || '#222',
        drawerLabelStyle: { fontSize: 16, fontWeight: '500' },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      initialRouteName={subNavOnly ? firstSubNav?.name : "Home"}
    >

      {/* ===========================================================
         SUBNAV ONLY MODE → NO HOME BUTTON, NO MAIN NAV
      =========================================================== */}
      {subNavOnly ? (
        <>
          {filteredSubNav.map((route) => (
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
                  subNav={true}
                />
              )}
              options={{
                drawerLabel: route.displayName || route.name,
                drawerIcon: ({ color, size }) => (
                  <Icon source={route.icon?.android || "folder"} color={color} size={size} />
                ),
              }}
            />
          ))}
        </>
      ) : (
        <>
          {/* ===========================================================
             NORMAL MODE → Home + subNav + settings
          =========================================================== */}
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

          {filteredSubNav.map((route) => (
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
                  subNav={true}
                />
              )}
              options={{
                drawerLabel: route.displayName || route.name,
                drawerIcon: ({ color, size }) => (
                  <Icon source={route.icon?.android || "folder"} color={color} size={size} />
                ),
              }}
            />
          ))}
        </>
      )}

      {/* SETTINGS IF AVAILABLE */}
      {appConfig.settings.length > 0 && (
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
      )}

      {/* LOGOUT */}
      <Drawer.Screen
        name="Logout"
        component={() => null}
        listeners={{ focus: () => logout() }}
        options={{
          drawerLabel: 'Logout',
          drawerIcon: ({ color, size }) => (
            <Icon source="logout" color={color} size={size} />
          ),
          drawerActiveTintColor: theme.colors.error,
          drawerItemStyle: { marginTop: 20 },
          unmountOnBlur: true,
        }}
      />
    </Drawer.Navigator>
  );
}
