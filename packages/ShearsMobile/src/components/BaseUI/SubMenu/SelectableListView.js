// src/components/BaseUI/SubMenu/SelectableListView.jsx
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
  ActivityIndicator,
} from 'react-native';

import { Avatar, useTheme } from 'react-native-paper';
import { singularize } from 'shears-shared/src/utils/stringHelpers';
import { AuthContext } from '../../../context/AuthContext';
import { DateTime } from 'luxon';

/* ---------------------------------------------------------
   🎨 Status Color Configuration
--------------------------------------------------------- */
const STATUS_COLORS = {
  pending: "#FF9800",
  approved: "#4CAF50",
  rejected: "#F44336",
  completed: "#2196F3",
  cancelled: "#9E9E9E",
};

function getStatusColor(status) {
  if (!status || typeof status !== "string") return null;
  return STATUS_COLORS[status.toLowerCase()] || null;
}

/* ---------------------------------------------------------
   🔠 Primary Text Resolver
--------------------------------------------------------- */
function getPrimaryText(item) {
  if (!item || typeof item !== "object") return "Untitled";

  if (item.firstName || item.lastName) {
    return [item.firstName, item.lastName].filter(Boolean).join(" ");
  }

  const nameFields = Object.keys(item).filter((k) =>
    k.toLowerCase().includes("name")
  );

  for (const key of nameFields) {
    const val = item[key];
    if (typeof val === "string" && val.trim()) return val;
    if (val?.raw?.fullName) return val.raw.fullName;
    if (val?.raw?.name) return val.raw.name;
    if (val?.name) return val.name;
  }

  return item.title || item.description || item.email || "Untitled";
}

/* ---------------------------------------------------------
   📅 Date Resolver (returns Luxon DateTime)
--------------------------------------------------------- */
function resolveDateObject(item) {
  const raw =
    item.date ||
    item.startDate ||
    item.requestDate ||
    item.createdAt ||
    item.updatedAt;

  if (!raw) return null;

  if (typeof raw === "string") {
    // Case 1: "2025-01-17" → local midnight
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return DateTime.fromFormat(raw, "yyyy-MM-dd", { zone: "local" });
    }

    // Case 2: Full ISO → force to local date only
    try {
      const dt = DateTime.fromISO(raw, { zone: "utc" }).toLocal();
      return dt.startOf("day");
    } catch {}
  }

  // Fallback: native Date → convert to Luxon local
  const native = new Date(raw);
  if (!isNaN(native.getTime())) {
    return DateTime.fromJSDate(native).startOf("day");
  }

  return null;
}

function resolveDate(item) {
  const dt = resolveDateObject(item);
  if (!dt) return null;
  return dt.toLocaleString(DateTime.DATE_MED); // "Jan 17, 2026"
}

/* ---------------------------------------------------------
   🖼 Avatar Resolver
--------------------------------------------------------- */
const getAvatarUrl = (item) => {
  if (!item) return null;

  // Check for avatar field
  if (item.avatar) {
    if (Array.isArray(item.avatar) && item.avatar[0]?.url) return item.avatar[0].url;
    if (typeof item.avatar === "string") return item.avatar;
  }

  // ⭐ Check for any field with "image" in the name (like productImage)
  for (const [key, value] of Object.entries(item)) {
    if (key.toLowerCase().includes('image')) {
      if (Array.isArray(value) && value[0]?.url) return value[0].url;
      if (typeof value === "string") return value;
    }
  }

  // Check nested raw objects
  for (const v of Object.values(item)) {
    if (v?.raw?.avatar) return v.raw.avatar;
    if (Array.isArray(v?.avatar) && v.avatar[0]?.url) return v.avatar[0].url;
  }

  return null;
};

/* ---------------------------------------------------------
   🕒 Time + Timezone
--------------------------------------------------------- */
function formatTimeWithZone(value) {
  if (!value?.time || !value?.timezone) return "";

  try {
    const viewerTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const [hour, minute] = String(value.time).split(":").map(Number);

    return DateTime.fromObject({ hour, minute }, { zone: value.timezone })
      .setZone(viewerTZ)
      .toFormat("h:mm a");
  } catch {
    return String(value.time);
  }
}

