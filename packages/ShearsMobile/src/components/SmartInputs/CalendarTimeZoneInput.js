// CalendarTimeZoneInput.native.js
import React, { useState, useEffect, useMemo } from "react";
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
  { label: "Eastern (EST/EDT)", value: "America/New_York" },
  { label: "Central (CST/CDT)", value: "America/Chicago" },
  { label: "Mountain (MST/MDT)", value: "America/Denver" },
  { label: "Pacific (PST/PDT)", value: "America/Los_Angeles" },
  { label: "Alaska (AKST/AKDT)", value: "America/Anchorage" },
  { label: "Hawaii (HST)", value: "Pacific/Honolulu" },
];

/**
 * Convert stored time (HH:mm) in source timezone → viewer's local time
 */
function convertToLocalTime(time, sourceTZ) {
  if (!time || !sourceTZ) return "";

  try {
    const viewerTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const [hour, minute] = time.split(":").map(Number);

    const source = DateTime.fromObject({ hour, minute }, { zone: sourceTZ });
    if (!source.isValid) return time;

    const local = source.setZone(viewerTZ);
    return local.toFormat("h:mm a"); // → 4:40 PM
  } catch {
    return time;
  }
}

export default function CalendarTimeZoneInput({
  label = "Time",
  value,                    // { start, end, timezone } or null/undefined
  onChange,                 // ← recommended: better name than onChangeText
  onChangeText,             // kept for backward compatibility
  mode = "edit",
  defaultTimezone,          // renamed from defaultValue for clarity
}) {
  const theme = useTheme();
console.log("📅 CalendarTimeZoneInput rendering:", { label, value, mode });
  // Normalize value - make sure we always work with object
  const timeZoneTime = value ?? {};

  const startTime = timeZoneTime.start ?? "";
  const endTime   = timeZoneTime.end ?? "";
  const timezone  = timeZoneTime.timezone ?? 
                    Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [visible, setVisible] = useState(false);

  // Better name + more reliable modal detection
  const routeName = useNavigationState(state => state.routes[state.index]?.name);
  const insideModal = 
    routeName?.toLowerCase().includes("modal") ||
    useNavigationState(state => 
      state.routes.some(r => r.params?.presentation === "modal")
    );

  const handleChange = (updates) => {
    const newValue = {
      start: updates.start ?? startTime,
      end:   updates.end   ?? endTime,
      timezone: updates.timezone ?? timezone,
    };

    // Prefer onChange (more conventional), fallback to onChangeText
    if (onChange) {
      onChange(newValue);
    } else if (onChangeText) {
      onChangeText(newValue);
    }
  };

  // Apply default timezone only once when field is empty
  useEffect(() => {
    if (defaultTimezone && !timeZoneTime.timezone && startTime) {
      handleChange({ timezone: defaultTimezone });
    }
  }, [defaultTimezone, timeZoneTime.timezone, startTime]); // ← important deps

  const selectedLabel = useMemo(() => 
    US_TIMEZONES.find(tz => tz.value === timezone)?.label || 
    "Select timezone",
    [timezone]
  );

  // ── READ MODE ────────────────────────────────────────────────
  if (mode === "read") {
    const localStart = convertToLocalTime(startTime, timezone);
    const localEnd   = convertToLocalTime(endTime, timezone);

    const showConverted = localStart && localEnd && localStart !== `${startTime}`;

    return (
      <View style={styles.readContainer}>
        <Text variant="titleMedium" style={[styles.label, { color: theme.colors.primary }]}>
          {label}
        </Text>

        <Text variant="bodyLarge" style={{ color: theme.colors.text }}>
          {localStart && localEnd
            ? `${localStart} – ${localEnd}`
            : startTime && endTime
              ? `${startTime} – ${endTime}`
              : "Not set"}
        </Text>

        {showConverted && (
          <Text style={[styles.caption, { color: theme.colors.textSecondary, marginTop: 4 }]}>
            (your local time)
          </Text>
        )}

        {startTime && endTime && timezone && (
          <Text style={[styles.caption, { color: theme.colors.textSecondary, marginTop: 2 }]}>
            {/* Original: {startTime} – {endTime} ({selectedLabel}) */}
          </Text>
        )}
      </View>
    );
  }

  // ── EDIT MODE ────────────────────────────────────────────────
  const borderColor = visible ? theme.colors.primary : theme.colors.outline;

  const SelectorField = (
    <TouchableOpacity onPress={() => setVisible(true)} activeOpacity={0.7}>
      <View style={[
        styles.selectorContainer,
        { 
          borderColor,
          backgroundColor: theme.colors.surface,
        }
      ]}>
        <Text style={[
          styles.selectorText,
          { color: timezone ? theme.colors.onSurface : theme.colors.onSurfaceVariant }
        ]}>
          {selectedLabel}
        </Text>
        <Text style={styles.dropdownIcon}>▼</Text>
      </View>
    </TouchableOpacity>
  );

  const timezoneList = (
    <ScrollView 
      style={{ maxHeight: 340 }} 
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 16 }}
    >
      {US_TIMEZONES.map((tz) => (
        <List.Item
          key={tz.value}
          title={tz.label}
          onPress={() => {
            handleChange({ timezone: tz.value });
            setVisible(false);
          }}
          titleStyle={{ 
            color: tz.value === timezone ? theme.colors.primary : undefined 
          }}
          left={props => 
            tz.value === timezone ? <List.Icon {...props} icon="check" color={theme.colors.primary} /> : null
          }
        />
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.editContainer}>
      <Text variant="labelLarge" style={{ marginBottom: 8, color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>

      {/* Time pickers */}
      <View style={styles.timePickersRow}>
        <View style={styles.timePickerHalf}>
          <TimePickerInput
            label="Start"
            value={startTime}
            onChangeText={(v) => handleChange({ start: v })}
          />
        </View>

        <View style={styles.timePickerHalf}>
          <TimePickerInput
            label="End"
            value={endTime}
            onChangeText={(v) => handleChange({ end: v })}
          />
        </View>
      </View>

      {/* Timezone selector */}
      {SelectorField}

      <Portal>
        {insideModal ? (
          <Modal
            visible={visible}
            onDismiss={() => setVisible(false)}
            contentContainerStyle={[
              styles.modalContainer,
              { backgroundColor: theme.colors.surface, borderRadius: 2 }
            ]}
          >
            <Card>
              <Card.Title title="Select Timezon" />
              <Card.Content>{timezoneList}</Card.Content>
              <Card.Actions>
                <Button onPress={() => setVisible(false)}>Close</Button>
              </Card.Actions>
            </Card>
          </Modal>
        ) : (
          <Dialog
            visible={visible}
            onDismiss={() => setVisible(false)}
            style={{ backgroundColor: theme.colors.surface, borderRadius: 2 }}
          >
            <Dialog.Title>Select Timezone</Dialog.Title>
            <Dialog.ScrollArea style={{ maxHeight: 380 }}>
              {timezoneList}
            </Dialog.ScrollArea>
            <Dialog.Actions>
              <Button onPress={() => setVisible(false)}>Cancel</Button>
            </Dialog.Actions>
          </Dialog>
        )}
      </Portal>
    </View>
  );
}

// Updated styles (small improvements)
const styles = StyleSheet.create({
  readContainer: { marginBottom: 12 },
  label: { fontWeight: "500", marginBottom: 4 },
  caption: { fontSize: 13, opacity: 0.7 },

  editContainer: { marginBottom: 16 },
  timePickersRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  timePickerHalf: { flex: 1 },

  selectorContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectorText: {
    fontSize: 16,
  },
  dropdownIcon: {
    fontSize: 20,
    color: "#888",
    marginLeft: 8,
  },

  modalContainer: {
    margin: 24,
    borderRadius: 16,
    padding: 0,
    overflow: "hidden",
  },
});