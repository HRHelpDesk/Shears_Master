// SmartStatusWidget.native.js
import React, { useContext, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Button, Text, useTheme, Portal, Switch } from "react-native-paper";

import {
  saveCalendarAndNotification,
  updateRecord,
} from "shears-shared/src/Services/Authentication";

import { AuthContext } from "../../context/AuthContext";

const STATUS_OPTIONS = ["Pending", "Approved", "Rejected", "Completed"];

export default function SmartStatusWidgetNative({
  label = "Status",
  value,
  item,
  mode = "read",        // NOW ALLOWED IN READ MODE
  onChangeText,         // parent state setter
  onStatusUpdated,      // optional callback: update localItem
}) {
  const theme = useTheme();
  const { user, token } = useContext(AuthContext);

  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState(value || "Pending");
  const [notify, setNotify] = useState(true);

  const openSheet = () => setVisible(true);
  const closeSheet = () => setVisible(false);

  /* ---------------------------------------------------------
     MAIN STATUS CONFIRM LOGIC
  --------------------------------------------------------- */
  const handleConfirm = async () => {
    console.log("📌 MOBILE Status update:", { item, status, notify });

    try {
      // 1️⃣ UPDATE RECORD STATUS IN DATABASE
      await updateRecord(item._id, {
        ...item,
        status,
      }, token);

      console.log("✅ Status updated in DB");

      // 2️⃣ UPDATE LOCAL ITEM (UI)
      if (onStatusUpdated) onStatusUpdated(status);
      if (onChangeText) onChangeText(status);

      // 3️⃣ CALENDAR + NOTIFICATION (ONLY WHEN APPROVED)
      if (status === "Approved") {
        console.log("📅 Building calendar + notification…");
        await saveCalendarAndNotification(item, user, token, notify);
      }

    } catch (err) {
      console.error("❌ Status update failed:", err);
    }

    closeSheet();
  };

  return (
    <View style={{ marginVertical: 8 }}>
      <Button mode="contained" onPress={openSheet}>
        {label}: {value || "Pending"}
      </Button>

      <Portal>
        {visible && (
          <>
            <TouchableOpacity style={styles.backdrop} onPress={closeSheet} />

            <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
              <ScrollView contentContainerStyle={styles.sheetContent}>
                <Text style={styles.title}>Update Status</Text>

                {STATUS_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.option,
                      {
                        borderColor:
                          opt === status
                            ? theme.colors.primary
                            : theme.colors.outline,
                      },
                    ]}
                    onPress={() => setStatus(opt)}
                  >
                    <Text
                      style={{
                        color:
                          opt === status
                            ? theme.colors.primary
                            : theme.colors.onSurface,
                      }}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* Notification Switch */}
                <View style={styles.switchRow}>
                  <Text style={styles.notifyText}>Send Notification?</Text>
                  <Switch
                    value={notify}
                    onValueChange={setNotify}
                    color={theme.colors.primary}
                  />
                </View>

                <Button mode="contained" onPress={handleConfirm} style={{ marginTop: 20 }}>
                  Save Status
                </Button>

                <Button mode="outlined" onPress={closeSheet} style={{ marginTop: 10 }}>
                  Cancel
                </Button>
              </ScrollView>
            </View>
          </>
        )}
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "55%",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
  },
  sheetContent: {
    alignItems: "center",
    paddingBottom: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
  },
  option: {
    width: "100%",
    padding: 14,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
    alignItems: "center",
  },
  notifyText: {
    fontSize: 16,
  },
});
