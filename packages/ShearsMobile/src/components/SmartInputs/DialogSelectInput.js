import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { TextInput, Text, Dialog, Portal, Button, List, useTheme } from 'react-native-paper';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function DialogSelectInput({
  label,
  value,
  options = [],
  onChangeText,
  placeholder = 'Select...',
  allowCustom = true,
}) {
  const [visible, setVisible] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const theme = useTheme();
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!isCustom) return;

    const showListener = Keyboard.addListener('keyboardDidShow', () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      scrollRef.current?.scrollToEnd({ animated: true });
      inputRef.current?.focus();
    });

    return () => showListener.remove();
  }, [isCustom]);

  const handleSelect = (opt) => {
    if (opt === 'Other' && allowCustom) {
      setIsCustom(true);
      setCustomValue('');
    } else {
      setIsCustom(false);
      onChangeText(opt);
      setVisible(false);
    }
  };

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onChangeText(customValue.trim());
      setIsCustom(false);
      setVisible(false);
    }
  };

  const inputStyle = {
    backgroundColor: 'rgba(255,255,255,0.71)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: 'black',
    marginTop: 12,
  };

  return (
    <View style={{ marginVertical: 6 }}>
      <Text style={{ color: 'white', marginBottom: 4 }}>
        {label != null ? String(label) : ''}
      </Text>

      <TouchableOpacity onPress={() => setVisible(true)}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
            borderRadius: 8,
            backgroundColor: 'rgba(255,255,255,0.71)',
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: value ? 'black' : 'gray' }}>
            {value != null ? String(value) : placeholder}
          </Text>
          <Text style={{ fontSize: 18 }}>{'⌄'}</Text>
        </View>
      </TouchableOpacity>

      <Portal>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <Dialog
            visible={visible}
            onDismiss={() => {
              setIsCustom(false);
              setVisible(false);
            }}
            style={{ backgroundColor: theme.colors.background, borderRadius: 8 }}
          >
            <Dialog.Title>Select {label}</Dialog.Title>
            <Dialog.Content style={{ maxHeight: 300 }}>
              <ScrollView
                ref={scrollRef}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 12 }}
              >
                {options.map((opt, i) => (
                  <List.Item
                    key={i}
                    title={String(opt)}
                    onPress={() => handleSelect(opt)}
                    style={{ borderBottomWidth: 0.5, borderBottomColor: '#ccc' }}
                  />
                ))}

                {isCustom && (
                  <TextInput
                    ref={inputRef}
                    label="Enter custom value"
                    value={customValue}
                    onChangeText={setCustomValue}
                    style={inputStyle}
                    onSubmitEditing={handleCustomSubmit}
                    returnKeyType="done"
                  />
                )}
              </ScrollView>
            </Dialog.Content>
            <Dialog.Actions>
              {isCustom && customValue.trim() && (
                <Button onPress={handleCustomSubmit}>Add</Button>
              )}
              <Button
                onPress={() => {
                  setIsCustom(false);
                  setVisible(false);
                }}
              >
                Cancel
              </Button>
            </Dialog.Actions>
          </Dialog>
        </KeyboardAvoidingView>
      </Portal>
    </View>
  );
}