/* ---------------------------------------------------------
   ⏱ Duration
--------------------------------------------------------- */
function formatDuration(value) {
  if (!value || typeof value !== "object") return "";

  const h = value.hours ? `${value.hours} hour${value.hours === "1" ? "" : "s"}` : "";
  const m = value.minutes ? `${value.minutes} minute${value.minutes === "1" ? "" : "s"}` : "";

  return [h, m].filter(Boolean).join(" ");
}

/* ---------------------------------------------------------
   🧠 Unified Formatter
--------------------------------------------------------- */
function formatValueForList(value) {
  if (value == null) return "";

  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (Array.isArray(value)) {
    return value
      .map(
        (v) =>
          v?.platform ||
          v?.label ||
          v?.name ||
          v?.raw?.fullName ||
          v?.raw?.name
      )
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    if (value.time && value.timezone) return formatTimeWithZone(value);
    if (value.hours || value.minutes) return formatDuration(value);
    if (value.name) return value.name;

    if (value.raw) {
      return (
        value.raw.fullName ||
        value.raw.name ||
        value.raw.productName ||
        value.raw.serviceName ||
        value.raw.email ||
        ""
      );
    }

    return "";
  }

  return "";
}

/* ---------------------------------------------------------
   SEARCH FILTER
--------------------------------------------------------- */
const matchesSearch = (item, search) => {
  if (!search) return true;
  const term = search.toLowerCase();
  return getPrimaryText(item).toLowerCase().includes(term);
};

