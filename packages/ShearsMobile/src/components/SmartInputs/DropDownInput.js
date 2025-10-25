import React, { useState } from 'react';
import { View } from 'react-native';
import { Menu, Button, Text } from 'react-native-paper';

export default function DropdownInput({ label, value, options = [], onChangeText, placeholder }) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={{ marginVertical: 6 }}>
      <Text style={{ color: 'white', marginBottom: 4 }}>{label}</Text>
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => setVisible(true)}
            icon="menu-down"
            contentStyle={{ justifyContent: 'space-between' }}
            style={{
              borderColor: 'rgba(255,255,255,0.2)',
              borderRadius: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.71)',
            }}
          >
            {value || placeholder || 'Select...'}
          </Button>
        }
      >
        {options.map((opt, i) => (
          <Menu.Item
            key={i}
            onPress={() => {
              onChangeText(opt); // Pass the selected option directly
              setVisible(false);
            }}
            title={opt}
          />
        ))}
      </Menu>
    </View>
  );
}