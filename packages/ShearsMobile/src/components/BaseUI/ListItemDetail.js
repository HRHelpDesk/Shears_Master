// src/components/BaseUI/ListItemDetail/ListItemDetailScreen.jsx

import React, { useContext, useEffect, useMemo, useState, useRef } from "react";
import {
  Alert,
  ScrollView,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import uuid from 'react-native-uuid';

import { useTheme, Text, Divider, Button, Portal } from "react-native-paper";
import {
  buildTransactionFromAppointment,
  currencyToNumber,
  formatCurrency,
  singularize,
} from "shears-shared/src/utils/stringHelpers";
import { FieldMap } from "../../config/component-mapping/FieldMap";
import {
  createRecord,
  deleteRecord,
  updateRecord,
} from "shears-shared/src/Services/Authentication";
import { AuthContext } from "../../context/AuthContext";
import PlainTextInput from "../../components/SmartInputs/PlainTextInput";
import { GlassActionButton } from "../UI/GlassActionButton";
import { getDisplayTitle } from "shears-shared/src/utils/stringHelpers";
import LinearGradient from "react-native-linear-gradient";
import SubtitleText from "../UI/SubtitleText";
import FieldActionsForEntry from "../BaseUI/ActionMenu/FieldActionsForEntry";

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
  mode,
  theme,
  parentPath,
  onPaymentComplete,
  columns = 3,
}) => {
  const groupedByRow = nestedFields.reduce((acc, f) => {
    const row = f.layout?.row || 1;
    if (!acc[row]) acc[row] = [];
    acc[row].push(f);
    return acc;
  }, {});

  const screenWidth = Dimensions.get("window").width;
  const isSmallScreen = screenWidth < 400;

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
            style={[styles.columnsContainer, { flexDirection: "row", flexWrap: "wrap" }]}
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
                    mode={mode}
                    theme={theme}
                    parentPath={parentPath}
                    onPaymentComplete={onPaymentComplete}

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
   RenderField (includes PaymentButton logic)
============================================================ */
const RenderField = ({
  fieldDef,
  item,
  handleChange,
  mode,
  theme,
  parentPath = "",
  onPaymentComplete,
}) => {
  const inputType = fieldDef.input || fieldDef.type || "text";
  const nestedFields =
    fieldDef.objectConfig || fieldDef.arrayConfig?.object || [];
  const FieldComponent = FieldMap[inputType] || PlainTextInput;
  const fieldPath = parentPath
    ? `${parentPath}.${fieldDef.field}`
    : fieldDef.field;
  const value = getValue(item, fieldPath);

  /* Auto-init object/array */
  if (fieldDef.arrayConfig?.object && !Array.isArray(value))
    handleChange(fieldPath, []);
  else if (
    fieldDef.objectConfig &&
    (value === undefined || typeof value !== "object")
  )
    handleChange(fieldPath, {});

  /* IMAGE FIELD */
  if (inputType === "image") {
    return (
      <View style={styles.fieldWrapper}>
        <FieldComponent
          label={fieldDef.label || fieldDef.field}
          mode={mode}
          value={value}
          onChangeText={(newVal) => handleChange(fieldPath, newVal)}
          inputConfig={fieldDef.inputConfig || {}}
        />
      </View>
    );
  }

  /* ARRAY FIELD */
  if (Array.isArray(value)) {
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
      <View style={[styles.arraySection]}>
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
            {fieldDef.label || fieldDef.field}
          </Text>

          {(mode === "edit" || mode === "add") && (
            <Button
              mode="text"
              onPress={handleAddArrayItem}
              icon="plus"
              compact
              textColor={theme.colors.primary}
            >
              Add
            </Button>
          )}
        </View>

        <Divider style={{ marginBottom: 12 }} />

        {value.length === 0 ? (
          <View style={styles.emptyState}>
            {mode === "edit" ? (
              <TouchableOpacity onPress={handleAddArrayItem}>
                <Text style={{ color: theme.colors.textSecondary, fontStyle: "italic" }}>
                  Tap to add first entry
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={{ color: theme.colors.textSecondary, fontStyle: "italic" }}>
                No entries
              </Text>
            )}
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
                    {singularize(fieldDef.label || fieldDef.field)} #{idx + 1}
                  </Text>

                  {mode === "read" && <FieldActionsForEntry entry={entry} />}
                </View>

                {(mode === "edit" || mode === "add") && (
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

              <View style={styles.arrayItemContent}>
                {fieldDef.input === "linkSelect" ? (
                  <FieldMap.linkSelect
                    label={fieldDef.label || fieldDef.field}
                    value={entry}
                    mode={mode}
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
                    mode={mode}
                    theme={theme}
                    parentPath={`${fieldPath}[${idx}]`}
                    columns={fieldDef.columns || 3}
                    onPaymentComplete={onPaymentComplete}
                  />
                )}
              </View>
            </View>
          ))
        )}
      </View>
    );
  }

  /* LINK SELECT */
  if (fieldDef.input === "linkSelect" && !Array.isArray(value)) {
    return (
      <View style={styles.fieldWrapper}>
        <FieldMap.linkSelect
          label={fieldDef.label || fieldDef.field}
          value={value}
          mode={mode}
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

  /* OBJECT FIELD */
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    fieldDef.objectConfig
  ) {
    return (
      <View style={[styles.objectSection]}>
        <Text
          variant="titleSmall"
          style={{ color: theme.colors.textSecondary, marginBottom: 8 }}
        >
          {fieldDef.label || fieldDef.field}
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
            mode={mode}
            theme={theme}
            parentPath={fieldPath}
            columns={fieldDef.columns || 3}
            onPaymentComplete={onPaymentComplete}

          />
        </View>
      </View>
    );
  }

  /* PAYMENT BUTTON */
  if (
    fieldDef.input === "paymentButton" ||
    fieldDef.type === "paymentButton"
  ) {
    const currentAmount = item?.payment?.amount || "0";
    const currentTax = item?.payment?.tax || 0;
    const numericAmount = currencyToNumber(currentAmount);

    return (
      <View style={styles.fieldWrapper}>
        <FieldComponent
          label={fieldDef.label || "Payment"}
          mode={mode}
          item={item}
          amount={numericAmount}
          tax={Number(currentTax)}
          onStatusChange={(paymentUpdate) => {
            const base = parentPath?.endsWith("payment")
              ? parentPath
              : "payment";

            handleChange(`${base}.status`, paymentUpdate.status);
            handleChange(`${base}.method`, paymentUpdate.method);
            handleChange(`${base}.sendReceipt`, paymentUpdate.sendReceipt);

            if (paymentUpdate.status === "Paid") {
              onPaymentComplete?.(paymentUpdate);
            }
          }}
        />
      </View>
    );
  }

  /* BASIC FIELD */
  return (
    <View style={styles.fieldWrapper}>
      <FieldComponent
        label={fieldDef.label || fieldDef.field}
        value={value}
        mode={mode}
        item={item} 
        onChangeText={(newVal) => handleChange(fieldPath, newVal)}
        multiline={fieldDef.input === "textarea"}
        keyboardType={
          fieldDef.input === "number" ? "numeric" : "default"
        }
        defaultValue={fieldDef.inputConfig?.defaultValue || ""}
        options={
          fieldDef.input === "select"
            ? fieldDef.inputConfig?.options || []
            : []
        }
      />
    </View>
  );
};

/* ============================================================
   MAIN SCREEN
============================================================ */
export default function ListItemDetailScreen({ route, navigation }) {
  const { item = {}, name, fields = [], mode: initialMode = "read", recordType } =
    route.params;
    useEffect(() => {
        console.log("Record type:", recordType);
    }, [recordType]);
  const theme = useTheme();
  const { token, user } = useContext(AuthContext);

  /* Prepare initial data */
  const initializeItemFromFields = (fields) => {
    const obj = {};
    fields.forEach((f) => {
      if (f.objectConfig) obj[f.field] = initializeItemFromFields(f.objectConfig);
      else if (f.arrayConfig?.object || f.type === "array") obj[f.field] = [];
      else obj[f.field] = "";
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
  const originalItemRef = useRef(JSON.parse(JSON.stringify(initialData)));

// --------------------------------------------------------------
// AUTO CALC KEY — triggers recalculation when data changes
// --------------------------------------------------------------
const buildAutoKey = (obj) => {
  if (!obj || typeof obj !== "object") return "";

  if (Array.isArray(obj)) {
    return obj.map(buildAutoKey).join("|");
  }

  return Object.keys(obj)
    .sort()
    .map((k) => {
      const v = obj[k];
      if (typeof v === "object") return `${k}:${buildAutoKey(v)}`;
      return `${k}:${String(v)}`;
    })
    .join(",");
};

const autoKey = useMemo(() => buildAutoKey(localItem), [localItem]);
const lastAutoAmount = useRef(0);

// --------------------------------------------------------------
// AUTO CALC (mobile version) — full parity with Web
// --------------------------------------------------------------
useEffect(() => {
  if (!localItem) return;

  let totalAmount = 0;
  let totalMinutes = 0;

  // Walk all linkSelect entries and accumulate price + duration
  const walk = (node) => {
    if (!node || typeof node !== "object") return;

    // linkSelect raw.price
    if (node.raw?.price != null) {
      const p = currencyToNumber(node.raw.price);
      const q = Number(node.quantity ?? 1);
      totalAmount += p * q;
    }

    // linkSelect raw.duration
    if (node.raw?.duration) {
      const h = Number(node.raw.duration.hours || 0);
      const m = Number(node.raw.duration.minutes || 0);
      totalMinutes += h * 60 + m;
    }

    // Continue deep walk
    if (Array.isArray(node)) node.forEach(walk);
    else Object.values(node).forEach(walk);
  };

  walk(localItem);

  // APPLY CALCULATED FIELDS
  setLocalItem((prev) => {
    const updated = { ...prev };

    // ------------------------------
    // 1️⃣ Duration (hours/minutes)
    // ------------------------------
    if (totalMinutes > 0) {
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;

      if (!updated.duration) updated.duration = {};

      updated.duration = {
        hours: h.toString(),
        minutes: m.toString().padStart(2, "0"),
      };

      // Auto-calc endTime if startTime exists
      if (updated.time?.startTime) {
        const [sh, sm] = updated.time.startTime.split(":").map(Number);
        const start = new Date(0, 0, 0, sh, sm);
        const end = new Date(start.getTime() + totalMinutes * 60000);

        if (!updated.time) updated.time = {};

        updated.time.endTime =
          `${String(end.getHours()).padStart(2, "0")}:` +
          `${String(end.getMinutes()).padStart(2, "0")}`;
      }
    }

    // ------------------------------
    // 2️⃣ Payment auto amount
    // ------------------------------
    if (!updated.payment) updated.payment = {};

    const current = currencyToNumber(updated.payment.amount);

    if (!updated.payment.amount || current === lastAutoAmount.current) {
      updated.payment.amount = formatCurrency(String(totalAmount));
      lastAutoAmount.current = totalAmount;
    }

    return updated;
  });
}, [autoKey]);


  /* ----------------------------------------------------------
     Handle Payment Completion → create Transaction + update appt
  ---------------------------------------------------------- */
  const handlePaymentComplete = async (paymentUpdate) => {
    console.log("Payment completed:", paymentUpdate);
    console.log("Local item before transaction:", localItem);
    try {
      const newID = paymentUpdate?.paymentIntent ? paymentUpdate?.paymentIntent.id : uuid.v4();
      const tx = buildTransactionFromAppointment(localItem, paymentUpdate, newID);
  console.log("Built transaction:", tx);
      await createRecord(
        tx,
        "transactions",
        token,
        user.userId,
        user.subscriberId,
        user
      );

      if (item?._id) {
        await updateRecord(item._id, localItem, token);
      }

    } catch (err) {
      console.error("Transaction/save failed:", err);
    }
  };

  /* ----------------------------------------------------------
     Handle Field Change
  ---------------------------------------------------------- */
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

  /* ----------------------------------------------------------
     Saving Logic
  ---------------------------------------------------------- */
  const handleSave = async () => {
  try {
    const isUser = name?.toLowerCase() === "users";
    let savedId = item?._id;

    // -----------------------------------------
    // USERS
    // -----------------------------------------
    if (isUser) {
      if (mode === "add") {
        const created = await createRecord(
          localItem,
          "user",
          token,
          user.userId,
          user.subscriberId,
          user
        );

        // NEW RECORD → CLOSE SCREEN
        return navigation.goBack();

      } else {
        const idToUpdate = item?.userId || item?._id;
        localItem.__isUser = true;

        await updateRecord(idToUpdate, localItem, token);

        // EDIT EXISTING USER → STAY ON SCREEN
        originalItemRef.current = JSON.parse(JSON.stringify(localItem));
        return setMode("read");
      }
    }

    // -----------------------------------------
    // NON-USER RECORDS (appointments, transactions, etc)
    // -----------------------------------------
    if (mode === "edit" && item._id) {
      // Updating existing record
      await updateRecord(item._id, localItem, token);

      // STAY ON SCREEN → SWITCH TO READ MODE
      originalItemRef.current = JSON.parse(JSON.stringify(localItem));
      return setMode("read");

    } else {
      // Creating new record
      await createRecord(
        localItem,
        recordType.toLowerCase(),
        token,
        user.userId,
        user.subscriberId,
        user
      );

      // NEW RECORD → CLOSE SCREEN
      return navigation.goBack();
    }

  } catch (err) {
    console.error("Save failed:", err);
  }
};


  /* ----------------------------------------------------------
     Delete Logic
  ---------------------------------------------------------- */
  const handleDelete = async () => {
    const isUser = name?.toLowerCase() === "users";
    const idToDelete = isUser ? item?.userId || item?._id : item?._id;
    if (!idToDelete) return;

    const confirmed =
      Platform.OS === "web"
        ? window.confirm("Delete item?")
        : await new Promise((resolve) => {
            Alert.alert(
              "Confirm Delete",
              "Delete item?",
              [
                { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
                { text: "Delete", style: "destructive", onPress: () => resolve(true) },
              ]
            );
          });

    if (!confirmed) return;

    try {
      await deleteRecord(idToDelete, token, isUser);
      navigation.goBack({ shouldRefresh: true });
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <Portal.Host>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <LinearGradient
          colors={[
            theme.dark ? "rgba(20,20,20,1)" : "#ffffffff",
            theme.dark ? "rgba(40,40,40,1)" : "#ffffffff",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ flex: 1 }}
        >
          {/* HEADER */}
          <View
            style={[
              styles.headerContainer,
              { paddingHorizontal: 15, paddingTop: 25 },
            ]}
          >
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text
                  variant="headlineMedium"
                  style={{ color: theme.colors.text, fontWeight: "600" }}
                >
                  {getDisplayTitle(localItem, name, mode)}
                </Text>

                <SubtitleText name={name} item={localItem} />

                {mode === "read" && localItem?.createdAt && (
                  <Text
                    variant="bodySmall"
                    style={{
                      color: theme.colors.textSecondary,
                      marginTop: 4,
                    }}
                  >
                    Created {new Date(localItem.createdAt).toLocaleDateString()}
                  </Text>
                )}
              </View>

              <View style={styles.headerActions}>
                {mode === "read" ? (
                  <>
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
                      onPress={() => {
                        originalItemRef.current = JSON.parse(JSON.stringify(localItem));
                        setMode("edit");
                      }}
                      color={theme.colors.primary}
                      theme={theme}
                    />

                    <GlassActionButton
                      icon="close"
                      onPress={() =>navigation.goBack()}
                  
                      theme={theme}
                    />
                  </>
                ) : (
                  <>
                    <GlassActionButton
                      icon="check"
                      onPress={handleSave}
                      color={theme.colors.primary}
                      theme={theme}
                    />
                    <GlassActionButton
                      icon="close"
                      onPress={() => {
                        if (mode === "add") {
                          navigation.goBack();
                        } else {
                          // ❌ Restore snapshot
                          setLocalItem(JSON.parse(JSON.stringify(originalItemRef.current)));
                          setMode("read");
                        }
                      }}
                      theme={theme}
                    />

                  </>
                )}
              </View>
            </View>

            <Divider
              style={{ marginTop: 12, marginBottom: 4, opacity: 0.4 }}
            />
          </View>

          {/* CONTENT */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.fieldsContainer}>
              {fields.map((field, index) => (
                <React.Fragment key={`${field.field}-${index}`}>
                  <RenderField
                    fieldDef={field}
                    item={localItem}
                    handleChange={handleChange}
                    mode={mode}
                    theme={theme}
                    onPaymentComplete={handlePaymentComplete}
                  />
                  {index < fields.length - 1 && (
                    <Divider
                      style={{ marginVertical: 12, opacity: 0.3 }}
                    />
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
   Styles
============================================================ */
const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 60,
  },
  headerContainer: {
    marginBottom: 0,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
    marginLeft: 16,
    alignItems: "center",
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
  fieldsContainer: {},
});
