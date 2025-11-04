// src/components/SmartInputs/TimePickerInput.js
import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from 'react-native';
import {
  Dialog,
  Portal,
  Button,
  Text,
  useTheme,
  Icon,
  IconButton,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function TimePickerInput({
  label = 'Time',
  value,
  onChangeText,
  mode = 'edit', // 'read' or 'edit'
  error,
  helperText,
}) {
  const theme = useTheme();

  // --- Helpers ---
  const parseTime = (timeString) => {
    if (!timeString) return new Date();
    const [h, m] = timeString.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };

  const formatTo24 = (date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const formatTo12 = (date) => {
    let h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  // --- State ---
  const [visible, setVisible] = useState(false);
  const [tempTime, setTempTime] = useState(value ? parseTime(value) : new Date());

  // Keep synced with prop value
  useEffect(() => {
    if (value) setTempTime(parseTime(value));
  }, [value]);

  const handleConfirm = () => {
    onChangeText(formatTo24(tempTime));
    setVisible(false);
  };

  const handleCancel = () => {
    setTempTime(value ? parseTime(value) : new Date());
    setVisible(false);
  };

  const displayValue = value ? formatTo12(parseTime(value)) : 'Select time';

  /* ---------------- READ MODE ---------------- */
  if (mode === 'read') {
    return (
      <View style={styles.readContainer}>
        <View style={styles.inlineRead}>
          <Icon
            source="clock-outline"
            size={20}
            color={theme.colors.onSurfaceVariant}
            style={{ marginRight: 8 }}
          />
          <Text
            variant="bodyLarge"
            style={[
              styles.readValue,
              { color: value ? theme.colors.onSurface : theme.colors.onSurfaceVariant, marginLeft:35 },
            ]}
          >
            {value ? displayValue : 'Not set'}
          </Text>
        </View>
      </View>
    );
  }

  /* ---------------- EDIT MODE ---------------- */
  const borderColor = error
    ? theme.colors.error
    : visible
    ? theme.colors.primary
    : theme.colors.outlineVariant || theme.colors.border;

  return (
    <View style={styles.editContainer}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setVisible(true)}
        style={[
          styles.selectorContainer,
          { backgroundColor: theme.colors.surface, borderColor },
        ]}
      >
        {/* Inline Clock Icon + Time */}
        <View style={styles.inlineContent}>
          <Icon
            source="clock-outline"
            size={20}
            color={value ? theme.colors.onSurface : theme.colors.onSurfaceVariant}
            style={{ marginRight: 8 }}
          />
          <Text
            style={[
              styles.selectorText,
              {
                color: value
                  ? theme.colors.onSurface
                  : theme.colors.onSurfaceVariant,
                  marginLeft:35
              },
            ]}
          >
            {displayValue}
          </Text>
        </View>

        <IconButton
          icon="chevron-down"
          size={20}
          iconColor={theme.colors.onSurfaceVariant}
        />
      </TouchableOpacity>

      {/* Helper / Error Text */}
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

      {/* Dialog Picker */}
      <Portal>
        <Dialog
          visible={visible}
          onDismiss={handleCancel}
          style={[styles.dialogContainer, { backgroundColor: theme.colors.background }]}
        >
          <Dialog.Title>Select {label}</Dialog.Title>
          <Dialog.Content>
            <DateTimePicker
              value={tempTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
              is24Hour={false}
              minuteInterval={5}
              onChange={(event, selected) => {
                if (selected) setTempTime(selected);
              }}
              style={{ width: '100%' }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCancel}>Cancel</Button>
            <Button onPress={handleConfirm}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  // READ MODE
  readContainer: {
    marginBottom: 12,
  },
  inlineRead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  readValue: {
    fontSize: 16,
    fontFamily: 'System',
  },

  // EDIT MODE
  editContainer: {
    marginBottom: 12,
  },
  selectorContainer: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectorText: {
    fontSize: 16,
    fontFamily: 'System',
  },
  helperText: {
    marginTop: 4,
    marginLeft: 2,
  },
  dialogContainer: {
    borderRadius: 8,
  },
});
