// SmartTimeTimeZone.native.js
import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
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

  const navState = useNavigationState((s) => s);
  const insideModal = navState?.routes?.some((r) =>
    String(r?.name || "").toLowerCase().includes("modal")
  );
  const shouldUseModal = insideModal;

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
        <Text style={[styles.label, { color: theme.colors.primary }]}>
          {label}
        </Text>

        <Text style={styles.readValue}>
          {converted || "Not set"}{" "}
          <Text style={styles.caption}>(Your local time)</Text>
        </Text>

        {time && (
          <Text style={styles.caption}>Original timezone: {timezone}</Text>
        )}
      </View>
    );
  }

  /* ------------------------------------------------------------
     ✏️ EDIT MODE
------------------------------------------------------------ */
  const borderColor = visible
    ? theme.colors.primary
    : theme.colors.outlineVariant;

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
            contentContainerStyle={styles.modalContainer}
          >
            <Card>
              <Card.Title title="Select Timezone" />
              <Card.Content>
                {US_TIMEZONES.map((tz) => (
                  <List.Item
                    key={tz.value}
                    title={tz.label}
                    onPress={() => {
                      update("timezone", tz.value);
                      setVisible(false);
                    }}
                  />
                ))}
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => setVisible(false)}>Cancel</Button>
              </Card.Actions>
            </Card>
          </Modal>
        ) : (
          <Dialog visible={visible} onDismiss={() => setVisible(false)}>
            <Dialog.Title>Select Timezone</Dialog.Title>
            <Dialog.Content>
              {US_TIMEZONES.map((tz) => (
                <List.Item
                  key={tz.value}
                  title={tz.label}
                  onPress={() => {
                    update("timezone", tz.value);
                    setVisible(false);
                  }}
                />
              ))}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setVisible(false)}>Cancel</Button>
            </Dialog.Actions>
          </Dialog>
        )}
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  readContainer: { marginBottom: 16 },
  label: { fontWeight: "600", marginBottom: 8 },
  readValue: { fontSize: 16, color: "#333" },
  caption: { fontSize: 12, color: "#666", marginTop: 4 },
  editContainer: { marginBottom: 16 },
  selectorContainer: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectorText: { fontSize: 16 },
  dropdownIcon: { fontSize: 20, color: "#999" },
  modalContainer: { margin: 32, backgroundColor: "white", borderRadius: 8 },
});
