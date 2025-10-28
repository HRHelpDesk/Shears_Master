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
import { TextInput, Text, Dialog, Portal, Button, List, useTheme, ActivityIndicator } from 'react-native-paper';
import { AuthContext } from '../../context/AuthContext';
import { getRecords } from 'shears-shared/src/Services/Authentication';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SmartDialogLinkSelectInput({
  label,
  value,
  recordTypeName = 'contacts',
  onChangeText,
  placeholder = 'Select...',
}) {
  const { token, user } = useContext(AuthContext);
  const [visible, setVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const scrollRef = useRef(null);

  const fetchRecords = async (query = '') => {
    console.log('Fetching records for', recordTypeName, 'with query:', query);
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
console.log('Fetched records:', response);
const formatted = response?.map((r) => {
  const fields = r.fieldsData || {};

  // --- Get all keys that include "name" and have a value ---
  const nameKeys = Object.keys(fields).filter(
    (key) => key.toLowerCase().includes('name') && fields[key]
  );

  // --- Take first two values, join with a space ---
  const displayName = nameKeys.length
    ? nameKeys.slice(0, 2).map((key) => fields[key]).join(' ')
    : '(Unnamed)';

  return {
    _id: r._id,
    name: displayName,
    raw: fields,
  };
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
  onChangeText(record); // pass full record if parent needs it
  setSearchValue(record.name); // update input display
  setVisible(false);
  setRecords([]);
};

  return (
    <View style={{ marginVertical: 6 }}>

      <TouchableOpacity onPress={() => setVisible(true)}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
            borderRadius: 8,
            backgroundColor: 'rgba(255,255,255,0.71)',
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: searchValue ? 'black' : 'gray' }}>
                {searchValue || placeholder}
                </Text>
          <Text style={{ fontSize: 18 }}>{'⌄'}</Text>
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
            style={{ backgroundColor: theme.colors.background, borderRadius: 8 }}
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
                  backgroundColor: 'rgba(255,255,255,0.71)',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
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
                      style={{ borderBottomWidth: 0.5, borderBottomColor: '#ccc' }}
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
