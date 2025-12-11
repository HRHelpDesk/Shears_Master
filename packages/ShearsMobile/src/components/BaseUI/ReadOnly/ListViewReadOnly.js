// ListViewReadOnlyMobile.js
import React, { useState, useMemo, useContext, useEffect } from 'react';
import {
  View,
  Text,
  SectionList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { Avatar, useTheme } from 'react-native-paper';
import { singularize } from 'shears-shared/src/utils/stringHelpers';
import ReadOnlyDetailMobile from './ReadOnlyDetail';

/* -------------------------------------------------------------
   Main Read-Only List
------------------------------------------------------------- */
export default function ListViewReadOnly({
  data = [],
  fields = null,
  name = 'Item',
  appConfig,
}) {
  const theme = useTheme();

  const [search, setSearch] = useState('');
  const [finalFields, setFinalFields] = useState([]);
  const [localData, setLocalData] = useState(data);

  const [detailItem, setDetailItem] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  useEffect(() => setLocalData(data), [data]);

  /* Normalize fieldsData → flat structure */
  const normalizedData = useMemo(() => {
    return localData.map((item) =>
      item.fieldsData
        ? { ...item.fieldsData, _id: item._id, recordType: item.recordType }
        : item
    );
  }, [localData]);

  /* Load display fields */
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

  /* Search filter */
  const filteredData = useMemo(() => {
    if (!keys.length) return normalizedData;

    return normalizedData.filter((item) =>
      keys.some((field) => {
        const v = item[field];
        if (Array.isArray(v))
          return v.some((x) =>
            String(x?.value || x).toLowerCase().includes(search.toLowerCase())
          );
        return String(v || '').toLowerCase().includes(search.toLowerCase());
      })
    );
  }, [normalizedData, search, keys]);

  /* Alphabetical sections */
  const sections = useMemo(() => {
    if (!filteredData.length) return [{ title: '', data: [] }];
    if (!keys.length) return [{ title: '', data: filteredData }];

    const grouped = {};
    filteredData.forEach((item) => {
      const val = item[keys[0]];
      const letter =
        typeof val === 'string' && val.length ? val[0].toUpperCase() : '#';
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(item);
    });

    return Object.keys(grouped)
      .sort()
      .map((k) => ({ title: k, data: grouped[k] }));
  }, [filteredData, keys]);

  /* Helpers */
  const getPrimaryText = (item) => {
    if (item.firstName || item.lastName)
      return [item.firstName, item.lastName].filter(Boolean).join(' ');

    const nf = Object.keys(item).filter((k) =>
      k.toLowerCase().includes('name')
    );
    const combined = nf.map((k) => item[k]).filter(Boolean).join(' ');
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

  const buildSubText = (item) => {
    const ordered = displayFields
      .filter((f) => !['firstName', 'lastName'].includes(f.field))
      .sort((a, b) => (a.display?.order || 0) - (b.display?.order || 0));

    const lines = [];

    for (const f of ordered) {
      const val = item[f.field];
      if (!val) continue;

      if (Array.isArray(val)) {
        const out = val
          .map((x) =>
            typeof x === 'object'
              ? Object.values(x).join(' • ')
              : String(x)
          )
          .join(', ');
        lines.push(out);
        continue;
      }

      if (typeof val === 'object') {
        lines.push(
          Object.entries(val)
            .map(([k, v]) => `${v}`)
            .join(', ')
        );
        continue;
      }

      lines.push(String(val));
    }

    return lines.join('\n');
  };

  const openDetail = (item) => {
    setDetailItem(item);
    setDetailVisible(true);
  };

  /* Render item */
  const renderItem = ({ item }) => {
    const primary = getPrimaryText(item);
    const sub = buildSubText(item);

    const initials = primary
      .split(' ')
      .map((p) => p[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const avatarUrl = item.avatar?.[0]?.url;

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        onPress={() => openDetail(item)}
      >
        {avatarUrl ? (
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: theme.colors.surfaceVariant,
            }}
          >
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
            />
          </View>
        ) : (
          <Avatar.Text
            size={48}
            label={initials}
            style={{ borderRadius: 8 }}
          />
        )}

        <View style={styles.textContainer}>
          <Text style={[styles.name, { color: theme.colors.onSurface }]}>
            {primary}
          </Text>

          {sub.length > 0 && (
            <Text
              style={[styles.subText, { color: theme.colors.onSurfaceVariant }]}
            >
              {sub}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search */}
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
        keyExtractor={(item, i) => item._id || i.toString()}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionHeaderText, { color: theme.colors.primary }]}>
              {title}
            </Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 60 }}
      />

      {/* Read-only detail modal */}
      <ReadOnlyDetailMobile
        visible={detailVisible}
        onDismiss={() => setDetailVisible(false)}
        item={detailItem}
        fields={finalFields}
        name={name}
      />
    </View>
  );
}

/* -------------------------------------------------------------
   Styles
------------------------------------------------------------- */
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
    elevation: 2,
  },
  textContainer: { marginLeft: 12, flex: 1 },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  subText: { fontSize: 13, lineHeight: 18 },
  sectionHeader: { paddingBottom: 6, marginTop: 12 },
  sectionHeaderText: { fontWeight: 'bold', fontSize: 14 },
});
