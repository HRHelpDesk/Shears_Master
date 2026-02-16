// src/navigation/RootDrawer.js
import React, { useContext, useEffect, useMemo } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import MainNavigator from './MainNavigator';
import SettingsStack from './SettingsNavigator';
import { Icon, useTheme } from 'react-native-paper';
import BasePage from '../screens/BasePage';
import { AuthContext } from '../context/AuthContext';
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
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
        backgroundColor: theme.colors.surface,
        flex: 1,
        paddingTop: 60,
      }}
      style={{ backgroundColor: theme.colors.surface }}
    >
      <SmartProfileCard user={user} />
      <View style={{ height: 20 }} />
      <DrawerItemList
        {...props}
        itemStyle={{
          borderRadius: 8,
          marginHorizontal: 8,
          marginVertical: 2,
        }}
      />
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
     MODE LOGIC
  =========================================================== */
  const hasMainNav = appConfig.mainNavigation?.length > 0;
  const hasSubNav = appConfig.subNavigation?.length > 0;
  const subNavOnly = !hasMainNav && hasSubNav;

  const filteredSubNav = useMemo(() => {
    return (appConfig.subNavigation || []).filter(item => {
      if (!item.permissions) return true;
      return item.permissions.includes(user.role);
    });
  }, [appConfig.subNavigation, user.role]);

  const firstSubNav = filteredSubNav[0];

  /* ===========================================================
     🔥 BUILD VIEW DATA (MATCHES MainNavigator EXACTLY)
  =========================================================== */
  const buildViewData = (routes = []) =>
    routes.reduce((acc, route) => {
      const recordType = route.recordType || null;

      acc[route.name] = route.views
        ? route.views.map((view) => ({
            ...view,
            displayName: view.displayName || view.name,
            component: view.component,
            fields: route.fields || [],
            recordType,
            data: view.data || [],
            icon: route.icon,
          }))
        : [
            {
              displayName: route.displayName || route.name,
              component: route.component || null,
              fields: route.fields || [],
              recordType,
              data: route.data || [],
              icon: route.icon,
            },
          ];

      return acc;
    }, {});

  const subNavViewData = useMemo(
    () => buildViewData(filteredSubNav),
    [filteredSubNav]
  );

  /* ===========================================================
     RENDER
  =========================================================== */
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        overlayColor: 'rgba(0,0,0,0.5)',
        drawerStyle: {
          backgroundColor: theme.colors.surface,
          borderRightWidth: 0,
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerActiveBackgroundColor: theme.colors.primaryContainer,
        drawerInactiveTintColor: theme.colors.onSurfaceVariant,
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '500',
          marginLeft: -4,
        },
        drawerItemStyle: {
          borderRadius: 8,
          marginHorizontal: 8,
        },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      initialRouteName={subNavOnly ? firstSubNav?.name : "Home"}
    >

      {/* =======================================================
         SUBNAV ONLY MODE
      ======================================================= */}
      {subNavOnly ? (
        <>
          {filteredSubNav.map((route) => (
            <Drawer.Screen
              key={route.name}
              name={route.name}
              options={{
                drawerLabel: route.displayName || route.name,
                drawerIcon: ({ color, size }) => (
                  <Icon
                    source={route.icon?.android || "folder"}
                    color={color}
                    size={size}
                  />
                ),
              }}
            >
              {() => (
                <BasePage
                  appConfig={appConfig}
                  name={route.name}
                  recordType={route.recordType || null}
                  viewData={subNavViewData[route.name] || []}
                  displayName={route.displayName || route.name}
                  settings={route.settings || []}
                  subNav={true}
                />
              )}
            </Drawer.Screen>
          ))}
        </>
      ) : (
        <>
          {/* ===================================================
             NORMAL MODE – Home + subNav
          =================================================== */}
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
              options={{
                drawerLabel: route.displayName || route.name,
                drawerIcon: ({ color, size }) => (
                  <Icon
                    source={route.icon?.android || "folder"}
                    color={color}
                    size={size}
                  />
                ),
              }}
            >
              {() => (
                <BasePage
                  appConfig={appConfig}
                  name={route.name}
                  recordType={route.recordType || null}
                  viewData={subNavViewData[route.name] || []}
                  displayName={route.displayName || route.name}
                  settings={route.settings || []}
                  subNav={true}
                />
              )}
            </Drawer.Screen>
          ))}
        </>
      )}

      {/* =======================================================
         SETTINGS
      ======================================================= */}
      {appConfig.settings?.length > 0 && (
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

      {/* =======================================================
         LOGOUT
      ======================================================= */}
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
          drawerInactiveTintColor: theme.colors.error,
          drawerLabelStyle: {
            color: theme.colors.error,
            fontWeight: '600',
            marginLeft: -4,
          },
          drawerItemStyle: {
            marginTop: 32,
            marginHorizontal: 8,
            borderRadius: 8,
          },
          unmountOnBlur: true,
        }}
      />

    </Drawer.Navigator>
  );
}
