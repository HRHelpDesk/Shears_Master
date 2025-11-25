// TransactionListView.js
import React, { useState, useMemo, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Platform,
} from 'react-native';
import { useTheme, Divider, FAB } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import {  formatDateValue, singularize } from 'shears-shared/src/utils/stringHelpers';
import { AuthContext } from '../../context/AuthContext';

export default function TransactionListView({
  data = [],
  fields = null,
  name = 'Transactions',
  appConfig,
  onRefresh,
  refreshing = false,
}) {
  const theme = useTheme();
  const navigation = useNavigation();

  const [search, setSearch] = useState('');
  const [localData, setLocalData] = useState(data);

  useEffect(() => setLocalData(data), [data]);

  /* ------------------------------------------------------------ */
  /* Normalize fieldsData                                          */
  /* ------------------------------------------------------------ */
  const normalizedData = useMemo(() => {
    return localData.map((item) =>
      item.fieldsData
        ? { ...item.fieldsData, _id: item._id, recordType: item.recordType }
        : item
    );
  }, [localData]);

  /* ------------------------------------------------------------ */
  /* Load display fields                                           */
  /* ------------------------------------------------------------ */
  const displayFields = useMemo(() => {
    if (fields?.length) return fields.filter((f) => f.displayInList);
    if (!appConfig) return [];

    const route = appConfig.mainNavigation.find(
      (r) =>
        r.displayName?.toLowerCase() === name.toLowerCase() ||
        r.name?.toLowerCase() === name.toLowerCase()
    );

    return (route?.fields || []).filter((f) => f.displayInList);
  }, [fields, appConfig, name]);

  const keys = displayFields.map((f) => f.field);

  /* ------------------------------------------------------------ */
  /* Search                                                        */
  /* ------------------------------------------------------------ */
  const filteredData = useMemo(() => {
    if (!keys.length) return normalizedData;

    return normalizedData.filter((item) =>
      keys.some((field) =>
        String(item[field] || '')
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    );
  }, [normalizedData, search, keys]);

  /* ------------------------------------------------------------ */
  /* Sort newest-first (based on _id or date field)                */
  /* ------------------------------------------------------------ */
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      // If there is a date field, sort by it (recommended)
      const dateField = displayFields.find((f) =>
        f.field.toLowerCase().includes('date')
      );

      if (dateField && a[dateField.field] && b[dateField.field]) {
        return new Date(b[dateField.field]) - new Date(a[dateField.field]);
      }

      // Otherwise fallback to Mongo _id timestamp
      return b._id.localeCompare(a._id);
    });
  }, [filteredData, displayFields]);

  /* ------------------------------------------------------------ */
  /* Helpers: Primary + Subtext                                    */
  /* ------------------------------------------------------------ */
  const getPrimaryText = (item) => {
    const nameFields = Object.keys(item).filter((k) =>
      k.toLowerCase().includes('name')
    );
    const combined = nameFields.map((k) => item[k]).join(' ').trim();

    return combined || item.title || item.description || 'Untitled';
  };

  const getSubText = (item) => {
  const parts = [];

  for (const f of displayFields) {
    if (f.field.includes('name')) continue;

    let value = item[f.field];
    if (!value) continue;

    // 🟦 NEW — Auto-format date fields
    if (f.field.toLowerCase().includes('date')) {
      value = formatDateValue(value);
    }

    parts.push(`${f.label || f.field}: ${value}`);
  }

  return parts.join('\n'); // stacked subtext
};


  /* ------------------------------------------------------------ */
  /* Row renderer                                                  */
  /* ------------------------------------------------------------ */
  const renderItem = ({ item }) => {
    const primary = getPrimaryText(item);
    const sub = getSubText(item);

    return (
      <View>
        <TouchableOpacity
          style={[
            styles.row,
            { backgroundColor: theme.colors.surface },
          ]}
          onPress={() =>
            navigation.navigate('ListItemDetail', {
              item,
              name,
              fields,
              mode: 'read',
              appConfig,
            })
          }
        >
          <Text style={[styles.primary, { color: theme.colors.onSurface }]}>
            {primary}
          </Text>

          {!!sub && (
            <Text
              style={[styles.sub, { color: theme.colors.onSurfaceVariant }]}
            >
              {sub}
            </Text>
          )}
        </TouchableOpacity>

        <Divider style={styles.fullDivider} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search */}
      <TextInput
        style={[
          styles.search,
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

      <FlatList
        data={sortedData}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 40, opacity: 0.5 }}>
            No {name} found.
          </Text>
        }
      />

      {/* FAB */}
      <FAB
        icon="plus"
        style={[
          styles.fab,
          { backgroundColor: theme.colors.primary },
        ]}
        color={theme.colors.onPrimary}
        onPress={() =>
          navigation.navigate('ListItemDetail', {
            item: {},
            name,
            fields,
            mode: 'add',
            appConfig,
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },

  search: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    fontSize: 16,
  },

  row: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },

  primary: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },

  sub: {
    fontSize: 13,
    lineHeight: 18,
    whiteSpace: 'pre-line',
  },

  fullDivider: {
    width: '100%',
    height: 1,
    opacity: 0.4,
  },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 90 : 20,
    borderRadius: 30,
  },
});
