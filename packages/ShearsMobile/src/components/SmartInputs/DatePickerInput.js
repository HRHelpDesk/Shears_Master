// DatePickerText.js
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { Dialog, Portal, Button, useTheme } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function DatePickerText({ label, value, onChangeText }) {
  const [visible, setVisible] = useState(false);
  const [tempDate, setTempDate] = useState(value ? parseDate(value) : new Date());
  const theme = useTheme();

  // Helper: "2025-10-29" → Date (midnight local time)
  function parseDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  }

  // Keep tempDate in sync when value changes (edit mode)
  useEffect(() => {
    if (value) {
      setTempDate(parseDate(value));
    }
  }, [value]);

  const handleConfirm = () => {
    // Save as YYYY-MM-DD (UTC-safe)
    const year = tempDate.getFullYear();
    const month = String(tempDate.getMonth() + 1).padStart(2, '0');
    const day = String(tempDate.getDate()).padStart(2, '0');
    onChangeText(`${year}-${month}-${day}`);
    setVisible(false);
  };

  const handleCancel = () => {
    setTempDate(value ? parseDate(value) : new Date());
    setVisible(false);
  };

  // Display: human-readable date
  const displayValue = value
    ? new Date(value).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : `Select ${label}`;

  return (
    <View style={{ marginVertical: 6 }}>
      <TouchableOpacity
        style={{
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 20,
          backgroundColor: 'rgba(255,255,255,0.1)',
        }}
        onPress={() => setVisible(true)}
      >
        <Text style={{ color: value ? 'black' : '#888', fontSize: 16 }}>
          {displayValue}
        </Text>
      </TouchableOpacity>

      <Portal>
        <Dialog visible={visible} onDismiss={handleCancel} style={{ borderRadius: 8 }}>
          <Dialog.Title>Select {label}</Dialog.Title>
          <Dialog.Content>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
              onChange={(event, selectedDate) => {
                if (selectedDate) setTempDate(selectedDate);
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