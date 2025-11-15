// ListView.js
import React, { useState, useMemo, useContext, useEffect } from 'react';
import {
  View,
  Text,
  SectionList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { Avatar, useTheme, FAB } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { singularize } from 'shears-shared/src/utils/stringHelpers';
import { deleteRecord } from 'shears-shared/src/Services/Authentication';
import { AuthContext } from '../../context/AuthContext';

export default function ListView({
  data = [],
  fields = null,
  name = 'Item',
  appConfig,
  type = 'alphabetical',
  onRefresh,
  refreshing = false,
}) {
  const theme = useTheme();
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [finalFields, setFinalFields] = useState([]);
  const [localData, setLocalData] = useState(data);
  const { token } = useContext(AuthContext);

  // Sync updates
  useEffect(() => setLocalData(data), [data]);

  const normalizedData = useMemo(() => {
    return localData.map((item) =>
      item.fieldsData
        ? { ...item.fieldsData, _id: item._id, recordType: item.recordType }
        : item
    );
  }, [localData]);


  /* -------------------------------------------------------------------------- */
  /* ✅ Load Display Fields                                                     */
  /* -------------------------------------------------------------------------- */
  const displayFields = useMemo(() => {
    let appFields = [];

    if (fields?.length) {
      appFields = fields;
    } else if (appConfig) {
      const route = appConfig.mainNavigation.find(
        (r) =>
          r.displayName?.toLowerCase() === name.toLowerCase() ||
          r.name?.toLowerCase() === name.toLowerCase()
      );
      appFields = route?.fields || [];
    }

    setFinalFields(appFields);
    return appFields.filter((f) => f.displayInList === true);
  }, [fields, appConfig, name]);

  const keys = displayFields.map((f) => f.field);

  /* -------------------------------------------------------------------------- */
  /* ✅ Search Filter                                                           */
  /* -------------------------------------------------------------------------- */
  const filteredData = useMemo(() => {
    if (!keys.length) return normalizedData;

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

  /* -------------------------------------------------------------------------- */
  /* ✅ Alphabetical Grouping                                                   */
  /* -------------------------------------------------------------------------- */
  const sections = useMemo(() => {
    if (!filteredData.length) return [{ title: '', data: [] }];
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
      .map((k) => ({ title: k, data: grouped[k] }));
  }, [filteredData, keys]);

  /* -------------------------------------------------------------------------- */
  /* ✅ Delete Action                                                            */
  /* -------------------------------------------------------------------------- */
  const handleDelete = (id) => {
    Alert.alert(
      'Delete record?',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecord(id, token);
              setLocalData((prev) => prev.filter((i) => i._id !== id));
            } catch (err) {
              console.error('Delete failed', err);
            }
          },
        },
      ]
    );
  };

  const renderRightActions = (item) => (
    <TouchableOpacity
      style={styles.deleteBtn}
      onPress={() => handleDelete(item._id)}
    >
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );

  /* -------------------------------------------------------------------------- */
  /* ✅ 🧠 Smart SubText Builder (Clean Labels + Inline Arrays)                  */
  /* -------------------------------------------------------------------------- */
  const buildSubText = (item) => {
    const orderedFields = displayFields
      .filter((f) => !['firstName', 'lastName'].includes(f.field))
      .sort((a, b) => (a.display?.order || 0) - (b.display?.order || 0));

    const lines = [];

    for (const field of orderedFields) {
      const val = item[field.field];
      if (val === undefined || val === null || val === '') continue;

      const label = field.label || field.field;

      /* ✅ ARRAY FIELDS (phones, emails, addresses, tags, categories) */
      if (field.type === 'array') {
        if (Array.isArray(val) && val.length > 0) {
          const formattedItems = val.map((entry) => {
            if (typeof entry !== 'object') {
              return String(entry);
            }

            const keys = Object.keys(entry);

            const labelKey =
              keys.find((k) => k.toLowerCase() === 'label') ||
              keys.find((k) => k.toLowerCase().includes('label'));

            const valueKey =
              keys.find((k) => k.toLowerCase() === 'value') ||
              keys.find((k) => k.toLowerCase().includes('phone')) ||
              keys.find((k) => k.toLowerCase().includes('email')) ||
              keys.find((k) => k.toLowerCase().includes('number'));

            if (labelKey && valueKey) {
              return `${entry[labelKey]} • ${entry[valueKey]}`;
            }

            const parts = keys
              .map((k) => (entry[k] ? `${entry[k]}` : null))
              .filter(Boolean);

            return parts.join(' • ');
          });

          lines.push(formattedItems.join(', '));
        }
        continue;
      }

      /* ✅ OBJECT FIELDS (payment, duration, time, supplier) */
      if (field.type === 'object' && field.objectConfig && typeof val === 'object') {
        const parts = field.objectConfig
          .map((sub) => {
            const v = val[sub.field];
            if (!v) return null;
            return `${sub.label}: ${v}`;
          })
          .filter(Boolean);

        if (parts.length) lines.push(`${label}: ${parts.join(', ')}`);
        continue;
      }

      /* ✅ SCALAR FIELDS */
      lines.push(`${label}: ${String(val)}`);
    }

    return lines.join('\n');
  };

  /* -------------------------------------------------------------------------- */
  /* ✅ Smart Primary Title                                                      */
  /* -------------------------------------------------------------------------- */
  const getPrimaryText = (item) => {
    if (item.firstName || item.lastName)
      return [item.firstName, item.lastName].filter(Boolean).join(' ');

    const nameFields = Object.keys(item).filter((k) =>
      k.toLowerCase().includes('name')
    );

    const combined = nameFields.map((k) => item[k]).filter(Boolean).join(' ');
    if (combined) return combined;

    const nested = Object.values(item).find(
      (v) =>
        v &&
        typeof v === 'object' &&
        !Array.isArray(v) &&
        (v.name || v.productName || v.serviceName)
    );

    if (nested) return nested.name || nested.productName || nested.serviceName;

    return item.title || item.description || 'Untitled';
  };

  /* -------------------------------------------------------------------------- */
  /* ✅ Render Item                                                              */
  /* -------------------------------------------------------------------------- */
  const renderItem = ({ item }) => {
    const primary = getPrimaryText(item);
    const subText = buildSubText(item);

    const initials =
      primary
        .split(' ')
        .map((p) => p[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || '?';

    return (
      <Swipeable renderRightActions={() => renderRightActions(item)}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.colors.surface }]}
          onPress={() =>
            navigation.navigate('ListItemDetail', {
              item,
              name,
              appConfig,
              fields: finalFields,
            })
          }
        >
          <Avatar.Text
            size={48}
            label={initials}
            style={{ backgroundColor: theme.colors.primary }}
            color={theme.colors.onPrimary}
          />

          <View style={styles.textContainer}>
            <Text style={[styles.name, { color: theme.colors.onSurface }]}>
              {primary}
            </Text>

            {!!subText && (
              <Text style={[styles.subText, { color: theme.colors.onSurfaceVariant }]}>
                {subText}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
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
            backgroundColor: theme.colors.surface,
            color: theme.colors.onSurface,
          },
        ]}
        placeholder={`Search ${singularize(name)}...`}
        placeholderTextColor={theme.colors.onSurfaceVariant}
        value={search}
        onChangeText={setSearch}
      />

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item._id ?? index.toString()}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              No {name} found.
            </Text>
          </View>
        }
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() =>
          navigation.navigate('ListItemDetail', {
            item: {},
            name,
            mode: 'add',
            appConfig,
            fields: finalFields,
          })
        }
      />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* ✅ Styles                                                                   */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  searchInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 10,
    fontSize: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    marginBottom: 8,
    borderRadius: 14,
    elevation: 3,
  },
  deleteBtn: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 12,
    marginBottom: 8,
  },
  deleteText: { color: 'white', fontWeight: 'bold' },
  textContainer: { marginLeft: 12, flex: 1 },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  subText: { fontSize: 13, lineHeight: 18 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  sectionHeader: { paddingBottom: 6, paddingHorizontal: 10, marginTop: 12 },
  sectionHeaderText: { fontWeight: 'bold', fontSize: 14 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 100 : 20,
    borderRadius: 30,
  },
});
