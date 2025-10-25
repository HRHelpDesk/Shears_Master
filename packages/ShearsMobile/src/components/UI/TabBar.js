// packages/mobile/src/components/TabBar.js
import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTheme } from 'react-native-paper';

const TopTab = createMaterialTopTabNavigator();

export default function TabBar({ views = [], dynamicProps }) {
  const theme = useTheme();

  return (
    <TopTab.Navigator
      screenOptions={{
        tabBarScrollEnabled: false,
        tabBarIndicatorStyle: { backgroundColor: theme.colors.primary },
        tabBarLabelStyle: {
          fontWeight: 'bold',
          color: theme.colors.text,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
        },
      }}
    >
      {views.map((view, index) => (
        <TopTab.Screen
          key={index}
          name={view.displayName || view.name}
          children={() => <view.component {...dynamicProps} />}
        />
      ))}
    </TopTab.Navigator>
  );
}
