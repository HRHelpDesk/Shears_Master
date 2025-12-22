// CardListViewReadOnlyMobile.js
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { useTheme, Chip } from "react-native-paper";

import { mapFields } from "shears-shared/src/config/fieldMapper";
import ReadOnlyDetailMobile from "../ReadOnly/ReadOnlyDetail";

/* ============================================================
   Helpers
============================================================ */

function normalizeItem(item) {
  if (!item) return item;

  // ✅ Flatten fieldsData for ReadOnlyDetail
  if (item.fieldsData) {
    return {
      ...item.fieldsData,
      _id: item._id,
      recordType: item.recordType,
    };
  }

  return item;
}

function getImage(item) {
  return item?.fieldsData?.announcementImage?.[0]?.url || null;
}

function getVideoUrl(item) {
  return item?.fieldsData?.videoUrl || null;
}

function getTitle(item) {
  return (
    item?.fieldsData?.announcementName ||
    item?.fieldsData?.annnouncementName ||
    "Announcement"
  );
}

function getDescription(item) {
  return (
    item?.fieldsData?.message ||
    item?.fieldsData?.description ||
    ""
  );
}

function getDate(item) {
  const raw =
    item?.fieldsData?.date ||
    item?.fieldsData?.createdAt ||
    item?.createdAt;

  if (!raw) return null;

  const date = new Date(raw);
  if (isNaN(date)) return null;

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function CardListView({
  data = [],
  fields = [],
  name = "Announcements",
}) {
  const theme = useTheme();
  const [selectedItem, setSelectedItem] = useState(null);

  // ✅ Normalize schema fields (overrides + labels)
  const mappedFields = useMemo(() => mapFields(fields || []), [fields]);

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {data.map((item) => {
          const imageUrl = getImage(item);
          const videoUrl = getVideoUrl(item);
          const title = getTitle(item);
          const description = getDescription(item);
          const dateLabel = getDate(item);

          return (
            <TouchableOpacity
              key={item._id}
              activeOpacity={0.9}
              onPress={() => setSelectedItem(normalizeItem(item))} // ✅ FIX
              style={[
                styles.card,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              {(imageUrl || videoUrl) && (
                <View style={styles.mediaWrapper}>
                  {imageUrl && (
                    <Image source={{ uri: imageUrl }} style={styles.image} />
                  )}

                  {videoUrl && (
                    <View style={styles.videoBadge}>
                      <Chip compact>Video</Chip>
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
                    numberOfLines={4}
                  >
                    {description}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* READ-ONLY DETAIL */}
      <ReadOnlyDetailMobile
        visible={!!selectedItem}
        onDismiss={() => setSelectedItem(null)}
        item={selectedItem}
        fields={mappedFields}
        name={name}
      />
    </>
  );
}

/* ============================================================
   Styles
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
  },
  mediaWrapper: {
    width: "100%",
    aspectRatio: 4 / 3,
    backgroundColor: "#eee",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  videoBadge: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  content: {
    padding: 14,
  },
  date: {
    fontSize: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    lineHeight: 19,
  },
});
