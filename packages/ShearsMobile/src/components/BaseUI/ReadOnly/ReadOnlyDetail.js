// ReadOnlyDetailMobile.js — FULLSCREEN OVERLAY, NOT A NATIVE MODAL
import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "react-native-paper";
import { FieldMap } from "../../../config/component-mapping/FieldMap";
import { GlassActionButton } from "../../UI/GlassActionButton";
import { getDisplayTitle } from "shears-shared/src/utils/stringHelpers";

export default function ReadOnlyDetailMobile({
  visible,
  onDismiss,
  item,
  fields,
  name
}) {
  const theme = useTheme();
  if (!visible || !item) return null; // <-- behave like modal: hide when not visible

  const title =  getDisplayTitle(item, name, 'read')

  return (
    <View
      style={[
        styles.overlay,
        { backgroundColor: "rgba(0,0,0,0.5)", zIndex: 99999 },
      ]}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.surface }]}
      >
        {/* HEADER */}
        <View style={[styles.header, { borderColor: theme.colors.outline }]}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            {title}
          </Text>

          <View style={styles.closeWrapper}>
            <GlassActionButton
              icon="close"
              size={24}
              color={theme.colors.primary}
              onPress={onDismiss}
            />
          </View>
        </View>

        {/* CONTENT */}
        <ScrollView style={styles.content}>
          {fields.map((field) => (
            <RenderFieldReadOnly
              key={field.field}
              fieldDef={field}
              item={item}
              theme={theme}
            />
          ))}
          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/* Supporting renderer */
function RenderFieldReadOnly({ fieldDef, item, theme, parentPath = "" }) {
  const type = fieldDef.input || fieldDef.type || "text";
  const nested = fieldDef.objectConfig || fieldDef.arrayConfig?.object || [];
  const Component = FieldMap[type] || FieldMap.text;

  const path = parentPath ? `${parentPath}.${fieldDef.field}` : fieldDef.field;

  const getValue = (src, path) =>
    path.split(".").reduce((acc, key) => acc?.[key], src) ?? "";

  const value = getValue(item, path);

  if (type === "image") {
    return (
      <View style={styles.fieldBlock}>
        <Component label={fieldDef.label} value={value} mode="read" />
      </View>
    );
  }

  if (Array.isArray(value)) {
    return (
      <View style={styles.fieldBlock}>
        <Text style={[styles.label, { color: theme.colors.primary }]}>
          {fieldDef.label}
        </Text>
        {value.length === 0 ? (
          <Text style={styles.emptyText}>No entries</Text>
        ) : (
          value.map((entry, i) => (
            <View
              key={i}
              style={[styles.arrayItem, { borderColor: theme.colors.outline }]}
            >
              {nested.map((nf) => (
                <RenderFieldReadOnly
                  key={nf.field}
                  fieldDef={nf}
                  item={item}
                  theme={theme}
                  parentPath={`${path}[${i}]`}
                />
              ))}
            </View>
          ))
        )}
      </View>
    );
  }

  return (
    <View style={styles.fieldBlock}>
      <Component label={fieldDef.label} value={value} mode="read" />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "flex-start",
  },
  container: { flex: 1 },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: { fontSize: 22, fontWeight: "700" },
  closeWrapper: { position: "absolute", right: 16, top: 16 },
  content: { flex: 1, padding: 16 },
  fieldBlock: { marginBottom: 18 },
  label: { fontWeight: "600", marginBottom: 6 },
  emptyText: { opacity: 0.6, fontStyle: "italic" },
  arrayItem: { borderWidth: 1, padding: 10, borderRadius: 10, marginBottom: 10 },
});
