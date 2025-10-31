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
  Card,
} from 'react-native-paper';
import { AuthContext } from '../../context/AuthContext';
import { getRecords } from 'shears-shared/src/Services/Authentication';

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
}) {
  const { token, user } = useContext(AuthContext);
  const [visible, setVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const scrollRef = useRef(null);

  // Keep displayed value synced
  useEffect(() => {
    if (value && typeof value === 'object' && value.name) {
      setSearchValue(value.name);
    } else {
      setSearchValue('');
    }
  }, [value]);

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

  useEffect(() => {
    if (visible) fetchRecords();
  }, [visible]);

  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    return () => showListener.remove();
  }, []);

  const handleSelect = (record) => {
    onChangeText(record);
    setVisible(false);
    setRecords([]);
  };

  /** ----------------
   *  READ MODE
   * ---------------- */
  if (mode === 'read') {
    const displayText =
      (value && typeof value === 'object' && value.name) ||
      (typeof value === 'string' && value) ||
      placeholder;

    return (
      <View style={{ marginVertical: 6 }}>
        <Text
          variant="labelSmall"
          style={{
            color: theme.colors.onSurface,
            fontWeight: '500',
            marginBottom: 2,
          }}
        >
          {label}
        </Text>

        <View
          style={{
            backgroundColor: theme.dark
              ? theme.colors.surfaceVariant
              : theme.colors.surfaceDisabled || '#f4f4f4',
            borderRadius: 1,
            paddingVertical: 8,
            paddingHorizontal: 10,
          }}
        >
          <Text
            variant="bodyMedium"
            style={{
              color: theme.colors.onSurface,
            }}
          >
            {displayText ? (
              displayText
            ) : (
              <Text
                style={{
                  color: theme.colors.onSurfaceVariant,
                  fontStyle: 'italic',
                }}
              >
                —
              </Text>
            )}
          </Text>
        </View>
      </View>
    );
  }

  /** ----------------
   *  EDIT MODE
   * ---------------- */
  return (
    <View style={{ marginVertical: 6 }}>
      <Text
        variant="labelSmall"
        style={{
          color: theme.colors.onSurface,
          fontWeight: '500',
          marginBottom: 2,
        }}
      >
        {label}
      </Text>

      <TouchableOpacity onPress={() => setVisible(true)}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderWidth: 1,
            borderColor: theme.colors.outlineVariant,
            borderRadius: 1,
            backgroundColor: theme.colors.surface,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: searchValue ? theme.colors.onSurface : 'gray' }}>
            {searchValue || placeholder}
          </Text>
          <Text style={{ fontSize: 18, color: theme.colors.onSurfaceVariant }}>{'⌄'}</Text>
        </View>
      </TouchableOpacity>

      <Portal>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <Dialog
            visible={visible}
            onDismiss={() => setVisible(false)}
            style={{ backgroundColor: theme.colors.background, borderRadius: 1 }}
          >
            <Dialog.Title>Select {label}</Dialog.Title>
            <Dialog.Content style={{ maxHeight: 300 }}>
              <TextInput
                placeholder="Search..."
                value={searchValue}
                onChangeText={(text) => {
                  setSearchValue(text);
                  fetchRecords(text);
                }}
                style={{
                  marginBottom: 8,
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: 1,
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
                    <Text style={{ textAlign: 'center', color: 'gray', marginTop: 12 }}>
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
