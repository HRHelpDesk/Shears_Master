// src/components/SmartViews/SmartEditProfileView.jsx

import React, { useState, useEffect, useContext, useRef } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, Divider, Button, useTheme, Portal } from "react-native-paper";
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { singularize } from "shears-shared/src/utils/stringHelpers";

import PlainTextInput from "../../SmartInputs/PlainTextInput";
import { AuthContext } from "../../../context/AuthContext";
import { FieldMap } from "../../../config/component-mapping/FieldMap";
import { updateRecord } from "shears-shared/src/Services/Authentication";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ============================================================
   Utility
============================================================ */
const getValue = (source, path) => {
  if (!source || !path) return "";
  const normalized = path.replace(/\[(\d+)\]/g, ".$1");
  return normalized.split(".").reduce((acc, key) => acc?.[key], source) ?? "";
};

/* ============================================================
   Render Nested Fields
============================================================ */
const RenderNestedFields = ({
  nestedFields,
  item,
  handleChange,
  theme,
  parentPath,
  columns = 3,
  user,
}) => {
  const groupedByRow = nestedFields.reduce((acc, f) => {
    const row = f.layout?.row || 1;
    if (!acc[row]) acc[row] = [];
    acc[row].push(f);
    return acc;
  }, {});

  return (
    <>
      {Object.keys(groupedByRow).map((rowKey) => {
        const rowFields = groupedByRow[rowKey];
        const totalSpan = rowFields.reduce(
          (s, f) => s + (f.layout?.span || 1),
          0
        );

        return (
          <View
            key={`row-${rowKey}`}
            style={[styles.columnsContainer]}
          >
            {rowFields.map((nestedField) => {
              const span = nestedField.layout?.span || 1;
              const width = `${(span / totalSpan) * 100}%`;

              return (
                <View
                  key={nestedField.field}
                  style={[styles.columnItem, { width, paddingRight: 8 }]}
                >
                  <RenderField
                    fieldDef={nestedField}
                    item={item}
                    handleChange={handleChange}
                    theme={theme}
                    parentPath={parentPath}
                    user={user}
                  />
                </View>
              );
            })}
          </View>
        );
      })}
    </>
  );
};

