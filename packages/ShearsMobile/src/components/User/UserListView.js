// UserListView.js
import React, { useState, useEffect, useContext, useMemo } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { AuthContext } from '../../context/AuthContext';
import { getSubUsers } from 'shears-shared/src/Services/Authentication';

export default function UserListView({
    data = [],
  fields = null,
  name = 'Item',
  appConfig,
  type = 'alphabetical',
  onRefresh,
  refreshing = false,
}) {
  const theme = useTheme();
  const navigation = useNavigation();
  const { user, token } = useContext(AuthContext);
  const [finalFields, setFinalFields] = useState([]);

  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);


  /* -------------------------------------------------------------------------- */
    /* ✅ Load Display Fields                                                     */
    /* -------------------------------------------------------------------------- */
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
      return appFields.filter((f) => f.displayInList === true);
    }, [fields, appConfig, name]);


  const fetchUsers = async () => {
    try {
      if (!user?.subscriberId || !token) return;
      const data = await getSubUsers(user.subscriberId, token);
      setUsers(data || []);
    } catch (err) {
      console.log('Error loading users:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  /* ----------------------------------------------- */
  /* ✅ Helper: Combine first+last name if needed     */
  /* ----------------------------------------------- */
  const getDisplayName = (u) =>
    u.fullName ||
    `${u.firstName || ''} ${u.lastName || ''}`.trim() ||
    'Unnamed User';

  /* ----------------------------------------------- */
  /* ✅ Apply Search                                 */
  /* ----------------------------------------------- */
  const filtered = useMemo(() => {
    return users.filter((u) =>
      `${getDisplayName(u)} ${u.email} ${u.phone}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [users, search]);

  /* ----------------------------------------------- */
  /* ✅ Alphabetical Sections                        */
  /* ----------------------------------------------- */
  const sections = useMemo(() => {
    const grouped = {};

    filtered.forEach((u) => {
      const name = getDisplayName(u);
      const letter = name[0]?.toUpperCase() || '#';
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(u);
    });

    return Object.keys(grouped)
      .sort()
      .map((letter) => ({
        title: letter,
        data: grouped[letter],
      }));
  }, [filtered]);

  /* ----------------------------------------------- */
  /* ✅ Swipe-to-delete (optional)                   */
  /* ----------------------------------------------- */
  const handleDelete = (u) => {
    Alert.alert(
      'Delete user?',
      `Remove ${getDisplayName(u)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log('TODO delete'); // optional
          },
        },
      ]
    );
  };

  const renderRightActions = (u) => (
    <TouchableOpacity
      style={styles.deleteBtn}
      onPress={() => handleDelete(u)}
    >
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );

  /* ----------------------------------------------- */
  /* ✅ Render Item Row                              */
  /* ----------------------------------------------- */
  const renderItem = ({ item: u }) => {
    const name = getDisplayName(u);
    const initials = name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    return (
      <Swipeable renderRightActions={() => renderRightActions(u)}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.colors.surface }]}
          onPress={() =>
            navigation.navigate('ListItemDetail', {
            item: u,
              name:"users",
              appConfig,
              fields: finalFields,
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
            <Text
              style={[styles.name, { color: theme.colors.onSurface }]}
            >
              {name}
            </Text>

            {/* Matching Web Layout */}
            <Text
              style={[styles.subText, { color: theme.colors.onSurfaceVariant }]}
            >
              {u.email}
            </Text>
            {u.phone ? (
              <Text
                style={[styles.subText, { color: theme.colors.onSurfaceVariant }]}
              >
                {u.phone}
              </Text>
            ) : null}
            <Text
              style={[styles.subText, { color: theme.colors.onSurfaceVariant }]}
            >
              Role: {u.role}
            </Text>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  /* ----------------------------------------------- */
  /* ✅ Section Header                               */
  /* ----------------------------------------------- */
  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text
        style={[
          styles.sectionHeaderText,
          { color: theme.colors.primary },
        ]}
      >
        {title}
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
        placeholder="Search users..."
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
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* ✅ Add User FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() =>
          navigation.navigate('ListItemDetail', {
            item: {},
            name: 'User',
            mode: 'add',
            fields: finalFields,
            appConfig: appConfig,
          })
        }
      />
    </View>
  );
}

/* -------------------------------------------------------------- */
/* ✅ Styles                                                      */
/* -------------------------------------------------------------- */
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
    alignItems: 'flex-start',
    padding: 14,
    marginBottom: 8,
    borderRadius: 14,
    elevation: 3,
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
  textContainer: { marginLeft: 12, flex: 1 },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  subText: { fontSize: 13, lineHeight: 18 },
  sectionHeader: { paddingBottom: 6, paddingHorizontal: 10, marginTop: 12 },
  sectionHeaderText: { fontWeight: 'bold', fontSize: 14 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 100 : 20,
    borderRadius: 30,
  },
});
