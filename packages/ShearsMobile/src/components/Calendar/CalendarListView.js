// src/components/CalendarListView.js
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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { deleteRecord, getRecords } from 'shears-shared/src/Services/Authentication';
import { mapFields } from 'shears-shared/src/config/fieldMapper';
import { AuthContext } from '../../context/AuthContext';
import formatTime12 from 'shears-shared/src/utils/stringHelpers';
import { LiquidGlassView } from '@callstack/liquid-glass';

/* --------------------------------------------------------------
   ⭐ FIX — SAFE LOCAL DATE PARSER (no timezone shift)
-------------------------------------------------------------- */
const parseYMD = (value) => {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(value);
  const [_, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0);
};

/* --------------------------------------------------------------
   Pretty date formatter (kept intact)
-------------------------------------------------------------- */
const formatDatePretty = (value) => {
  if (!value) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  }

  const dateObj = new Date(value);
  if (isNaN(dateObj)) return value;

  return dateObj.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

/* --------------------------------------------------------------
   Render helper for nested objects
-------------------------------------------------------------- */
const renderObjectAsLines = (obj, fieldName) => {
  if (!obj || typeof obj !== 'object') return null;

  if (fieldName === 'time' && obj.startTime) {
    const start = formatTime12(obj.startTime);
    const end = obj.endTime ? ` – ${formatTime12(obj.endTime)}` : '';
    return `${start}${end}`;
  }

  if (fieldName === 'duration' && (obj.hours || obj.minutes)) {
    const h = obj.hours && obj.hours !== '0' ? `${obj.hours}h` : '';
    const m = obj.minutes && obj.minutes !== '0' ? `${obj.minutes}m` : '';
    return [h, m].filter(Boolean).join(' ') || '0m';
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '—';

    if (obj.every((item) => item && typeof item === 'object' && 'name' in item))
      return obj.map((item) => item.name).join(', ');

    if (
      obj.every(
        (item) =>
          item && typeof item === 'object' && ('label' in item || 'value' in item)
      )
    ) {
      return obj
        .map((item) => {
          if (item.label && item.value) return `${item.label}: ${item.value}`;
          return item.value || item.label || '';
        })
        .filter(Boolean)
        .join(' • ');
    }

    return obj.map((i) => String(i)).join(', ');
  }

  if (obj.name) return obj.name;
  if (obj.label && obj.value) return `${obj.label}: ${obj.value}`;

  const parts = Object.entries(obj)
    .filter(([_, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k[0].toUpperCase() + k.slice(1)}: ${String(v)}`);

  return parts.join(' • ');
};

export default function CalendarListView(props) {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { token, user } = useContext(AuthContext);

  /* ----------------------------------------------------------------
     1️⃣ Merge route params + props
  ---------------------------------------------------------------- */
  const merged = { ...(route?.params ?? {}), ...props };

  const {
    data: propData = [],
    appConfig,
    onRefresh,
    refreshing = false,
    name = 'Calendar',
    header: headerProp,
    selectedDate, // ⭐ FIX — day passed in
    mode,         // "day" mode
  } = merged;

  const [search, setSearch] = useState('');
  const [header] = useState(headerProp);
  const [localData, setLocalData] = useState(propData);

  useEffect(() => {
    setLocalData(propData);
  }, [propData]);

  /* ----------------------------------------------------------------
     2️⃣ Fetch ONLY when not in day mode
  ---------------------------------------------------------------- */
  const fetchLocalRecords = async () => {
    try {
      const resp = await getRecords({
        recordType: 'calendar',
        token,
        subscriberId: user.subscriberId,
        userId: user.userId,
        limit: 200,
      });
      console.log('resp',resp)
      setLocalData(resp || []);
    } catch (e) {
      console.error('CalendarListView fetch error:', e);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      console.log('day')
      
        fetchLocalRecords();
      
    }, [mode])
  );

  /* ----------------------------------------------------------------
     3️⃣ View + fields
  ---------------------------------------------------------------- */
  const viewData = useMemo(() => {
    return appConfig?.mainNavigation?.find(
      (r) =>
        r.name?.toLowerCase() === 'calendar' ||
        r.displayName?.toLowerCase() === 'calendar'
    );
  }, [appConfig]);

  const listFields = useMemo(() => {
    const rawFields = viewData?.fields || [];
    return mapFields(rawFields).filter((f) => f.displayInList);
  }, [viewData]);

  /* ----------------------------------------------------------------
     4️⃣ Normalize + ⭐ FILTER BY DAY
  ---------------------------------------------------------------- */
  const normalizedData = useMemo(() => {
    let rows = localData
      .map((item) => {
        const fd = item.fieldsData || {};
        const dateStr = fd.date;

        return {
          _id: item._id,
          recordType: item.recordType,
          subscriberId: item.subscriberId,
          flatItem: {
            ...fd,
            _id: item._id,
            recordType: item.recordType,
            subscriberId: item.subscriberId,
          },
          contactName: fd.contact?.name ?? '—',
          serviceName: Array.isArray(fd.service)
            ? fd.service.map((s) => s.name).join(', ')
            : fd.service?.name ?? '—',
          date: dateStr,
          dateObj: parseYMD(dateStr), // ⭐ FIX
          startTime: fd.time?.startTime,
          endTime: fd.time?.endTime,
          timeValue: fd.time?.startTime
            ? parseInt(fd.time.startTime.replace(':', ''), 10)
            : 9999,
        };
      })
      .filter((i) => i.dateObj);

    /* --------------------------------------------------------------
       ⭐ CRITICAL FIX — EXACT DAY MATCHING
    -------------------------------------------------------------- */
    if (selectedDate) {
      const target = parseYMD(selectedDate);

      rows = rows.filter((item) => {
        const d = item.dateObj;
        return (
          d.getFullYear() === target.getFullYear() &&
          d.getMonth() === target.getMonth() &&
          d.getDate() === target.getDate()
        );
      });
    }

    return rows;
  }, [localData, selectedDate]);

  /* ----------------------------------------------------------------
     5️⃣ Searching
  ---------------------------------------------------------------- */
  const filteredData = useMemo(() => {
    if (!search) return normalizedData;

    const lower = search.toLowerCase();

    return normalizedData.filter((item) => {
      if (
        item.contactName.toLowerCase().includes(lower) ||
        item.serviceName.toLowerCase().includes(lower)
      )
        return true;

      return listFields.some((field) => {
        const val = item.flatItem[field.field];
        if (!val) return false;

        const str = renderObjectAsLines(val, field.field) || String(val);
        return str.toLowerCase().includes(lower);
      });
    });
  }, [normalizedData, search, listFields]);

  /* ----------------------------------------------------------------
     6️⃣ Group into sections (even in day mode)
  ---------------------------------------------------------------- */
  const sections = useMemo(() => {
    const groups = {};

    filteredData.forEach((item) => {
      const key = item.dateObj.toISOString().split('T')[0];
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return Object.keys(groups)
      .map((dateKey) => {
        const sorted = groups[dateKey].sort((a, b) => a.timeValue - b.timeValue);
        return { title: formatDatePretty(dateKey), data: sorted, dateKey };
      })
      .sort((a, b) => new Date(a.dateKey) - new Date(b.dateKey));
  }, [filteredData]);

  /* ----------------------------------------------------------------
     7️⃣ Delete + render logic
  ---------------------------------------------------------------- */
  const handleDelete = (id) => {
    Alert.alert('Delete appointment?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecord(id, token);
            setLocalData((prev) => prev.filter((i) => i._id !== id));
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);
  };

  const renderRightActions = (item) => (
    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => {
    const initials =
      item.contactName
        .split(' ')
        .map((p) => p[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || '?';

    const extraLines = listFields
      .filter((f) => !['contact', 'service'].includes(f.field))
      .map((field) => {
        const raw = item.flatItem[field.field];
        if (!raw) return null;

        let txt = renderObjectAsLines(raw, field.field);
        if (!txt && typeof raw !== 'object') txt = String(raw);
        if (field.field === 'date') txt = formatDatePretty(raw);

        return txt ? (
          <Text key={field.field} style={[styles.tertiary, { color: theme.colors.onSurfaceVariant }]}>
            {txt}
          </Text>
        ) : null;
      });

    return (
      <Swipeable renderRightActions={() => renderRightActions(item)}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.colors.surface }]}
          onPress={() =>
            navigation.navigate('ListItemDetail', {
              item: item.flatItem,
              name: 'Calendar',
              appConfig,
              fields: mapFields(viewData?.fields || []),
              mode: 'read',
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
            <Text style={[styles.primary, { color: theme.colors.onSurface }]}>
              {item.contactName}
            </Text>

            <Text style={[styles.secondary, { color: theme.colors.onSurfaceVariant }]}>
              {item.serviceName}
            </Text>

            {extraLines}
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const renderSectionHeader = ({ section }) => (
    <View style={[styles.sectionHeader, { backgroundColor: 'transparent' }]}>
      <Text style={[styles.sectionHeaderText, { color: theme.colors.primary }]}>
        {section.title}
      </Text>
    </View>
  );

  /* ----------------------------------------------------------------
     8️⃣ Render
  ---------------------------------------------------------------- */
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {header && (
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.editButton} onPress={() => navigation.goBack()}>
            <LiquidGlassView
              style={styles.editButtonGlass}
              tintColor="rgba(255,255,255,0.1)"
              effect="clear"
              interactive
            >
              <Icon name="close" size={28} color={theme.colors.primary} />
            </LiquidGlassView>
          </TouchableOpacity>
        </View>
      )}

      <TextInput
        style={[
          styles.searchInput,
          {
            borderColor: theme.colors.primary,
            color: theme.colors.onSurface,
            backgroundColor: theme.colors.surface,
          },
        ]}
        placeholder="Search appointments..."
        placeholderTextColor={theme.colors.onSurfaceVariant}
        value={search}
        onChangeText={setSearch}
      />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled
        contentContainerStyle={{ paddingBottom: 80, paddingTop: 5, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>No appointments found.</Text>
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
            name: 'Calendar',
            appConfig,
            mode: 'add',
            fields: mapFields(viewData?.fields || []),
          })
        }
      />
    </View>
  );
}

/* -----------------------------------------------------------------
   Styles
----------------------------------------------------------------- */
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
  primary: { fontSize: 16, fontWeight: '600' },
  secondary: { fontSize: 13, marginTop: 2 },
  tertiary: { fontSize: 12, marginTop: 2, fontStyle: 'italic' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  sectionHeader: {
    paddingBottom: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginTop: 12,
  },
  sectionHeaderText: { fontWeight: 'bold', fontSize: 14 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 100 : 20,
    borderRadius: 30,
    elevation: 5,
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingBottom: 60,
  },
  editButton: { position: 'absolute', right: 10 },
  editButtonGlass: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
