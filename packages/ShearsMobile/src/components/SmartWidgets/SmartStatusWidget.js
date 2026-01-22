// SmartStatusWidget.native.js
import React, { useContext, useState, useEffect } from "react";
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
  Switch,
  useTheme,
} from "react-native-paper";
import { useNavigationState } from "@react-navigation/native";

import { AuthContext } from "../../context/AuthContext";
import {
  saveCalendarAndNotification,
  updateRecord,
} from "shears-shared/src/Services/Authentication";

const STATUS_OPTIONS = ["Pending", "Approved", "Rejected", "Completed"];

export default function SmartStatusWidget({
  label = "Status",
  value,
  item,
  onChangeText,
  onStatusUpdated,
}) {
  const theme = useTheme();
  const { user, token } = useContext(AuthContext);

  const [visible, setVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(value || "Pending");
  const [notify, setNotify] = useState(true);

  // Modal vs Dialog detection — same as DialogSelectInput
  const navigationState = useNavigationState((state) => state);
  const insideModalScreen = navigationState?.routes?.some(
    (r) => r?.params?.presentation === "modal" || r?.name?.toLowerCase().includes("modal")
  );
  const shouldUseModal = insideModalScreen;

  // Keep internal selection in sync with prop value
  useEffect(() => {
    if (value !== undefined && value !== selectedStatus) {
      setSelectedStatus(value);
    }
  }, [value]);

  const handleConfirm = async () => {
    try {
      await updateRecord(
        item._id,
        { ...item, status: selectedStatus },
        token
      );

      if (onStatusUpdated) onStatusUpdated(selectedStatus);
      if (onChangeText) onChangeText(selectedStatus);

      if (selectedStatus === "Approved") {
        await saveCalendarAndNotification(item, user, token, notify);
      }

      setVisible(false);
    } catch (err) {
      console.error("Status update failed:", err);
      // ← you might want to add error feedback here (snackbar, alert…)
    }
  };

  // Status color helper
  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":  return theme.colors.success   || "#4CAF50";
      case "Rejected":  return theme.colors.error     || "#F44336";
      case "Completed": return theme.colors.tertiary  || "#9C27B0";
      default:          return theme.colors.warning   || "#FF9800"; // Pending
    }
  };

  // ── Selector Field (same style as DialogSelectInput) ───────────────
  const borderColor = visible
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
                ? getStatusColor(value)
                : theme.colors.onSurfaceVariant,
              fontWeight: value ? "600" : "normal",
            },
          ]}
        >
          {value || "Select status..."}
        </Text>
        <Text style={styles.dropdownIcon}>⌄</Text>
      </View>
    </TouchableOpacity>
  );

  // ── Selection Content (very similar structure) ──────────────────────
  const SelectionContent = (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 12 }}
      style={{ maxHeight: 320 }}
    >
      {STATUS_OPTIONS.map((status) => (
        <List.Item
          key={status}
          title={status}
          onPress={() => setSelectedStatus(status)}
          titleStyle={{
            color:
              status === selectedStatus
                ? theme.colors.primary
                : theme.colors.onSurface,
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
    <View style={styles.container}>
      {/* Label - same as DialogSelectInput */}
      <Text
        variant="labelMedium"
        style={{
          color: theme.colors.text,
          marginBottom: 6,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>

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
              <Card.Title title="Update Status" />
              <Card.Content>
                {SelectionContent}

                {/* Notification switch */}
                <View style={styles.switchRow}>
                  <Text variant="bodyMedium">Send notification?</Text>
                  <Switch
                    value={notify}
                    onValueChange={setNotify}
                    color={theme.colors.primary}
                  />
                </View>
              </Card.Content>

              <Card.Actions style={{ justifyContent: "flex-end" }}>
                <Button onPress={() => setVisible(false)}>Cancel</Button>
                <Button mode="contained" onPress={handleConfirm}>
                  Save
                </Button>
              </Card.Actions>
            </Card>
          </Modal>
        ) : (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
          >
            <Dialog
              visible={visible}
              onDismiss={() => setVisible(false)}
              style={[
                styles.dialogContainer,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <Dialog.Title>Update Status</Dialog.Title>
              <Dialog.Content>{SelectionContent}</Dialog.Content>

              {/* Switch placed in content area like many designs */}
              <View style={styles.switchRow}>
                <Text variant="bodyMedium" style={{ flex: 1}}>
                  Send notification?
                </Text>
                <Switch
                  value={notify}
                  onValueChange={setNotify}
                  color={theme.colors.primary}
                />
              </View>

              <Dialog.Actions>
                <Button style={{borderRadius:5, width:'50%'}}  onPress={() => setVisible(false)}>Cancel</Button>
                <Button style={{borderRadius:5, width:'50%'}} mode="contained" onPress={handleConfirm}>
                  Save
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
  container: {
    marginBottom: 12, // same bottom spacing as DialogSelectInput
  },

  selectorContainer: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectorText: {
    fontSize: 16,
    fontFamily: "System",
  },

  dropdownIcon: {
    fontSize: 18,
    color: "#999",
    marginLeft: 6,
  },

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingVertical: 15,
    paddingHorizontal: 15,
  },

  // ── Exact same container styles as DialogSelectInput ───────
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