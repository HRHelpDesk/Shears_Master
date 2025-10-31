// src/components/SmartInputs/PlainTextInput.js
import React from 'react';
import { View } from 'react-native';
import { Text, TextInput, useTheme } from 'react-native-paper';

export default function PlainTextInput({
  label,
  value,
  onChangeText,
  multiline = false,
  keyboardType = 'default',
  placeholder,
  mode = 'edit', // Default to edit if not specified
}) {
  const theme = useTheme();

  const getInputType = () => {
    switch (keyboardType) {
      case 'email-address':
        return 'email';
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

  /** READ MODE */
  if (mode === 'read') {
    return (
      <View style={{ marginVertical: 6 }}>
        <Text
          variant="labelSmall"
          style={{
            color: theme.colors.onSurface,
            fontWeight: '500',
            marginBottom: 2,
          }}
        >
          {label}
        </Text>

        <View
          style={{
            backgroundColor:
              theme.dark
                ? theme.colors.surfaceVariant
                : theme.colors.surfaceDisabled || '#f4f4f4',
            borderRadius: 6,
            paddingVertical: multiline ? 6 : 4,
            paddingHorizontal: 8,
          }}
        >
          <Text
            variant={multiline ? 'bodySmall' : 'bodyMedium'}
            style={{
              color: theme.colors.onSurface,
              lineHeight: multiline ? 18 : 20,
            }}
          >
            {value
              ? value.toString()
              : (
                <Text
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    fontStyle: 'italic',
                  }}
                >
                  —
                </Text>
              )}
          </Text>
        </View>
      </View>
    );
  }

  /** EDIT MODE */
  return (
    <View style={{ marginVertical: 6 }}>
      <Text
        variant="labelSmall"
        style={{
          color: theme.colors.onSurface,
          fontWeight: '500',
          marginBottom: 2,
        }}
      >
        {label}
      </Text>

      <TextInput
        mode="outlined"
        value={value?.toString() || ''}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={getInputType()}
        placeholder={placeholder || `Enter ${label}`}
        style={{
          backgroundColor: theme.colors.background,
        }}
        outlineColor={theme.colors.outlineVariant}
        activeOutlineColor={theme.colors.primary}
        contentStyle={{
          paddingVertical: multiline ? 8 : 4,
          fontSize: 15,
        }}
        theme={{
          roundness: 6,
        }}
      />
    </View>
  );
}
