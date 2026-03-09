// ListView.js
import React, { useState, useMemo, useContext, useEffect, useCallback, useRef } from "react";
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
/* Status Colors                                                               */
/* -------------------------------------------------------------------------- */
const STATUS_COLORS = {
  pending: "#FF9800", approved: "#4CAF50",
  rejected: "#F44336", completed: "#2196F3", cancelled: "#9E9E9E",
};
function getStatusColor(status) {
  if (!status || typeof status !== "string") return null;
  return STATUS_COLORS[status.toLowerCase()] || null;
}

/* -------------------------------------------------------------------------- */
/* Primary Text Resolver                                                       */
/* -------------------------------------------------------------------------- */
function getPrimaryText(item) {
  if (!item || typeof item !== "object") return "Untitled";
  if (item.firstName || item.lastName) return [item.firstName, item.lastName].filter(Boolean).join(" ");
  if (item.influencerName?.raw?.fullName) return item.influencerName.raw.fullName;
  const nameFields = Object.keys(item).filter((k) => k.toLowerCase().includes("name"));
  for (const key of nameFields) {
    const val = item[key];
    if (typeof val === "string" && val.trim()) return val;
    if (val?.raw?.fullName) return val.raw.fullName;
    if (val?.raw?.name)     return val.raw.name;
    if (val?.name)          return val.name;
  }
  return item.title || item.description || item.email || "Untitled";
}

/* -------------------------------------------------------------------------- */
/* Date Helpers                                                                */
/* -------------------------------------------------------------------------- */
function getDateArray(item) {
  const raw = item.date ?? item.fieldsData?.date;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") return [raw];
  return [];
}

function resolveDateObject(item) {
  const dates = getDateArray(item)
    .filter((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d))
    .map((d) => DateTime.fromFormat(d, "yyyy-MM-dd", { zone: "local" }))
    .filter((dt) => dt.isValid);
  if (dates.length === 0) return null;
  return DateTime.min(...dates);
}

function resolveDate(item) {
  const dates = getDateArray(item)
    .filter((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d))
    .map((d) => DateTime.fromFormat(d, "yyyy-MM-dd", { zone: "local" }))
    .filter((dt) => dt.isValid)
    .sort((a, b) => a - b);
  if (dates.length === 0) return null;
  if (dates.length === 1) return dates[0].toLocaleString(DateTime.DATE_MED);
  const start = dates[0];
  const end   = dates[dates.length - 1];
  if (start.month === end.month && start.year === end.year) return `${start.toFormat("MMM d")} – ${end.toFormat("d, yyyy")}`;
  if (start.year === end.year) return `${start.toFormat("MMM d")} – ${end.toFormat("MMM d, yyyy")}`;
  return `${start.toLocaleString(DateTime.DATE_MED)} – ${end.toLocaleString(DateTime.DATE_MED)}`;
}

function getDateGroupLabel(item) {
  const dt = resolveDateObject(item);
  if (!dt || !dt.isValid) return "No Date";
  const now      = DateTime.now().startOf("day");
  const diffDays = Math.floor(dt.diff(now, "days").days);
  if (diffDays === 0)                       return "Today";
  if (diffDays === 1)                       return "Tomorrow";
  if (diffDays > 1   && diffDays <= 7)     return "This Week";
  if (diffDays > 7   && diffDays <= 30)    return "This Month";
  if (diffDays > 30)                        return "Future";
  if (diffDays === -1)                      return "Yesterday";
  if (diffDays > -7  && diffDays < 0)      return "This Week";
  if (diffDays > -30 && diffDays <= -7)    return "Recent";
  if (diffDays > -365 && diffDays <= -30)  return "This Year";
  return dt.toFormat("yyyy");
}

