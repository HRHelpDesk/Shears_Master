import React, { useEffect } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { FlatList, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Divider, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LiquidGlassView } from '@callstack/liquid-glass';

const SettingsListView = ({appConfig}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const navigation = useNavigation();
console.log('SettingsListView route.params:', appConfig);
  const flattenedSettings = Array.isArray(appConfig.settings[0]) ? appConfig.settings.flat() : appConfig.settings;

  useEffect(() => {
    console.log('🛠️ SettingsListView mounted with items:', flattenedSettings);
  }, [flattenedSettings]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.itemContainer, { backgroundColor: colors.surface }]}
      onPress={() =>
  navigation.navigate('SettingsBasePage', {
    item,
    appConfig,
  })
}
    >
      <View style={styles.row}>
        {item.icon?.android && (
          <Icon
            name={item.icon.android}
            size={24}
            color={colors.onSurfaceVariant || colors.textSecondary}
            style={styles.icon}
          />
        )}
        <Text style={[styles.title, { color: colors.onSurface }]}>
          {item.displayName || item.name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header row with title and LiquidGlass close button */}
      <View style={styles.headerRow}>
  <Text style={[styles.pageTitle, { color: colors.primary }]}>Settings</Text>
  
  <TouchableOpacity
    style={styles.editButton} // absolute positioning
    onPress={() => navigation.goBack()}
  >
    <LiquidGlassView
      style={styles.editButtonGlass} // your glass styling
      tintColor="rgba(255,255,255,0.1)"
      effect="clear"
      interactive
    >
      <Icon name="close" size={28} color={colors.primary} />
    </LiquidGlassView>
  </TouchableOpacity>
</View>


      <FlatList
        data={flattenedSettings}
        keyExtractor={(item, index) => item.name || index.toString()}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <Divider style={{ backgroundColor: colors.border }} />}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  pageTitle: { fontSize: 22, fontWeight: 'bold' },
   editButton: { position: 'absolute', top: 0, right: 10, zIndex: 2 },
  editButtonGlass: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassButton: {
    width: 20,
    height: 20,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: { padding: 0, marginTop: 25 },
  itemContainer: { paddingVertical: 14, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 12 },
  title: { fontSize: 16 },
});

export default SettingsListView;
