// SmartTimeTimeZone.native.js
import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Text,
  Dialog,
  Portal,
  Button,
  List,
  Modal,
  Card,
  useTheme,
} from "react-native-paper";
import { useNavigationState } from "@react-navigation/native";
import TimePickerInput from "./TimePickerInput";
import { DateTime } from "luxon";

const US_TIMEZONES = [
  { label: "Eastern (EST)", value: "America/New_York" },
  { label: "Central (CST)", value: "America/Chicago" },
  { label: "Mountain (MST)", value: "America/Denver" },
  { label: "Pacific (PST)", value: "America/Los_Angeles" },
  { label: "Alaska (AKST)", value: "America/Anchorage" },
  { label: "Hawaii (HST)", value: "Pacific/Honolulu" },
];

/* ------------------------------------------------------------
   📌 Convert stored time + source timezone → viewer's timezone
   Matches Web version exactly
------------------------------------------------------------ */
function convertToLocalTime(time, sourceTZ) {
  if (!time || !sourceTZ) return "";

  const viewerTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [hour, minute] = time.split(":").map(Number);

  const source = DateTime.fromObject({ hour, minute }, { zone: sourceTZ });
  const local = source.setZone(viewerTZ);

  return local.toFormat("h:mm a"); // AM/PM format
}

export default function SmartTimeTimeZone({
  label = "Time",
  value,
  onChangeText,
  mode = "edit",
  defaultValue,
}) {
  const theme = useTheme();

  const time = value?.time ?? "";
  const timezone =
    value?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [visible, setVisible] = useState(false);

  // Detect if we're already in a modal (matches DialogSelectInput)
  const navigationState = useNavigationState((state) => state);
  const insideModalScreen = navigationState?.routes?.some(
    (r) => r?.params?.presentation === 'modal' || r?.name?.toLowerCase().includes('modal')
  );
  const shouldUseModal = insideModalScreen;

  /* ------------------------------------------------------------
     ⏱ Apply default timezone if provided
------------------------------------------------------------ */
  useEffect(() => {
    if (defaultValue && !value?.timezone) {
      onChangeText({ time, timezone: defaultValue });
    }
  }, [defaultValue]);

  /* ------------------------------------------------------------
     🔐 Safe update (matches web safeUpdate)
------------------------------------------------------------ */
  const update = (key, val) => {
    onChangeText({
      time: key === "time" ? val : time,
      timezone: key === "timezone" ? val : timezone,
    });
  };

  const selectedLabel =
    US_TIMEZONES.find((tz) => tz.value === timezone)?.label ||
    "Select timezone";

  /* ------------------------------------------------------------
     📖 READ MODE
------------------------------------------------------------ */
  if (mode === "read") {
    const converted = convertToLocalTime(time, timezone);

    return (
      <View style={styles.readContainer}>
        <Text
          variant="titleMedium"
          style={[styles.label, { color: theme.colors.primary }]}
        >
          {label}
        </Text>

        <Text variant="bodyLarge" style={[styles.readValue, { color: theme.colors.text }]}>
          {converted || "Not set"}{" "}
          <Text style={[styles.caption, { color: theme.colors.textSecondary }]}>
            (Your local time)
          </Text>
        </Text>

        {time && (
          <Text style={[styles.caption, { color: theme.colors.textSecondary }]}>
            Original timezone: {timezone}
          </Text>
        )}
      </View>
    );
  }

  /* ------------------------------------------------------------
     ✏️ EDIT MODE
------------------------------------------------------------ */
  const borderColor = visible
    ? theme.colors.primary
    : theme.colors.outlineVariant || theme.colors.border;

  const SelectorField = (
    <TouchableOpacity onPress={() => setVisible(true)} activeOpacity={0.8}>
      <View
        style={[
          styles.selectorContainer,
          { backgroundColor: theme.colors.surface, borderColor },
        ]}
      >
        <Text
          style={[
            styles.selectorText,
            {
              color: timezone
                ? theme.colors.onSurface
                : theme.colors.onSurfaceVariant,
            },
          ]}
        >
          {selectedLabel}
        </Text>
        <Text style={styles.dropdownIcon}>⌄</Text>
      </View>
    </TouchableOpacity>
  );

  const SelectionContent = (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 12 }}
      style={{ maxHeight: 320 }}
    >
      {US_TIMEZONES.map((tz) => (
        <List.Item
          key={tz.value}
          title={tz.label}
          onPress={() => {
            update("timezone", tz.value);
            setVisible(false);
          }}
          style={{
            borderBottomWidth: 0.4,
            borderBottomColor: theme.colors.outlineVariant,
          }}
        />
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.editContainer}>
      <Text variant="labelMedium" style={styles.label}>
        {label}
      </Text>

      {/* TIME PICKER */}
      <TimePickerInput
        label="Time"
        value={time}
        onChangeText={(v) => update("time", v)}
      />

      {/* TIMEZONE SELECTOR */}
      {SelectorField}

      <Portal>
        {shouldUseModal ? (
          <Modal
            visible={visible}
            onDismiss={() => setVisible(false)}
            contentContainerStyle={[
              styles.modalContainer,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <Card>
              <Card.Title title="Select Timezone" />
              <Card.Content>{SelectionContent}</Card.Content>
              <Card.Actions style={{ justifyContent: 'flex-end' }}>
                <Button onPress={() => setVisible(false)}>Cancel</Button>
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
              onDismiss={() => setVisible(false)}
              style={[
                styles.dialogContainer,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <Dialog.Title>Select Timezone</Dialog.Title>
              <Dialog.Content>{SelectionContent}</Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setVisible(false)}>Cancel</Button>
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
    marginBottom: 4 
  },
  label: { 
    fontWeight: "500", 
    marginBottom: 4 
  },
  readValue: { 
    lineHeight: 22 
  },
  caption: { 
    fontSize: 12, 
    marginTop: 4 
  },
  
  // EDIT MODE
  editContainer: { 
    marginBottom: 12 
  },
  selectorContainer: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectorText: { 
    fontSize: 16,
    fontFamily: 'System',
  },
  dropdownIcon: { 
    fontSize: 18, 
    color: "#999",
    marginLeft: 6,
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