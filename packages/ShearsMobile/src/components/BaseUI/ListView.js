// ListView.js
import React, { useState, useMemo, useContext, useEffect } from "react";
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
} from "react-native";
import { useTheme, FAB } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Swipeable } from "react-native-gesture-handler";
import { DateTime } from "luxon";

import { singularize } from "shears-shared/src/utils/stringHelpers";
import { deleteRecord } from "shears-shared/src/Services/Authentication";
import { AuthContext } from "../../context/AuthContext";

/* -------------------------------------------------------------------------- */
/* 🎨 Status Color Configuration                                               */
/* -------------------------------------------------------------------------- */
const STATUS_COLORS = {
  pending: "#FF9800",    // Orange
  approved: "#4CAF50",   // Green
  rejected: "#F44336",   // Red
  completed: "#2196F3",  // Blue
  cancelled: "#9E9E9E",  // Gray
  // Add more status-color mappings here as needed
};

function getStatusColor(status) {
  if (!status || typeof status !== "string") return null;
  return STATUS_COLORS[status.toLowerCase()] || null;
}

/* -------------------------------------------------------------------------- */
/* 🔠 Primary Text Resolver                                                    */
/* -------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------- */
/* 📅 Date Resolver                                                            */
/* -------------------------------------------------------------------------- */
function resolveDate(item) {
  const dt = resolveDateObject(item);
  if (!dt) return null;
  return dt.toLocaleString(DateTime.DATE_MED); // "Jan 17, 2026"
}

/* -------------------------------------------------------------------------- */
/* 📅 Date Resolver (returns Luxon DateTime for reliable local comparison)   */
/* -------------------------------------------------------------------------- */
function resolveDateObject(item, useRawDate = false) {
  let raw;

  if (useRawDate) {
    raw = item.date; // ← only use the explicit .date field
  } else {
    raw =
      item.date ||
      item.startDate ||
      item.requestDate ||
      item.createdAt ||
      item.updatedAt;
  }

  if (!raw) return null;

  // ── Luxon: treat YYYY-MM-DD as local date (no UTC shift) ───────────────
  if (typeof raw === "string") {
    // Case 1: "2025-01-17" → local midnight
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return DateTime.fromFormat(raw, "yyyy-MM-dd", { zone: "local" });
    }

    // Case 2: Full ISO (may be UTC) → force to local date only
    try {
      const dt = DateTime.fromISO(raw, { zone: "utc" }).toLocal();
      return dt.startOf("day"); // ← strip time, keep only local date
    } catch {}
  }

  // Fallback: native Date → convert to Luxon local
  const native = new Date(raw);
  if (!isNaN(native.getTime())) {
    return DateTime.fromJSDate(native).startOf("day");
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* 📅 Date Group Label (for date-based grouping)                              */
/* -------------------------------------------------------------------------- */
function getDateGroupLabel(date) {
  if (!date) return "No Date";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffTime = today - itemDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays <= 7) return "This Week";
  if (diffDays > 7 && diffDays <= 30) return "This Month";
  if (diffDays > 30 && diffDays <= 365) return "This Year";
  
  return date.getFullYear().toString();
}

