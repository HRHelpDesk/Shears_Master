import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export default function SmartReadOnlyBool({
  label,
  value = false,           // typically boolean | undefined | null
  mode = "edit",           // "read" | "edit"
  error,
  helperText,
  inputConfig = {},        // { onLabel?: string, offLabel?: string }
}) {
  const theme = useTheme();

  // Normalize value for display
  const displayText =
    value === true
      ? inputConfig.onLabel ?? "Enabled"
      : value === false
      ? inputConfig.offLabel ?? "Disabled"
      : (
          <Text style={{ color: theme.colors.onSurfaceVariant, fontStyle: "italic" }}>
            Not set
          </Text>
        );

  // Shared label style (slightly different variant per mode)
  const labelVariant = mode === "read" ? "titleMedium" : "labelMedium";
  const labelColor =
    mode === "read"
      ? theme.colors.primary
      : error
      ? theme.colors.error
      : theme.colors.text;

  return (
    <View
      style={[
        mode === "read" ? styles.readContainer : styles.editContainer,
      ]}
    >
      <Text
        variant={labelVariant}
        style={[styles.label, { color: labelColor }]}
      >
        {label}
      </Text>

      <Text
        variant="bodyLarge"
        style={[
          styles.valueText,
          { color: theme.colors.text },
        ]}
      >
        {displayText}
      </Text>

      {mode === "edit" && (error || helperText) && (
        <Text
          variant="bodySmall"
          style={{
            color: error ? theme.colors.error : theme.colors.outlineVariant,
            marginTop: 4,
            marginLeft: 2,
          }}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  readContainer: {
    marginBottom: 8,
  },
  editContainer: {
    marginBottom: 12,
  },
  label: {
    fontWeight: "500",
    marginBottom: 4,
  },
  valueText: {
    lineHeight: 22,
  },
});