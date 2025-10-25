// src/components/UI/AppBar.js
import * as React from 'react';
import { Appbar } from 'react-native-paper';

export default function AppBar({ title, onMenuPress, onProfilePress }) {
  return (
    <Appbar.Header elevated>
      {onMenuPress && <Appbar.Action icon="menu" onPress={onMenuPress} />}
      <Appbar.Content  title={title} />
      {onProfilePress && <Appbar.Action icon="account" onPress={onProfilePress} />}
    </Appbar.Header>
  );
}
