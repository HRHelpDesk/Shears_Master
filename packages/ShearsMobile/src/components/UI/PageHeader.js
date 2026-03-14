// src/components/UI/PageHeader.js
import React, { useContext } from 'react';
import { Appbar } from 'react-native-paper';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from 'react-native-paper';
import { AuthContext } from '../../context/AuthContext';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // ← Add this

export default function PageHeader({ title }) {
  const theme = useTheme();
  const navigation = useNavigation();
  const { logout } = useContext(AuthContext);
  const insets = useSafeAreaInsets(); // ← Add this

  return (
    <Appbar.Header
      statusBarHeight={insets.top} // ← Use actual inset instead of hardcoded value
      elevated
      style={[styles.header, { backgroundColor: theme.colors.primary }]}
    >
      <View style={styles.titleContainer}>
        <Appbar.Content
          title={title}
          titleStyle={[styles.title, { color: theme.colors.onPrimary }]}
        />
      </View>

      <Appbar.Action
        icon="menu"
        color={theme.colors.onPrimary}
        onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      />
    </Appbar.Header>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 40
  },
  titleContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 16,
  },
  title: {
    fontSize: 18,
    textAlign: 'left',
    fontWeight: 'bold',
  },
});