import React, { useState } from 'react';
import { View, StyleSheet, TextInput as RNTextInput } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { formatCurrency, formatMoneyValue } from 'shears-shared/src/utils/stringHelpers';

export default function SmartCurrencyInput({
  label,
  value,
  onChangeText,
  placeholder,
  mode = 'edit',
  error,
  helperText
}) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (text) => {
    const formatted = formatCurrency(text);
    onChangeText(formatted);
  };

  /** READ MODE */
  if (mode === 'read') {
    return (
      <View style={styles.readContainer}>
        <Text variant="titleMedium" style={[styles.label, { color: theme.colors.primary }]}>
          {label}
        </Text>

        <Text variant="bodyLarge" style={[styles.value, { color: theme.colors.text }]}>
          {value
            ? formatMoneyValue(value)
            : <Text style={{ color: theme.colors.textLight, fontStyle: "italic" }}>Not set</Text>
          }

        </Text>
      </View>
    );
  }

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
          { color: error ? theme.colors.error : theme.colors.text }
        ]}
      >
        {label}
      </Text>

      <RNTextInput
        value={value || ''}
        onChangeText={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        keyboardType="decimal-pad"
        placeholder={placeholder || '$0.00'}
        placeholderTextColor={theme.colors.textLight}
        style={[
          styles.input,
          {
            borderColor,
            borderWidth: isFocused ? 2 : 1,
            backgroundColor: theme.colors.surface,
            color: theme.colors.text
          }
        ]}
      />

      {(helperText || error) && (
        <Text
          variant="bodySmall"
          style={[
            styles.helperText,
            { color: error ? theme.colors.error : theme.colors.textSecondary }
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  readContainer: { marginBottom: 4 },
  label: { fontWeight: '500', marginBottom: 4 },
  value: { lineHeight: 22 },

  editContainer: { marginBottom: 8 },
  input: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16
  },
  helperText: { marginTop: 4, marginLeft: 2 }
});
