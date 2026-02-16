// SmartStatusWidget.js
import React, { useState, useEffect, useContext, useRef, useMemo } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput as RNTextInput,
} from "react-native";
import {
  Text,
  Button,
  Switch,
  useTheme,
  List,
  Divider,
  ActivityIndicator,
} from "react-native-paper";
import {
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthContext } from "../../context/AuthContext";
import {
  saveCalendarAndNotification,
  sendRejectionNotification,
  updateRecord,
} from "shears-shared/src/Services/Authentication";
import { formatDateValue } from "shears-shared/src/utils/stringHelpers";

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
  const insets = useSafeAreaInsets();

  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ["100%"], []);

  const [selectedStatus, setSelectedStatus] = useState(value || "Pending");
  const [notify, setNotify] = useState(true);
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log(item)
    if (value && value !== selectedStatus) {
      setSelectedStatus(value);
    }
  }, [value]);

  const handleConfirm = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const updatedItem = { ...item, status: selectedStatus };

      if (selectedStatus === "Rejected" && rejectionMessage.trim() !== "") {
        updatedItem.rejectionMessage = rejectionMessage.trim();
        await sendRejectionNotification(
          item,
          user,
          token,
          rejectionMessage.trim()
        );
      }

      await updateRecord(item._id, updatedItem, token);

      if (onStatusUpdated) onStatusUpdated(selectedStatus);
      if (onChangeText) onChangeText(selectedStatus);

      if (selectedStatus === "Approved") {
        const message = `Your request for ${item.date
          .map((d) => formatDateValue(d))
          .join(", ")} has been approved. Please check your calendar for the details.`;

        await saveCalendarAndNotification(
          item,
          user,
          token,
          notify,
          message
        );
      }

      bottomSheetRef.current?.dismiss();
    } catch (err) {
      console.error("Status update failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return theme.colors.success || "#4CAF50";
      case "Rejected":
        return theme.colors.error || "#F44336";
      case "Completed":
        return theme.colors.tertiary || "#9C27B0";
      default:
        return theme.colors.warning || "#FF9800";
    }
  };

  return (
    <View style={styles.container}>
      <Text
        variant="labelMedium"
        style={{
          marginBottom: 6,
          fontWeight: "500",
          color: theme.colors.text,
        }}
      >
        {label}
      </Text>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => bottomSheetRef.current?.present()}
        style={[
          styles.selectorContainer,
          { borderColor: theme.colors.outlineVariant || theme.colors.border },
        ]}
      >
        <Text
          style={[
            styles.selectorText,
            {
              color: selectedStatus
                ? getStatusColor(selectedStatus)
                : theme.colors.onSurfaceVariant,
            },
          ]}
        >
          {selectedStatus || "Select status..."}
        </Text>
        <Text style={styles.dropdownIcon}>⌄</Text>
      </TouchableOpacity>

      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={!loading}
        enableDynamicSizing={false}
        stackBehavior="push"
        topInset={insets.top}
        backgroundStyle={{ backgroundColor: theme.colors.surface }}
        handleIndicatorStyle={{ backgroundColor: theme.colors.outline }}
      >
        <View style={styles.sheetContainer}>
          <Text style={styles.sheetTitle}>Update Status</Text>
          <Divider style={{ marginVertical: 12 }} />

          <BottomSheetScrollView
            contentContainerStyle={{ paddingBottom: 140 }}
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
                  fontWeight: status === selectedStatus ? "600" : "400",
                }}
                style={{
                  borderBottomWidth: 0.5,
                  borderBottomColor: theme.colors.outline,
                }}
              />
            ))}

            {selectedStatus === "Rejected" && (
              <View style={{ marginTop: 16 }}>
                <Text style={{ marginBottom: 6, fontWeight: "500" }}>
                  Rejection Message
                </Text>
                <RNTextInput
                  placeholder="Enter message..."
                  value={rejectionMessage}
                  onChangeText={setRejectionMessage}
                  editable={!loading}
                  style={{
                    borderWidth: 1,
                    borderColor: theme.colors.outlineVariant,
                    borderRadius: 8,
                    padding: 10,
                    minHeight: 80,
                    textAlignVertical: "top",
                    backgroundColor: theme.colors.background,
                  }}
                  multiline
                />
              </View>
            )}

            <View style={styles.switchRow}>
              <Text style={{ flex: 1 }}>Send notification?</Text>
              <Switch
                value={notify}
                onValueChange={setNotify}
                disabled={loading}
                color={theme.colors.primary}
              />
            </View>
          </BottomSheetScrollView>

          <View
            style={[
              styles.sheetActions,
              { paddingBottom: insets.bottom + 20 },
            ]}
          >
            <Button
              mode="outlined"
              style={styles.actionButton}
              onPress={() => bottomSheetRef.current?.dismiss()}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              mode="contained"
              style={styles.actionButton}
              onPress={handleConfirm}
              disabled={loading}
            >
              Save
            </Button>
          </View>

          {/* SPLASH LOADER OVERLAY */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={{ marginTop: 12, fontWeight: "500" }}>
                Updating Status...
              </Text>
            </View>
          )}
        </View>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },

  selectorContainer: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  selectorText: { fontSize: 16 },

  dropdownIcon: { fontSize: 18, color: "#999" },

  sheetContainer: { flex: 1, paddingHorizontal: 20 },

  sheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingVertical: 15,
    paddingHorizontal: 5,
  },

  sheetActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    gap: 12,
  },

  actionButton: { flex: 1, borderRadius: 5 },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
});
