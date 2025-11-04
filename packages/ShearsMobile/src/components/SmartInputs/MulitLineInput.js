// src/components/SmartInputs/MultiLineInput.js
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, TextInput as PaperInput } from 'react-native-paper';

export default function MultiLineInput({
  label,
  value,
  onChangeText,
  placeholder,
  mode = 'edit', // 'read' or 'edit'
  error,
  helperText,
}) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  /* ---------------- READ MODE ---------------- */
  if (mode === 'read') {
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
          {value && value.trim() !== '' ? (
            value
          ) : (
            <Text style={{ color: theme.colors.textLight, fontStyle: 'italic' }}>
             
            </Text>
          )}
        </Text>
      </View>
    );
  }

  /* ---------------- EDIT MODE ---------------- */
  const borderColor = error
    ? theme.colors.error
    : isFocused
    ? theme.colors.primary
    : theme.colors.outlineVariant || theme.colors.border;

  return (
    <View style={styles.editContainer}>
      {/* Label */}
      <Text
        variant="labelMedium"
        style={[
          styles.label,
          {
            color: error ? theme.colors.error : theme.colors.text,
            marginBottom: 6,
          },
        ]}
      >
        {label}
      </Text>

      {/* Multi-line Input */}
      <PaperInput
        mode="outlined"
        value={value?.toString() || ''}
        onChangeText={onChangeText}
        multiline
        numberOfLines={6}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            borderColor,
          },
        ]}
        outlineColor={borderColor}
        activeOutlineColor={theme.colors.primary}
        textColor={theme.colors.text}
        theme={{ roundness: 8 }}
      />

      {/* Helper Text / Error */}
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
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  // READ MODE
  readContainer: {
    marginBottom: 12,
  },
  label: {
    fontWeight: '500',
    marginBottom: 4,
  },
  readValue: {
    lineHeight: 22,
    minHeight: 80,
  },

  // EDIT MODE
  editContainer: {
    marginBottom: 12,
  },
  input: {
    borderRadius: 8,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    fontFamily: 'System',
  },
  helperText: {
    marginTop: 4,
    marginLeft: 2,
  },
});
