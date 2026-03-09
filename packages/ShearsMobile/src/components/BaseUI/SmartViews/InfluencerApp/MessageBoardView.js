import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Dimensions,
} from "react-native";
import { useTheme, IconButton, Icon, FAB } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../../../../context/AuthContext";
import { getRecords, deleteRecord } from "shears-shared/src/Services/Authentication";
import { DateTime } from "luxon";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/* -------------------------------------------------------------------------- */
/* ⏱ Relative time helper                                                     */
/* -------------------------------------------------------------------------- */
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const dt = DateTime.fromISO(dateStr).isValid
    ? DateTime.fromISO(dateStr)
    : DateTime.fromFormat(dateStr, "yyyy-MM-dd");
  if (!dt.isValid) return "";

  const diff = DateTime.now().diff(dt, ["hours", "minutes"]);
  const totalHours = diff.hours + diff.minutes / 60;

  if (totalHours >= 12) return dt.toFormat("MMM d, h:mm a");
  if (totalHours >= 1) return `${Math.floor(totalHours)}h ago`;
  if (diff.minutes >= 1) return `${Math.floor(diff.minutes)}m ago`;
  return "Just now";
}

/* -------------------------------------------------------------------------- */
/* 🏷 Category pill colors                                                    */
/* -------------------------------------------------------------------------- */
const CATEGORY_COLORS = {
  General:          { bg: "#E8F4FD", text: "#1A7DC4" },
  Announcements:    { bg: "#FFF3E0", text: "#E65100" },
  "Tips & Tricks":  { bg: "#E8F5E9", text: "#2E7D32" },
  "Product Updates":{ bg: "#F3E5F5", text: "#6A1B9A" },
  "Q&A":            { bg: "#FCE4EC", text: "#B71C1C" },
};

function getCategoryStyle(category) {
  return CATEGORY_COLORS[category] || { bg: "#F0F0F0", text: "#555" };
}

/* -------------------------------------------------------------------------- */
/* 🗂 Normalise a record coming from getRecords                               */
/* -------------------------------------------------------------------------- */
function normalise(record) {
  return record.fieldsData
    ? { ...record.fieldsData, _id: record._id, recordType: record.recordType, createdById: record.createdById }
    : record;
}

/* -------------------------------------------------------------------------- */
/* 📰 Single Post Card                                                         */
/* -------------------------------------------------------------------------- */
function PostCard({ item, theme, fields, appConfig, name, onRecordDeleted, modes, user, token }) {
  const navigation = useNavigation();
  const [deleting, setDeleting] = useState(false);

  const body         = item.messageBody  || item.description || "";
  const category     = item.category     || null;
  const imageArr     = item.messageImage || item.image || null;
  const imageUrl     = Array.isArray(imageArr) ? imageArr[0]?.url : imageArr;
  const dateStr      = item.date         || item.createdAt || "";
  const author       = item.postedBy?.raw?.fullName || item.postedBy?.name || "Admin";
  const avatarUrl    = item.postedBy?.raw?.avatar || null;
  const catStyle     = category ? getCategoryStyle(category) : null;
  const commentCount = Array.isArray(item?.comments) ? item.comments.length : 0;
  const canDelete    = user?.role === "admin" || user?.userId === item.createdById;

  const authorInitials = author
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handlePress = () => {
    navigation.navigate("ListItemDetail", {
      item,
      name,
      appConfig,
      recordType: item.recordType || "messageBoard",
      fields,
      modes,
      mode: "read",
      onRecordDeleted,
    });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteRecord(item._id, token);
              onRecordDeleted?.();
            } catch (err) {
              Alert.alert("Error", "Failed to delete post. Please try again.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
    >
      {/* ── Header row ── */}
      <View style={styles.cardHeader}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.avatarInitials, { color: theme.colors.onPrimary }]}>
                {authorInitials}
              </Text>
            </View>
          )}
          <View style={[styles.threadLine, { backgroundColor: theme.colors.surfaceVariant || "#E5E5E5" }]} />
        </View>

        {/* Author + meta */}
        <View style={styles.headerMeta}>
          <View style={styles.headerTopRow}>
            <Text style={[styles.authorName, { color: theme.colors.onSurface }]}>{author}</Text>
            <Text style={[styles.timestamp, { color: theme.colors.onSurfaceVariant || "#999" }]}>
              {timeAgo(dateStr)}
            </Text>
          </View>

          {catStyle && category && (
            <View style={[styles.categoryPill, { backgroundColor: catStyle.bg }]}>
              <Text style={[styles.categoryText, { color: catStyle.text }]}>{category}</Text>
            </View>
          )}

          {!!body && (
            <Text style={[styles.postBody, { color: theme.colors.onSurfaceVariant || "#666" }]}>
              {body.length > 200 ? (
                <>
                  {body.slice(0, 200)}
                  <Text style={{ color: theme.colors.primary, fontWeight: "600" }}>
                    {"... Read more"}
                  </Text>
                </>
              ) : (
                body
              )}
            </Text>
          )}

          {!!imageUrl && (
            <Image
              source={{ uri: imageUrl }}
              style={styles.postImage}
              resizeMode="cover"
            />
          )}
        </View>
      </View>

      {/* ── Footer: comments + delete ── */}
      <View style={styles.cardFooter}>

        {/* Comment count */}
        <View style={styles.commentCount}>
          <IconButton
            icon="comment-outline"
            size={18}
            iconColor={commentCount > 0 ? theme.colors.primary : theme.colors.onSurfaceVariant || "#999"}
            style={{ margin: 0, padding: 0 }}
          />
          {commentCount > 0 && (
            <Text style={[styles.commentCountText, { color: theme.colors.primary }]}>
              {commentCount}
            </Text>
          )}
        </View>

        {/* Delete */}
        {canDelete && (
          deleting ? (
            <ActivityIndicator size="small" color={theme.colors.error} />
          ) : (
            <TouchableOpacity
              onPress={handleDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.deleteBtn, { color: theme.colors.error }]}><Icon size={18} source="delete" color="tomato" /></Text>
            </TouchableOpacity>
          )
        )}
      </View>
    </TouchableOpacity>
  );
}

