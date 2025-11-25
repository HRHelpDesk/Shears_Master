// src/components/Dashboard/AppointmentsSummaryWidget.jsx

import React, { useContext, useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { Text, useTheme, Card } from "react-native-paper";
import { AuthContext } from "../../context/AuthContext";
import { getRecords } from "shears-shared/src/Services/Authentication";

export default function SmartAppointmentsSummaryWidget() {
  const theme = useTheme();
  const { user, token } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);
  const [completedThisWeekCount, setCompletedThisWeekCount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !token) return;
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId, user?.subscriberId, token]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      const raw = await getRecords({
        recordType: "calendar",
        subscriberId: user.subscriberId,
        userId: user.userId,
        // status: "active", // optional depending on your API
        page: 1,
        limit: 200, // enough to cover this week
        token,
      });

      // Normalise API shape: could be array or {records/items/data: []}
      const records = Array.isArray(raw)
        ? raw
        : raw?.records || raw?.items || raw?.data || [];

      const { todayCount, completedThisWeekCount } =
        computeAppointmentStats(records);

      setTodayCount(todayCount);
      setCompletedThisWeekCount(completedThisWeekCount);
    } catch (err) {
      console.error("Error loading appointment summary:", err);
      setError("Unable to load appointments");
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------------------------------
     Helpers: date + status logic
     Adjust these if your calendar schema is different
  -------------------------------------------------------- */

  // Assume each record has fieldsData.date as "YYYY-MM-DD"
  const getRecordDate = (rec) => {
    const dateStr =
      rec?.fieldsData?.date ||
      rec?.fieldsData?.appointmentDate ||
      rec?.fieldsData?.startDate;

    if (!dateStr) return null;

    // If already "YYYY-MM-DD"
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // Fallback: try to parse via Date and reformat
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const isCompleted = (rec) => {
    const status =
      rec?.fieldsData?.status ||
      rec?.fieldsData?.appointmentStatus ||
      rec?.status;

    if (!status) return false;
    return String(status).toLowerCase() === "completed";
  };

  const computeAppointmentStats = (records) => {
    if (!records || !records.length) {
      return { todayCount: 0, completedThisWeekCount: 0 };
    }

    // Today's date in local time, formatted "YYYY-MM-DD"
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // Start of this week (Mon) and end (Sun)
    const dayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon...
    const diffToMonday = (dayOfWeek + 6) % 7; // convert so Mon=0
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    let todayCount = 0;
    let completedThisWeekCount = 0;

    for (const rec of records) {
      const dateStr = getRecordDate(rec);
      if (!dateStr) continue;

      // Parse dateStr back to Date for week calc
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) continue;

      // TODAY
      if (dateStr === todayStr) {
        todayCount += 1;
      }

      // THIS WEEK + COMPLETED
      if (d >= startOfWeek && d <= endOfWeek && isCompleted(rec)) {
        completedThisWeekCount += 1;
      }
    }

    return { todayCount, completedThisWeekCount };
  };

  /* --------------------------------------------------------
     RENDER
  -------------------------------------------------------- */

  if (!user || !token) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="bodyMedium">
          Sign in to see your appointment summary.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 8 }}>Loading appointments…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: theme.colors.error }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.centerContainer}>
      <View style={styles.row}>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.countText}>
              {todayCount}
            </Text>
            <Text variant="bodyMedium" style={styles.labelText}>
              Today&apos;s Appointments
            </Text>
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.countText}>
              {completedThisWeekCount}
            </Text>
            <Text variant="bodyMedium" style={styles.labelText}>
              Completed This Week
            </Text>
          </Card.Content>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  card: {
    flex: 1,
    minWidth: 140,
    marginHorizontal: 6,
    borderRadius: 16,
    elevation: 3,
  },
  countText: {
    textAlign: "center",
    fontWeight: "700",
  },
  labelText: {
    textAlign: "center",
    marginTop: 4,
    opacity: 0.8,
  },
});
