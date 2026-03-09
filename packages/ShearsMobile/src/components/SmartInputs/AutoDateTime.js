// src/components/SmartInputs/AutoDateTime.js
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export function formatDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date)) return value;

  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const month   = date.toLocaleDateString('en-US', { month: 'long' });
  const day     = date.getDate();
  const year    = date.getFullYear();

  const suffix =
    day % 10 === 1 && day !== 11 ? 'st' :
    day % 10 === 2 && day !== 12 ? 'nd' :
    day % 10 === 3 && day !== 13 ? 'rd' : 'th';

  let hours  = date.getHours();
  const mins = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  return `${dayName}, ${month} ${day}${suffix} ${year} ${hours}:${mins} ${ampm}`;
}

export default function AutoDateTime({
  label,
  value,
  onChangeText,
  mode = 'edit',
}) {
  const theme = useTheme();
  const nowRef = useRef(new Date().toISOString());
  const hasStamped = useRef(false);

  useEffect(() => {
    // Stamp immediately (no setTimeout) — fires after first render,
    // ensuring the value is in parent state well before any save action.
    if (!hasStamped.current && (mode === 'edit' || mode === 'add') && !value) {
      hasStamped.current = true;
      onChangeText?.(nowRef.current);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const displayValue = formatDateTime(value || nowRef.current);

  if (mode === 'read') {
    return (
      <View style={styles.readContainer}>
        <Text variant="titleMedium" style={[styles.label, { color: theme.colors.primary }]}>
          {label}
        </Text>
        <Text variant="bodyLarge" style={[styles.readValue, { color: theme.colors.text }]}>
          {displayValue ?? (
            <Text style={{ color: theme.colors.textLight, fontStyle: 'italic' }}>Not set</Text>
          )}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.editContainer}>
      <Text variant="labelMedium" style={[styles.label, { color: theme.colors.text, marginBottom: 6 }]}>
        {label}
      </Text>
      <View style={[styles.valueBox, {
        backgroundColor: theme.colors.surfaceVariant ?? theme.colors.surface,
        borderColor: theme.colors.border,
      }]}>
        <Text variant="bodyMedium" style={{ color: theme.colors.textSecondary ?? theme.colors.text }}>
          {displayValue}
        </Text>
      </View>
      <Text variant="bodySmall" style={[styles.helperText, { color: theme.colors.textSecondary }]}>
        Auto-filled — cannot be edited
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  readContainer: { marginBottom: 4 },
  label: { fontWeight: '500', marginBottom: 4 },
  readValue: { lineHeight: 22 },
  editContainer: { marginBottom: 4 },
  valueBox: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    opacity: 0.75,
  },
  helperText: { marginTop: 4, marginLeft: 2, fontStyle: 'italic' },
});