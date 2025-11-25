// src/navigation/RootDrawer.js
import React, { useContext, useEffect } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import MainNavigator from './MainNavigator';
import SettingsStack from './SettingsNavigator';
import { Icon } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import BasePage from '../screens/BasePage';
import { AuthContext } from '../context/AuthContext';
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import SmartProfileCard from "../components/SmartWidgets/SmartProfileCard";


const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  const { user } = useContext(AuthContext);

  return (
    <DrawerContentScrollView {...props}>
      {/* Profile Card at top */}
      <SmartProfileCard user={user} />

      {/* Default drawer items */}
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}


export default function RootDrawer({ appConfig }) {
    const theme = useTheme();
    const {logout, user} = useContext(AuthContext);

    useEffect(()=>{console.log(appConfig)},[])
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

      {appConfig.subNavigation.filter(item => {
        // If no permissions array → allow it
        console.log("item.permissions", item.permissions)
                console.log("user.role", user.role)

        if (!item.permissions) return true;

        // If permissions exist, check user.role
        return item.permissions.includes(user.role);
      }).map((route) => (
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
  
        <Drawer.Screen
        name="Logout"
        component={() => null} // No screen to render
        listeners={{
          // Handle tap on drawer item
          focus: () => {
            logout();
            // Close drawer after click (optional)
            // You might need to use navigation.dispatch(DrawerActions.closeDrawer())
          },
        }}
        options={{
          drawerLabel: 'Logout',
          drawerIcon: ({ color, size }) => (
            <Icon source="logout" color={color} size={size} />
          ),
          // Red tint when active (though it won't stay active)
          drawerActiveTintColor: theme.colors.error,
          drawerItemStyle: { marginTop: 20 }, // Optional: spacing from other items
          // Prevent navigation (optional, safer)
          unmountOnBlur: true,
        }}
      />
    </Drawer.Navigator>
  );
}
