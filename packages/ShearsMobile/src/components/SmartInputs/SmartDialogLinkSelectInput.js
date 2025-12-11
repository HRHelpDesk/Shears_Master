// src/components/SmartInputs/SmartDialogLinkSelectInput.js
import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View,
  TouchableOpacity,
  Keyboard,
  LayoutAnimation,
  UIManager,
  Platform,
  StyleSheet,
} from 'react-native';
import { TextInput, Text, useTheme } from 'react-native-paper';
import { AuthContext } from '../../context/AuthContext';
import { getRecords } from 'shears-shared/src/Services/Authentication';

import FieldActionsForEntry from "../BaseUI/ActionMenu/FieldActionsForEntry";
import { GlassActionButton } from '../UI/GlassActionButton';

// 💥 NEW IMPORTS
import BottomSheetModal from "../BaseUI/BottomSheetModal";
import SelectableListView from "../BaseUI/SubMenu/SelectableListView";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ============================================================
   Helpers
============================================================ */
const formatLinkedValue = (key, value) => {
  if (value == null) return "";

  // STRING / NUMBER
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  // ARRAY (ex: phone: [{label, value}])
  if (Array.isArray(value)) {
    return value
      .map(v => formatLinkedValue(key, v))
      .filter(Boolean)
      .join(", ");
  }

  // OBJECTS
  if (typeof value === "object") {
    // Duration { hours, minutes }
    if ("hours" in value || "minutes" in value) {
      const h = value.hours ?? 0;
      const m = value.minutes ?? 0;
      return `${h}h ${m}m`;
    }

    // Price { value } or {label, value}
    if ("value" in value) {
      if (key === "price") {
        const num = parseFloat(value.value || 0);
        return `$${num.toFixed(2)}`;
      }
      return String(value.value);
    }

    // Generic fallback → join all printable values
    return Object.values(value)
      .map(v => (typeof v === "string" || typeof v === "number" ? v : ""))
      .filter(Boolean)
      .join(" ");
  }

  // FINAL FALLBACK
  return "";
};


const getLinkedDisplayFields = (raw) => {
  if (!raw || typeof raw !== "object") return [];

  const fields = [];

    if (raw.price != null) fields.push({ key: "price", label: "Price", layout: "inline" });
  if (raw.duration != null) fields.push({ key: "duration", label: "Duration", layout: "inline" });
  if (Array.isArray(raw.phone)) fields.push({ key: "phone", label: "Phone", layout: "inline" });
  if (raw.description) fields.push({ key: "description", label: "Description", layout: "full" });
  if (raw.saleAmount) fields.push({ key: "saleAmount", label: "Sale Amount", layout: "full" });
  if (raw.percentage) fields.push({ key: "percentage", label: "Percentage off Regular Price", layout: "full" });

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
  helperText,

  // NEW quantity feature
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

  const quantityEnabled = showQuantity || autoEnableQuantityFor.includes(recordTypeName);

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

  /* Fetch records when bottom sheet opens */
  useEffect(() => {
    if (visible) fetchRecords();
  }, [visible]);

  /* Fetch list of records */
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
          const nameKeys = Object.keys(fields).filter((k) => k.toLowerCase().includes("name"));

          const displayName = nameKeys.length
            ? nameKeys.slice(0, 2).map((k) => fields[k]).join(" ")
            : "(Unnamed)";

          return { _id: r._id, name: displayName, raw: fields, fieldsData: r.fieldsData };
        }) || [];

      const filtered = query
        ? formatted.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
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

                  <Text style={{ fontWeight: "500" }}>{formatted}
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
      <Text style={{ marginBottom: 6, color: theme.colors.text }}>{label}</Text>

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

      {/* Quantity */}
      {quantityEnabled && value && value._id && (
        <View style={{ marginTop: 12 }}>
          <Text style={{ marginBottom: 6, color: theme.colors.text }}>Quantity</Text>

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
            <GlassActionButton
              icon="minus"
              theme={theme}
              onPress={() => {
                setQuantity((q) => {
                  const newQ = Math.max(1, q - 1);
                  onChangeText({ ...value, quantity: newQ });
                  return newQ;
                });
              }}
            />

            <TextInput
              mode="flat"
              value={String(quantity)}
              keyboardType="numeric"
              onChangeText={(text) => {
                const num = parseInt(text.replace(/[^0-9]/g, ""), 10);
                const final = num && num >= 1 ? num : 1;
                setQuantity(final);
                onChangeText({ ...value, quantity: final });
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
            />

            <GlassActionButton
              icon="plus"
              theme={theme}
              onPress={() => {
                setQuantity((q) => {
                  const newQ = q + 1;
                  onChangeText({ ...value, quantity: newQ });
                  return newQ;
                });
              }}
            />
          </View>
        </View>
      )}

      {helperText && <Text style={{ marginTop: 4, opacity: 0.6 }}>{helperText}</Text>}

      {/* ============================================================
          BOTTOM SHEET MODAL (REPLACES DIALOG)
      ============================================================ */}
      <BottomSheetModal
        visible={visible}
        onDismiss={() => setVisible(false)}
        component={SelectableListView}
        data={records}
        name={recordTypeName}
        loading={loading}
        onSelect={(record) => handleSelect(record)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  selectorText: { fontSize: 16 },
});