/* -------------------------------------------------------------------------- */
/* 🖼 Avatar Resolver                                                          */
/* -------------------------------------------------------------------------- */
function getAvatarUrl(item) {
  if (item.avatar) {
    if (Array.isArray(item.avatar) && item.avatar[0]?.url) return item.avatar[0].url;
    if (typeof item.avatar === "string") return item.avatar;
  }

  for (const v of Object.values(item)) {
    if (v?.raw?.avatar) return v.raw.avatar;
    if (Array.isArray(v?.avatar) && v.avatar[0]?.url) return v.avatar[0].url;
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* 🕒 Time + Timezone                                                          */
/* -------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------- */
/* ⏱ Duration                                                                  */
/* -------------------------------------------------------------------------- */
function formatDuration(value) {
  if (!value || typeof value !== "object") return "";

  const h = value.hours ? `${value.hours} hour${value.hours === "1" ? "" : "s"}` : "";
  const m = value.minutes ? `${value.minutes} minute${value.minutes === "1" ? "" : "s"}` : "";

  return [h, m].filter(Boolean).join(" ");
}

/* -------------------------------------------------------------------------- */
/* 🧠 Unified Formatter                                                        */
/* -------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------- */
/* 🧾 MAIN COMPONENT                                                           */
/* -------------------------------------------------------------------------- */
export default function ListView({
  data = [],
  fields = null,
  name = "Item",
  appConfig,
  recordType = null,
  onRefresh,
  refreshing = false,
  modes,
  actionsMenu = [],
  sortBy = "name", // 👈 NEW: defaults to "name", can be "date"
}) {
  const theme = useTheme();
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [finalFields, setFinalFields] = useState([]);
  const [localData, setLocalData] = useState(data);
  const { token } = useContext(AuthContext);

  useEffect(() => 
    {
      console.log("actionsMenu in ListView:", actionsMenu);
      console.log("Modes in ListView:", modes);
      setLocalData(data), [data]
    },[data]);
    

  const normalizedData = useMemo(
    () =>
      localData.map((item) => {
        const normalized = item.fieldsData
          ? { ...item.fieldsData, _id: item._id, recordType: item.recordType }
          : item;
        
        // Preserve the date field from fieldsData (item.fieldsData.date)
        if (item.fieldsData?.date) {
          normalized.date = item.fieldsData.date;
        }
        
        return normalized;
      }),
    [localData]
  );

  /* ------------------------------------------------------------------------ */
  /* Display Fields                                                           */
  /* ------------------------------------------------------------------------ */
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

    return appFields
      .filter((f) => {
        if (f.displayInList === false) return false;
        if (f.displayInList === true) return true;
        return f.display?.order !== undefined;
      })
      .sort((a, b) => (a.display?.order ?? 999) - (b.display?.order ?? 999));
  }, [fields, appConfig, name]);

  const keys = displayFields.map((f) => f.field);

  /* ------------------------------------------------------------------------ */
  /* Search                                                                    */
  /* ------------------------------------------------------------------------ */
  const filteredData = useMemo(() => {
    if (!search) return normalizedData;
    const q = search.toLowerCase();

    return normalizedData.filter((item) =>
      keys.some((k) =>
        formatValueForList(item[k]).toLowerCase().includes(q)
      )
    );
  }, [normalizedData, search, keys]);

  /* ------------------------------------------------------------------------ */
  /* Grouping (supports both name and date sorting)                           */
  /* ------------------------------------------------------------------------ */
  const sections = useMemo(() => {
  if (!filteredData.length) return [{ title: "", data: [] }];

  if (sortBy === "date") {
    const sorted = [...filteredData].sort((a, b) => {
      const dtA = resolveDateObject(a, true); // true = only item.date
      const dtB = resolveDateObject(b, true);

      if (!dtA && !dtB) return 0;
      if (!dtA) return 1;
      if (!dtB) return -1;

      // Newest first
      return dtB - dtA; // Luxon DateTime supports direct subtraction
    });

    const grouped = {};
    sorted.forEach((item) => {
      const dt = resolveDateObject(item, true);
      const key = dt
        ? dt.toLocaleString(DateTime.DATE_HUGE) // "January 17, 2026"
        : "No Date";

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });

    // Preserve sort order
    const sections = [];
    const seen = new Set();
    sorted.forEach((item) => {
      const dt = resolveDateObject(item, true);
      const key = dt ? dt.toLocaleString(DateTime.DATE_HUGE) : "No Date";
      if (!seen.has(key)) {
        seen.add(key);
        sections.push({ title: key, data: grouped[key] });
      }
    });

    return sections;
  
    } else {
      // Default: Sort by name (alphabetically)
      const grouped = {};
      filteredData.forEach((item) => {
        const primary = getPrimaryText(item);
        const key = primary?.[0]?.toUpperCase() || "#";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
      });

      return Object.keys(grouped)
        .sort()
        .map((k) => ({ title: k, data: grouped[k] }));
    }
  }, [filteredData, sortBy]);

  /* ------------------------------------------------------------------------ */
  /* SubText Builder (EXCLUDES *name* fields)                                  */
  /* ------------------------------------------------------------------------ */
  const buildSubText = (item) => {
    const ordered = displayFields
      .filter(
        (f) =>
          !["firstName", "lastName"].includes(f.field) &&
          !f.field.toLowerCase().includes("name") &&
          f.field.toLowerCase() !== "date" // Skip date field since it's in the overline
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

  /* ------------------------------------------------------------------------ */
  /* Render Item                                                              */
  /* ------------------------------------------------------------------------ */
  const renderItem = ({ item }) => {
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
      <Swipeable
        renderRightActions={() => (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => deleteRecord(item._id, token)}
          >
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        )}
      >
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.colors.surface }]}
          onPress={() =>
            navigation.navigate("ListItemDetail", {
              item,
              name,
              appConfig,
              recordType,
              fields: finalFields,
              modes: modes,
              actionsMenu,
            })
          }
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
      </Swipeable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TextInput
        style={[styles.searchInput, { borderColor: theme.colors.primary }]}
        placeholder={`Search ${singularize(name)}...`}
        value={search}
        onChangeText={setSearch}
      />

      <SectionList
        sections={sections}
        keyExtractor={(item, i) => item._id ?? i.toString()}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeaderText}>{section.title}</Text>
        )}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      <FAB
        icon="plus"
        color={theme.colors.onPrimary}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() =>
          navigation.navigate("ListItemDetail", {
            item: {},
            name,
            mode: "add",
            appConfig,
            recordType,
            fields: finalFields,
            modes: modes,
            actionsMenu,
          })
        }
      />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                      */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, paddingBottom:120 },
  searchInput: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 10 },
  card: { flexDirection: "row", padding: 14, borderRadius: 14, marginBottom: 8 },
  textContainer: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700" },
  subText: { fontSize: 13, lineHeight: 18 },
  deleteBtn: {
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
  },
  deleteText: { color: "white", fontWeight: "bold" },
  sectionHeaderText: { fontWeight: "700", marginVertical: 6 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: Platform.OS === "ios" ? 100 : 20,
  },
});