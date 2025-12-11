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
} from 'react-native';

import { Avatar, useTheme } from 'react-native-paper';
import { singularize } from 'shears-shared/src/utils/stringHelpers';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../../context/AuthContext';

/* ---------------------------------------------------------
   UNIVERSAL NAME PARSER
--------------------------------------------------------- */
const getDisplayName = (item) => {
  if (!item) return "Unnamed";

  return (
    item.name ||
    item.fullName ||
    item.displayName ||
    item.raw?.name ||
    item.raw?.fullName ||
    item.fieldsData?.name ||
    item.fieldsData?.fullName ||
    (item.raw?.firstName && item.raw?.lastName
      ? `${item.raw.firstName} ${item.raw.lastName}`
      : null) ||
    "Unnamed"
  );
};

/* ---------------------------------------------------------
   UNIVERSAL AVATAR PARSER
--------------------------------------------------------- */
const getAvatarUrl = (item) => {
  if (!item) return null;

  const list = [
    item.avatar,
    item.avatar?.url,
    item.avatar?.[0]?.url,
    item.raw?.avatar,
    item.raw?.avatar?.url,
    item.raw?.avatar?.[0]?.url,
    item.fieldsData?.avatar,
    item.fieldsData?.avatar?.url,
    item.fieldsData?.avatar?.[0]?.url,
  ];

  for (const entry of list) {
    if (typeof entry === "string") return entry;
    if (entry?.url) return entry.url;
  }

  return null;
};

/* ---------------------------------------------------------
   SEARCH FILTER
--------------------------------------------------------- */
const matchesSearch = (item, search) => {
  if (!search) return true;
  const term = search.toLowerCase();

  return getDisplayName(item).toLowerCase().includes(term);
};

/* ---------------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------------- */
export default function SelectableListView({
  data = [],
  name = 'Item',
  onSelect,
  fields = null,
  onRefresh,
  refreshing = false,
}) {
  const theme = useTheme();
  const { appConfig } = useContext(AuthContext);

  const [search, setSearch] = useState('');
  const [localData, setLocalData] = useState(data);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const filtered = useMemo(() => {
    return localData.filter((item) => matchesSearch(item, search));
  }, [localData, search]);

  const sections = useMemo(() => {
    if (!filtered.length) return [{ title: "", data: [] }];

    const grouped = {};

    filtered.forEach((item) => {
      const name = getDisplayName(item);
      const letter = name[0]?.toUpperCase() || "#";
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(item);
    });

    return Object.keys(grouped)
      .sort()
      .map((letter) => ({ title: letter, data: grouped[letter] }));
  }, [filtered]);

  /* ---------------------------------------------------------
     Render Item — ONLY NAME (no subtext)
  --------------------------------------------------------- */
  const renderItem = ({ item }) => {
    const name = getDisplayName(item);
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
        onPress={() => onSelect?.(item)}
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

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionHeaderText, { color: theme.colors.primary }]}>
        {section.title}
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

      <SectionList
        sections={sections}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </View>
  );
}

/* ---------------------------------------------------------
   STYLES
--------------------------------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
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
  sectionHeader: { paddingVertical: 6 },
  sectionHeaderText: { fontWeight: '700', fontSize: 14 },
});
