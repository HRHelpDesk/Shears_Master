// CardListViewReadOnlyMobile.js
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import { useTheme, Chip, IconButton, Badge } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";

import { mapFields } from "shears-shared/src/config/fieldMapper";

/* ============================================================
   Helpers
============================================================ */

function normalizeItem(item) {
  if (!item) return item;

  // Flatten fieldsData for detail screen compatibility
  if (item.fieldsData) {
    return {
      ...item.fieldsData,
      _id: item._id,
      recordType: item.recordType,
      createdAt: item.createdAt || item.fieldsData?.createdAt,
      updatedAt: item.updatedAt || item.fieldsData?.updatedAt,
    };
  }

  return item;
}

function getImage(item) {
  return (
    item?.fieldsData?.announcementImage?.[0]?.url ||
    item?.announcementImage?.[0]?.url ||
    null
  );
}

function getVideoUrl(item) {
  return item?.fieldsData?.videoUrl || item?.videoUrl || null;
}

function getTitle(item) {
  return (
    item?.fieldsData?.announcementName ||
    item?.fieldsData?.annnouncementName || // typo-tolerant
    item?.announcementName ||
    "Announcement"
  );
}

function getDescription(item) {
  return (
    item?.fieldsData?.message ||
    item?.fieldsData?.description ||
    item?.message ||
    item?.description ||
    ""
  );
}

function getDate(item) {
  const raw =
    item?.fieldsData?.date ||
    item?.fieldsData?.createdAt ||
    item?.createdAt ||
    item?.date;

  if (!raw) return null;

  const date = new Date(raw);
  if (isNaN(date.getTime())) return null;

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function CardListViewReadOnlyMobile({
  data = [],
  fields = [],
  name = "Announcements",
  recordType,
  modes = ["read"],
  actionsMenu = [],
  onRefresh,
  appConfig,
}) {
  const theme = useTheme();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  // Normalize schema fields
  const mappedFields = useMemo(() => mapFields(fields || []), [fields]);

  const handleCardPress = (item) => {
    const normalized = normalizeItem(item);

    navigation.navigate("ListItemDetail", {
      item: normalized,
      name,
      mode: "read",
      modes,
      fields: mappedFields,
      recordType: recordType || item.recordType || name.toLowerCase(),
      actionsMenu,
      appConfig,
    });
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
          enabled={!!onRefresh}
        />
      }
    >
      {data.map((item) => {
        const imageUrl = getImage(item);
        const videoUrl = getVideoUrl(item);
        const title = getTitle(item);
        const description = getDescription(item);
        const dateLabel = getDate(item);

        // Safely get comment count
        const commentCount = Array.isArray(item?.comments)
          ? item.comments.length
          : Array.isArray(item?.fieldsData?.comments)
            ? item.fieldsData.comments.length
            : 0;

        return (
          <TouchableOpacity
            key={item._id}
            activeOpacity={0.88}
            onPress={() => handleCardPress(item)}
            style={[
              styles.card,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            {(imageUrl || videoUrl) && (
              <View style={styles.mediaWrapper}>
                {imageUrl && (
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                )}

                {videoUrl && (
                  <View style={styles.videoBadge}>
                    <Chip compact mode="flat">
                      Video
                    </Chip>
                  </View>
                )}
              </View>
            )}

            <View style={styles.content}>
              {dateLabel && (
                <Text
                  style={[
                    styles.date,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {dateLabel}
                </Text>
              )}

              <Text
                style={[
                  styles.title,
                  { color: theme.colors.onSurface },
                ]}
                numberOfLines={2}
              >
                {title}
              </Text>

              {!!description && (
                <Text
                  style={[
                    styles.description,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                  numberOfLines={3}
                >
                  {description}
                </Text>
              )}

              {/* Comment icon + count – bottom right */}
              <View
                style={{
                  position: 'absolute',
                  bottom: 12,
                  right: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.colors.surface,
                  borderRadius: 20,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                }}
              >
                <IconButton
                  icon="comment-outline"
                  size={20}
                  color={commentCount > 0 ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  style={{ margin: 0, padding: 0 }}
                  onPress={() => handleCardPress(item)}
                />

                {commentCount > 0 && (
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.colors.primary,
                      fontWeight: 'bold',
                      marginLeft: 4,
                    }}
                  >
                    {commentCount}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      {data.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 16 }}>
            No {name.toLowerCase()} found
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

/* ============================================================
   Styles (updated with badge positioning)
============================================================ */
const styles = StyleSheet.create({
  container: {
    padding: 12,
    paddingBottom: 80,
  },
  card: {
    borderRadius: 14,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mediaWrapper: {
    width: "100%",
    aspectRatio: 4 / 3,
    backgroundColor: "#f0f0f0",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  videoBadge: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  content: {
    padding: 16,
    position: "relative", // for absolute badge
  },
  date: {
    fontSize: 13,
    marginBottom: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 23,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
});