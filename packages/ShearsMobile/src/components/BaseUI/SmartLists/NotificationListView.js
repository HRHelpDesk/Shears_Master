// NotificationsView.js
import React, { useState, useMemo, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
} from "react-native";
import { useTheme, Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Swipeable } from "react-native-gesture-handler";
import { DateTime } from "luxon";

import { deleteRecord, updateRecord } from "shears-shared/src/Services/Authentication";
import { AuthContext } from "../../../context/AuthContext";

/* -------------------------------------------------------------------------- */
/* 📅 Date Resolver (returns Luxon DateTime)                                 */
/* -------------------------------------------------------------------------- */
function resolveDateObject(item) {
  const raw =
    item.date ||
    item.createdAt ||
    item.updatedAt;

  if (!raw) return null;

  // Luxon: treat YYYY-MM-DD as local date (no UTC shift)
  if (typeof raw === "string") {
    // Case 1: "2025-01-17" → local midnight
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return DateTime.fromFormat(raw, "yyyy-MM-dd", { zone: "local" });
    }

    // Case 2: Full ISO (may be UTC) → force to local date only
    try {
      const dt = DateTime.fromISO(raw, { zone: "utc" }).toLocal();
      return dt;
    } catch {}
  }

  // Fallback: native Date → convert to Luxon local
  const native = new Date(raw);
  if (!isNaN(native.getTime())) {
    return DateTime.fromJSDate(native);
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* 📅 Format Relative Time                                                    */
/* -------------------------------------------------------------------------- */
function formatRelativeTime(date) {
  if (!date) return "";
  
  const now = DateTime.now();
  const diff = now.diff(date, ["days", "hours", "minutes"]);
  
  if (diff.days >= 1) {
    return date.toLocaleString(DateTime.DATE_MED); // "Jan 17, 2026"
  } else if (diff.hours >= 1) {
    const hours = Math.floor(diff.hours);
    return `${hours}h ago`;
  } else if (diff.minutes >= 1) {
    const minutes = Math.floor(diff.minutes);
    return `${minutes}m ago`;
  } else {
    return "Just now";
  }
}

/* -------------------------------------------------------------------------- */
/* 🧾 NOTIFICATIONS VIEW COMPONENT                                            */
/* -------------------------------------------------------------------------- */
export default function NotificationListView({
  data = [],
  onRefresh,
  refreshing = false,
  name = "Notifications",
  appConfig,
  recordType = "notifications",
  fields = [],
  modes,
  actionsMenu = [],
}) {
  const theme = useTheme();
  const navigation = useNavigation();
  const { token } = useContext(AuthContext);
  const [localData, setLocalData] = useState(data);
  const [isClearing, setIsClearing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");


  const handleItemClick = async (item) => {
  if (deletingId === item._id) return;

  // Extract only the fieldsData you want to update (everything except _id/recordType)
  const { _id, recordType, ...fieldsOnly } = item;

  // Only proceed if unread
  if (fieldsOnly.read !== true) {
    // Optimistic UI update
    setLocalData((prev) =>
      prev.map((notification) =>
        notification._id === item._id
          ? { ...notification, fieldsData: { ...fieldsOnly, read: true } }
          : notification
      )
    );

    try {
      // Send just fieldsData to backend (your route expects it)
      await updateRecord(item._id, { ...fieldsOnly, read: true }, token);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);

      // Rollback optimistic update on failure
      setLocalData((prev) =>
        prev.map((notification) =>
          notification._id === item._id
            ? { ...notification, fieldsData: { ...fieldsOnly, read: false } }
            : notification
        )
      );
    }
  }

  // Navigate to details or open drawer
  navigation.navigate("ListItemDetail", {
    item,
    name,
    appConfig,
    recordType,
    fields,
    modes,
    actionsMenu,
  });
};


  // Sync localData with incoming data prop
  React.useEffect(() => {
    setLocalData(data);
  }, [data]);

  // Normalize data
  const normalizedData = useMemo(
    () =>
      localData.map((item) => {
        const normalized = item.fieldsData
          ? { ...item.fieldsData, _id: item._id, recordType: item.recordType }
          : item;
        
        // Preserve the date field from fieldsData
        if (item.fieldsData?.date) {
          normalized.date = item.fieldsData.date;
        }
        if (item.fieldsData?.createdAt) {
          normalized.createdAt = item.fieldsData.createdAt;
        }
        
        return normalized;
      }),
    [localData]
  );

  // Filter by search
  const filteredData = useMemo(() => {
    if (!search) return normalizedData;
    
    const q = search.toLowerCase();
    return normalizedData.filter((item) => {
      const title = item.notificationName || item.title || "";
      const message = item.message || "";
      return (
        title.toLowerCase().includes(q) ||
        message.toLowerCase().includes(q)
      );
    });
  }, [normalizedData, search]);

  // Sort by date (newest first)
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const dtA = resolveDateObject(a);
      const dtB = resolveDateObject(b);

      if (!dtA && !dtB) return 0;
      if (!dtA) return 1;
      if (!dtB) return -1;

      return dtB - dtA; // Newest first
    });
  }, [filteredData]);

  /* ------------------------------------------------------------------------ */
  /* Delete Handler                                                           */
  /* ------------------------------------------------------------------------ */
  const handleDelete = (item) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingId(item._id);
            try {
              await deleteRecord(item._id, token);
              
              // Trigger refresh to reload data from server
              if (onRefresh) {
                onRefresh();
              }
            } catch (error) {
              Alert.alert("Error", "Failed to delete notification");
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  /* ------------------------------------------------------------------------ */
  /* Clear All Handler                                                        */
  /* ------------------------------------------------------------------------ */
  const handleClearAll = () => {
    if (sortedData.length === 0) return;

    Alert.alert(
      "Clear All Notifications",
      `Are you sure you want to delete all ${sortedData.length} notification${sortedData.length === 1 ? "" : "s"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            setIsClearing(true);
            try {
              // Delete all notifications concurrently
              const deletePromises = sortedData.map((item) =>
                deleteRecord(item._id, token)
              );
              
              await Promise.all(deletePromises);
              
              // Trigger refresh to reload data from server
              if (onRefresh) {
                onRefresh();
              }
            } catch (error) {
              Alert.alert(
                "Error",
                "Some notifications could not be deleted. Please try again."
              );
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  /* ------------------------------------------------------------------------ */
  /* Render Item                                                              */
  /* ------------------------------------------------------------------------ */
  const renderItem = ({ item, index }) => {
    // Get title from notificationName or title field
    const title = item.notificationName || item.title || "Notification";
    const message = item.message || "";
    const date = resolveDateObject(item);
    const timeLabel = formatRelativeTime(date);

    // Check if notification is unread (you can add a 'read' field to your schema)
    const isUnread = item.read === false || item.isRead === false;
    const isDeleting = deletingId === item._id;

    return (
      <Swipeable
        renderRightActions={() => (
          <TouchableOpacity
            style={styles.deleteAction}
            onPress={() => handleDelete(item)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.deleteText}>Delete</Text>
            )}
          </TouchableOpacity>
        )}
      >
        <TouchableOpacity
          style={styles.notificationItem}
          onPress={() => handleItemClick(item)}

          disabled={isDeleting}
        >
          {/* Unread Indicator */}
          {isUnread && (
            <View
              style={[
                styles.unreadDot,
                { backgroundColor: theme.colors.primary },
              ]}
            />
          )}

          {/* Content */}
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <Text
                style={[
                  styles.title,
                  {
                    color: theme.colors.onSurface,
                    fontWeight: isUnread ? "700" : "600",
                  },
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
              {timeLabel && (
                <Text
                  style={[
                    styles.time,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {timeLabel}
                </Text>
              )}
            </View>

            {message && (
              <Text
                style={[
                  styles.message,
                  { color: theme.colors.onSurfaceVariant },
                ]}
                numberOfLines={2}
              >
                {message}
              </Text>
            )}
          </View>

          {/* Loading indicator for deleting */}
          {isDeleting && (
            <ActivityIndicator
              size="small"
              color={theme.colors.primary}
              style={{ marginLeft: 12 }}
            />
          )}
        </TouchableOpacity>

        {/* Divider */}
        {index < sortedData.length - 1 && (
          <View
            style={[
              styles.divider,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />
        )}
      </Swipeable>
    );
  };

  /* ------------------------------------------------------------------------ */
  /* Empty State                                                              */
  /* ------------------------------------------------------------------------ */
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
        No notifications yet
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Bar with Clear All Button */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            { 
              borderColor: theme.colors.primary,
              color: theme.colors.onSurface,
              flex: 1,
            }
          ]}
          placeholder="Search notifications..."
          placeholderTextColor={theme.colors.onSurfaceVariant}
          value={search}
          onChangeText={setSearch}
        />
        {sortedData.length > 0 && (
          <Button
            mode="text"
            onPress={handleClearAll}
            disabled={isClearing}
            loading={isClearing}
            textColor={theme.colors.error}
            compact
            style={styles.clearButton}
          >
            Clear All
          </Button>
        )}
      </View>

      <FlatList
        data={sortedData}
        keyExtractor={(item, i) => item._id ?? i.toString()}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={sortedData.length === 0 && styles.emptyListContent}
      />

      {/* Loading Overlay for Clear All */}
      {isClearing && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingBox, { backgroundColor: theme.colors.surface }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
              Clearing all notifications...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                      */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: Platform.OS === "ios" ? 80 : 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
  },
  clearButton: {
    marginLeft: 4,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 72,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    marginLeft: 36, // Indent to align with content
  },
  deleteAction: {
    backgroundColor: "#F44336",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
  },
  deleteText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingBox: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 200,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
  },
});