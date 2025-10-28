import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { Dialog, Portal, Button, useTheme } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function DatePickerText({ label, value, onChangeText }) {
  const [visible, setVisible] = useState(false);
  const [tempDate, setTempDate] = useState(value ? new Date(value) : new Date());
  const theme = useTheme();

  const handleConfirm = () => {
    onChangeText(tempDate.toISOString());
    setVisible(false);
  };

  const handleCancel = () => {
    setTempDate(value ? new Date(value) : new Date());
    setVisible(false);
  };

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
          {value ? new Date(value).toLocaleDateString() : `Select ${label}`}
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
