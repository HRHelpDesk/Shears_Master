// ListView.js
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Avatar, useTheme, FAB } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { singularize } from 'shears-shared/src/utils/stringHelpers';
import { mapFields } from 'shears-shared/src/config/fieldMapper';

export default function ListView({
  data = [],
  fields = null,
  name = 'Item',
  appConfig,
  type = 'alphabetical',
  onRefresh,
  refreshing = false, // 👈 controlled by BasePage
}) {
  const theme = useTheme();
  const navigation = useNavigation();
  const [search, setSearch] = useState('');

  // ✅ Normalize data for display
  const normalizedData = useMemo(() => {
    return data.map((item) =>
      item.fieldsData
        ? { ...item.fieldsData, _id: item._id, recordType: item.recordType, subscriberId: item.subscriberId }
        : item
    );
  }, [data]);

  // ✅ Map visible fields
  const displayFields = useMemo(() => {
    let appFields = [];
    if (fields?.length) appFields = fields;
    else if (appConfig) {
      const route = appConfig.mainNavigation.find(
        (r) =>
          r.displayName?.toLowerCase() === name.toLowerCase() ||
          r.name?.toLowerCase() === name.toLowerCase()
      );
      appFields = route?.fields || [];
    }
    const normalized = mapFields(appFields);
    return normalized.filter((f) => f.displayInList === true);
  }, [fields, appConfig, name]);

  const keys = displayFields.map((f) => f.field);

  const handleRefresh = async () => {
    if (onRefresh) await onRefresh();
  };

  // ✅ Apply search filtering
  const filteredData = useMemo(() => {
    return normalizedData.filter((item) =>
      keys.some((field) => {
        const value = item[field];
        if (Array.isArray(value))
          return value.some((v) =>
            String(v.value || v).toLowerCase().includes(search.toLowerCase())
          );
        return String(value || '').toLowerCase().includes(search.toLowerCase());
      })
    );
  }, [normalizedData, search, keys]);

  // ✅ Group by first letter
  const sections = useMemo(() => {
    if (!keys.length) return [{ title: '', data: filteredData }];
    const grouped = {};
    filteredData.forEach((item) => {
      const val = item[keys[0]];
      const key =
        typeof val === 'string' && val.length ? val[0].toUpperCase() : '#';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    return Object.keys(grouped)
      .sort()
      .map((key) => ({ title: key, data: grouped[key] }));
  }, [filteredData, keys]);

  // ✅ Render list item
  const renderItem = ({ item }) => {
    const nameFields = Object.keys(item).filter((k) => k.toLowerCase().includes('name'));
    let primaryText = nameFields.map((k) => item[k]).filter(Boolean).join(' ');

    if (!primaryText)
      primaryText =
        item.title ||
        item.serviceName ||
        item.description ||
        item.email ||
        'Untitled';

    const orderedFields = displayFields
      .filter((f) => !['firstName', 'lastName'].includes(f.field))
      .sort((a, b) => (a.display?.order || 0) - (b.display?.order || 0));

    const subTexts = [];

    for (const field of orderedFields) {
      const value = item[field.field];
      if (!value && value !== 0) continue;

      if (Array.isArray(value) && value.length > 0) {
        const firstItem = value[0];
        if (firstItem && typeof firstItem === 'object') {
          subTexts.push(
            Object.values(firstItem)
              .filter(Boolean)
              .join(' • ')
          );
        } else {
          subTexts.push(String(firstItem));
        }
      } else if (field.type === 'object' && field.objectConfig) {
        const parts = field.objectConfig
          .map((sub) => {
            const val = value?.[sub.field];
            return val ? `${val} ${sub.label.toLowerCase()}` : null;
          })
          .filter(Boolean);
        if (parts.length) subTexts.push(parts.join(' '));
      } else {
        subTexts.push(String(value));
      }
    }

    const subText = subTexts.join('\n');
    const initials =
      !item.avatar &&
      (primaryText
        .split(' ')
        .map((part) => part[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || '?');

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            shadowColor: theme.colors.onSurface,
          },
        ]}
        onPress={() =>
          navigation.navigate('ListItemDetail', { item, name, appConfig })
        }
      >
        {item.avatar ? (
          <Avatar.Image size={48} source={{ uri: item.avatar }} />
        ) : (
          <Avatar.Text
            size={48}
            label={initials}
            style={{ backgroundColor: theme.colors.primary }}
            color={theme.colors.onPrimary}
          />
        )}
        <View style={styles.textContainer}>
          <Text style={[styles.name, { color: theme.colors.onSurface }]}>
            {primaryText}
          </Text>
          {!!subText && (
            <Text style={[styles.subText, { color: theme.colors.onSurfaceVariant }]}>
              {subText}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ✅ Render section header
  const renderSectionHeader = ({ section: { title } }) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.sectionHeaderText, { color: theme.colors.primary }]}>
        {title}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TextInput
        style={[
          styles.searchInput,
          {
            borderColor: theme.colors.primary,
            color: theme.colors.onSurface,
            backgroundColor: theme.colors.surface,
          },
        ]}
        placeholder={`Search ${singularize(name)}...`}
        placeholderTextColor={theme.colors.onSurfaceVariant}
        value={search}
        onChangeText={setSearch}
      />

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item._id?.toString() || index.toString()}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled
        contentContainerStyle={{ paddingBottom: 80, paddingTop: 5, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              No {name} found.
            </Text>
          </View>
        }
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() =>
          navigation.navigate('ListItemDetail', {
            item: {},
            name,
            appConfig,
            mode: 'add',
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  searchInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 10,
    fontSize: 16,
    elevation: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  textContainer: { marginLeft: 12, flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  subText: { fontSize: 13, marginTop: 2 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  sectionHeader: { paddingBottom: 6, paddingHorizontal: 10, borderRadius: 6, marginTop: 12 },
  sectionHeaderText: { fontWeight: 'bold', fontSize: 14 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 100 : 20,
    borderRadius: 30,
    elevation: 5,
  },
});
