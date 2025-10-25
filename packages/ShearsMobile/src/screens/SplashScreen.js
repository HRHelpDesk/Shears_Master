// packages/mobile/src/screens/SplashScreen.js
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ActivityIndicator, useTheme } from 'react-native-paper';

export default function SplashScreen({ logo }) {
  const theme = useTheme();

  // Use primary/secondary from theme for gradient fallback
  const gradientColors = [
    theme.colors.primary || '#4A90E2',
    theme.colors.secondary || '#50E3C2',
  ];

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <Image source={logo} style={styles.logo} resizeMode="contain" />
      <ActivityIndicator
        size="large"
        color={theme.colors.onPrimary || '#fff'}
        style={styles.spinner}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo: { width: 200, height: 200 },
  spinner: { marginTop: 20 },
});