/* -------------------------------------------------------------------------- */
/* Avatar Resolver                                                             */
/* -------------------------------------------------------------------------- */
function getAvatarUrl(item) {
  if (item.influencerName?.raw?.avatar) return item.influencerName.raw.avatar;
  if (item.avatar) {
    if (Array.isArray(item.avatar) && item.avatar[0]?.url) return item.avatar[0].url;
    if (typeof item.avatar === "string") return item.avatar;
  }
  for (const [key, value] of Object.entries(item)) {
    if (key.toLowerCase().includes("image") || key.toLowerCase().includes("avatar")) {
      if (Array.isArray(value) && value[0]?.url) return value[0].url;
      if (typeof value === "string") return value;
    }
  }
  for (const v of Object.values(item)) {
    if (v?.raw?.avatar) return v.raw.avatar;
    if (Array.isArray(v?.avatar) && v.avatar[0]?.url) return v.avatar[0].url;
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Time + Duration                                                             */
/* -------------------------------------------------------------------------- */
function formatTimeWithZone(value) {
  if (!value?.time || !value?.timezone) return "";
  try {
    const viewerTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const [hour, minute] = String(value.time).split(":").map(Number);
    return DateTime.fromObject({ hour, minute }, { zone: value.timezone })
      .setZone(viewerTZ).toFormat("h:mm a");
  } catch { return String(value.time || ""); }
}

function formatDuration(value) {
  if (!value || typeof value !== "object") return "";
  const h = value.hours   ? `${value.hours} hr${value.hours === "1" ? "" : "s"}` : "";
  const m = value.minutes && value.minutes !== "00" ? `${value.minutes} min` : "";
  return [h, m].filter(Boolean).join(" ");
}

/* -------------------------------------------------------------------------- */
/* Unified Formatter                                                           */
/* -------------------------------------------------------------------------- */
function formatValueForList(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.map((v) => v?.value || v?.label || v?.platform || v?.name || v?.raw?.fullName || v?.raw?.name || "").filter(Boolean).join(", ");
  }
  if (typeof value === "object") {
    if (value.time && value.timezone) return formatTimeWithZone(value);
    if (value.hours || value.minutes) return formatDuration(value);
    if (value.name) return value.name;
    if (value.raw)  return value.raw.fullName || value.raw.name || value.raw.productName || value.raw.serviceName || value.raw.email || "";
  }
  return "";
}

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                              */
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
  sortBy = "name",
}) {
  const theme      = useTheme();
  const navigation = useNavigation();
  const [search, setSearch]           = useState("");
  const [finalFields, setFinalFields] = useState([]);
  const [localData, setLocalData]     = useState(data);
  const { token }                     = useContext(AuthContext);

  // Tracks whether we left via navigateToDetail so the focus listener
  // knows to request a refresh — avoids spurious refreshes on unrelated focus events
  const didNavigateRef = useRef(false);

  /* ------------------------------------------------------------------
     Sync localData when parent delivers fresh data (e.g. after onRefresh)
  ------------------------------------------------------------------ */
  useEffect(() => {
    setLocalData(data);
  }, [data]);

  /* ------------------------------------------------------------------
     FOCUS LISTENER
     When the screen comes back into focus after the user navigated to
     ListItemDetail (add OR edit), trigger onRefresh so the parent
     re-fetches and passes fresh data back down.
  ------------------------------------------------------------------ */
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (didNavigateRef.current) {
        didNavigateRef.current = false;
        if (typeof onRefresh === "function") onRefresh();
      }
    });
    return unsubscribe;
  }, [navigation, onRefresh]);

  /* ------------------------------------------------------------------
     DISPLAY FIELDS
  ------------------------------------------------------------------ */
  const displayFields = useMemo(() => {
    let appFields = fields?.length ? fields : [];
    if (!appFields.length && appConfig) {
      const route = appConfig.mainNavigation.find(
        (r) => r.displayName?.toLowerCase() === name.toLowerCase() || r.name?.toLowerCase() === name.toLowerCase()
      );
      appFields = route?.fields || [];
    }
    setFinalFields(appFields);
    return appFields
      .filter((f) => f.displayInList !== false)
      .sort((a, b) => (a.display?.order ?? 999) - (b.display?.order ?? 999));
  }, [fields, appConfig, name]);

  const keys = displayFields.map((f) => f.field);

  /* ------------------------------------------------------------------
     NORMALIZED + FILTERED DATA
  ------------------------------------------------------------------ */
  const normalizedData = useMemo(() => {
    return localData.map((item) =>
      item.fieldsData ? { ...item.fieldsData, _id: item._id, recordType: item.recordType } : item
    );
  }, [localData]);

  const filteredData = useMemo(() => {
    if (!search) return normalizedData;
    const q = search.toLowerCase();
    return normalizedData.filter((item) =>
      keys.some((k) => formatValueForList(item[k]).toLowerCase().includes(q))
    );
  }, [normalizedData, search, keys]);

  /* ------------------------------------------------------------------
     SECTIONS
  ------------------------------------------------------------------ */
  const sections = useMemo(() => {
    if (!filteredData.length) return [{ title: "No Results", data: [] }];

    if (sortBy === "date") {
      const sorted = [...filteredData].sort((a, b) => {
        const dtA = resolveDateObject(a), dtB = resolveDateObject(b);
        if (!dtA) return 1; if (!dtB) return -1;
        return dtA - dtB;
      });
      const grouped = {};
      sorted.forEach((item) => {
        const label = getDateGroupLabel(item);
        if (!grouped[label]) grouped[label] = [];
        grouped[label].push(item);
      });
      return Object.keys(grouped)
        .sort((a, b) => {
          const order = ["Today","Tomorrow","This Week","This Month","Future","Yesterday","Recent","This Year"];
          const ia = order.indexOf(a), ib = order.indexOf(b);
          if (ia !== -1 && ib !== -1) return ia - ib;
          if (ia !== -1) return -1; if (ib !== -1) return 1;
          return a.localeCompare(b);
        })
        .map((k) => ({ title: k, data: grouped[k] }));
    }

    const grouped = {};
    filteredData.forEach((item) => {
      const key = getPrimaryText(item)?.[0]?.toUpperCase() || "#";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    return Object.keys(grouped).sort().map((k) => ({ title: k, data: grouped[k] }));
  }, [filteredData, sortBy]);

  /* ------------------------------------------------------------------
     BUILD SUB-TEXT
  ------------------------------------------------------------------ */
  const buildSubText = useCallback((item) => {
    const lines = [];
    const timeStr     = formatValueForList(item.startTimeWithZone);
    const durationStr = formatValueForList(item.duration);
    if (timeStr || durationStr) lines.push({ text: [timeStr, durationStr].filter(Boolean).join(" • ") });

    const ordered = displayFields.filter(
      (f) => !["firstName","lastName","influencerName","date","startTimeWithZone","duration"].includes(f.field) &&
             !f.field.toLowerCase().includes("name")
    );
    for (const field of ordered) {
      const raw = item[field.field];
      if (raw == null || raw === "") continue;
      if (typeof raw === "boolean") {
        lines.push({ text: raw ? "Active" : "Inactive", color: raw ? "#4CAF50" : "#FF6347", isBold: true });
        continue;
      }
      const formatted = formatValueForList(raw);
      if (!formatted) continue;
      const label       = field.label || field.field;
      const statusColor = field.field.toLowerCase() === "status" ? getStatusColor(formatted) : null;
      lines.push({ text: `${label}: ${formatted}`, color: statusColor, isBold: !!statusColor });
    }
    return lines;
  }, [displayFields]);

  /* ------------------------------------------------------------------
     DELETE
     Optimistically removes the item from localData immediately so
     the list updates without waiting for the server round-trip.
     Then calls the server and triggers onRefresh to reconcile.
  ------------------------------------------------------------------ */
  const handleDelete = useCallback((item) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete this ${singularize(name)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // 1. Remove instantly — no spinner, list snaps immediately
            setLocalData(prev => prev.filter(r => (r._id || r.id) !== item._id));
            try {
              await deleteRecord(item._id, token);
              // 2. Reconcile with server state
              if (typeof onRefresh === "function") onRefresh();
            } catch (error) {
              Alert.alert("Delete Failed", error.message || "Unable to delete.");
              // 3. Re-sync on failure so the item reappears
              if (typeof onRefresh === "function") onRefresh();
            }
          },
        },
      ]
    );
  }, [name, token, onRefresh]);

  /* ------------------------------------------------------------------
     NAVIGATE TO DETAIL
     Sets the ref flag so the focus listener knows to refetch on return.
     Covers: tapping an item (read/edit) AND tapping the FAB (add).
  ------------------------------------------------------------------ */
  const navigateToDetail = useCallback((params) => {
    didNavigateRef.current = true;
    navigation.navigate("ListItemDetail", params);
  }, [navigation]);

  /* ------------------------------------------------------------------
     RENDER ITEM
  ------------------------------------------------------------------ */
  const renderItem = useCallback(({ item }) => {
    const primary      = getPrimaryText(item);
    const subTextLines = buildSubText(item);
    const dateLabel    = resolveDate(item);
    const avatarUrl    = getAvatarUrl(item);
    const initials     = primary.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

    return (
      <Swipeable
        renderRightActions={() => (
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        )}
      >
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigateToDetail({ item, name, appConfig, recordType, fields: finalFields, modes, actionsMenu })}
        >
          <View style={{ marginRight: 12 }}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={{ width: 48, height: 48, borderRadius: 8 }} />
            ) : (
              <View style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: theme.colors.primary, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: theme.colors.onPrimary, fontWeight: "700" }}>{initials}</Text>
              </View>
            )}
          </View>
          <View style={styles.textContainer}>
            {dateLabel && (
              <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: "600" }}>{dateLabel}</Text>
            )}
            <Text style={[styles.name, { color: theme.colors.onSurface }]}>{primary}</Text>
            {subTextLines.length > 0 && (
              <View style={{ marginTop: 2 }}>
                {subTextLines.map((line, idx) => (
                  <Text key={idx} style={[styles.subText, { color: line.color || theme.colors.onSurfaceVariant, fontWeight: line.isBold ? "600" : "400" }]}>
                    {line.text}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  }, [buildSubText, finalFields, theme, name, appConfig, recordType, modes, actionsMenu, handleDelete, navigateToDetail]);

  /* ------------------------------------------------------------------
     RENDER
  ------------------------------------------------------------------ */
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
        keyExtractor={(item) => item._id || Math.random().toString()}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionHeaderText, { color: theme.colors.onSurfaceVariant }]}>
            {section.title}
          </Text>
        )}
        refreshing={refreshing}
        onRefresh={onRefresh}
        stickySectionHeadersEnabled={false}
      />
      <FAB
        icon="plus"
        color={theme.colors.onPrimary}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigateToDetail({ item: {}, name, mode: "add", appConfig, recordType, fields: finalFields, modes, actionsMenu })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, padding: 10, paddingBottom: Platform.OS === "ios" ? 100 : 0 },
  searchInput:  { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 12, fontSize: 16 },
  card: {
    flexDirection: "row", padding: 14, borderRadius: 12, marginBottom: 8,
    elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
  },
  textContainer: { flex: 1 },
  name:          { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  subText:       { fontSize: 13, lineHeight: 18, opacity: 0.9 },
  deleteBtn:     { backgroundColor: "#F44336", justifyContent: "center", alignItems: "center", width: 80 },
  deleteText:    { color: "white", fontWeight: "bold", fontSize: 14 },
  sectionHeaderText: { fontSize: 14, fontWeight: "600", paddingVertical: 8, paddingHorizontal: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  fab:           { position: "absolute", right: 16, bottom: Platform.OS === "ios" ? 90 : 24 },
});