/* -------------------------------------------------------------------------- */
/* 📋 MAIN COMPONENT — MessageBoardView                                       */
/* -------------------------------------------------------------------------- */
export default function MessageBoardView({
  name       = "Message Board",
  recordType = "messageBoard",
  fields     = [],
  appConfig,
  modes      = ["add", "read"],
}) {
  const theme      = useTheme();
  const navigation = useNavigation();
  const { token, user } = useContext(AuthContext);

  const [data, setData]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ── Fetch ── */
  const loadData = useCallback(async (isRefresh = false) => {
    if (!token || !user?.subscriberId) return;
    if (isRefresh) setRefreshing(true);

    try {
      const res = await getRecords({
        recordType,
        subscriberId: user.subscriberId,
        token,
        limit: 100,
      });
      const raw = Array.isArray(res) ? res : res?.records || [];
      setData(raw.map(normalise));
    } catch (err) {
      console.error("🔥 MessageBoardView fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user?.subscriberId, recordType]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── New post ── */
  const handleNewPost = () => {
    navigation.navigate("ListItemDetail", {
      item: {},
      name,
      displayName:"Add New Post",
      mode: "add",
      appConfig,
      recordType,
      fields,
      onRecordDeleted: () => loadData(true),
      onRecordAdded:   () => loadData(true),
    });
  };

  /* ── Header ── */
  const ListHeader = () => (
    <View style={[styles.feedHeader, { borderBottomColor: theme.colors.surfaceVariant || "#E5E5E5" }]}>
      <Text style={[styles.feedTitle, { color: theme.colors.onSurface }]}>
        Message Board
      </Text>
      <TouchableOpacity
        onPress={handleNewPost}
        style={[styles.newPostBtn, { backgroundColor: theme.colors.primary }]}
        activeOpacity={0.82}
      >
        <Text style={[styles.newPostBtnText, { color: theme.colors.onPrimary }]}>
          + New Post
        </Text>
      </TouchableOpacity>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant || "#999" }]}>
        No posts yet.{"\n"}Be the first to post!
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={data}
        keyExtractor={(item) => item._id || Math.random().toString()}
        renderItem={({ item }) => (
          <PostCard
            item={item}
            theme={theme}
            fields={fields}
            appConfig={appConfig}
            name={name}
            modes={modes}
            user={user}
            token={token}
            onRecordDeleted={() => loadData(true)}
          />
        )}
        
        ListEmptyComponent={<ListEmpty />}
       // stickyHeaderIndices={[0]}
        refreshing={refreshing}
        onRefresh={() => loadData(true)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

         <FAB
      icon="plus"
      color={theme.colors.onPrimary}
      style={[styles.fab, { backgroundColor: theme.colors.primary }]}
      onPress={handleNewPost}
    />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* 🎨 Styles                                                                  */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 40,
  },

  /* ── Feed Header ── */
  feedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  feedTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  newPostBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newPostBtnText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  /* ── Post Card ── */
  card: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E8E8E8",
  },
  cardHeader: {
    flexDirection: "row",
  },

  /* ── Avatar ── */
  avatarWrap: {
    alignItems: "center",
    marginRight: 12,
    width: 44,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: "700",
  },
  threadLine: {
    flex: 1,
    width: 2,
    marginTop: 6,
    borderRadius: 1,
    minHeight: 24,
  },

  /* ── Content ── */
  headerMeta: {
    flex: 1,
    paddingBottom: 14,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  authorName: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  timestamp: {
    fontSize: 13,
  },
  categoryPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  postBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 8,
  },

  /* ── Footer ── */
cardFooter: {
  flexDirection: "row",
  justifyContent: "flex-end",  // ← changed from space-between
  alignItems: "center",
  paddingTop: 4,
  paddingBottom: 10,
  gap: 12,                     // ← space between delete and comment count
},
  commentCount: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentCountText: {
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 2,
  },
  deleteBtn: {
    fontSize: 13,
    fontWeight: "600",
  },

  /* ── Empty state ── */
  emptyWrap: {
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  fab: {
  position: "absolute",
  right: 16,
  bottom: Platform.OS === "ios" ? 90 : 24,
},
});