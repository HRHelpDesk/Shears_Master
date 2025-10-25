import React from 'react';
import { TextInput } from 'react-native-paper';

export default function PlainTextInput({
  label,
  value,
  onChangeText,
  multiline = false,
  keyboardType = 'default',
  placeholder,
}) {
  return (
    <TextInput
      mode="outlined"
      label={label}
      value={value?.toString() || ''} // Ensure value is a string
      onChangeText={onChangeText} // Use onChangeText but pass to onChange
      multiline={multiline}
      keyboardType={keyboardType}
      placeholder={placeholder || `Enter ${label}`}
      style={{ marginVertical: 6 }}
      outlineColor="rgba(255,255,255,0.2)"
      activeOutlineColor="#4A90E2"
      theme={{ roundness: 8 }}
    />
  );
}