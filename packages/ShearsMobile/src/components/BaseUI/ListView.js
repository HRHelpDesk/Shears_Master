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
  Image,
} from 'react-native';
import { useTheme, FAB } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { singularize } from 'shears-shared/src/utils/stringHelpers';
import { deleteRecord } from 'shears-shared/src/Services/Authentication';
import { AuthContext } from '../../context/AuthContext';

/* -------------------------------------------------------------------------- */
/* 🔠 Primary Text Resolver (matches Web)                                      */
/* -------------------------------------------------------------------------- */
function getPrimaryText(item) {
  if (!item || typeof item !== 'object') return 'Untitled';

  // 1. first + last
  if (item.firstName || item.lastName) {
    return [item.firstName, item.lastName].filter(Boolean).join(' ');
  }

  // 2. any “name” fields (but support nested objects!)
  const nameFields = Object.keys(item).filter((k) =>
    k.toLowerCase().includes('name')
  );

  for (const key of nameFields) {
    const val = item[key];

    if (typeof val === 'string' && val.trim()) {
      return val; // direct name string
    }

    if (val && typeof val === 'object' && !Array.isArray(val)) {
      // try nested shape
      if (val.name) return val.name;
      if (val.fullName) return val.fullName;
      if (val.raw?.fullName) return val.raw.fullName;
      if (val.raw?.name) return val.raw.name;
      if (val.raw?.productName) return val.raw.productName;
      if (val.raw?.serviceName) return val.raw.serviceName;
    }
  }

  // 3. Deep nested fallback
  const nested = Object.values(item).find(
    (v) =>
      v &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      (v.name ||
        v.fullName ||
        v.raw?.name ||
        v.raw?.fullName ||
        v.raw?.productName ||
        v.raw?.serviceName)
  );

  if (nested) {
    return (
      nested.name ||
      nested.fullName ||
      nested.raw?.name ||
      nested.raw?.fullName ||
      nested.raw?.productName ||
      nested.raw?.serviceName
    );
  }

  // 4. Fallbacks
  return item.title || item.description || item.email || 'Untitled';
}


/* -------------------------------------------------------------------------- */
/* 🖼️ Avatar URL Resolver (handles nested raw.avatar etc.)                     */
/* -------------------------------------------------------------------------- */
function getAvatarUrl(item) {
  if (!item || typeof item !== 'object') return null;

  // Direct avatar field
  if (item.avatar) {
    // array-style [{ url }]
    if (Array.isArray(item.avatar) && item.avatar[0]?.url) {
      return item.avatar[0].url;
    }
    // string URL
    if (typeof item.avatar === 'string') return item.avatar;
  }

  if (item.avatarUrl && typeof item.avatarUrl === 'string') {
    return item.avatarUrl;
  }

  // Look into nested objects for raw.avatar / raw.avatarUrl / etc.
  for (const v of Object.values(item)) {
    if (!v || typeof v !== 'object' || Array.isArray(v)) continue;

    // If it's your { name, raw: { ...user } } shape
    if (v.raw) {
      const r = v.raw;
      if (Array.isArray(r.avatar) && r.avatar[0]?.url) return r.avatar[0].url;
      if (typeof r.avatar === 'string') return r.avatar;
      if (typeof r.avatarUrl === 'string') return r.avatarUrl;
      if (typeof r.profileImage === 'string') return r.profileImage;
      if (typeof r.photo === 'string') return r.photo;
    }

    // Or just nested.avatar
    if (Array.isArray(v.avatar) && v.avatar[0]?.url) return v.avatar[0].url;
    if (typeof v.avatar === 'string') return v.avatar;
    if (typeof v.avatarUrl === 'string') return v.avatarUrl;
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* 🧾 MAIN COMPONENT                                                           */
/* -------------------------------------------------------------------------- */
export default function ListView({
  data = [],
  fields = null,
  name = 'Item',
  appConfig,
  type = 'alphabetical',
  recordType = null,
  onRefresh,
  refreshing = false,
}) {
  const theme = useTheme();
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [finalFields, setFinalFields] = useState([]);
  const [localData, setLocalData] = useState(data);
  const { token } = useContext(AuthContext);

  // Sync incoming data
  useEffect(() => {
    console.log("Record Type in ListView:", recordType);  
    setLocalData(data);
  }, [data]);

  // Flatten fieldsData into top-level, keep _id + recordType
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
      const primary = getPrimaryText(item);
      const key = primary?.[0]?.toUpperCase() || '#';
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
  /* ✅ 🧠 Smart SubText Builder                                                */
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

      // ARRAY
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
              keys.find((k) => k.toLowerCase().includes('number')) ||
              keys.find((k) => k.toLowerCase().includes('platform'));

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

      // OBJECT
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

      // SCALAR
      lines.push(`${label}: ${String(val)}`);
    }

    return lines.join('\n');
  };

  /* -------------------------------------------------------------------------- */
  /* ✅ Render Item                                                              */
  /* -------------------------------------------------------------------------- */
  const renderItem = ({ item }) => {
    const primary = getPrimaryText(item);
    const subText = buildSubText(item);

    const avatarUrl = getAvatarUrl(item);

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
              recordType,
              fields: finalFields,
            })
          }
        >
          {/* Avatar / Initials */}
          <View style={{ marginRight: 12 }}>
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
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  backgroundColor: theme.colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: theme.colors.onPrimary,
                    fontSize: 18,
                    fontWeight: 'bold',
                  }}
                >
                  {initials}
                </Text>
              </View>
            )}
          </View>

          {/* Text */}
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
            recordType,
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