/* ---------------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------------- */
export default function SelectableListView({
  data = [],
  name = 'Item',
  inputConfig,
  onSelect,
  fields = null,
  onRefresh,
  recordType,
  refreshing = false,
  loading = false,
  mode = 'basic', // 'basic' or 'expanded'
}) {
  const theme = useTheme();
  const { appConfig } = useContext(AuthContext);

  const [search, setSearch] = useState('');
  const [displayFields, setDisplayFields] = useState([]);

  /* ---------------------------------------------------------
     Normalize Data
  --------------------------------------------------------- */
  const normalizedData = useMemo(
    () =>
      data.map((item) => {
        const normalized = item.fieldsData
          ? { ...item.fieldsData, _id: item._id, recordType: item.recordType }
          : item;
        
        if (item.fieldsData?.date) {
          normalized.date = item.fieldsData.date;
        }
        
        return normalized;
      }),
    [data]
  );

  /* ---------------------------------------------------------
     Display Fields (for expanded mode)
  --------------------------------------------------------- */
  useEffect(() => {
    if (mode !== 'expanded') return;

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

    const fieldsToDisplay = appFields
      .filter((f) => {
        if (f.displayInList === false) return false;
        if (f.displayInList === true) return true;
        return f.display?.order !== undefined;
      })
      .sort((a, b) => (a.display?.order ?? 999) - (b.display?.order ?? 999));

    setDisplayFields(fieldsToDisplay);
  }, [fields, appConfig, name, mode]);

  /* ---------------------------------------------------------
     SubText Builder (for expanded mode)
  --------------------------------------------------------- */
  const buildSubText = (item) => {
    const ordered = displayFields
      .filter(
        (f) =>
          !["firstName", "lastName"].includes(f.field) &&
          !f.field.toLowerCase().includes("name") &&
          f.field.toLowerCase() !== "date"
      )
      .sort((a, b) => (a.display?.order || 0) - (b.display?.order || 0));

    const lines = [];

    for (const field of ordered) {
      const raw = item[field.field];
      if (raw == null || raw === "") continue;

      const formatted = formatValueForList(raw);
      if (formatted) {
        const label = field.label || field.field;
        const statusColor = field.field.toLowerCase() === "status" 
          ? getStatusColor(formatted) 
          : null;
        
        lines.push({
          text: `${label}: ${formatted}`,
          color: statusColor,
          isBold: !!statusColor,
        });
      }
    }

    return lines;
  };

  /* ---------------------------------------------------------
     Filtered & Sectioned Data
  --------------------------------------------------------- */
  const filtered = useMemo(() => {

  return normalizedData.filter((item) => {

    if (recordType?.toLowerCase() === 'products' && item.isActive === false) return false;
    return matchesSearch(item, search);
  });
}, [normalizedData, search]);

  const sections = useMemo(() => {
    if (!filtered.length) return [{ title: "", data: [] }];

    const grouped = {};

    filtered.forEach((item) => {
      const name = getPrimaryText(item);
      const letter = name[0]?.toUpperCase() || "#";
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(item);
    });

    return Object.keys(grouped)
      .sort()
      .map((letter) => ({ title: letter, data: grouped[letter] }));
  }, [filtered]);

  /* ---------------------------------------------------------
     Handle Selection - KEY FIX
  --------------------------------------------------------- */
  const handleItemSelect = (item) => {
    if (!onSelect) return;
    
    // Pass the original item with all its data intact
    const selectedItem = {
      _id: item._id,
      name: getPrimaryText(item),
      raw: item.raw || item,
      fieldsData: item.fieldsData || item,
      recordType: item.recordType,

      ...item // Preserve all original properties
    };
    
    onSelect(selectedItem);
  };

  /* ---------------------------------------------------------
     Render Item — BASIC MODE (name only)
  --------------------------------------------------------- */
  const renderBasicItem = ({ item }) => {
    const name = getPrimaryText(item);
    const initials = name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    const avatarUrl = getAvatarUrl(item);

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        onPress={() => handleItemSelect(item)}
      >
        {avatarUrl ? (
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              overflow: "hidden",
              backgroundColor: theme.colors.surfaceVariant,
            }}
          >
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: "100%", height: "100%", resizeMode: "cover" }}
            />
          </View>
        ) : (
          <Avatar.Text
            size={48}
            label={initials}
            style={{
              backgroundColor: theme.colors.primary,
              borderRadius: 8,
            }}
            color={theme.colors.onPrimary}
          />
        )}

        <View style={styles.textContainer}>
          <Text style={[styles.name, { color: theme.colors.onSurface }]}>
            {name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  /* ---------------------------------------------------------
     Render Item — EXPANDED MODE (like ListView)
  --------------------------------------------------------- */
  const renderExpandedItem = ({ item }) => {
    const primary = getPrimaryText(item);
    const subTextLines = buildSubText(item);
    const dateLabel = resolveDate(item);
    const avatarUrl = getAvatarUrl(item);

    const initials = primary
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        onPress={() => handleItemSelect(item)}
      >
        {/* Avatar */}
        <View style={{ marginRight: 12 }}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: 48, height: 48, borderRadius: 8 }}
            />
          ) : (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                backgroundColor: theme.colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: theme.colors.onPrimary, fontWeight: "700" }}>
                {initials}
              </Text>
            </View>
          )}
        </View>

        {/* Text */}
        <View style={styles.textContainer}>
          {dateLabel && (
            <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>
              {dateLabel}
            </Text>
          )}

          <Text style={[styles.name, { color: theme.colors.onSurface }]}>
            {primary}
          </Text>

          {subTextLines.length > 0 && (
            <View>
              {subTextLines.map((line, index) => (
                <Text
                  key={index}
                  style={[
                    styles.subText,
                    {
                      color: line.color || theme.colors.onSurfaceVariant,
                      fontWeight: line.isBold ? "700" : "400",
                    },
                  ]}
                >
                  {line.text}
                </Text>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionHeaderText, { color: theme.colors.primary }]}>
        {section.title}
      </Text>
    </View>
  );

  /* ---------------------------------------------------------
     Empty State
  --------------------------------------------------------- */
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
        {search ? `No ${name} found matching "${search}"` : `No ${name} available`}
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
        value={search}
        onChangeText={setSearch}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item._id}
          renderItem={mode === 'expanded' ? renderExpandedItem : renderBasicItem}
          renderSectionHeader={renderSectionHeader}
          ListEmptyComponent={renderEmptyState}
          stickySectionHeadersEnabled
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </View>
  );
}

/* ---------------------------------------------------------
   STYLES
--------------------------------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, paddingBottom:80 },
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
    padding: 14,
    marginBottom: 8,
    borderRadius: 14,
    elevation: 3,
    alignItems: 'center',
  },
  textContainer: { marginLeft: 12, flex: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  subText: { fontSize: 13, lineHeight: 18 },
  sectionHeader: { paddingVertical: 6 },
  sectionHeaderText: { fontWeight: '700', fontSize: 14 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
});