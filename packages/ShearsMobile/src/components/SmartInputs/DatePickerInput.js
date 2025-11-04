// src/components/SmartInputs/DatePickerText.js
import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from 'react-native';
import {
  Dialog,
  Portal,
  Button,
  Text,
  useTheme,
  Icon,
  IconButton,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function DatePickerText({
  label = 'Date',
  value,
  onChangeText,
  mode = 'edit', // 'read' or 'edit'
  error,
  helperText,
}) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [tempDate, setTempDate] = useState(value ? parseDate(value) : new Date());

  // Parse "YYYY-MM-DD" → Date
// Parse "YYYY-MM-DD" → Date (local-safe)
function parseDate(dateStr) {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0); // local noon
}

// Display human-readable value
const displayValue = (() => {
  if (!value) return 'Not set';
  const [year, month, day] = value.split('-').map(Number);
  const local = new Date(year, month - 1, day, 12, 0, 0);
  return local.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
})();


  // Sync state with prop
  useEffect(() => {
    if (value) setTempDate(parseDate(value));
  }, [value]);

  const handleConfirm = () => {
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
        <View style={styles.inlineRead}>
          <Icon
            source="calendar"
            size={30}
            color={theme.colors.onSurfaceVariant}
            style={{ marginRight: 35 }}
          />
          <Text
            variant="bodyLarge"
            style={[
              styles.readValue,
              { color: value ? theme.colors.onSurface : theme.colors.onSurfaceVariant, marginLeft:35 },
            ]}
          >
            {displayValue}
          </Text>
        </View>
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

  return (
    <View style={styles.editContainer}>
            <Text
          variant="titleMedium"
          style={[styles.label, { color: theme.colors.primary }]}
        >
          {label}
        </Text>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setVisible(true)}
        style={[
          styles.selectorContainer,
          { backgroundColor: theme.colors.surface, borderColor },
        ]}
      >
        <View style={styles.inlineContent}>
          <Icon
            source="calendar"
            size={20}
            color={value ? theme.colors.onSurface : theme.colors.onSurfaceVariant}
            style={{ marginRight: 18 }}
          />
          <Text
            style={[
              styles.selectorText,
              {
                color: value
                  ? theme.colors.onSurface
                  : theme.colors.onSurfaceVariant,
                  marginLeft:35
              },
              
            ]}
          >
            {value ? displayValue : 'Select date'}
          </Text>
        </View>
        <IconButton
          icon="chevron-down"
          size={20}
          iconColor={theme.colors.onSurfaceVariant}
        />
      </TouchableOpacity>

      {/* Helper or Error Text */}
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

      {/* Date Dialog */}
      <Portal>
        <Dialog
          visible={visible}
          onDismiss={handleCancel}
          style={[
            styles.dialogContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
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

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  // READ MODE
  readContainer: {
    marginBottom: 12,
  },
  inlineRead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  readValue: {
    fontSize: 16,
    fontFamily: 'System',
  },

  // EDIT MODE
  editContainer: {
    marginBottom: 12,
  },
  selectorContainer: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectorText: {
    fontSize: 16,
    fontFamily: 'System',
  },
  helperText: {
    marginTop: 4,
    marginLeft: 2,
  },
  dialogContainer: {
    borderRadius: 8,
  },
});
