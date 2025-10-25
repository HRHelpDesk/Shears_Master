import React, { useState } from 'react';
import { View } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function DatePickerInput({ label, value, onChangeText, placeholder }) {
  const [show, setShow] = useState(false);

  return (
    <View style={{ marginVertical: 6 }}>
      <TextInput
        mode="outlined"
        label={label}
        value={value ? new Date(value).toLocaleDateString() : ''} // Display formatted date
        onFocus={() => setShow(true)}
        placeholder={placeholder || `Select ${label}`}
        style={{ marginBottom: 4 }}
        outlineColor="rgba(255,255,255,0.2)"
        activeOutlineColor="#4A90E2"
        textColor="white"
        editable={false} // Prevent manual text input
      />
      {show && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()} // Use provided value or current date
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShow(false);
            if (selectedDate) {
              onChangeText(selectedDate.toISOString()); // Return ISO string
            }
          }}
        />
      )}
    </View>
  );
}