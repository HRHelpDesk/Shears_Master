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

// ✅ NEW: inline phone actions
import FieldActionsForEntry from "../BaseUI/ActionMenu/FieldActionsForEntry";

// ✅ Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ============================================================
   ✅ Helper: Format price/duration
============================================================ */
const formatLinkedValue = (key, value) => {
  if (!value) return "";

  if (key === "price") {
    const num = parseFloat(value);
    return isNaN(num) ? value : `$${num.toFixed(2)}`;
  }

  if (key === "duration" && typeof value === "object") {
    const h = value.hours || "0";
    const m = value.minutes || "00";
    return `${h}h ${m}m`;
  }

  return value;
};

/* ============================================================
   ✅ Helper: Determine which fields to show
============================================================ */
const getLinkedDisplayFields = (raw) => {
  if (!raw || typeof raw !== "object") return [];

  const fields = [];

  if (raw.price != null) {
    fields.push({ key: "price", label: "Price", layout: "inline" });
  }

  if (raw.duration != null) {
    fields.push({ key: "duration", label: "Duration", layout: "inline" });
  }

  // ✅ NEW: Phone support
  if (raw.phone && Array.isArray(raw.phone)) {
    fields.push({ key: "phone", label: "Phone", layout: "inline" });
  }

  if (raw.description) {
    fields.push({ key: "description", label: "Description", layout: "full" });
  }

  return fields;
};

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
  const [expanded, setExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  /* ============================================================
     ✅ EFFECT: Sync displayed value
  ============================================================ */
  useEffect(() => {
    if (value?.name) setSearchValue(value.name);
    else if (typeof value === "string") setSearchValue(value);
    else setSearchValue("");
  }, [value]);

  /* ============================================================
     ✅ EFFECT: Fetch records when dialog opens
  ============================================================ */
  useEffect(() => {
    if (visible) fetchRecords();
  }, [visible]);

  /* ============================================================
     ✅ EFFECT: Smooth scroll on keyboard
  ============================================================ */
  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    return () => showListener.remove();
  }, []);

  /* ============================================================
     ✅ DATA FETCHING
  ============================================================ */
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
          const nameKeys = Object.keys(fields).filter(k =>
            k.toLowerCase().includes("name") && fields[k]
          );

          const displayName = nameKeys.length
            ? nameKeys.slice(0, 2).map(k => fields[k]).join(" ")
            : "(Unnamed)";

          return { _id: r._id, name: displayName, raw: fields };
        }) || [];

      const filtered = query
        ? formatted.filter(r =>
            r.name.toLowerCase().includes(query.toLowerCase())
          )
        : formatted;

      setRecords(filtered);

    } catch (err) {
      console.error("Error fetching records:", err);
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

  /* ============================================================
     ✅ READ MODE
  ============================================================ */
  if (mode === 'read') {
    const raw = value?.raw || {};
    const fields = getLinkedDisplayFields(raw);

    const compact = fields.filter(f => f.layout === "inline");
    const fullWidth = fields.filter(f => f.layout === "full");

    return (
      <View style={{ marginBottom: 12 }}>
        <Text
          variant="titleMedium"
          style={{ marginBottom: 6, color: theme.colors.primary }}
        >
          {label}
        </Text>

        {/* Dropdown header */}
        <TouchableOpacity
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setExpanded(!expanded);
          }}
          activeOpacity={0.8}
        >
          <View
            style={{
              backgroundColor: theme.dark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.05)',
              padding: 14,
              borderRadius: 8,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              variant="titleMedium"
              style={{ fontWeight: '600', color: theme.colors.text }}
            >
              {value?.name || (
                <Text style={{ color: theme.colors.textSecondary, fontStyle: 'italic' }}>
                  Not set
                </Text>
              )}
            </Text>

            <Text
              style={{
                fontSize: 18,
                color: theme.colors.textSecondary,
                transform: [{ rotate: expanded ? '180deg' : '0deg' }],
              }}
            >
              ▼
            </Text>
          </View>
        </TouchableOpacity>

        {/* ✅ Expandable detail */}
        {expanded && (
          <View style={{ paddingHorizontal: 6, paddingTop: 12 }}>

            {/* ✅ Inline compact fields */}
            {compact.length > 0 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {compact.map((f) => {
                const isPhoneField = f.key === "phone";

                let formatted;
                let phoneEntry = null;

                if (isPhoneField) {
                  if (Array.isArray(raw.phone) && raw.phone.length > 0) {
                    phoneEntry = raw.phone[0];      // object {label, value}
                    formatted = phoneEntry.value;   // ✅ ONLY render the number
                  } else {
                    formatted = "Not set";
                  }
                } else {
                  formatted = formatLinkedValue(f.key, raw[f.key]); 
                }

                  return (
                    <View
                      key={f.key}
                      style={{ width: "50%", marginBottom: 12 }}
                    >
                      <Text
                        style={{
                          color: theme.colors.textSecondary,
                          marginBottom: 2,
                          fontSize: 12,
                        }}
                      >
                        {f.label}
                      </Text>

                    <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          flexWrap: "nowrap",  
                          minWidth: 0,      
                          flex: 1,           
                        }}
                      >
                        <Text
                          style={{
                            color: theme.colors.text,
                            fontWeight: "500",
                            fontSize: 14,
                            marginRight: 6,
                          }}
                        >
                          {formatted}
                        </Text>

                        {/* ✅ Inline phone actions */}
                        {isPhoneField && phoneEntry && (
                          <View style={{ marginLeft: 4, flexDirection: "row", alignItems: "center" }}>
                          <FieldActionsForEntry entry={phoneEntry} />
                        </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* ✅ Full width fields */}
            {fullWidth.map((f) => {
              const formatted = formatLinkedValue(f.key, raw[f.key]);
              return (
                <View key={f.key} style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      marginBottom: 2,
                      fontSize: 12,
                    }}
                  >
                    {f.label}
                  </Text>
                  <Text style={{ color: theme.colors.text, fontSize: 14 }}>
                    {formatted}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  }

  /* ============================================================
     ✅ EDIT MODE
  ============================================================ */
  const borderColor = error
    ? theme.colors.error
    : visible
    ? theme.colors.primary
    : theme.colors.outlineVariant || theme.colors.border;

  return (
    <View style={styles.editContainer}>
      <Text
        variant="labelMedium"
        style={[
          styles.label,
          { color: error ? theme.colors.error : theme.colors.text },
        ]}
      >
        {label}
      </Text>

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

                  {records.length === 0 && (
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

/* ============================================================
   ✅ Styles
============================================================ */
const styles = StyleSheet.create({
  label: {
    fontWeight: '500',
    marginBottom: 4,
  },

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
