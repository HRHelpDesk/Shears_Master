// src/components/BaseUI/ListItemDetail/ListItemDetailScreen.jsx

import React, { useContext, useEffect, useMemo, useState, useRef } from 'react';
import {
  Alert,
  ScrollView,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { useTheme, Text, Divider, Button, Portal } from 'react-native-paper';
import { currencyToNumber, formatCurrency, singularize } from 'shears-shared/src/utils/stringHelpers';
import { FieldMap } from '../../config/component-mapping/FieldMap';
import { createRecord, deleteRecord, updateRecord } from 'shears-shared/src/Services/Authentication';
import { AuthContext } from '../../context/AuthContext';
import PlainTextInput from '../../components/SmartInputs/PlainTextInput';
import { GlassActionButton } from '../UI/GlassActionButton';
import { getDisplayTitle } from 'shears-shared/src/utils/stringHelpers';
import LinearGradient from 'react-native-linear-gradient';
import ActionMenu from "../BaseUI/ActionMenu/ActionMenu";
import SubtitleText from "../UI/SubtitleText";

// ✅ NEW — extracted actions for array entries
import FieldActionsForEntry from "../BaseUI/ActionMenu/FieldActionsForEntry";

/* ============================================================
   ✅ Utility
============================================================ */
const getValue = (source, path) => {
  if (!source || !path) return '';
  const normalized = path.replace(/\[(\d+)\]/g, '.$1');
  return normalized.split('.').reduce((acc, key) => acc?.[key], source) ?? '';
};

/* ============================================================
   ✅ Render Nested Fields
============================================================ */
const RenderNestedFields = ({ nestedFields, item, handleChange, mode, theme, parentPath, columns = 3 }) => {
  const groupedByRow = nestedFields.reduce((acc, f) => {
    const row = f.layout?.row || 1;
    if (!acc[row]) acc[row] = [];
    acc[row].push(f);
    return acc;
  }, {});

  const screenWidth = Dimensions.get('window').width;
  const isSmallScreen = screenWidth < 400;

  return (
    <>
      {Object.keys(groupedByRow).map((rowKey) => {
        const rowFields = groupedByRow[rowKey];
        const totalSpan = rowFields.reduce((s, f) => s + (f.layout?.span || 1), 0);

        return (
          <View key={`row-${rowKey}`} style={[styles.columnsContainer, { flexDirection: 'row', flexWrap: 'wrap' }]}>
            {rowFields.map((nestedField) => {
              const span = nestedField.layout?.span || 1;
              const width = `${(span / totalSpan) * 100}%`;

              return (
                <View key={nestedField.field} style={[styles.columnItem, { width, paddingRight: 8 }]}>
                  <RenderField
                    fieldDef={nestedField}
                    item={item}
                    handleChange={handleChange}
                    mode={mode}
                    theme={theme}
                    parentPath={parentPath}
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
   ✅ RenderField
============================================================ */
const RenderField = ({ fieldDef, item, handleChange, mode, theme, parentPath = '' }) => {
  const inputType = fieldDef.input || fieldDef.type || 'text';
  const nestedFields = fieldDef.objectConfig || fieldDef.arrayConfig?.object || [];
  const FieldComponent = FieldMap[inputType] || PlainTextInput;
  const fieldPath = parentPath ? `${parentPath}.${fieldDef.field}` : fieldDef.field;
  const value = getValue(item, fieldPath);

  // Initialize missing array/object structures
  if (fieldDef.arrayConfig?.object && !Array.isArray(value)) handleChange(fieldPath, []);
  else if (fieldDef.objectConfig && (value === undefined || typeof value !== 'object'))
    handleChange(fieldPath, {});

  /* ============================================================
     ✅ ARRAY FIELDS
  ============================================================ */
  if (Array.isArray(value)) {
    const handleAddArrayItem = () => {
      const newItem =
        fieldDef.input === 'linkSelect'
          ? { _id: '', name: '' }
          : Object.fromEntries((nestedFields || []).map((nf) => [nf.field, '']));

      handleChange(fieldPath, [...value, newItem]);
    };

    const handleDeleteArrayItem = (idx) => {
      const updated = [...value];
      updated.splice(idx, 1);
      handleChange(fieldPath, updated);
    };

    return (
      <View style={[styles.arraySection]}>
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
            {fieldDef.label || fieldDef.field}
          </Text>

          {(mode === 'edit' || mode === 'add') && (
            <Button mode="text" onPress={handleAddArrayItem} icon="plus" compact textColor={theme.colors.primary}>
              Add
            </Button>
          )}
        </View>

        <Divider style={{ marginBottom: 12 }} />

        {value.length === 0 ? (
          <View style={styles.emptyState}>
            {mode === 'edit' ? (
              <TouchableOpacity onPress={handleAddArrayItem}>
                <Text style={{ color: theme.colors.textSecondary, fontStyle: 'italic' }}>
                  Tap to add first entry
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={{ color: theme.colors.textSecondary, fontStyle: 'italic' }}>No entries</Text>
            )}
          </View>
        ) : (
          value.map((entry, idx) => (
            <View
              key={`${fieldPath}[${idx}]`}
              style={[
                styles.arrayItemCard,
                {
                  backgroundColor: theme.dark ? 'rgba(255,255,255,0.02)' : 'rgba(74,144,226,0.03)',
                  borderWidth: 1,
                  borderColor: theme.dark ? '#4B5563' : '#F3F4F6',
                },
              ]}
            >
              {/* ✅ INLINE HEADER: Title + Actions + Remove Button */}
              <View style={[styles.arrayItemHeader, { alignItems: "center" }]}>
                
                {/* LEFT: Title + Actions */}
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                <Text
                  variant="labelLarge"
                  style={{ color: theme.colors.text, marginRight: 8 }}
                >
                  {singularize(fieldDef.label || fieldDef.field)} #{idx + 1}
                </Text>

                {/* ✅ Only show actions in READ mode */}
                {mode === "read" && <FieldActionsForEntry entry={entry} />}
              </View>


                {/* RIGHT: Remove */}
                {(mode === 'edit' || mode === 'add') && (
                  <Button
                    mode="text"
                    compact
                    onPress={() => handleDeleteArrayItem(idx)}
                    textColor={theme.colors.error}
                    icon="delete-outline"
                  >
                    Remove
                  </Button>
                )}
              </View>

              {/* ✅ Content */}
              <View style={styles.arrayItemContent}>
                {fieldDef.input === 'linkSelect' ? (
                  <FieldMap.linkSelect
                    label={fieldDef.label || fieldDef.field}
                    value={entry}
                    mode={mode}
                    recordTypeName={fieldDef.inputConfig?.recordType || fieldDef.recordTypeName || 'contacts'}
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
                    mode={mode}
                    theme={theme}
                    parentPath={`${fieldPath}[${idx}]`}
                    columns={fieldDef.columns || 3}
                  />
                )}
              </View>
            </View>
          ))
        )}
      </View>
    );
  }

  /* ============================================================
     ✅ LINK SELECT (single)
  ============================================================ */
  if (fieldDef.input === 'linkSelect' && !Array.isArray(value)) {
    return (
      <View style={styles.fieldWrapper}>
        <FieldMap.linkSelect
          label={fieldDef.label || fieldDef.field}
          value={value}
          mode={mode}
          recordTypeName={fieldDef.inputConfig?.recordType || fieldDef.recordTypeName || 'contacts'}
          onChangeText={(newVal) => handleChange(fieldPath, newVal)}
        />
      </View>
    );
  }

  /* ============================================================
     ✅ OBJECT FIELDS
  ============================================================ */
  if (value && typeof value === 'object' && !Array.isArray(value) && fieldDef.objectConfig) {
    return (
      <View style={[styles.objectSection]}>
        <Text variant="titleSmall" style={{ color: theme.colors.textSecondary, marginBottom: 8 }}>
          {fieldDef.label || fieldDef.field}
        </Text>

        <View
          style={[
            styles.objectContent,
            {
              backgroundColor: theme.dark ? 'rgba(255,255,255,0.02)' : 'rgba(74,144,226,0.03)',
              borderWidth: 1,
              borderColor: theme.dark ? '#4B5563' : '#F3F4F6',
            },
          ]}
        >
          <RenderNestedFields
            nestedFields={fieldDef.objectConfig}
            item={item}
            handleChange={handleChange}
            mode={mode}
            theme={theme}
            parentPath={fieldPath}
            columns={fieldDef.columns || 3}
          />
        </View>
      </View>
    );
  }

  /* ============================================================
     ✅ BASIC FIELD
  ============================================================ */
  return (
    <View style={styles.fieldWrapper}>
      <FieldComponent
        label={fieldDef.label || fieldDef.field}
        value={value}
        mode={mode}
        onChangeText={(newVal) => handleChange(fieldPath, newVal)}
        multiline={fieldDef.input === 'textarea'}
        keyboardType={fieldDef.input === 'number' ? 'numeric' : 'default'}
        options={fieldDef.input === 'select' ? fieldDef.inputConfig?.options || [] : []}
      />
    </View>
  );
};

/* ============================================================
   ✅ MAIN COMPONENT
============================================================ */
export default function ListItemDetailScreen({ route, navigation }) {
  const { item = {}, name, fields = [], mode: initialMode = 'read' } = route.params;
  const theme = useTheme();
  const { token, user } = useContext(AuthContext);
console.log('item',item)
console.log('fields',fields)
  const initializeItemFromFields = (fields) => {
    const obj = {};
    fields.forEach((f) => {
      if (f.objectConfig) obj[f.field] = initializeItemFromFields(f.objectConfig);
      else if (f.arrayConfig?.object || f.type === 'array') obj[f.field] = [];
      else obj[f.field] = '';
    });
    return obj;
  };

  const initialData = useMemo(() => {
    if (item?.fieldsData) return item.fieldsData;
    if (item && Object.keys(item).length > 0) return item;
    return initializeItemFromFields(fields);
  }, [item, fields]);

  const [localItem, setLocalItem] = useState(initialData);
  const [mode, setMode] = useState(initialMode);

  const lastAutoAmountRef = useRef(0);

  /* Init baseline */
  useEffect(() => {
    const initial = currencyToNumber(localItem?.payment?.amount || "0");
    lastAutoAmountRef.current = isNaN(initial) ? 0 : initial;
  }, []);

  const autoCalcKey = JSON.stringify({
    service: localItem?.service,
    product: localItem?.product,
  });

  /* ============================================================
     ✅ Auto-calc duration + end time + payment
  ============================================================ */
  useEffect(() => {
    if (!localItem) return;

    let totalMinutes = 0;
    let totalAmount = 0;

    const findValues = (obj) => {
      if (!obj || typeof obj !== 'object') return;

      if (obj.raw?.duration) {
        const { hours = '0', minutes = '0' } = obj.raw.duration;
        totalMinutes += parseInt(hours || 0) * 60 + parseInt(minutes || 0);
      }

      if (obj.raw?.price) {
        const priceNum = parseFloat(obj.raw.price);
        if (!isNaN(priceNum)) totalAmount += priceNum;
      }

      if (Array.isArray(obj)) obj.forEach(findValues);
      else Object.values(obj).forEach(findValues);
    };

    findValues(localItem);

    setLocalItem((prev) => {
      const updated = { ...prev };

      if (totalMinutes > 0) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        updated.duration = {
          hours: hours.toString(),
          minutes: minutes.toString().padStart(2, '0'),
        };

        if (updated.time?.startTime) {
          const [h, m] = updated.time.startTime.split(':').map(Number);
          const start = new Date(0, 0, 0, h, m);
          const end = new Date(start.getTime() + totalMinutes * 60000);
          updated.time.endTime = `${String(end.getHours()).padStart(2, '0')}:${String(
            end.getMinutes()
          ).padStart(2, '0')}`;
        }
      }

      if (!updated.payment) updated.payment = { amount: '', status: 'Open', action: {} };

      const currentAmount = currencyToNumber(updated.payment.amount);
      const lastAutoAmount = lastAutoAmountRef.current;

      if (!updated.payment.amount || currentAmount === lastAutoAmount) {
        updated.payment.amount = formatCurrency(String(totalAmount));
        lastAutoAmountRef.current = totalAmount;
      }

      return updated;
    });
  }, [autoCalcKey]);

  /* ============================================================
     ✅ Handle Change
  ============================================================ */
  const handleChange = (path, value) => {
    setLocalItem((prev) => {
      const updated = { ...prev };
      const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
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

  /* ============================================================
   ✅ Save — FULL WEB PARITY LOGIC
============================================================ */
const handleSave = async () => {
  try {
    console.log("name",name)

    const isUser = name?.toLowerCase() === "users";
    console.log("Saving record for:", name, "isUser:", isUser);
    console.log("localItem:", localItem);

    /* ----------------------------------------------------------
       ✅ USER LOGIC — EXACT WEB PARITY
    ---------------------------------------------------------- */
    if (isUser) {
      if (mode === "add") {
        console.log("➡ Creating NEW USER…");

        await createRecord(
          localItem,
          "user",
          token,
          user.userId,        // createdById
          user.subscriberId,  // subscriber
          user                // owner info
        );

      } else {
        console.log("➡ Updating EXISTING USER…");

        const userIdToUpdate = item?.userId || item?._id;

        if (!userIdToUpdate) {
          throw new Error("Cannot update: user has no userId/_id");
        }

        // Mark as a true user update for updateRecord routing
        localItem.__isUser = true;

        await updateRecord(userIdToUpdate, localItem, token);
      }

      navigation.goBack();
      return;
    }

    /* ----------------------------------------------------------
       ✅ NORMAL NON-USER DATA RECORDS — EXACT WEB PARITY
    ---------------------------------------------------------- */
    if (mode === "edit" && item._id) {
      await updateRecord(item._id, localItem, token);

    } else {
      await createRecord(
        localItem,
        name.toLowerCase(),
        token,
        user.userId,       // createdById
        user.subscriberId, // subscriberId
        user               // owner info
      );
    }

    navigation.goBack();

  } catch (err) {
    console.error("Save failed:", err);
  }
};

/* ============================================================
   ✅ Delete — FULL WEB PARITY
============================================================ */
const handleDelete = async () => {
  const isUser = name?.toLowerCase() === "users";

  const idToDelete = isUser
    ? item?.userId || item?._id
    : item?._id;

  if (!idToDelete) return;

  const message = isUser
    ? "Are you sure you want to delete this user? This will permanently delete their account and all associated records."
    : "Are you sure you want to delete this item?";

  // ----- MOBILE CONFIRM -----
  const confirmNative = () =>
    new Promise((resolve) => {
      Alert.alert(
        "Confirm Delete",
        message,
        [
          { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
          { text: "Delete", style: "destructive", onPress: () => resolve(true) },
        ]
      );
    });

  // ----- WEB CONFIRM -----
  const confirmWeb = () => Promise.resolve(window.confirm(message));

  const confirmed = Platform.OS === "web"
    ? await confirmWeb()
    : await confirmNative();

  if (!confirmed) return;

  try {
    await deleteRecord(idToDelete, token, isUser);
    navigation.goBack({shouldRefresh: true});
  } catch (err) {
    console.error("Delete failed:", err);
  }
};




  /* ============================================================
     ✅ Render
  ============================================================ */
  return (
    <Portal.Host>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <LinearGradient
          colors={[
            theme.dark ? 'rgba(20,20,20,1)' : '#ffffffff',
            theme.dark ? 'rgba(40,40,40,1)' : '#ffffffff',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ flex: 1 }}
        >
          {/* HEADER */}
          <View style={[styles.headerContainer, { paddingHorizontal: 15, paddingTop: 25 }]}>
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text variant="headlineMedium" style={{ color: theme.colors.text, fontWeight: '600' }}>
                  {getDisplayTitle(localItem, name, mode)}
                </Text>
                <SubtitleText name={name} item={localItem} />


                {mode === 'read' && localItem?.createdAt && (
                  <Text variant="bodySmall" style={{ color: theme.colors.textSecondary, marginTop: 4 }}>
                    Created {new Date(localItem.createdAt).toLocaleDateString()}
                  </Text>
                )}
              </View>

             <View style={styles.headerActions}>
                {mode === 'read' ? (
                  <>
                    {/* DELETE BUTTON — SAME POSITION AS WEB */}
                    {item?._id && (
                      <GlassActionButton
                        icon="trash-can-outline"
                        color={theme.colors.error}
                        onPress={handleDelete}
                        theme={theme}
                      />
                    )}

                    <GlassActionButton
                      icon="pencil"
                      onPress={() => setMode('edit')}
                      color={theme.colors.primary}
                      theme={theme}
                    />

                    <GlassActionButton
                      icon="close"
                      onPress={() => navigation.goBack()}
                      theme={theme}
                    />
                  </>
                ) : (

                  <>
                    <GlassActionButton icon="check" onPress={handleSave} color={theme.colors.primary} theme={theme} />
                    <GlassActionButton
                      icon="close"
                      onPress={() => (mode === 'add' ? navigation.goBack() : setMode('read'))}
                      theme={theme}
                    />
                  </>
                )}
              </View>
            </View>

            {/* ✅ Top-level action menu */}
            {/* <ActionMenu item={localItem} /> */}

            <Divider style={{ marginTop: 12, marginBottom: 4, opacity: 0.4 }} />
          </View>

          {/* CONTENT */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
            <View style={styles.fieldsContainer}>
              {fields.map((field, index) => (
                <React.Fragment key={field.field}>
                  <RenderField
                    fieldDef={field}
                    item={localItem}
                    handleChange={handleChange}
                    mode={mode}
                    theme={theme}
                  />
                  {index < fields.length - 1 && (
                    <Divider style={{ marginVertical: 12, opacity: 0.3 }} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </ScrollView>

        </LinearGradient>
      </KeyboardAvoidingView>
    </Portal.Host>
  );
}

/* ============================================================
   ✅ Styles
============================================================ */
const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 60 },
  headerContainer: { marginBottom: 0 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerActions: { flexDirection: 'row', gap: 12, marginLeft: 16, alignItems: 'center' },
  fieldWrapper: { marginBottom: 16 },
  arraySection: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  emptyState: { paddingVertical: 24, alignItems: 'center' },
  arrayItemCard: { marginBottom: 12, borderRadius: 8, padding: 12 },
  arrayItemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  objectSection: { marginBottom: 5 },
  objectContent: { padding: 12, borderRadius: 8 },
  columnsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  columnItem: { marginBottom: 8 },
  fieldsContainer: {},
});
