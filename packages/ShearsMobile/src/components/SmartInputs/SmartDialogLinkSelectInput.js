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

import FieldActionsForEntry from "../BaseUI/ActionMenu/FieldActionsForEntry";
import { GlassActionButton } from '../UI/GlassActionButton';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ============================================================
   Helpers
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

const getLinkedDisplayFields = (raw) => {
  if (!raw || typeof raw !== "object") return [];

  const fields = [];

  if (raw.price != null) {
    fields.push({ key: "price", label: "Price", layout: "inline" });
  }

  if (raw.duration != null) {
    fields.push({ key: "duration", label: "Duration", layout: "inline" });
  }

  if (raw.phone && Array.isArray(raw.phone)) {
    fields.push({ key: "phone", label: "Phone", layout: "inline" });
  }

  if (raw.description) {
    fields.push({ key: "description", label: "Description", layout: "full" });
  }

  return fields;
};

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function SmartDialogLinkSelectInput({
  label,
  value,
  recordTypeName = "contacts",
  onChangeText,
  placeholder = "Select...",
  mode = "edit",
  error,
  helperText,

  // NEW
  showQuantity = false,
  autoEnableQuantityFor = ["products"],
}) {
  const { token, user } = useContext(AuthContext);
  const theme = useTheme();

  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const [quantity, setQuantity] = useState(value?.quantity || 1);

  const scrollRef = useRef(null);

  const quantityEnabled =
    showQuantity || autoEnableQuantityFor.includes(recordTypeName);

  /* Sync displayed name */
  useEffect(() => {
    if (value?.name) setSearchValue(value.name);
    else if (typeof value === "string") setSearchValue(value);
    else setSearchValue("");
  }, [value]);

  /* Sync quantity */
  useEffect(() => {
    if (value?.quantity != null) {
      setQuantity(value.quantity);
    }
  }, [value]);

  /* Fetch records when dialog opens */
  useEffect(() => {
    if (visible) fetchRecords();
  }, [visible]);

  /* Smooth scroll when keyboard appears */
  useEffect(() => {
    const showListener = Keyboard.addListener("keyboardDidShow", () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    return () => showListener.remove();
  }, []);

  const fetchRecords = async (query = "") => {
    if (!token) return;
    setLoading(true);

    try {
      const response = await getRecords({
        recordType: recordTypeName.toLowerCase(),
        subscriberId: user.subscriberId,
        userId: user.userId,
        token,
        status: "active",
      });

      const formatted =
        response?.map((r) => {
          const fields = r.fieldsData || {};

          const nameKeys = Object.keys(fields).filter((k) =>
            k.toLowerCase().includes("name")
          );

          const displayName = nameKeys.length
            ? nameKeys.slice(0, 2).map((k) => fields[k]).join(" ")
            : "(Unnamed)";

          return { _id: r._id, name: displayName, raw: fields };
        }) || [];

      const filtered = query
        ? formatted.filter((r) =>
            r.name.toLowerCase().includes(query.toLowerCase())
          )
        : formatted;

      setRecords(filtered);
    } catch (err) {
      console.error(err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (record) => {
    onChangeText({
      ...record,
      quantity: quantity || 1,
    });

    setVisible(false);
    setRecords([]);
  };

  /* ============================================================
     READ MODE
  ============================================================ */
  if (mode === "read") {
    const raw = value?.raw || {};
    const fields = getLinkedDisplayFields(raw);

    const compact = fields.filter((f) => f.layout === "inline");
    const fullWidth = fields.filter((f) => f.layout === "full");

    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={{ marginBottom: 6, color: theme.colors.primary, fontSize: 16 }}>
          {label}
        </Text>

        <TouchableOpacity
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setExpanded(!expanded);
          }}
        >
          <View
            style={{
              backgroundColor: theme.dark ? "#222" : "#eee",
              padding: 14,
              borderRadius: 8,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontWeight: "600" }}>
              {value?.name || <Text style={{ opacity: 0.6 }}>Not set</Text>}
            </Text>
            <Text style={{ opacity: 0.6 }}>{expanded ? "▲" : "▼"}</Text>
          </View>
        </TouchableOpacity>

        {quantityEnabled && value?.quantity && (
          <Text
            style={{
              marginTop: 6,
              marginLeft: 2,
              color: theme.colors.outline,
              fontWeight: "600",
            }}
          >
            Quantity: {value.quantity}
          </Text>
        )}

        {expanded && (
          <View style={{ paddingTop: 12 }}>
            {compact.map((f) => {
              const isPhone = f.key === "phone";
              const phone = raw.phone?.[0];

              const formatted = isPhone
                ? phone?.value || "Not set"
                : formatLinkedValue(f.key, raw[f.key]);

              return (
                <View key={f.key} style={{ marginBottom: 12 }}>
                  <Text style={{ opacity: 0.6, fontSize: 12 }}>{f.label}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontWeight: "500", marginRight: 6 }}>
                      {formatted}
                    </Text>
                    {isPhone && phone && <FieldActionsForEntry entry={phone} />}
                  </View>
                </View>
              );
            })}

            {fullWidth.map((f) => (
              <View key={f.key} style={{ marginBottom: 12 }}>
                <Text style={{ opacity: 0.6, fontSize: 12 }}>{f.label}</Text>
                <Text style={{ fontWeight: "500" }}>
                  {formatLinkedValue(f.key, raw[f.key])}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }

  /* ============================================================
     EDIT MODE
  ============================================================ */
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ marginBottom: 6, color: theme.colors.text }}>
        {label}
      </Text>

      {/* Selector */}
      <TouchableOpacity onPress={() => setVisible(true)}>
        <View
          style={{
            borderWidth: 1,
            borderColor: theme.colors.outlineVariant,
            borderRadius: 8,
            padding: 12,
            backgroundColor: theme.colors.surface,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ opacity: searchValue ? 1 : 0.5 }}>
            {searchValue || placeholder}
          </Text>
          <Text style={{ opacity: 0.4 }}>⌄</Text>
        </View>
      </TouchableOpacity>

      {/* --------------------------
           QUANTITY FIELD (Updated)
      --------------------------- */}
      {quantityEnabled && value && value._id && (
        <View style={{ marginTop: 12 }}>
          <Text style={{ marginBottom: 6, color: theme.colors.text }}>
            Quantity
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.colors.surface,
              borderRadius: 8,
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderWidth: 1,
              borderColor: theme.colors.outlineVariant,
              justifyContent: "space-between",
            }}
          >
            {/* ---- Minus ---- */}
            <GlassActionButton
              icon="minus"
              theme={theme}
              onPress={() => {
                setQuantity(q => {
                  const newQ = Math.max(1, q - 1);
                  if (value) onChangeText({ ...value, quantity: newQ });
                  return newQ;
                });
              }}
              color={theme.colors.primary}
            />

            {/* ---- Input ---- */}
            <TextInput
              mode="flat"
              value={String(quantity)}
              keyboardType="numeric"
              onChangeText={(text) => {
                const num = parseInt(text.replace(/[^0-9]/g, ""), 10);
                const final = !num || num < 1 ? 1 : num;
                setQuantity(final);

                if (value) {
                  onChangeText({ ...value, quantity: final });
                }
              }}
              style={{
                flex: 1,
                marginHorizontal: 12,
                backgroundColor: "transparent",
                textAlign: "center",
                fontSize: 18,
                fontWeight: "600",
                paddingVertical: 0,
              }}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
            />

            {/* ---- Plus ---- */}
            <GlassActionButton
              icon="plus"
              theme={theme}
              onPress={() => {
                setQuantity(q => {
                  const newQ = q + 1;
                  if (value) onChangeText({ ...value, quantity: newQ });
                  return newQ;
                });
              }}
              color={theme.colors.primary}
            />
          </View>
        </View>
      )}

      {helperText && (
        <Text style={{ marginTop: 4, opacity: 0.6 }}>{helperText}</Text>
      )}

      {/* Dialog */}
      <Portal>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Dialog visible={visible} onDismiss={() => setVisible(false)}>
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
                style={{ marginBottom: 8 }}
              />

              {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} />
              ) : (
                <ScrollView ref={scrollRef}>
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
                        textAlign: "center",
                        marginTop: 12,
                        opacity: 0.6,
                        fontStyle: "italic",
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
   Styles
============================================================ */
const styles = StyleSheet.create({
  selectorText: {
    fontSize: 16,
  },
});
