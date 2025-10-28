// src/components/UI/PageHeader.js
import React, { useContext } from 'react';
import { Appbar } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { AuthContext } from '../../context/AuthContext';
import { useNavigation, DrawerActions } from '@react-navigation/native';

export default function PageHeader({ title }) {
  const theme = useTheme();
  const navigation = useNavigation();
  const { logout } = useContext(AuthContext);

  return (
    <Appbar.Header
      statusBarHeight={30}
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
    height: 56,
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
    marginBottom: 0,
    marginTop: 20,
    fontWeight: 'bold',
  },
});
