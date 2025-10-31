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
import { useNavigation, useRoute } from '@react-navigation/native'; // Added useRoute
import { Swipeable } from 'react-native-gesture-handler';
import { deleteRecord } from 'shears-shared/src/Services/Authentication';
import { mapFields } from 'shears-shared/src/config/fieldMapper';
import { AuthContext } from '../../context/AuthContext';
import formatTime12 from 'shears-shared/src/utils/stringHelpers';
import { LiquidGlassView } from '@callstack/liquid-glass';

/* --------------------------------------------------------------
   Helper – pretty date
   -------------------------------------------------------------- */
const formatDatePretty = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const renderObjectAsLines = (obj, fieldName) => {
  if (!obj || typeof obj !== 'object') return null;

  // 🕐 Time range
  if (fieldName === 'time' && obj.startTime) {
    const start = formatTime12(obj.startTime);
    const end = obj.endTime ? ` – ${formatTime12(obj.endTime)}` : '';
    return `${start}${end}`;
  }

  // ⏱ Duration (e.g., 1h 30m)
  if (fieldName === 'duration' && (obj.hours || obj.minutes)) {
    const h = obj.hours && obj.hours !== '0' ? `${obj.hours}h` : '';
    const m = obj.minutes && obj.minutes !== '0' ? `${obj.minutes}m` : '';
    return [h, m].filter(Boolean).join(' ') || '0m';
  }

  // 🧾 Arrays
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '—';

    // ✅ Case 1: Array of linked items (services, contacts, etc.)
    const hasNames = obj.every((item) => item && typeof item === 'object' && 'name' in item);
    if (hasNames) {
      return obj.map((item) => item.name).join(', ');
    }

    // ✅ Case 2: Array of label/value pairs
    const hasLabels = obj.every(
      (item) => item && typeof item === 'object' && ('label' in item || 'value' in item)
    );
    if (hasLabels) {
      return obj
        .map((item) => {
          if (item.label && item.value) return `${item.label}: ${item.value}`;
          return item.value || item.label || '';
        })
        .filter(Boolean)
        .join(' • ');
    }

    // ✅ Case 3: Fallback – primitive array
    return obj.map((i) => String(i)).join(', ');
  }

  // 🧱 Single object fallback
  if (obj.name) return obj.name; // handle single linked object
  if (obj.label && obj.value) return `${obj.label}: ${obj.value}`;

  const parts = Object.entries(obj)
    .filter(([_, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k[0].toUpperCase() + k.slice(1)}: ${String(v)}`);

  return parts.join(' • ');
};


export default function CalendarListView({
  data: propData = [], // from parent component
  appConfig,
  onRefresh,
  refreshing = false,
  name
}) {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute(); // Get route params
  const [search, setSearch] = useState('');
  const { token } = useContext(AuthContext);

  // Determine final data source
  const data = route.params?.data || propData;
  const [header, setHeader] = useState(route.params?.header);

  const [localData, setLocalData] = useState(data);
  const viewData = appConfig.mainNavigation.find((r) => r.name === name);

  useEffect(() => {
    
    setLocalData(data);
    console.log("AppConfig", appConfig);
    console.log("name", name);

    console.log("viewData", viewData);

    console.log("CalendarListView data source:", route.params?.data ? "route.params.data" : "propData");
    console.log("Final data:", data);
    
  }, [data]);


  const listFields = useMemo(() => {
    const routeConfig = appConfig?.mainNavigation?.find(
      (r) =>
        r.name?.toLowerCase() === 'calendar' ||
        r.displayName?.toLowerCase() === 'calendar'
    );
    const rawFields = routeConfig?.fields || [];
    console.log('CalendarListView listFields', rawFields);
    const mapped = mapFields(rawFields);
    return mapped.filter((f) => f.displayInList);
  }, [appConfig]);

  const normalizedData = useMemo(() => {
    return localData
      .map((item) => {
        const fd = item.fieldsData || {};
        const dateStr = fd.date;
        const startTime = fd.time?.startTime;

        const dateObj = dateStr ? new Date(dateStr) : null;
        const timeValue = startTime
          ? parseInt(startTime.replace(':', ''), 10)
          : 9999;

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
    ? fd.service.map((s) => s.name).filter(Boolean).join(', ')
    : fd.service?.name ?? '—',
          date: dateStr,
          dateObj,
          startTime,
          endTime: fd.time?.endTime,
          timeValue,
        };
      })
      .filter((i) => i.dateObj);
  }, [localData]);

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

  const sections = useMemo(() => {
    const groups = {};
    filteredData.forEach((item) => {
      const key = item.dateObj.toISOString().split('T')[0];
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    return Object.keys(groups)
      .map((dateKey) => {
        const date = new Date(dateKey);
        let title = '';
        if (date.getTime() === today.getTime()) title = 'Today';
        else if (date.getTime() === tomorrow.getTime()) title = 'Tomorrow';
        else title = formatDatePretty(dateKey);

        const sorted = groups[dateKey].sort((a, b) => a.timeValue - b.timeValue);
        return { title, data: sorted, dateKey };
      })
      .sort((a, b) => new Date(a.dateKey) - new Date(b.dateKey));
  }, [filteredData]);

  const handleDelete = (id) => {
    Alert.alert(
      'Delete appointment?',
      'This action cannot be undone.',
      [
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
      ]
    );
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
      if (raw === null || raw === undefined) return null;

      let txt = renderObjectAsLines(raw, field.field);
      if (!txt && typeof raw !== 'object') {
        txt = String(raw);
      }
      if (field.field === 'date' && raw) {
        txt = formatDatePretty(raw);
      }

      return txt ? (
        <Text
          key={field.field}
          style={[styles.tertiary, { color: theme.colors.onSurfaceVariant }]}
        >
          {txt}
        </Text>
      ) : null;
    })
    .filter(Boolean);

  return (
    <Swipeable renderRightActions={() => renderRightActions(item)}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        onPress={() =>
          navigation.navigate('ListItemDetail', {
            item: item.flatItem,                     // ✅ same as ListView
            name: 'Calendar',                        // ✅ consistent naming
            appConfig,
            fields: mapFields(viewData.fields),      // ✅ consistent field mapping
            mode: 'read',                            // ✅ explicit
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
    <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.sectionHeaderText, { color: theme.colors.primary }]}>
        {section.title}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {header  && (
           <View style={styles.headerRow}>
          <Text style={[styles.pageTitle, { color: theme.colors.primary }]}>{}</Text>
          
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
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              No appointments found.
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
      name: 'Calendar',
      appConfig,
      mode: 'add',
      fields: mapFields(viewData.fields),
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
    justifyContent: 'space-between',
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingBottom: 20,
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
});