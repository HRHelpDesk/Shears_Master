// src/navigation/SettingsStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsListView from '../components/BaseUI/SettingsListView';
import SettingsBasePage from '../screens/SettingsBasePage';

const Stack = createNativeStackNavigator();

export default function SettingsStack({ appConfig }) {

console.log('SettingsStack appConfig:', appConfig);
    
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        presentation:'modal'
       
      }}
    >
      <Stack.Screen name="SettingsList"
      children={()=> <SettingsListView appConfig={appConfig}/>}
      />
      
  <Stack.Screen name="SettingsBasePage" component={SettingsBasePage} />
    </Stack.Navigator>
  );
}