/* ============================================================
   RenderField  (unchanged – included for completeness)
============================================================ */
const RenderField = ({
  fieldDef,
  item,
  handleChange,
  theme,
  parentPath = "",
  user,
}) => {
  const mode = "edit";
  const inputType = fieldDef.input || fieldDef.type || "text";
  const nestedFields =
    fieldDef.objectConfig || fieldDef.arrayConfig?.object || [];
  const FieldComponent = FieldMap[inputType] || PlainTextInput;
  const actualField = fieldDef.override?.field || fieldDef.field;
  const fieldPath = parentPath
    ? `${parentPath}.${actualField}`
    : actualField;

  const value = getValue(item, fieldPath);

  useEffect(() => {
    if (fieldDef.arrayConfig?.object && !Array.isArray(value)) {
      handleChange(fieldPath, []);
    } else if (
      fieldDef.objectConfig &&
      (value === undefined || typeof value !== "object")
    ) {
      handleChange(fieldPath, {});
    }
  }, []);

  if (inputType === "image") {
    return (
      <View style={styles.fieldWrapper}>
        <FieldComponent
          label={fieldDef.label || fieldDef.field}
          mode={mode}
          value={value}
          user={user}
          onChangeText={(newVal) => handleChange(fieldPath, newVal)}
          inputConfig={fieldDef.inputConfig || {}}
          required={fieldDef.required || fieldDef.override?.required}
        />
      </View>
    );
  }

  if (Array.isArray(value) && inputType !== "dateRange") {
    const handleAddArrayItem = () => {
      const newItem =
        fieldDef.input === "linkSelect"
          ? { _id: "", name: "" }
          : Object.fromEntries(
              (nestedFields || []).map((nf) => [nf.field, ""])
            );
      handleChange(fieldPath, [...value, newItem]);
    };

    const handleDeleteArrayItem = (idx) => {
      const updated = [...value];
      updated.splice(idx, 1);
      handleChange(fieldPath, updated);
    };

    return (
      <View style={styles.arraySection}>
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
            {fieldDef.label || fieldDef.field}
            {fieldDef.required && <Text style={{ color: 'red' }}> *</Text>}
          </Text>

          <Button
            mode="text"
            onPress={handleAddArrayItem}
            icon="plus"
            compact
            textColor={theme.colors.primary}
          >
            Add
          </Button>
        </View>

        <Divider style={{ marginBottom: 12 }} />

        {value.length === 0 ? (
          <View style={styles.emptyState}>
            <TouchableOpacity onPress={handleAddArrayItem}>
              <Text style={{ color: theme.colors.textSecondary, fontStyle: "italic" }}>
                Tap to add first entry
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          value.map((entry, idx) => (
            <View
              key={`${fieldPath}[${idx}]`}
              style={[
                styles.arrayItemCard,
                {
                  backgroundColor: theme.dark
                    ? "rgba(255,255,255,0.02)"
                    : "rgba(74,144,226,0.03)",
                  borderWidth: 1,
                  borderColor: theme.dark ? "#4B5563" : "#F3F4F6",
                },
              ]}
            >
              <View style={[styles.arrayItemHeader, { alignItems: "center" }]}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
                >
                  <Text
                    variant="labelLarge"
                    style={{ color: theme.colors.text, marginRight: 8 }}
                  >
                    {(singularize(fieldDef.name || fieldDef.field)).charAt(0).toUpperCase() +
                    (singularize(fieldDef.name || fieldDef.field)).slice(1)} #{idx + 1}
                  </Text>
                </View>

                <Button
                  mode="text"
                  compact
                  onPress={() => handleDeleteArrayItem(idx)}
                  textColor={theme.colors.error}
                  icon="delete-outline"
                >
                  Remove
                </Button>
              </View>

              <View style={styles.arrayItemContent}>
                {fieldDef.input === "linkSelect" ? (
                  <FieldMap.linkSelect
                    label={fieldDef.label || fieldDef.field}
                    value={entry}
                    mode={mode}
                    user={user}
                    recordTypeName={
                      fieldDef.inputConfig?.recordType ||
                      fieldDef.recordTypeName ||
                      "contacts"
                    }
                    onChangeText={(newVal) => {
                      const updated = [...value];
                      updated[idx] = newVal;
                      handleChange(fieldPath, updated);
                    }}
                  />
                ) : (
                  <RenderNestedFields
                    nestedFields={nestedFields}
                    item={item}
                    handleChange={handleChange}
                    theme={theme}
                    parentPath={`${fieldPath}[${idx}]`}
                    columns={fieldDef.columns || 3}
                    user={user}
                  />
                )}
              </View>
            </View>
          ))
        )}
      </View>
    );
  }

  if (fieldDef.input === "linkSelect" && !Array.isArray(value)) {
    return (
      <View style={styles.fieldWrapper}>
        <FieldMap.linkSelect
          label={fieldDef.label || fieldDef.field}
          value={value}
          mode={mode}
          user={user}
          recordTypeName={
            fieldDef.inputConfig?.recordType ||
            fieldDef.recordTypeName ||
            "contacts"
          }
          onChangeText={(newVal) => handleChange(fieldPath, newVal)}
        />
      </View>
    );
  }

  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    fieldDef.objectConfig
  ) {
    return (
      <View style={styles.objectSection}>
        <Text
          variant="titleSmall"
          style={{ color: theme.colors.textSecondary, marginBottom: 8 }}
        >
          {fieldDef.label || fieldDef.field}
          {fieldDef.required && <Text style={{ color: 'red' }}> *</Text>}
        </Text>

        <View
          style={[
            styles.objectContent,
            {
              backgroundColor: theme.dark
                ? "rgba(255,255,255,0.02)"
                : "rgba(74,144,226,0.03)",
              borderWidth: 1,
              borderColor: theme.dark ? "#4B5563" : "#F3F4F6",
            },
          ]}
        >
          <RenderNestedFields
            nestedFields={fieldDef.objectConfig}
            item={item}
            handleChange={handleChange}
            theme={theme}
            parentPath={fieldPath}
            columns={fieldDef.columns || 3}
            user={user}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fieldWrapper}>
      <FieldComponent
        label={fieldDef.label || fieldDef.field}
        value={value}
        mode={mode}
        item={item}
        user={user}
        onChangeText={(newVal) => handleChange(fieldPath, newVal)}
        multiline={fieldDef.input === "textarea"}
        keyboardType={fieldDef.input === "number" ? "numeric" : "default"}
        defaultValue={fieldDef.inputConfig?.defaultValue || ""}
        options={
          fieldDef.input === "select"
            ? fieldDef.inputConfig?.options || []
            : []
        }
        required={fieldDef.required || fieldDef.override?.required}
        inputConfig={fieldDef.inputConfig || {}}
      />
    </View>
  );
};

