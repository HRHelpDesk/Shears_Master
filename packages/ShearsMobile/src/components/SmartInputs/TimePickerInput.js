import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { Dialog, Portal, Button } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function TimePickerInput({ label, value, onChangeText }) {
  const defaultTime = new Date();
  defaultTime.setHours(0, 0, 0, 0);

  const [visible, setVisible] = useState(false);
  const [tempTime, setTempTime] = useState(value ? parseTime(value) : defaultTime);

  function parseTime(timeString) {
    // Expecting "HH:MM" format
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  const handleConfirm = () => {
    // Format to "HH:MM" 24-hour string
    const hours = tempTime.getHours().toString().padStart(2, '0');
    const minutes = tempTime.getMinutes().toString().padStart(2, '0');
    onChangeText(`${hours}:${minutes}`);
    setVisible(false);
  };

  const handleCancel = () => {
    setTempTime(value ? parseTime(value) : defaultTime);
    setVisible(false);
  };

  const displayValue = value || '12:00 AM';

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
        <Text style={{ color: value ? 'black' : '#888', fontSize: 16 }}>{displayValue}</Text>
      </TouchableOpacity>

      <Portal>
        <Dialog visible={visible} onDismiss={handleCancel} style={{ borderRadius: 8 }}>
          <Dialog.Title>Select {label}</Dialog.Title>
          <Dialog.Content>
            <DateTimePicker
              value={tempTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
              is24Hour={false}
              minuteInterval={5}
              onChange={(event, selectedTime) => {
                if (selectedTime) setTempTime(selectedTime);
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
