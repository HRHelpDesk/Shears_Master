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
  const raw =
    item.date ||
    item.startDate ||
    item.requestDate ||
    item.createdAt ||
    item.updatedAt;

  if (!raw) return null;

  const d = new Date(raw);
  if (isNaN(d)) return null;

  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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
}) {
  const theme = useTheme();
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [finalFields, setFinalFields] = useState([]);
  const [localData, setLocalData] = useState(data);
  const { token } = useContext(AuthContext);

  useEffect(() => setLocalData(data), [data]);

  const normalizedData = useMemo(
    () =>
      localData.map((item) =>
        item.fieldsData
          ? { ...item.fieldsData, _id: item._id, recordType: item.recordType }
          : item
      ),
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
  /* Grouping                                                                  */
  /* ------------------------------------------------------------------------ */
  const sections = useMemo(() => {
    if (!filteredData.length) return [{ title: "", data: [] }];

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
  }, [filteredData]);

  /* ------------------------------------------------------------------------ */
  /* SubText Builder (EXCLUDES *name* fields)                                  */
  /* ------------------------------------------------------------------------ */
  const buildSubText = (item) => {
    const ordered = displayFields
      .filter(
        (f) =>
          !["firstName", "lastName"].includes(f.field) &&
          !f.field.toLowerCase().includes("name") // 🔥 KEY CHANGE
      )
      .sort((a, b) => (a.display?.order || 0) - (b.display?.order || 0));

    const lines = [];

    for (const field of ordered) {
      const raw = item[field.field];
      if (raw == null || raw === "") continue;

      const formatted = formatValueForList(raw);
      if (formatted) {
        lines.push(`${field.label || field.field}: ${formatted}`);
      }
    }

    return lines.join("\n");
  };

  /* ------------------------------------------------------------------------ */
  /* Render Item                                                              */
  /* ------------------------------------------------------------------------ */
  const renderItem = ({ item }) => {
    const primary = getPrimaryText(item);
    const subText = buildSubText(item);
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
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() =>
          navigation.navigate("ListItemDetail", {
            item: {},
            name,
            mode: "add",
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
/* Styles                                                                      */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
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