/* ============================================================
   MAIN COMPONENT – Updated with KeyboardAvoidingView
============================================================ */
export const SmartEditProfileView = ({ fields = [] }) => {
  const theme = useTheme();
  const { token, user, setUser, refreshUser } = useContext(AuthContext);
const insets = useSafeAreaInsets();

  const [localItem, setLocalItem] = useState({ ...user });
  const [saving, setSaving] = useState(false);
  const originalItemRef = useRef(JSON.parse(JSON.stringify(user)));

  const handleChange = (path, value) => {
    setLocalItem((prev) => {
      const updated = { ...prev };
      const keys = path.replace(/\[(\d+)\]/g, ".$1").split(".");
      let target = updated;
      while (keys.length > 1) {
        const key = keys.shift();
        if (!target[key]) target[key] = {};
        target = target[key];
      }
      target[keys[0]] = value;
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      localItem.__isUser = true;
      await updateRecord(user.userId, localItem, token);
      setUser((prev) => ({ ...prev, ...localItem }));
      originalItemRef.current = JSON.parse(JSON.stringify(localItem));
      Alert.alert("Success", "Profile updated successfully");
    } catch (err) {
      Alert.alert("Error", "Failed to save profile");
    } finally {
      await refreshUser();
      setSaving(false);
    }
  };

  return (
    <BottomSheetModalProvider>
      <Portal.Host>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20} // slight adjustment for Android
        >
          <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScrollView
              style={{ flex: 1 }}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
              contentContainerStyle={styles.scrollContent}
            >
              {fields.map((field, index) => (
                <React.Fragment key={`${field.field}-${index}`}>
                  <RenderField
                    fieldDef={field}
                    item={localItem}
                    handleChange={handleChange}
                    theme={theme}
                    user={user}
                  />
                  {index < fields.length - 1 && (
                    <Divider style={{ marginVertical: 12, opacity: 0.3 }} />
                  )}
                </React.Fragment>
              ))}

              {/* Extra bottom padding so last field isn't hidden under save button */}
              <View style={{ height: 100 }} />
            </ScrollView>

            <View style={[styles.saveButtonContainer, {
              paddingBottom: insets.bottom + 20,
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
            }]}>
              <Button
                mode="contained"
                onPress={handleSave}
                disabled={saving}
                loading={saving}
                style={{ borderRadius: 5 }}  // match SmartStatusWidget's borderRadius
              >
                Save Profile
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Portal.Host>
    </BottomSheetModalProvider>
  );
};

/* ============================================================
   Styles
============================================================ */
const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 120, // increased to ensure space below last field
  },
  fieldWrapper: {
    marginBottom: 16,
  },
  arraySection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: "center",
  },
  arrayItemCard: {
    marginBottom: 12,
    borderRadius: 8,
    padding: 12,
  },
  arrayItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  arrayItemContent: {},
  objectSection: {
    marginBottom: 5,
  },
  objectContent: {
    padding: 12,
    borderRadius: 8,
  },
  columnsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  columnItem: {
    marginBottom: 8,
  },
 saveButtonContainer: {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  paddingHorizontal: 20,
  paddingTop: 12,
  borderTopWidth: 1,
  borderColor: "rgba(0,0,0,0.08)",
},
});

export default SmartEditProfileView;