// src/components/SmartInputs/DialogSelectInput.js
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
import {
  TextInput,
  Text,
  Dialog,
  Portal,
  Button,
  List,
  Modal,
  Card,
  useTheme,
} from 'react-native-paper';
import { useNavigationState } from '@react-navigation/native';

// ✅ Enable LayoutAnimation on Android
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
  mode = 'edit', // 'read' or 'edit'
  forceModal = false, // optional override
}) {
  const [visible, setVisible] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const theme = useTheme();
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  // 🧭 Detect if we’re inside a navigation modal
  const navigationState = useNavigationState((state) => state);
  const insideModalScreen = navigationState?.routes?.some(
    (r) => r?.params?.presentation === 'modal' || r?.name?.toLowerCase().includes('modal')
  );

  const shouldUseModal = forceModal || insideModalScreen;

  // Smooth scroll animation for custom input focus
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

  /** ----------------
   *  READ MODE
   * ---------------- */
  if (mode === 'read') {
    return (
      <View style={{ marginVertical: 6 }}>
        <Text
          variant="labelSmall"
          style={{
            color: theme.colors.onSurface,
            fontWeight: '500',
            marginBottom: 2,
          }}
        >
          {label}
        </Text>

        <View
          style={{
            backgroundColor: theme.dark
              ? theme.colors.surfaceVariant
              : theme.colors.surfaceDisabled || '#f4f4f4',
            borderRadius: 6,
            paddingVertical: 8,
            paddingHorizontal: 10,
          }}
        >
          <Text
            variant="bodyMedium"
            style={{
              color: theme.colors.onSurface,
            }}
          >
            {value ? (
              value.toString()
            ) : (
              <Text
                style={{
                  color: theme.colors.onSurfaceVariant,
                  fontStyle: 'italic',
                }}
              >
                —
              </Text>
            )}
          </Text>
        </View>
      </View>
    );
  }

  /** ----------------
   *  EDIT MODE
   * ---------------- */
  const SelectorField = (
    <TouchableOpacity onPress={() => setVisible(true)}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: theme.colors.outlineVariant,
          borderRadius: 6,
          backgroundColor: theme.colors.surface,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        <Text
          style={{
            color: value ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
          }}
        >
          {value ? String(value) : placeholder}
        </Text>
        <Text style={{ fontSize: 18, color: theme.colors.onSurfaceVariant }}>{'⌄'}</Text>
      </View>
    </TouchableOpacity>
  );

  /** ----------------
   *  DIALOG CONTENT
   * ---------------- */
  const SelectionContent = (
    <ScrollView
      ref={scrollRef}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 12 }}
      style={{ maxHeight: 300 }}
    >
      {options.map((opt, i) => (
        <List.Item
          key={i}
          title={String(opt)}
          onPress={() => handleSelect(opt)}
          style={{
            borderBottomWidth: 0.4,
            borderBottomColor: theme.colors.outlineVariant,
          }}
        />
      ))}

      {allowCustom && !options.includes('Other') && (
        <List.Item
          title="Other"
          onPress={() => handleSelect('Other')}
          left={(props) => <List.Icon {...props} icon="plus" />}
        />
      )}

      {isCustom && (
        <TextInput
          ref={inputRef}
          label="Enter custom value"
          value={customValue}
          onChangeText={setCustomValue}
          style={{
            marginTop: 12,
            backgroundColor: theme.colors.surfaceVariant,
          }}
          onSubmitEditing={handleCustomSubmit}
          returnKeyType="done"
        />
      )}
    </ScrollView>
  );

  return (
    <View style={{ marginVertical: 6 }}>
      <Text
        variant="labelSmall"
        style={{
          color: theme.colors.onSurface,
          fontWeight: '500',
          marginBottom: 2,
        }}
      >
        {label}
      </Text>

      {SelectorField}

      <Portal>
        {shouldUseModal ? (
          /** 🧱 Local Modal fallback */
          <Modal
            visible={visible}
            onDismiss={() => {
              setIsCustom(false);
              setVisible(false);
            }}
            contentContainerStyle={{
              backgroundColor: theme.colors.background,
              margin: 24,
              borderRadius: 8,
              elevation: 6,
              padding: 16,
            }}
          >
            <Card>
              <Card.Title title={`Select ${label}`} />
              <Card.Content>{SelectionContent}</Card.Content>
              <Card.Actions style={{ justifyContent: 'flex-end' }}>
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
              </Card.Actions>
            </Card>
          </Modal>
        ) : (
          /** 🪟 Default Dialog */
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
              <Dialog.Content>{SelectionContent}</Dialog.Content>
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
        )}
      </Portal>
    </View>
  );
}
