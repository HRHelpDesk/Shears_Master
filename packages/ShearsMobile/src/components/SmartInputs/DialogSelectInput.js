// src/components/SmartInputs/DialogSelectInput.js
import React, { useState, useRef, useEffect, use } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  LayoutAnimation,
  UIManager,
  StyleSheet,
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
  mode = 'edit', // 'read' | 'edit'
  forceModal = false,
  error,
  helperText,
  defaultValue
}) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  // Detect if we're already in a modal
  const navigationState = useNavigationState((state) => state);
  const insideModalScreen = navigationState?.routes?.some(
    (r) => r?.params?.presentation === 'modal' || r?.name?.toLowerCase().includes('modal')
  );
  const shouldUseModal = forceModal || insideModalScreen;
useEffect(() => {
    if (defaultValue) {
      onChangeText(defaultValue);
    }
  }, [defaultValue]);
  // Smooth scroll for custom input
  useEffect(() => {
    if (!isCustom) return;
    const showListener = Keyboard.addListener('keyboardDidShow', () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      scrollRef.current?.scrollToEnd({ animated: true });
      inputRef.current?.focus();
    });
    return () => showListener.remove();
  }, [isCustom]);
  

  /* -------------------------------------------------------------------------- */
  /*                                  HANDLERS                                  */
  /* -------------------------------------------------------------------------- */

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

  /* -------------------------------------------------------------------------- */
  /*                                 READ MODE                                  */
  /* -------------------------------------------------------------------------- */
  if (mode === 'read') {
    return (
      <View style={styles.readContainer}>
        <Text
          variant="titleMedium"
          style={[styles.label, { color: theme.colors.primary }]}
        >
          {label}
        </Text>
        <Text
          variant="bodyLarge"
          style={[
            styles.readValue,
            { color: theme.colors.text },
          ]}
        >
          {value ? (
            value.toString()
          ) : (
            <Text style={{ color: theme.colors.textLight, fontStyle: 'italic' }}>
              Not set
            </Text>
          )}
        </Text>
      </View>
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                 EDIT MODE                                  */
  /* -------------------------------------------------------------------------- */

  const borderColor = error
    ? theme.colors.error
    : visible
    ? theme.colors.primary
    : theme.colors.outlineVariant || theme.colors.border;

  const SelectorField = (
    <TouchableOpacity onPress={() => setVisible(true)} activeOpacity={0.8}>
      <View
        style={[
          styles.selectorContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor,
          },
        ]}
      >
        <Text
          style={[
            styles.selectorText,
            {
              color: value
                ? theme.colors.onSurface
                : theme.colors.onSurfaceVariant,
            },
          ]}
        >
          {value ? String(value) : placeholder}
        </Text>
        <Text style={styles.dropdownIcon}>⌄</Text>
      </View>
    </TouchableOpacity>
  );

  const SelectionContent = (
    <ScrollView
      ref={scrollRef}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 12 }}
      style={{ maxHeight: 320 }}
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
          mode="outlined"
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
    <View style={styles.editContainer}>
      {/* Label */}
      <Text
        variant="labelMedium"
        style={[
          styles.label,
          {
            color: error ? theme.colors.error : theme.colors.text,
            marginBottom: 6,
          },
        ]}
      >
        {label}
      </Text>

      {SelectorField}

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

      <Portal>
        {shouldUseModal ? (
          <Modal
            visible={visible}
            onDismiss={() => {
              setIsCustom(false);
              setVisible(false);
            }}
            contentContainerStyle={[
              styles.modalContainer,
              { backgroundColor: theme.colors.background },
            ]}
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
              style={[
                styles.dialogContainer,
                { backgroundColor: theme.colors.background },
              ]}
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

const styles = StyleSheet.create({
  // READ MODE
  readContainer: {
    marginBottom: 4,
  },
  label: {
    fontWeight: '500',
    marginBottom: 4,
  },
  readValue: {
    lineHeight: 22,
  },

  // EDIT MODE
  editContainer: {
    marginBottom: 12,
  },
  selectorContainer: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    fontSize: 16,
    fontFamily: 'System',
  },
  dropdownIcon: {
    fontSize: 18,
    color: '#999',
    marginLeft: 6,
  },
  helperText: {
    marginTop: 4,
    marginLeft: 2,
  },
  modalContainer: {
    margin: 24,
    borderRadius: 8,
    elevation: 6,
    padding: 16,
  },
  dialogContainer: {
    borderRadius: 8,
  },
});
