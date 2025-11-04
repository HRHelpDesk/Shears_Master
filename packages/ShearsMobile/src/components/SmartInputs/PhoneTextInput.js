import React, { useState } from 'react';
import { View, StyleSheet, TextInput as RNTextInput } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { formatPhoneNumber } from 'shears-shared/src/utils/stringHelpers';

/**
 * PhoneTextInput – formats input as (XXX) XXX-XXXX while typing.
 */
export default function PhoneTextInput({
  label,
  value,
  onChangeText,
  placeholder,
  mode = 'edit',
  error,
  helperText,
}) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);




  /** handle changes with formatted value */
  const handleTextChange = (text) => {
    const formatted = formatPhoneNumber(text);
    onChangeText(formatted);
  };

  /** 🧾 READ MODE */
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
          style={[styles.readValue, { color: theme.colors.text }]}
        >
          {value && value.toString().trim() !== '' ? (
            value
          ) : (
            <Text style={{ color: theme.colors.textLight, fontStyle: 'italic' }}>
              Not set
            </Text>
          )}
        </Text>
      </View>
    );
  }

  /** ✏️ EDIT MODE */
  const borderColor = error
    ? theme.colors.error
    : isFocused
    ? theme.colors.primary
    : theme.colors.border;

  return (
    <View style={styles.editContainer}>
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

      <RNTextInput
        value={value || ''}
        onChangeText={handleTextChange}
        keyboardType="phone-pad"
        placeholder={placeholder || '(555) 555-5555'}
        placeholderTextColor={theme.colors.textLight}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            borderColor,
            borderWidth: isFocused ? 2 : 1,
            color: theme.colors.text,
          },
        ]}
        maxLength={14} // matches (XXX) XXX-XXXX
      />

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

const styles = StyleSheet.create({
  // READ MODE
  readContainer: {
    marginBottom: 4,
  },
  label: {
    fontWeight: '500',
    marginBottom: 4,
  },
  readValue: {
    lineHeight: 22,
  },

  // EDIT MODE
  editContainer: {
    marginBottom: 4,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'System',
  },
  helperText: {
    marginTop: 4,
    marginLeft: 2,
  },
});
