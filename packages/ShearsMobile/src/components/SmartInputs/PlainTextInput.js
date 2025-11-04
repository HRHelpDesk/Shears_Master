// src/components/SmartInputs/PlainTextInput.js
import React, { useState } from 'react';
import { View, StyleSheet, TextInput as RNTextInput } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export default function PlainTextInput({
  label,
  value,
  onChangeText,
  multiline = false,
  keyboardType = 'default',
  placeholder,
  mode = 'edit',
  error,
  helperText,
}) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const getInputType = () => {
    switch (keyboardType) {
      case 'email-address':
        return 'email-address';
      case 'numeric':
      case 'number-pad':
      case 'decimal-pad':
        return 'numeric';
      case 'phone-pad':
        return 'phone-pad';
      default:
        return 'default';
    }
  };

  /** READ MODE - Clean text display */
  if (mode === 'read') {
    return (
      <View style={styles.readContainer}>
        <Text
          variant="titleMedium"
          style={[
            styles.label,
            { color: theme.colors.primary }
          ]}
        >
          {label}
        </Text>
        

        <Text
          variant="bodyLarge"
          style={[
            styles.readValue,
            { color: theme.colors.text }
          ]}
        >
          {value && value.toString().trim() !== '' ? (
            value.toString()
          ) : (
            <Text style={{ color: theme.colors.textLight, fontStyle: 'italic' }}>
              Not set
            </Text>
          )}
        </Text>
      </View>
    );
  }

  /** EDIT MODE - Modern input field */
  const borderColor = error 
    ? theme.colors.error 
    : isFocused 
      ? theme.colors.primary 
      : theme.colors.border;

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
          }
        ]}
      >
        {label}
      </Text>

      {/* Input Field */}
      <RNTextInput
        value={value?.toString() || ''}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={getInputType()}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        placeholderTextColor={theme.colors.textLight}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          styles.input,
          multiline && styles.multilineInput,
          {
            backgroundColor: theme.colors.surface,
            borderColor: borderColor,
            borderWidth: isFocused ? 2 : 1,
            color: theme.colors.text,
          }
        ]}
        autoCapitalize="sentences"
        autoCorrect={true}
      />

      {/* Helper Text or Error */}
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
  // READ MODE STYLES
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

  // EDIT MODE STYLES
  editContainer: {
    marginBottom: 4,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'System',
    // Smooth transition for border
    transitionProperty: 'border-color, border-width',
    transitionDuration: '150ms',
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  helperText: {
    marginTop: 4,
    marginLeft: 2,
  },
});