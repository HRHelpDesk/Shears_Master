import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Switch, useTheme } from 'react-native-paper';

export default function SmartSwitchInput({
  label,
  value = false,
  onChangeText,
  mode = "edit",
  error,
  helperText,
}) {
  const theme = useTheme();

  /* --------------------------------------------- */
  /* ✅ READ MODE                                  */
  /* --------------------------------------------- */
  if (mode === "read") {
    return (
      <View style={styles.readContainer}>
        <Text
          variant="titleMedium"
          style={[styles.label, { color: theme.colors.primary }]}
        >
          {label}
        </Text>

        <Text
          variant="bodyLarge"
          style={[
            styles.readValue,
            { color: theme.colors.text },
          ]}
        >
          {value === true ? "Yes" : value === false ? "No" : (
            <Text style={{ color: theme.colors.onSurfaceVariant, fontStyle: "italic" }}>
              Not set
            </Text>
          )}
        </Text>
      </View>
    );
  }

  /* --------------------------------------------- */
  /* ✅ EDIT MODE                                  */
  /* --------------------------------------------- */
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

      <View style={styles.switchRow}>
        <Switch
          value={!!value}
          onValueChange={(v) => onChangeText(v)}
          color={theme.colors.primary}
        />
        <Text style={{ marginLeft: 10, color: theme.colors.text }}>
          {value ? "Enabled" : "Disabled"}
        </Text>
      </View>

      {(error || helperText) && (
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
  readValue: {
    lineHeight: 22,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
});
