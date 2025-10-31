// TimePickerInput.js
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { Dialog, Portal, Button } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function TimePickerInput({ label, value, onChangeText }) {
  // Helper: "13:45" → Date (today at that time)
  const parseTime = (timeString) => {
    const [h, m] = timeString.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };

  // Helper: Date → "13:45" (24-hour string for storage)
  const formatTo24 = (date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  // Helper: Date → "1:45 PM" (12-hour display)
  const formatTo12 = (date) => {
    let h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12; // 0 → 12
    return `${h}:${m} ${ampm}`;
  };

  const [visible, setVisible] = useState(false);
  const [tempTime, setTempTime] = useState(
    value ? parseTime(value) : new Date()
  );

  // Keep picker in sync when value changes (edit mode)
  useEffect(() => {
    if (value) {
      setTempTime(parseTime(value));
    }
  }, [value]);

  const handleConfirm = () => {
    onChangeText(formatTo24(tempTime)); // Save as 24-hour string
    setVisible(false);
  };

  const handleCancel = () => {
    setTempTime(value ? parseTime(value) : new Date());
    setVisible(false);
  };

  // What shows on the button
  const displayValue = value ? formatTo12(parseTime(value)) : '12:00 AM';

  return (
    <View style={{ marginVertical: 6 }}>
      {/* Trigger Button */}
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

      {/* Dialog with Picker */}
      <Portal>
        <Dialog visible={visible} onDismiss={handleCancel} style={{ borderRadius: 8 }}>
          <Dialog.Title>Select {label}</Dialog.Title>

          <Dialog.Content>
            <DateTimePicker
              value={tempTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
              is24Hour={false}           // 12-hour mode on both iOS & Android
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