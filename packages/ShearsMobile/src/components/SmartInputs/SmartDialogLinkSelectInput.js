// src/components/SmartInputs/SmartDialogLinkSelectInput.js
import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  LayoutAnimation,
  UIManager,
  StyleSheet,
} from 'react-native';
import {
  TextInput,
  Text,
  Dialog,
  Portal,
  Button,
  List,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { AuthContext } from '../../context/AuthContext';
import { getRecords } from 'shears-shared/src/Services/Authentication';

// Enable smooth LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SmartDialogLinkSelectInput({
  label,
  value,
  recordTypeName = 'contacts',
  onChangeText,
  placeholder = 'Select...',
  mode = 'edit',
  error,
  helperText,
}) {
  const { token, user } = useContext(AuthContext);
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  /* -------------------------------------------------------------------------- */
  /*                                  EFFECTS                                   */
  /* -------------------------------------------------------------------------- */

  // Keep search display synced to selected value
  useEffect(() => {
    if (value && typeof value === 'object' && value.name) {
      setSearchValue(value.name);
    } else if (typeof value === 'string') {
      setSearchValue(value);
    } else {
      setSearchValue('');
    }
  }, [value]);

  // Fetch records when visible
  useEffect(() => {
    if (visible) fetchRecords();
  }, [visible]);

  // Smooth scroll when keyboard opens
  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    return () => showListener.remove();
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                               DATA FETCHING                                */
  /* -------------------------------------------------------------------------- */

  const fetchRecords = async (query = '') => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await getRecords({
        recordType: recordTypeName.toLowerCase(),
        subscriberId: user.subscriberId,
        userId: user.userId,
        token,
        status: 'active',
      });

      const formatted =
        response?.map((r) => {
          const fields = r.fieldsData || {};
          const nameKeys = Object.keys(fields).filter(
            (key) => key.toLowerCase().includes('name') && fields[key]
          );
          const displayName = nameKeys.length
            ? nameKeys
                .slice(0, 2)
                .map((key) => fields[key])
                .join(' ')
            : '(Unnamed)';
          return { _id: r._id, name: displayName, raw: fields };
        }) || [];

      const filtered = query
        ? formatted.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
        : formatted;

      setRecords(filtered);
    } catch (err) {
      console.error('Error fetching records:', err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (record) => {
    onChangeText(record);
    setVisible(false);
    setRecords([]);
  };

  /* -------------------------------------------------------------------------- */
  /*                                 READ MODE                                  */
  /* -------------------------------------------------------------------------- */
  if (mode === 'read') {
    const displayText =
      (value && typeof value === 'object' && value.name) ||
      (typeof value === 'string' && value) ||
      '';

    return (
      <View style={styles.readContainer}>
        <Text
          variant="titleMedium"
          style={[styles.label, { color: theme.colors.primary }]}
        >
          {label}
        </Text>

        <Text
          variant="bodyLarge"
          style={[styles.readValue, { color: theme.colors.text }]}
        >
          {displayText ? (
            displayText
          ) : (
            <Text style={{ color: theme.colors.textLight, fontStyle: 'italic' }}>
              Not set
            </Text>
          )}
        </Text>
      </View>
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                 EDIT MODE                                  */
  /* -------------------------------------------------------------------------- */

  const borderColor = error
    ? theme.colors.error
    : visible
    ? theme.colors.primary
    : theme.colors.outlineVariant || theme.colors.border;

  return (
    <View style={styles.editContainer}>
      {/* Label */}
      <Text
        variant="labelMedium"
        style={[
          styles.label,
          {
            color: error ? theme.colors.error : theme.colors.text,
            marginBottom: 6,
          },
        ]}
      >
        {label}
      </Text>

      {/* Touchable Selector */}
      <TouchableOpacity onPress={() => setVisible(true)} activeOpacity={0.8}>
        <View
          style={[
            styles.selectorContainer,
            { backgroundColor: theme.colors.surface, borderColor },
          ]}
        >
          <Text
            style={[
              styles.selectorText,
              {
                color: searchValue
                  ? theme.colors.onSurface
                  : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {searchValue || placeholder}
          </Text>
          <Text style={styles.dropdownIcon}>⌄</Text>
        </View>
      </TouchableOpacity>

      {/* Helper or Error Text */}
      {(helperText || error) && (
        <Text
          variant="bodySmall"
          style={[
            styles.helperText,
            { color: error ? theme.colors.error : theme.colors.textSecondary },
          ]}
        >
          {error || helperText}
        </Text>
      )}

      {/* Dialog */}
      <Portal>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <Dialog
            visible={visible}
            onDismiss={() => setVisible(false)}
            style={[
              styles.dialogContainer,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <Dialog.Title>Select {label}</Dialog.Title>
            <Dialog.Content style={{ maxHeight: 320 }}>
              <TextInput
                placeholder="Search..."
                value={searchValue}
                onChangeText={(text) => {
                  setSearchValue(text);
                  fetchRecords(text);
                }}
                mode="outlined"
                style={{
                  marginBottom: 8,
                  backgroundColor: theme.colors.surfaceVariant,
                }}
              />

              {loading ? (
                <ActivityIndicator animating={true} style={{ marginTop: 20 }} />
              ) : (
                <ScrollView
                  ref={scrollRef}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ paddingBottom: 12 }}
                >
                  {records.map((record) => (
                    <List.Item
                      key={record._id}
                      title={record.name}
                      onPress={() => handleSelect(record)}
                      style={{
                        borderBottomWidth: 0.4,
                        borderBottomColor: theme.colors.outlineVariant,
                      }}
                    />
                  ))}
                  {records.length === 0 && !loading && (
                    <Text
                      style={{
                        textAlign: 'center',
                        color: theme.colors.textSecondary,
                        marginTop: 12,
                        fontStyle: 'italic',
                      }}
                    >
                      No results found
                    </Text>
                  )}
                </ScrollView>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setVisible(false)}>Cancel</Button>
            </Dialog.Actions>
          </Dialog>
        </KeyboardAvoidingView>
      </Portal>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  // READ MODE
  readContainer: {
    marginBottom: 4,
  },
  label: {
    fontWeight: '500',
    marginBottom: 4,
  },
  readValue: {
    lineHeight: 22,
  },

  // EDIT MODE
  editContainer: {
    marginBottom: 12,
  },
  selectorContainer: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    fontSize: 16,
    fontFamily: 'System',
  },
  dropdownIcon: {
    fontSize: 18,
    color: '#999',
    marginLeft: 6,
  },
  helperText: {
    marginTop: 4,
    marginLeft: 2,
  },
  dialogContainer: {
    borderRadius: 8,
  },
});
